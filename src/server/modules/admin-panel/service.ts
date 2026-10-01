/**
 * Módulo Admin Panel — consultas de lectura (CQRS-lite) para el panel de
 * administración: overview, estadísticas por test, estudiantes con estado,
 * detalle de estudiante con historial y evolución.
 */
import { db, initDb } from "../../db";
import { listAllIds, listEstudiantes } from "../testing/estudiantes.repo";
import { countAll, getHistorial, listIds, mapLatestPorEstudiante } from "../testing/resultados.repo";
import { diffChaside, diffKuder, diffPersonalidad } from "../testing/diffs";
import { getHistorialReintentos, getReintentosPendientes, type TestCodigo } from "../testing";

type AnyRow = Record<string, any>;

async function withInitRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("no such table") || msg.includes("SQLITE_ERROR") || msg.includes("ER_NO_SUCH_TABLE")) {
      await initDb();
      return await fn();
    }
    throw e;
  }
}

export async function getEstudiantes(limit = 200) {
  await initDb();
  return withInitRetry(async () => listEstudiantes(limit));
}

export async function getOverview() {
  await initDb();
  return withInitRetry(async () => {
    const totalEst = await db.execute<AnyRow>("SELECT COUNT(*) as c FROM estudiantes");
    const totalCh = await countAll("CHASIDE");
    const totalPers = await countAll("PERSONALIDAD");
    const totalKuder = await countAll("KUDER");

    const allEst = await listAllIds();
    const chIds = new Set<string>(await listIds("CHASIDE"));
    const persIds = new Set<string>(await listIds("PERSONALIDAD"));
    const kuderIds = new Set<string>(await listIds("KUDER"));

    let completos = 0, solo2 = 0, solo1 = 0, ninguno = 0, faltantes: any[] = [];
    for (const id of allEst) {
      const hasC = chIds.has(id), hasP = persIds.has(id), hasK = kuderIds.has(id);
      const cnt = (hasC ? 1 : 0) + (hasP ? 1 : 0) + (hasK ? 1 : 0);
      if (cnt === 3) completos++;
      else if (cnt === 2) solo2++;
      else if (cnt === 1) solo1++;
      else ninguno++;
      if (cnt < 3) faltantes.push({ id, hasC, hasP, hasK, missing: 3 - cnt });
    }

    return {
      totalEstudiantes: Number(totalEst.rows[0].c),
      totalChaside: totalCh,
      totalPersonalidad: totalPers,
      totalKuder: totalKuder,
      completos,
      solo2,
      solo1,
      ninguno,
      faltantes: faltantes.slice(0, 20),
      chIds: chIds.size,
      persIds: persIds.size,
      kuderIds: kuderIds.size,
    };
  });
}

export async function getChasideStats() {
  await initDb();
  return withInitRetry(async () => {
    const total = await countAll("CHASIDE");
    const r = await db.execute<AnyRow>("SELECT intereses_json, aptitudes_json, top_interes, top_aptitud FROM chaside_resultados");
    const rows = r.rows;
    const areaCounts: Record<string, number> = { C: 0, H: 0, A: 0, S: 0, I: 0, D: 0, E: 0 };
    const aptCounts: Record<string, number> = { C: 0, H: 0, A: 0, S: 0, I: 0, D: 0, E: 0 };
    const avgInt: Record<string, number> = { C: 0, H: 0, A: 0, S: 0, I: 0, D: 0, E: 0 };
    const avgApt: Record<string, number> = { C: 0, H: 0, A: 0, S: 0, I: 0, D: 0, E: 0 };
    const n = rows.length;
    for (const rr of rows) {
      areaCounts[rr.top_interes] = (areaCounts[rr.top_interes] || 0) + 1;
      aptCounts[rr.top_aptitud] = (aptCounts[rr.top_aptitud] || 0) + 1;
      const inter = JSON.parse(rr.intereses_json);
      const apt = JSON.parse(rr.aptitudes_json);
      for (const k of Object.keys(avgInt)) { avgInt[k] += inter[k] || 0; avgApt[k] += apt[k] || 0; }
    }
    for (const k of Object.keys(avgInt)) {
      avgInt[k] = n ? Math.round((avgInt[k] / n) * 10) / 10 : 0;
      avgApt[k] = n ? Math.round((avgApt[k] / n) * 10) / 10 : 0;
    }
    return { total, topIntereses: areaCounts, topAptitudes: aptCounts, promediosIntereses: avgInt, promediosAptitudes: avgApt };
  });
}

export async function getPersonalidadStats() {
  await initDb();
  return withInitRetry(async () => {
    const total = await countAll("PERSONALIDAD");
    const r = await db.execute<AnyRow>("SELECT tipo, dimensiones_json, percentages_json FROM personalidad_resultados");
    const rows = r.rows;
    const byType: Record<string, number> = {};
    const byRole: Record<string, number> = { Analistas: 0, Diplomáticos: 0, Centinelas: 0, Exploradores: 0 };
    const roleMap: Record<string, string> = {
      INTJ: "Analistas", INTP: "Analistas", ENTJ: "Analistas", ENTP: "Analistas",
      INFJ: "Diplomáticos", INFP: "Diplomáticos", ENFJ: "Diplomáticos", ENFP: "Diplomáticos",
      ISTJ: "Centinelas", ISFJ: "Centinelas", ESTJ: "Centinelas", ESFJ: "Centinelas",
      ISTP: "Exploradores", ISFP: "Exploradores", ESTP: "Exploradores", ESFP: "Exploradores",
    };
    const dimAvg: Record<string, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
    const n = rows.length;
    for (const rr of rows) {
      byType[rr.tipo] = (byType[rr.tipo] || 0) + 1;
      const role = roleMap[rr.tipo] || "Desconocido";
      byRole[role] = (byRole[role] || 0) + 1;
      const dims = JSON.parse(rr.dimensiones_json);
      for (const d of ["EI", "SN", "TF", "JP"]) { dimAvg[d] += dims[d]?.percent || 50; }
    }
    for (const k of Object.keys(dimAvg)) dimAvg[k] = n ? Math.round(dimAvg[k] / n) : 50;
    return { total, byType, byRole, dimAvg };
  });
}

export async function getKuderStats() {
  await initDb();
  return withInitRetry(async () => {
    const total = await countAll("KUDER");
    const r = await db.execute<AnyRow>("SELECT top, scores_json FROM kuder_resultados");
    const rows = r.rows;
    const byTop: Record<string, number> = { EXT: 0, MEC: 0, CAL: 0, CIE: 0, PER: 0, ART: 0, LIT: 0, MUS: 0, SOC: 0, OFI: 0 };
    const avgScores: Record<string, number> = { EXT: 0, MEC: 0, CAL: 0, CIE: 0, PER: 0, ART: 0, LIT: 0, MUS: 0, SOC: 0, OFI: 0 };
    const n = rows.length;
    for (const rr of rows) {
      byTop[rr.top] = (byTop[rr.top] || 0) + 1;
      const sc = JSON.parse(rr.scores_json);
      for (const k of Object.keys(avgScores)) avgScores[k] += sc[k] || 0;
    }
    for (const k of Object.keys(avgScores)) avgScores[k] = n ? Math.round((avgScores[k] / n) * 10) / 10 : 0;
    return { total, byTop, avgScores };
  });
}

export async function getEstudiantesWithStatus(limit = 200) {
  await initDb();
  return withInitRetry(async () => {
    const students = await getEstudiantes(limit);
    const ch = await mapLatestPorEstudiante("CHASIDE");
    const pers = await mapLatestPorEstudiante("PERSONALIDAD");
    const kuder = await mapLatestPorEstudiante("KUDER");

    const result = [];
    for (const s of students) {
      const pendientes = await getReintentosPendientes(s.id);
      result.push({
        ...s,
        hasChaside: ch.has(s.id),
        hasPersonalidad: pers.has(s.id),
        hasKuder: kuder.has(s.id),
        chaside: ch.get(s.id) || null,
        personalidad: pers.get(s.id) || null,
        kuder: kuder.get(s.id) || null,
        completados: (ch.has(s.id) ? 1 : 0) + (pers.has(s.id) ? 1 : 0) + (kuder.has(s.id) ? 1 : 0),
        reintentosPendientes: pendientes.map((p) => p.test_codigo),
      });
    }
    return result;
  });
}

function serieDiffs(rows: AnyRow[], testCodigo: TestCodigo) {
  const out: any[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];
    if (testCodigo === "PERSONALIDAD") {
      out.push({
        intento: curr.intento_numero ?? i + 1,
        fecha_unix: curr.fecha_unix,
        diff: diffPersonalidad(
          { tipo: prev.tipo, percentages: JSON.parse(prev.percentages_json) },
          { tipo: curr.tipo, percentages: JSON.parse(curr.percentages_json) }
        ),
      });
    } else if (testCodigo === "CHASIDE") {
      out.push({
        intento: curr.intento_numero ?? i + 1,
        fecha_unix: curr.fecha_unix,
        diff: diffChaside(
          { top_interes: prev.top_interes, top_aptitud: prev.top_aptitud, intereses: JSON.parse(prev.intereses_json), aptitudes: JSON.parse(prev.aptitudes_json) },
          { top_interes: curr.top_interes, top_aptitud: curr.top_aptitud, intereses: JSON.parse(curr.intereses_json), aptitudes: JSON.parse(curr.aptitudes_json) }
        ),
      });
    } else {
      out.push({
        intento: curr.intento_numero ?? i + 1,
        fecha_unix: curr.fecha_unix,
        diff: diffKuder(
          { top: prev.top, scores: JSON.parse(prev.scores_json) },
          { top: curr.top, scores: JSON.parse(curr.scores_json) }
        ),
      });
    }
  }
  return out;
}

export async function getStudentDetail(id: string) {
  await initDb();
  return withInitRetry(async () => {
    const s = await db.execute<AnyRow>({ sql: "SELECT * FROM estudiantes WHERE id=?", args: [id] });
    if (s.rows.length === 0) return null;
    const est = s.rows[0];
    const ch = await db.execute<AnyRow>({ sql: "SELECT * FROM chaside_resultados WHERE estudiante_id=? ORDER BY fecha_unix DESC LIMIT 1", args: [id] });
    const pers = await db.execute<AnyRow>({ sql: "SELECT * FROM personalidad_resultados WHERE estudiante_id=? ORDER BY fecha_unix DESC LIMIT 1", args: [id] });
    const kud = await db.execute<AnyRow>({ sql: "SELECT * FROM kuder_resultados WHERE estudiante_id=? ORDER BY fecha_unix DESC LIMIT 1", args: [id] });

    let chScores = null;
    if (ch.rows.length) {
      const rr = ch.rows[0];
      chScores = {
        intereses: JSON.parse(rr.intereses_json), aptitudes: JSON.parse(rr.aptitudes_json),
        topInteres: rr.top_interes, segundoInteres: rr.segundo_interes, topAptitud: rr.top_aptitud,
        respuestas: JSON.parse(rr.respuestas_json), fecha_unix: rr.fecha_unix,
      };
    }
    let persData = null;
    if (pers.rows.length) {
      const rr = pers.rows[0];
      persData = {
        tipo: rr.tipo, dimensiones: JSON.parse(rr.dimensiones_json), percentages: JSON.parse(rr.percentages_json),
        respuestas: JSON.parse(rr.respuestas_json), fecha_unix: rr.fecha_unix,
      };
    }
    let kudData = null;
    if (kud.rows.length) {
      const rr = kud.rows[0];
      kudData = {
        top: rr.top, ranking: JSON.parse(rr.ranking_json), scores: JSON.parse(rr.scores_json),
        respuestas: JSON.parse(rr.respuestas_json), verificacion: rr.verificacion, fecha_unix: rr.fecha_unix,
      };
    }

    const [histChaside, histPersonalidad, histKuder] = await Promise.all([
      getHistorial(id, "CHASIDE"),
      getHistorial(id, "PERSONALIDAD"),
      getHistorial(id, "KUDER"),
    ]);

    let diffPers = null;
    if (histPersonalidad.length >= 2) {
      const [prev, curr] = histPersonalidad.slice(-2);
      diffPers = diffPersonalidad(
        { tipo: prev.tipo, percentages: JSON.parse(prev.percentages_json) },
        { tipo: curr.tipo, percentages: JSON.parse(curr.percentages_json) }
      );
    }
    let diffCha = null;
    if (histChaside.length >= 2) {
      const [prev, curr] = histChaside.slice(-2);
      diffCha = diffChaside(
        { top_interes: prev.top_interes, top_aptitud: prev.top_aptitud, intereses: JSON.parse(prev.intereses_json), aptitudes: JSON.parse(prev.aptitudes_json) },
        { top_interes: curr.top_interes, top_aptitud: curr.top_aptitud, intereses: JSON.parse(curr.intereses_json), aptitudes: JSON.parse(curr.aptitudes_json) }
      );
    }
    let diffKud = null;
    if (histKuder.length >= 2) {
      const [prev, curr] = histKuder.slice(-2);
      diffKud = diffKuder(
        { top: prev.top, scores: JSON.parse(prev.scores_json) },
        { top: curr.top, scores: JSON.parse(curr.scores_json) }
      );
    }

    const reintentosPendientes = await getReintentosPendientes(id);
    const [historialReintentosCh, historialReintentosPers, historialReintentosKud] = await Promise.all([
      getHistorialReintentos(id, "CHASIDE"),
      getHistorialReintentos(id, "PERSONALIDAD"),
      getHistorialReintentos(id, "KUDER"),
    ]);

    return {
      estudiante: est,
      chaside: chScores,
      personalidad: persData,
      kuder: kudData,
      historial: { chaside: histChaside, personalidad: histPersonalidad, kuder: histKuder },
      diffs: { chaside: diffCha, personalidad: diffPers, kuder: diffKud },
      evolucion: {
        chaside: serieDiffs(histChaside, "CHASIDE"),
        personalidad: serieDiffs(histPersonalidad, "PERSONALIDAD"),
        kuder: serieDiffs(histKuder, "KUDER"),
      },
      reintentosPendientes: reintentosPendientes.map((p) => p.test_codigo),
      historialReintentos: { chaside: historialReintentosCh, personalidad: historialReintentosPers, kuder: historialReintentosKud },
    };
  });
}

export async function habilitarReintentoAdmin(estudianteId: string, testCodigo: TestCodigo, actorUserId: string, motivo?: string, ventanaDesde?: string, ventanaHasta?: string) {
  await initDb();
  const { habilitarReintento } = await import("../testing/reintentos.repo");
  return habilitarReintento({ estudianteId, testCodigo, habilitadoPor: actorUserId, motivo, ventanaDesde, ventanaHasta });
}

export async function revocarReintentoAdmin(estudianteId: string, testCodigo: TestCodigo) {
  await initDb();
  const { revocarReintentoPendiente } = await import("../testing/reintentos.repo");
  return revocarReintentoPendiente(estudianteId, testCodigo);
}

// legacy para API antigua
export async function getStudents(limit = 200) { return getEstudiantes(limit); }
export async function getStats() { return getChasideStats(); }
