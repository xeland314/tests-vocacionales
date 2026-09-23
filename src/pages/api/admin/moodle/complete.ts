import type { APIRoute } from "astro";
import { authenticateToken, requireRole } from "../../../../lib/auth";
import { getMoodleConfig, getCmidForTest } from "../../../../lib/moodleConfig";

export const prerender = false;

/**
 * POST /api/admin/moodle/complete — marca manualmente una actividad como completada en Moodle
 * Body: { moodle_user_id: number, test: "CHASIDE"|"KUDER"|"MBTI"|"PERSONALIDAD", cmid?: number }
 * Solo admin. Útil para diagnosticar por qué el marcado automático no funciona.
 */
export const POST: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  if (!requireRole(auth.user, "admin")) return new Response(JSON.stringify({ error: "Solo admin puede marcar completado" }), { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { moodle_user_id, test, cmid: cmidBody } = body as { moodle_user_id?: number; test?: string; cmid?: number };

  if (!moodle_user_id || !test) {
    return new Response(JSON.stringify({ error: "Faltan moodle_user_id y test (CHASIDE/KUDER/MBTI)" }), { status: 400 });
  }

  const MOODLE_URL = import.meta.env.MOODLE_URL || process.env.MOODLE_URL;
  const WS_TOKEN = import.meta.env.MOODLE_WS_TOKEN || process.env.MOODLE_WS_TOKEN;
  if (!MOODLE_URL || !WS_TOKEN) {
    return new Response(JSON.stringify({ error: "MOODLE_URL/WS_TOKEN no configurados en .env" }), { status: 500 });
  }

  // Resolver cmid: prioridad body > config BD > fallback
  let cmid = cmidBody;
  if (!cmid) {
    try {
      const cfg = await getMoodleConfig();
      cmid = getCmidForTest(test, cfg) ?? undefined;
    } catch {}
    if (!cmid) {
      const fallback: Record<string, number> = { CHASIDE: 9, KUDER: 11, MBTI: 10, PERSONALIDAD: 10 };
      cmid = fallback[test.toUpperCase()];
    }
  }
  if (!cmid) return new Response(JSON.stringify({ error: `No hay cmid configurado para ${test}. Ve a Admin > Moodle` }), { status: 400 });

  // Deprecado: Moodle ahora tiene Do not indicate — el completado se ve solo en Panel Astro. Si aún necesitas forzar check, usa override con userid (descomenta abajo).
  return new Response(JSON.stringify({ success: false, warning: "Moodle completion deshabilitado — Completion tracking = Do not indicate. Usa Panel Admin → Estudiantes → Ver para ver el estado real (CHASIDE/MBTI/Kuder rendido). La nota sí se envía a Grades.", cmid, moodleUserId: moodle_user_id, test }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
