import type { APIRoute } from "astro";
import { authenticateToken, requireRole } from "../../../server/modules/identity";
import { buildBackupPayload } from "../../../server/modules/admin-panel";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  if (!requireRole(auth.user, "admin")) return new Response(JSON.stringify({ error: "Solo admin puede hacer respaldo" }), { status: 403 });
  const payload = await buildBackupPayload();
  const body = JSON.stringify(payload, null, 2);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="respaldo_${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
};
