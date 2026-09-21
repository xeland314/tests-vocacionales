import type { APIRoute } from "astro";
import { authenticateToken } from "../../../lib/auth";

export const prerender = false;

// GET /api/auth/me -> devuelve usuario actual (incluye role) si token válido
export const GET: APIRoute = async ({ request }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  return new Response(JSON.stringify({ user: authed.user }), { status: 200, headers: { "Content-Type": "application/json" } });
};
