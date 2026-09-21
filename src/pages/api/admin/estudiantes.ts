import type { APIRoute } from "astro";
import { authenticateToken } from "../../../lib/auth";
import { getEstudiantesWithStatus } from "../../../lib/admin";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "200");
  const data = await getEstudiantesWithStatus(limit);
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
};
