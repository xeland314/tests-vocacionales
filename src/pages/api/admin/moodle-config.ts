import type { APIRoute } from "astro";
import { authenticateToken, requireRole } from "../../../lib/auth";
import { getMoodleConfig, setMoodleConfig } from "../../../lib/moodleConfig";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  // docente puede leer, admin puede escribir
  const cfg = await getMoodleConfig();
  return new Response(JSON.stringify(cfg), { headers: { "Content-Type": "application/json" } });
};

export const PUT: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  if (!requireRole(auth.user, "admin")) return new Response(JSON.stringify({ error: "Solo admin puede configurar Moodle" }), { status: 403 });
  const body = await request.json().catch(() => ({}));
  const { chaside_cmid, mbti_cmid, kuder_cmid, course_id } = body as any;
  // Validación: si se envía, debe ser número positivo o null
  const parse = (v: any) => (v === null || v === "" || v === undefined ? null : Number(v));
  const cfg = await setMoodleConfig({
    chaside_cmid: chaside_cmid !== undefined ? parse(chaside_cmid) : undefined,
    mbti_cmid: mbti_cmid !== undefined ? parse(mbti_cmid) : undefined,
    kuder_cmid: kuder_cmid !== undefined ? parse(kuder_cmid) : undefined,
    course_id: course_id !== undefined ? parse(course_id) : undefined,
  });
  return new Response(JSON.stringify(cfg), { headers: { "Content-Type": "application/json" } });
};
