import type { APIRoute } from "astro";
import { authenticateToken } from "../../../lib/auth";
import { createUser, listUsers } from "../../../lib/users";
import { initDb } from "../../../lib/db";

export const prerender = false;

// GET /api/users -> list (requiere token)
// POST /api/users {email,password,first_name,last_name} -> crear (requiere token, salvo primer usuario)
export const GET: APIRoute = async ({ request }) => {
  await initDb();
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const users = await listUsers();
  return new Response(JSON.stringify(users), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request }) => {
  await initDb();
  // Permitir crear primer usuario sin token (bootstrap)
  const count = await (await import("../../../lib/db")).db.execute("SELECT COUNT(*) as c FROM users");
  const isFirst = Number((count.rows[0] as any).c) === 0;
  if (!isFirst) {
    const authed = await authenticateToken(request.headers.get("authorization"));
    if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  }
  const body = await request.json().catch(()=> ({}));
  try {
    const u = await createUser({ email: body.email, password: body.password, first_name: body.first_name, last_name: body.last_name });
    return new Response(JSON.stringify({ id: u.id, email: u.email }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch(e:any){
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};
