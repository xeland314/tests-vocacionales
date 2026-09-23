import type { APIRoute } from "astro";
import { getMoodleConfig, getCmidForTest } from "../../../lib/moodleConfig";

export const prerender = false;

/**
 * POST /api/moodle/grade — proxy seguro server-side para no exponer WS_TOKEN al navegador
 * Body: { moodleUserId: number, score: number, testType: "CHASIDE"|"KUDER"|"MBTI", courseId?: number }
 * Usa MOODLE_URL / MOODLE_WS_TOKEN del .env (sin prefijo PUBLIC_)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { moodleUserId, score, testType } = body as {
      moodleUserId?: number;
      score?: number;
      testType?: string;
      courseId?: number;
    };
    let { courseId } = body as { courseId?: number };
    // Si no se envía courseId, usa el configurado en BD
    if (!courseId) {
      try {
        const cfg = await getMoodleConfig();
        courseId = cfg.course_id ?? 2;
      } catch { courseId = 2; }
    }

    if (!moodleUserId || score === undefined || !testType) {
      return new Response(JSON.stringify({ error: "Faltan parámetros: moodleUserId, score, testType" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const MOODLE_URL = import.meta.env.MOODLE_URL || process.env.MOODLE_URL;
    const WS_TOKEN = import.meta.env.MOODLE_WS_TOKEN || process.env.MOODLE_WS_TOKEN;

    if (!MOODLE_URL || !WS_TOKEN) {
      return new Response(JSON.stringify({ error: "Configuración servidor incompleta (MOODLE_URL/WS_TOKEN)" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Moodle WS: core_grades_update_grades — con iteminstance=cmid para que la nota quede asociada a la actividad URL y dispare el completado automático si la actividad está en "Show activity as complete when conditions are met" + "Student must receive a grade"
    let cmid = (body as any).cmid as number | undefined;
    if (!cmid) {
      try {
        const cfg = await getMoodleConfig();
        cmid = getCmidForTest(String(testType || ""), cfg) ?? undefined;
      } catch {
        const fallback: Record<string, number> = { CHASIDE: 9, KUDER: 11, MBTI: 10, PERSONALIDAD: 10 };
        cmid = fallback[String(testType || "").toUpperCase()] as any;
      }
    }
    const wsUrl = `${MOODLE_URL.replace(/\/$/, "")}/webservice/rest/server.php`;
    const gradeParams = new URLSearchParams({
      wstoken: WS_TOKEN,
      wsfunction: "core_grades_update_grades",
      moodlewsrestformat: "json",
      source: "astro_test",
      courseid: String(courseId),
      itemtype: "mod",
      itemmodule: "url",
      iteminstance: String(cmid || 0),
      itemnumber: "0",
      "grades[0][studentid]": String(moodleUserId),
      "grades[0][grade]": String(score),
    });
    const moodleRes = await fetch(wsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: gradeParams,
    });

    const moodleData = await moodleRes.json().catch(async () => ({ raw: await moodleRes.text() }));
    const ok = moodleRes.ok && !(moodleData as any)?.exception;
    // Con Solución 1 (Show as complete when conditions are met + must receive a grade), Moodle marca Done automáticamente al recibir la nota — no hace falta llamar a core_completion_update_activity_completion_status_manually
    let completion: any = { auto: "grade triggers completion if activity is set to Show as complete when conditions are met + must receive a grade", cmid };

    if (!ok) {
      // No propagar 502 al navegador — Moodle puede estar en trycloudflare con WS deshabilitado, pero completion ya intentado
      return new Response(JSON.stringify({ success: false, warning: "Moodle WS no disponible", moodleData, completion }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, moodleData, completion }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Error interno", details: e?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
