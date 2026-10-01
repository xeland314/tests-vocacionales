import type { APIRoute } from "astro";
import { authenticateToken } from "../../../server/modules/identity";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  return new Response(JSON.stringify({ user: auth.user, expiry: auth.instance.expiry }), { headers: { "Content-Type": "application/json" } });
};
