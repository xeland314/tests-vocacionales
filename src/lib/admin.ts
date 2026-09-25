import { db, initDb } from "./db";
import { calculateScores } from "../data/scoring";
import {
  getReintentosPendientes,
  getHistorialReintentos,
  habilitarReintento,
  revocarReintentoPendiente,
  diffPersonalidad,
  diffChaside,
  diffKuder,
  type TestCodigo,
} from "./reintentos";

async function withInitRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("no such table") || msg.includes("SQLITE_ERROR")) {
      await initDb();
      return await fn();
    }
    throw e;
  }
}

export async function getEstudiantes(limit = 200) {
  await initDb();
  return withInitRetry(async () => {
    const r = await db.execute({ sql: "SELECT id, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra_json, created_at, moodle_user_name as nombre_estudiante, moodle_user_email as correo_estudiante, NULL as nombre_padre, NULL as correo_padre, NULL as cedula_estudiante, NULL as cedula_representante FROM estudiantes ORDER BY created_at DESC LIMIT ?", args: [limit] });
    return r.rows as any[];
  });
}

export async function getOverview() {
  await initDb();
  return withInitRetry(async () => {
  const totalEst = await db.execute("SELECT COUNT(*) as c FROM estudiantes");
  const totalCh = await db.execute("SELECT COUNT(*) as c FROM chaside_resultados");
  const totalPers = await db.execute("SELECT COUNT(*) as c FROM personalidad_resultados");
  const totalKuder = await db.execute("SELECT COUNT(*) as c FROM kuder_resultados");

  // Completitud: por estudiante
  const allEst = await db.execute("SELECT id FROM estudiantes");
  const chIds = new Set<string>((await db.execute("SELECT estudiante_id as id FROM chaside_resultados")).rows.map((r:any)=>r.id));
  const persIds = new Set<string>((await db.execute("SELECT estudiante_id as id FROM personalidad_resultados")).rows.map((r:any)=>r.id));
  const kuderIds = new Set<string>((await db.execute("SELECT estudiante_id as id FROM kuder_resultados")).rows.map((r:any)=>r.id));

  let completos = 0, solo1=0, solo2=0, ninguno=0, faltantes:any[]=[];
  for(const row of allEst.rows as any[]){
    const id=row.id;
    const hasC=chIds.has(id), hasP=persIds.has(id), hasK=kuderIds.has(id);
    const cnt = (hasC?1:0)+(hasP?1:0)+(hasK?1:0);
    if(cnt===3) completos++;
    else if(cnt===2) solo2++;
    else if(cnt===1) solo1++;
    else ninguno++;
    if(cnt<3) faltantes.push({ id, hasC, hasP, hasK, missing: 3-cnt });
  }

  // Ultimas aplicaciones por fecha
  const chRecent = await db.execute("SELECT fecha_unix FROM chaside_resultados ORDER BY fecha_unix DESC LIMIT 5");
  const persRecent = await db.execute("SELECT fecha_unix FROM personalidad_resultados ORDER BY fecha_unix DESC LIMIT 5");
  const kuderRecent = await db.execute("SELECT fecha_unix FROM kuder_resultados ORDER BY fecha_unix DESC LIMIT 5");

  return {
    totalEstudiantes: Number((totalEst.rows[0] as any).c),
    totalChaside: Number((totalCh.rows[0] as any).c),
    totalPersonalidad: Number((totalPers.rows[0] as any).c),
    totalKuder: Number((totalKuder.rows[0] as any).c),
    completos,
    solo2,
    solo1,
    ninguno,
    faltantes: faltantes.slice(0,20),
    chIds: chIds.size,
    persIds: persIds.size,
    kuderIds: kuderIds.size,
  };
  });
}

export async function getChasideStats() {
  await initDb();
  return withInitRetry(async () => {
  const total = await db.execute("SELECT COUNT(*) as c FROM chaside_resultados");
  const rows = await db.execute("SELECT intereses_json, aptitudes_json, top_interes, top_aptitud FROM chaside_resultados");
  const areaCounts: Record<string, number> = { C:0,H:0,A:0,S:0,I:0,D:0,E:0 };
  const aptCounts: Record<string, number> = { C:0,H:0,A:0,S:0,I:0,D:0,E:0 };
  const avgInt: Record<string, number> = { C:0,H:0,A:0,S:0,I:0,D:0,E:0 };
  const avgApt: Record<string, number> = { C:0,H:0,A:0,S:0,I:0,D:0,E:0 };
  let n = rows.rows.length;
  for(const r of rows.rows as any[]){
    areaCounts[r.top_interes] = (areaCounts[r.top_interes]||0)+1;
    aptCounts[r.top_aptitud] = (aptCounts[r.top_aptitud]||0)+1;
    const inter = JSON.parse(r.intereses_json);
    const apt = JSON.parse(r.aptitudes_json);
    for(const k of Object.keys(avgInt)) { avgInt[k]+= inter[k]||0; avgApt[k]+= apt[k]||0; }
  }
  for(const k of Object.keys(avgInt)) { avgInt[k] = n ? Math.round((avgInt[k]/n)*10)/10 : 0; avgApt[k] = n ? Math.round((avgApt[k]/n)*10)/10 : 0; }
  return { total: Number((total.rows[0] as any).c), topIntereses: areaCounts, topAptitudes: aptCounts, promediosIntereses: avgInt, promediosAptitudes: avgApt };
  });
}

export async function getPersonalidadStats(){
  await initDb();
  return withInitRetry(async () => {
  const total = await db.execute("SELECT COUNT(*) as c FROM personalidad_resultados");
  const rows = await db.execute("SELECT tipo, dimensiones_json, percentages_json FROM personalidad_resultados");
  const byType: Record<string, number> = {};
  const byRole: Record<string, number> = { Analistas:0, Diplomáticos:0, Centinelas:0, Exploradores:0 };
  const roleMap: Record<string,string> = { INTJ:"Analistas", INTP:"Analistas", ENTJ:"Analistas", ENTP:"Analistas", INFJ:"Diplomáticos", INFP:"Diplomáticos", ENFJ:"Diplomáticos", ENFP:"Diplomáticos", ISTJ:"Centinelas", ISFJ:"Centinelas", ESTJ:"Centinelas", ESFJ:"Centinelas", ISTP:"Exploradores", ISFP:"Exploradores", ESTP:"Exploradores", ESFP:"Exploradores" };
  const dimAvg: Record<string, number> = { EI:0, SN:0, TF:0, JP:0 };
  let n = rows.rows.length;
  for(const r of rows.rows as any[]){
    byType[r.tipo] = (byType[r.tipo]||0)+1;
    const role = roleMap[r.tipo] || "Desconocido";
    byRole[role] = (byRole[role]||0)+1;
    const dims = JSON.parse(r.dimensiones_json);
    for(const d of ["EI","SN","TF","JP"]){ dimAvg[d]+= dims[d]?.percent || 50; }
  }
  for(const k of Object.keys(dimAvg)) dimAvg[k]= n ? Math.round(dimAvg[k]/n) : 50;
  return { total: Number((total.rows[0] as any).c), byType, byRole, dimAvg };
  });
}

export async function getKuderStats(){
  await initDb();
  return withInitRetry(async () => {
  const total = await db.execute("SELECT COUNT(*) as c FROM kuder_resultados");
  const rows = await db.execute("SELECT top, scores_json FROM kuder_resultados");
  const byTop: Record<string, number> = { EXT:0,MEC:0,CAL:0,CIE:0,PER:0,ART:0,LIT:0,MUS:0,SOC:0,OFI:0 };
  const avgScores: Record<string, number> = { EXT:0,MEC:0,CAL:0,CIE:0,PER:0,ART:0,LIT:0,MUS:0,SOC:0,OFI:0 };
  let n = rows.rows.length;
  for(const r of rows.rows as any[]){
    byTop[r.top] = (byTop[r.top]||0)+1;
    const sc = JSON.parse(r.scores_json);
    for(const k of Object.keys(avgScores)) avgScores[k]+= sc[k]||0;
  }
  for(const k of Object.keys(avgScores)) avgScores[k]= n ? Math.round((avgScores[k]/n)*10)/10 : 0;
  return { total: Number((total.rows[0] as any).c), byTop, avgScores };
  });
}

export async function getEstudiantesWithStatus(limit=200){
  await initDb();
  return withInitRetry(async () => {
  const students = await getEstudiantes(limit);
  // IMPORTANTE: ORDER BY fecha_unix ASC — con retakes hay varias filas por estudiante_id
  // y el Map se queda con la ÚLTIMA fila procesada; con ASC, esa última es la más reciente.
  // Sin este ORDER BY, qué intento "gana" queda a merced del orden físico de SQLite.
  const ch = new Map<string, any>((await db.execute("SELECT estudiante_id, fecha_unix, top_interes, segundo_interes, intento_numero FROM chaside_resultados ORDER BY fecha_unix ASC")).rows.map((r:any)=>[r.estudiante_id, r]));
  const pers = new Map<string, any>((await db.execute("SELECT estudiante_id, fecha_unix, tipo, intento_numero FROM personalidad_resultados ORDER BY fecha_unix ASC")).rows.map((r:any)=>[r.estudiante_id, r]));
  const kuder = new Map<string, any>((await db.execute("SELECT estudiante_id, fecha_unix, top, intento_numero FROM kuder_resultados ORDER BY fecha_unix ASC")).rows.map((r:any)=>[r.estudiante_id, r]));

  const result = [];
  for (const s of students as any[]) {
    const pendientes = await getReintentosPendientes(s.id);
    result.push({
      ...s,
      hasChaside: ch.has(s.id),
      hasPersonalidad: pers.has(s.id),
      hasKuder: kuder.has(s.id),
      chaside: ch.get(s.id) || null,
      personalidad: pers.get(s.id) || null,
      kuder: kuder.get(s.id) || null,
      completados: (ch.has(s.id)?1:0)+(pers.has(s.id)?1:0)+(kuder.has(s.id)?1:0),
      // Tests con un reintento habilitado y aún no usado — para pintar la fila en blanco en el panel
      reintentosPendientes: pendientes.map((p) => p.test_codigo),
    });
  }
  return result;
  });
}

/**
 * Todos los intentos de un estudiante para un test, ordenados del más antiguo al
 * más reciente (intento_numero 1, 2, 3...). Es la fuente para la tabla de historial
 * con "fila en blanco" debajo de la última fila llena, y para calcular diffs.
 */
export async function getHistorialTest(estudianteId: string, testCodigo: TestCodigo) {
  await initDb();
  return withInitRetry(async () => {
    const tabla = testCodigo === "CHASIDE" ? "chaside_resultados" : testCodigo === "PERSONALIDAD" ? "personalidad_resultados" : "kuder_resultados";
    const r = await db.execute({ sql: `SELECT * FROM ${tabla} WHERE estudiante_id=? ORDER BY fecha_unix ASC`, args: [estudianteId] });
    return r.rows as any[];
  });
}

/**
 * Serie de diffs entre intentos CONSECUTIVOS (intento 1→2, 2→3, ...).
 * Complementa `diffs` (solo actual vs anterior) y permite ver la evolución completa.
 */
function serieDiffs(rows: any[], testCodigo: TestCodigo) {
  const out: any[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1] as any;
    const curr = rows[i] as any;
    if (testCodigo === "PERSONALIDAD") {
      out.push({
        intento: curr.intento_numero ?? i + 1,
        fecha_unix: curr.fecha_unix,
        diff: diffPersonalidad({ tipo: prev.tipo, percentages: JSON.parse(prev.percentages_json) }, { tipo: curr.tipo, percentages: JSON.parse(curr.percentages_json) }),
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
        diff: diffKuder({ top: prev.top, scores: JSON.parse(prev.scores_json) }, { top: curr.top, scores: JSON.parse(curr.scores_json) }),
      });
    }
  }
  return out;
}

export async function getStudentDetail(id:string){
  await initDb();
  return withInitRetry(async () => {
  const s = await db.execute({ sql:"SELECT * FROM estudiantes WHERE id=?", args:[id] });
  if(s.rows.length===0) return null;
  const est = s.rows[0] as any;
  const ch = await db.execute({ sql:"SELECT * FROM chaside_resultados WHERE estudiante_id=? ORDER BY fecha_unix DESC LIMIT 1", args:[id] });
  const pers = await db.execute({ sql:"SELECT * FROM personalidad_resultados WHERE estudiante_id=? ORDER BY fecha_unix DESC LIMIT 1", args:[id] });
  const kud = await db.execute({ sql:"SELECT * FROM kuder_resultados WHERE estudiante_id=? ORDER BY fecha_unix DESC LIMIT 1", args:[id] });
  let chScores=null;
  if(ch.rows.length){
    const r = ch.rows[0] as any;
    chScores = { intereses: JSON.parse(r.intereses_json), aptitudes: JSON.parse(r.aptitudes_json), topInteres: r.top_interes, segundoInteres: r.segundo_interes, topAptitud: r.top_aptitud, respuestas: JSON.parse(r.respuestas_json), fecha_unix: r.fecha_unix };
  }
  let persData=null;
  if(pers.rows.length){
    const r = pers.rows[0] as any;
    persData = { tipo: r.tipo, dimensiones: JSON.parse(r.dimensiones_json), percentages: JSON.parse(r.percentages_json), respuestas: JSON.parse(r.respuestas_json), fecha_unix: r.fecha_unix };
  }
  let kudData=null;
  if(kud.rows.length){
    const r = kud.rows[0] as any;
    kudData = { top: r.top, ranking: JSON.parse(r.ranking_json), scores: JSON.parse(r.scores_json), respuestas: JSON.parse(r.respuestas_json), verificacion: r.verificacion, fecha_unix: r.fecha_unix };
  }

  // Historial completo (todos los intentos) + diff entre el actual y el inmediatamente anterior.
  const [histChaside, histPersonalidad, histKuder] = await Promise.all([
    getHistorialTest(id, "CHASIDE"),
    getHistorialTest(id, "PERSONALIDAD"),
    getHistorialTest(id, "KUDER"),
  ]);

  let diffPers = null;
  if (histPersonalidad.length >= 2) {
    const [prev, curr] = histPersonalidad.slice(-2) as any[];
    diffPers = diffPersonalidad(
      { tipo: prev.tipo, percentages: JSON.parse(prev.percentages_json) },
      { tipo: curr.tipo, percentages: JSON.parse(curr.percentages_json) }
    );
  }
  let diffCha = null;
  if (histChaside.length >= 2) {
    const [prev, curr] = histChaside.slice(-2) as any[];
    diffCha = diffChaside(
      { top_interes: prev.top_interes, top_aptitud: prev.top_aptitud, intereses: JSON.parse(prev.intereses_json), aptitudes: JSON.parse(prev.aptitudes_json) },
      { top_interes: curr.top_interes, top_aptitud: curr.top_aptitud, intereses: JSON.parse(curr.intereses_json), aptitudes: JSON.parse(curr.aptitudes_json) }
    );
  }
  let diffKud = null;
  if (histKuder.length >= 2) {
    const [prev, curr] = histKuder.slice(-2) as any[];
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
    // Evolución completa: diff entre cada par de intentos consecutivos
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

/**
 * Habilita un reintento desde el panel de administración. `actorUser` debe
 * pasar la verificación de permisos (canEnableRetake) ANTES de llamar aquí —
 * este módulo no conoce el objeto de sesión/HTTP, solo el user.id ya validado.
 */
export async function habilitarReintentoAdmin(estudianteId: string, testCodigo: TestCodigo, actorUserId: string, motivo?: string, ventanaDesde?: string, ventanaHasta?: string) {
  await initDb();
  return habilitarReintento({ estudianteId, testCodigo, habilitadoPor: actorUserId, motivo, ventanaDesde, ventanaHasta });
}

export async function revocarReintentoAdmin(estudianteId: string, testCodigo: TestCodigo) {
  await initDb();
  return revocarReintentoPendiente(estudianteId, testCodigo);
}

// legacy for old API
export async function getStudents(limit=200){ return getEstudiantes(limit); }
export async function getStats(){ return getChasideStats(); }
