import type { APIRoute } from "astro";
import { db, initDb } from "../../../server/db";
import { authenticateToken } from "../../../server/modules/identity";

export const prerender = false;

// Knox LogoutAllView: POST Authorization: Token <token> -> borra todos los tokens del usuario -> 204
export const POST: APIRoute = async ({ request }) => {
  await initDb();
  const auth = request.headers.get("authorization");
  const authed = await authenticateToken(auth);
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  await db.execute({ sql: "DELETE FROM knox_authtoken WHERE user_id=?", args: [authed.user.id] });
  return new Response(null, { status: 204 });
};
