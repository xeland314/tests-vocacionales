import { db, initDb } from "./db";
import { calculateScores } from "../data/scoring";
import { AREAS } from "../data/chaside";

export async function getStudents(limit = 200) {
  await initDb();
  const r = await db.execute({
    sql: "SELECT id, nombre_estudiante, nombre_padre, correo_estudiante, correo_padre, cedula_estudiante, cedula_representante, fecha_unix, version FROM estudiantes WHERE test_codigo='CHASIDE' ORDER BY fecha_unix DESC LIMIT ?",
    args: [limit],
  });
  return r.rows as any[];
}

export async function getStudentDetail(id: string) {
  await initDb();
  const s = await db.execute({ sql: "SELECT * FROM estudiantes WHERE id=?", args: [id] });
  if (s.rows.length === 0) return null;
  const est = s.rows[0] as any;
  const resp = await db.execute({ sql: "SELECT pregunta_id, respuesta, version FROM respuestas WHERE estudiante_id=? ORDER BY pregunta_id", args: [id] });
  const answers: Record<number, boolean> = {};
  for (const row of resp.rows as any[]) answers[row.pregunta_id] = row.respuesta === 1;
  const scores = calculateScores(answers);
  return { estudiante: est, respuestas: resp.rows, answers, scores };
}

export async function getStats() {
  await initDb();
  const total = await db.execute("SELECT COUNT(*) as c FROM estudiantes WHERE test_codigo='CHASIDE'");
  const byArea = await db.execute(`
    SELECT e.id, e.fecha_unix
    FROM estudiantes e
  `);
  // Para stats agregadas, calculamos desde respuestas
  const allRes = await db.execute("SELECT estudiante_id, pregunta_id, respuesta FROM respuestas");
  // Agrupar por estudiante
  const byStudent: Record<string, Record<number, boolean>> = {};
  for (const r of allRes.rows as any[]) {
    if (!byStudent[r.estudiante_id]) byStudent[r.estudiante_id] = {};
    byStudent[r.estudiante_id][r.pregunta_id] = r.respuesta === 1;
  }
  const areaCounts: Record<string, number> = { C:0, H:0, A:0, S:0, I:0, D:0, E:0 };
  const areaAptCounts: Record<string, number> = { C:0, H:0, A:0, S:0, I:0, D:0, E:0 };
  let totalIntereses = 0;
  for (const ans of Object.values(byStudent)) {
    const sc = calculateScores(ans as any);
    areaCounts[sc.topInteres] = (areaCounts[sc.topInteres]||0)+1;
    areaAptCounts[sc.topAptitud] = (areaAptCounts[sc.topAptitud]||0)+1;
    totalIntereses++;
  }

  // Promedio puntajes intereses
  const avgScores: Record<string, number> = { C:0, H:0, A:0, S:0, I:0, D:0, E:0 };
  const avgApt: Record<string, number> = { C:0, H:0, A:0, S:0, I:0, D:0, E:0 };
  for (const ans of Object.values(byStudent)) {
    const sc = calculateScores(ans as any);
    for (const k of Object.keys(avgScores) as any[]) {
      avgScores[k] += sc.intereses[k];
      avgApt[k] += sc.aptitudes[k];
    }
  }
  for (const k of Object.keys(avgScores) as any[]) {
    avgScores[k] = totalIntereses ? Math.round((avgScores[k]/totalIntereses)*10)/10 : 0;
    avgApt[k] = totalIntereses ? Math.round((avgApt[k]/totalIntereses)*10)/10 : 0;
  }

  return {
    totalEstudiantes: Number((total.rows[0] as any).c),
    topIntereses: areaCounts,
    topAptitudes: areaAptCounts,
    promediosIntereses: avgScores,
    promediosAptitudes: avgApt,
  };
}
