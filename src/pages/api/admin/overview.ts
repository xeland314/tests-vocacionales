import type { APIRoute } from "astro";
import { authenticateToken } from "../../../lib/auth";
import { getOverview, getChasideStats, getPersonalidadStats, getKuderStats } from "../../../lib/admin";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const overview = await getOverview();
  const chaside = await getChasideStats();
  const personalidad = await getPersonalidadStats();
  const kuder = await getKuderStats();
  return new Response(JSON.stringify({ overview, chaside, personalidad, kuder }), { status: 200, headers: { "Content-Type": "application/json" } });
};
