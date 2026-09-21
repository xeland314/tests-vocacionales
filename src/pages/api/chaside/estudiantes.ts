import type { APIRoute } from "astro";
import { getStudents } from "../../../lib/admin";
import { authenticateToken } from "../../../lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const rows = await getStudents(500);
  return new Response(JSON.stringify(rows), { headers: { "Content-Type": "application/json" } });
};
