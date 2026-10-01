import type { APIRoute } from "astro";
import { authenticateToken, requireRole } from "../../../../server/modules/identity";
import { changePassword } from "../../../../server/modules/identity";

export const prerender = false;

// POST /api/users/:id/change-password {new_password} — solo admin resetea sin old_password
export const POST: APIRoute = async ({ request, params }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  if (!requireRole(authed.user, "admin")) return new Response(JSON.stringify({ error: "No autorizado: solo admin puede resetear contraseñas" }), { status: 403 });
  const body = await request.json().catch(() => ({}));
  try {
    await changePassword(params.id!, null, body.new_password, false);
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 400 }); }
};
