import type { APIRoute } from "astro";
import { initDb } from "../../../lib/db";
import { getUserByEmail } from "../../../lib/users";
import { create_token, get_post_response_data, verifyPassword } from "../../../lib/auth";

export const prerender = false;

// Knox LoginView: POST con {email,password} (equivale a AuthTokenSerializer)
// No requiere TokenAuthentication (AllowAny)
export const POST: APIRoute = async ({ request }) => {
  try {
    await initDb();
    const body = await request.json().catch(()=> ({}));
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const password = (body.password ?? "").toString();
    if (!email || !password) return new Response(JSON.stringify({ error: "email y password requeridos" }), { status: 400 });

    const user = await getUserByEmail(email) as any;
    if (!user || !user.is_active) return new Response(JSON.stringify({ error: "credenciales inválidas" }), { status: 401 });
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return new Response(JSON.stringify({ error: "credenciales inválidas" }), { status: 401 });

    const { token, instance } = await create_token(user.id);
    const data = get_post_response_data(token, instance, { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name });
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
