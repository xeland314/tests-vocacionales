import type { APIRoute } from "astro";
import { authenticateToken, requireRole } from "../../../../lib/auth";
import { getStudentDetail } from "../../../../lib/admin";
import { db, initDb } from "../../../../lib/db";

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const id = params.id!;
  const data = await getStudentDetail(id);
  if (!data) return new Response(JSON.stringify({ error: "No encontrado" }), { status: 404 });
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
};

// DELETE habilita retake: borra resultados pero mantiene estudiante (solo admin)
export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  if (!requireRole(auth.user, "admin")) return new Response(JSON.stringify({ error: "Solo admin puede habilitar retake" }), { status: 403 });
  const id = params.id!;
  const test = new URL(request.url).searchParams.get("test"); // chaside|personalidad|kuder|null (todos)
  await initDb();
  if (test === "chaside") await db.execute({ sql: "DELETE FROM chaside_resultados WHERE estudiante_id=?", args: [id] });
  else if (test === "personalidad") await db.execute({ sql: "DELETE FROM personalidad_resultados WHERE estudiante_id=?", args: [id] });
  else if (test === "kuder") await db.execute({ sql: "DELETE FROM kuder_resultados WHERE estudiante_id=?", args: [id] });
  else {
    await db.execute({ sql: "DELETE FROM chaside_resultados WHERE estudiante_id=?", args: [id] });
    await db.execute({ sql: "DELETE FROM personalidad_resultados WHERE estudiante_id=?", args: [id] });
    await db.execute({ sql: "DELETE FROM kuder_resultados WHERE estudiante_id=?", args: [id] });
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
