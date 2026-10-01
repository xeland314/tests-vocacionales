/**
 * Módulo Admin Panel — respaldo JSON de datos operativos (solo admin).
 */
import { db, initDb } from "../../db";

type AnyRow = Record<string, any>;

export async function buildBackupPayload() {
  await initDb();
  const [est, ch, pers, kuder, users] = await Promise.all([
    db.execute<AnyRow>("SELECT id, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, created_at FROM estudiantes ORDER BY created_at DESC"),
    db.execute<AnyRow>("SELECT id, estudiante_id, fecha_unix, top_interes, segundo_interes, top_aptitud, intereses_json, aptitudes_json FROM chaside_resultados ORDER BY fecha_unix DESC"),
    db.execute<AnyRow>("SELECT id, estudiante_id, fecha_unix, tipo, dimensiones_json FROM personalidad_resultados ORDER BY fecha_unix DESC"),
    db.execute<AnyRow>("SELECT id, estudiante_id, fecha_unix, top, scores_json FROM kuder_resultados ORDER BY fecha_unix DESC"),
    db.execute<AnyRow>("SELECT id, email, first_name, last_name, role, is_active, created_at FROM users ORDER BY created_at DESC"),
  ]);
  return {
    meta: { fecha: new Date().toISOString(), version: 1 },
    estudiantes: est.rows,
    chaside_resultados: ch.rows,
    personalidad_resultados: pers.rows,
    kuder_resultados: kuder.rows,
    users: users.rows,
  };
}
