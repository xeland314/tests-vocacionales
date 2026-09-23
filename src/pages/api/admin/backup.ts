import type { APIRoute } from "astro";
import { authenticateToken, requireRole } from "../../../lib/auth";
import { db, initDb } from "../../../lib/db";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  if (!requireRole(auth.user, "admin")) return new Response(JSON.stringify({ error: "Solo admin puede hacer respaldo" }), { status: 403 });
  await initDb();
  const [est, ch, pers, kuder, users] = await Promise.all([
    db.execute("SELECT id, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, created_at FROM estudiantes ORDER BY created_at DESC"),
    db.execute("SELECT id, estudiante_id, fecha_unix, top_interes, segundo_interes, top_aptitud, intereses_json, aptitudes_json FROM chaside_resultados ORDER BY fecha_unix DESC"),
    db.execute("SELECT id, estudiante_id, fecha_unix, tipo, dimensiones_json FROM personalidad_resultados ORDER BY fecha_unix DESC"),
    db.execute("SELECT id, estudiante_id, fecha_unix, top, scores_json FROM kuder_resultados ORDER BY fecha_unix DESC"),
    db.execute("SELECT id, email, first_name, last_name, role, is_active, created_at FROM users ORDER BY created_at DESC"),
  ]);
  const payload = {
    meta: { fecha: new Date().toISOString(), version: 1 },
    estudiantes: est.rows,
    chaside_resultados: ch.rows,
    personalidad_resultados: pers.rows,
    kuder_resultados: kuder.rows,
    users: users.rows,
  };
  const body = JSON.stringify(payload, null, 2);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="respaldo_${new Date().toISOString().slice(0,10)}.json"`,
    },
  });
};
