import type { APIRoute } from "astro";
import { authenticateToken } from "../../../../server/modules/identity/repository";
import { createAdminViewToken } from "../../../../server/modules/testing";

export const prerender = false;

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export const POST: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return json({ error: "No autenticado" }, 401);

  const body = await request.json().catch(() => ({} as any));
  const id = body?.id;
  if (!id) return json({ error: "Falta el id del estudiante" }, 400);

  const { token, expires_unix } = await createAdminViewToken(String(id));
  return json({ token, expires_unix });
};
