import type { APIRoute } from "astro";
import { initDb } from "../../../server/db";
import { crearSubmitHandler } from "../../../server/modules/testing";
import { calculateScores } from "../../../data/scoring";
import { QUESTIONS } from "../../../data/chaside";

export const prerender = false;

/**
 * POST /api/chaside/submit — 98 preguntas SÍ/NO.
 * Reglas de reintentos centralizadas en server/modules/testing (submit.service).
 */
export const POST: APIRoute = crearSubmitHandler({
  test: "CHASIDE",
  validate: (respuestas) => {
    if (!respuestas || typeof respuestas !== "object") return { ok: false, error: "respuestas requeridas" };
    if (Object.keys(respuestas as any).length !== QUESTIONS.length) {
      return { ok: false, error: `Se requieren ${QUESTIONS.length} respuestas` };
    }
    return { ok: true, value: respuestas };
  },
  score: (respuestas) => {
    const scores = calculateScores(respuestas);
    return {
      columnas: ["top_interes", "segundo_interes", "top_aptitud", "intereses_json", "aptitudes_json", "respuestas_json"],
      args: [scores.topInteres, scores.segundoInteres ?? null, scores.topAptitud, JSON.stringify(scores.intereses), JSON.stringify(scores.aptitudes), JSON.stringify(respuestas)],
      extra: {},
    };
  },
});

// initDb ya corre dentro del handler via repos; exponemos GET/POST de sync por compat
export const GET: APIRoute = async () => { await initDb(); return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } }); };
