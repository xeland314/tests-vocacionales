import type { APIRoute } from "astro";
import { authenticateToken } from "../../../../lib/auth";
import { getUserById, updateUser, deleteUser } from "../../../../lib/users";

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const u = await getUserById(params.id!);
  if (!u) return new Response(JSON.stringify({ error: "No encontrado" }), { status: 404 });
  return new Response(JSON.stringify(u), { headers: { "Content-Type": "application/json" } });
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const body = await request.json().catch(()=> ({}));
  try {
    const u = await updateUser(params.id!, { email: body.email, first_name: body.first_name, last_name: body.last_name, is_active: body.is_active });
    return new Response(JSON.stringify(u), { headers: { "Content-Type": "application/json" } });
  } catch(e:any){ return new Response(JSON.stringify({ error:e.message }), { status:400 }); }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  await deleteUser(params.id!);
  return new Response(null, { status: 204 });
};
