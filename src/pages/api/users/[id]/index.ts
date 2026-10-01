import type { APIRoute } from "astro";
import { authenticateToken, requireRole } from "../../../../server/modules/identity";
import { getUserById, updateUser, deleteUser } from "../../../../server/modules/identity";

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const isSelf = authed.user.id === params.id;
  const isAdmin = requireRole(authed.user, "admin");
  // Admin ve a todos, docente solo su propio perfil
  if (!isAdmin && !isSelf) return new Response(JSON.stringify({ error: "No autorizado: requiere rol admin" }), { status: 403 });
  const u = await getUserById(params.id!);
  if (!u) return new Response(JSON.stringify({ error: "No encontrado" }), { status: 404 });
  return new Response(JSON.stringify(u), { headers: { "Content-Type": "application/json" } });
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const isSelf = authed.user.id === params.id;
  const isAdmin = requireRole(authed.user, "admin");
  if (!isAdmin && !isSelf) return new Response(JSON.stringify({ error: "No autorizado: solo admin puede editar otros usuarios" }), { status: 403 });
  const body = await request.json().catch(() => ({}));
  // Docente no puede cambiar role ni is_active, solo admin
  if (!isAdmin && (body.role !== undefined || body.is_active !== undefined)) {
    return new Response(JSON.stringify({ error: "No autorizado: solo admin puede cambiar rol/estado" }), { status: 403 });
  }
  try {
    const u = await updateUser(params.id!, { email: body.email, first_name: body.first_name, last_name: body.last_name, is_active: body.is_active, role: body.role });
    return new Response(JSON.stringify(u), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 400 }); }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  if (!requireRole(authed.user, "admin")) return new Response(JSON.stringify({ error: "No autorizado: solo admin puede eliminar usuarios" }), { status: 403 });
  // Evitar auto-eliminación
  if (authed.user.id === params.id) return new Response(JSON.stringify({ error: "No puedes eliminar tu propio usuario" }), { status: 400 });
  await deleteUser(params.id!);
  return new Response(null, { status: 204 });
};
