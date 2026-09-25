import type { APIRoute } from "astro";
import { authenticateToken } from "../../../../lib/auth";
import { resolveAdminViewToken } from "../../../../lib/adminViewTokens";
import { getStudentDetail } from "../../../../lib/admin";

export const prerender = false;

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export const GET: APIRoute = async ({ request, url }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return json({ error: "No autenticado" }, 401);

  const token = url.searchParams.get("token");
  if (!token) return json({ error: "Falta el token" }, 400);

  const estudianteId = await resolveAdminViewToken(token);
  if (!estudianteId) return json({ error: "Enlace inválido o expirado" }, 404);

  const data = await getStudentDetail(estudianteId);
  if (!data) return json({ error: "No encontrado" }, 404);
  return json(data);
};
