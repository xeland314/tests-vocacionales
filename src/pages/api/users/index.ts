import type { APIRoute } from "astro";
import { initDb } from "../../../server/db";
import { authenticateToken, requireRole } from "../../../server/modules/identity";
import { createUser, listUsers } from "../../../server/modules/identity";

export const prerender = false;

// GET /api/users -> list (solo admin)
// POST /api/users {email,password,first_name,last_name,role} -> crear (solo admin, salvo primer usuario que es admin bootstrap)
export const GET: APIRoute = async ({ request }) => {
  await initDb();
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  if (!requireRole(authed.user, "admin")) return new Response(JSON.stringify({ error: "No autorizado: requiere rol admin" }), { status: 403 });
  const users = await listUsers();
  return new Response(JSON.stringify(users), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request }) => {
  await initDb();
  // Permitir crear primer usuario sin token (bootstrap) — siempre admin
  const count = await (await import("../../../server/db")).db.execute("SELECT COUNT(*) as c FROM users");
  const isFirst = Number((count.rows[0] as any).c) === 0;
  let authed: any = null;
  if (!isFirst) {
    authed = await authenticateToken(request.headers.get("authorization"));
    if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
    if (!requireRole(authed.user, "admin")) return new Response(JSON.stringify({ error: "No autorizado: solo admin puede crear usuarios" }), { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  try {
    // Bootstrap: primer usuario siempre admin, ignorar role enviado
    const role = isFirst ? "admin" : (body.role === "admin" ? "admin" : "docente");
    const u = await createUser({ email: body.email, password: body.password, first_name: body.first_name, last_name: body.last_name, role });
    return new Response(JSON.stringify({ id: u.id, email: u.email, role: (u as any).role }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};
