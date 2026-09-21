import type { APIRoute } from "astro";
import { authenticateToken } from "../../../../lib/auth";
import { getStudentDetail } from "../../../../lib/admin";

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const id = params.id!;
  const data = await getStudentDetail(id);
  if (!data) return new Response(JSON.stringify({ error: "No encontrado" }), { status: 404 });
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
};
