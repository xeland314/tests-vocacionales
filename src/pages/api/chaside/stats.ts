import type { APIRoute } from "astro";
import { getStats } from "../../../server/modules/admin-panel";
import { authenticateToken } from "../../../server/modules/identity/repository";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const authed = await authenticateToken(request.headers.get("authorization"));
  if (!authed) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const stats = await getStats();
  return new Response(JSON.stringify(stats), { headers: { "Content-Type": "application/json" } });
};
