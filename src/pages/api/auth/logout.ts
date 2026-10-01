import type { APIRoute } from "astro";
import { db, initDb } from "../../../server/db";
import { authenticateToken, hashToken } from "../../../server/modules/identity";

export const prerender = false;

// Knox LogoutView: POST con Authorization: Token <token> -> borra solo ese token -> 204
export const POST: APIRoute = async ({ request }) => {
  await initDb();
  const auth = request.headers.get("authorization");
  const authed = await authenticateToken(auth);
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const token = auth!.slice("Token ".length).trim();
  const digest = hashToken(token);
  await db.execute({ sql: "DELETE FROM knox_authtoken WHERE digest=?", args: [digest] });
  return new Response(null, { status: 204 });
};
