import type { APIRoute } from "astro";
import { authenticateToken } from "../../../../lib/auth";
import { changePassword } from "../../../../lib/users";

export const prerender = false;

// POST /api/users/:id/change-password {new_password} — admin resetea sin old_password
export const POST: APIRoute = async ({ request, params }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const body = await request.json().catch(()=> ({}));
  try {
    await changePassword(params.id!, null, body.new_password, false);
    return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json" } });
  } catch(e:any){ return new Response(JSON.stringify({ error:e.message }), { status:400 }); }
};
