import type { APIRoute } from "astro";
import { authenticateToken } from "../../../server/modules/identity/repository";
import { changePassword } from "../../../server/modules/identity/repository";

export const prerender = false;

// POST /api/users/change-password {old_password, new_password} — para el usuario autenticado
export const POST: APIRoute = async ({ request }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    await changePassword(authed.user.id, body.old_password, body.new_password, true);
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 400 }); }
};
