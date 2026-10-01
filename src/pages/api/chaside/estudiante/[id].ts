import type { APIRoute } from "astro";
import { authenticateToken } from "../../../../server/modules/identity/repository";
import { getStudentDetail } from "../../../../server/modules/admin-panel";

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const id = params.id!;
  const data = await getStudentDetail(id);
  if (!data) return new Response(JSON.stringify({ error: "No encontrado" }), { status: 404 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};
