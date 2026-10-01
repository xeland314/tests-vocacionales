import type { APIRoute } from "astro";
import { authenticateToken, requireRole } from "../../../server/modules/identity";
import { getMoodleConfig, setMoodleConfig, extraerContexto, validarContexto, type TestKey } from "../../../server/modules/moodle-integration";

export const prerender = false;

const TEST_KEYS: TestKey[] = ["CHASIDE", "PERSONALIDAD", "KUDER"];

/** GET /api/admin/moodle-config → config actual (docente y admin) */
export const GET: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  const cfg = await getMoodleConfig();
  return new Response(JSON.stringify(cfg), { headers: { "Content-Type": "application/json" } });
};

/** PUT /api/admin/moodle-config → guarda dominios + cursos + cmids (solo admin) */
export const PUT: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  if (!requireRole(auth.user, "admin")) return new Response(JSON.stringify({ error: "Solo admin puede configurar Moodle" }), { status: 403 });
  const body = await request.json().catch(() => ({}));
  const { moodle_domains, course_ids, chaside_cmids, mbti_cmids, kuder_cmids, referer_required } = body as any;
  // listas: acepta array o string separado por comas/saltos de línea
  const toList = (v: any): string[] | undefined => {
    if (v === undefined) return undefined;
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    return String(v).split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  };
  const toNumberList = (v: any): number[] | undefined => {
    if (v === undefined) return undefined;
    const list = toList(v) ?? [];
    return list.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
  };
  const cfg = await setMoodleConfig({
    moodle_domains: toList(moodle_domains),
    course_ids: toNumberList(course_ids),
    chaside_cmids: toNumberList(chaside_cmids),
    mbti_cmids: toNumberList(mbti_cmids),
    kuder_cmids: toNumberList(kuder_cmids),
    referer_required: referer_required === undefined ? undefined : Boolean(referer_required),
  });
  return new Response(JSON.stringify(cfg), { headers: { "Content-Type": "application/json" } });
};

/**
 * GET /api/admin/moodle-config?validate=CHASIDE&url=... → valida el contexto de la URL dada
 * (origin + courseId + cmid) contra la config BD. Útil para el docente: pega la URL
 * del test y ve si pasaría la validación (diagnóstico, sin Moodle REST).
 */
export const POST: APIRoute = async ({ request, url }) => {
  try {
    const auth = await authenticateToken(request.headers.get("authorization"));
    if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
    const test = (url.searchParams.get("validate") as TestKey) || "";
    if (!TEST_KEYS.includes(test as TestKey)) {
      return new Response(JSON.stringify({ error: "validate debe ser CHASIDE|PERSONALIDAD|KUDER" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const target = url.searchParams.get("url");
    if (!target) return new Response(JSON.stringify({ error: "url requerida (la URL del test en Moodle)" }), { status: 400, headers: { "Content-Type": "application/json" } });
    const ctx = extraerContexto(new URL(target));
    const cfg = await getMoodleConfig();
    const result = validarContexto(test, ctx, cfg);
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
};
