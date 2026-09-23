import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/moodle/grade — proxy seguro server-side para no exponer WS_TOKEN al navegador
 * Body: { moodleUserId: number, score: number, testType: "CHASIDE"|"KUDER"|"MBTI", courseId?: number }
 * Usa MOODLE_URL / MOODLE_WS_TOKEN del .env (sin prefijo PUBLIC_)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { moodleUserId, score, testType, courseId = 2 } = body as {
      moodleUserId?: number;
      score?: number;
      testType?: string;
      courseId?: number;
    };

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

    // Moodle WS: core_grades_update_grades
    const wsUrl = `${MOODLE_URL.replace(/\/$/, "")}/webservice/rest/server.php?wstoken=${WS_TOKEN}&wsfunction=core_grades_update_grades&moodlewsrestformat=json`;

    const moodleRes = await fetch(wsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grades: [
          {
            studentid: Number(moodleUserId),
            grade: Number(score),
            itemname: testType === "MBTI" || testType === "PERSONALIDAD" ? "MBTI" : testType,
            courseid: Number(courseId),
          },
        ],
      }),
    });

    const moodleData = await moodleRes.json().catch(async () => ({ raw: await moodleRes.text() }));
    const ok = moodleRes.ok && !(moodleData as any)?.exception;

    // Marcar completado automáticamente (cmid mapeado por testType si no se envía) — independiente de nota
    const CMID_MAP: Record<string, number> = { CHASIDE: 9, KUDER: 11, MBTI: 10, PERSONALIDAD: 10 };
    let cmid = (body as any).cmid as number | undefined;
    if (!cmid) {
      const key = String(testType || "").toUpperCase();
      cmid = CMID_MAP[key] ?? (null as any);
    }
    let completion: any = null;
    if (cmid) {
      const compUrl = `${MOODLE_URL.replace(/\/$/, "")}/webservice/rest/server.php?wstoken=${WS_TOKEN}&wsfunction=core_completion_update_activity_completion_status_manually&moodlewsrestformat=json`;
      try {
        const compRes = await fetch(compUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ cmid: String(cmid), completed: "1", userid: String(moodleUserId) }),
        });
        const compData = await compRes.json().catch(async () => ({ raw: await compRes.text() }));
        completion = compData;
        if ((compData as any)?.exception) {
          console.warn(`[moodle] completion cmid=${cmid} exception:`, (compData as any).exception, compData);
        }
      } catch (e) {
        console.warn(`[moodle] completion cmid=${cmid} fetch error:`, e);
        completion = { error: String(e) };
      }
    }

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
