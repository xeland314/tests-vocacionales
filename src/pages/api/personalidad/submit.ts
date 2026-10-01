import type { APIRoute } from "astro";
import { crearSubmitHandler } from "../../../server/modules/testing";
import { calculatePersonality } from "../../../data/personalidadScoring";
import { PERSONALITY_QUESTIONS } from "../../../data/personalidad";

export const prerender = false;

/**
 * POST /api/personalidad/submit — 60 preguntas Likert (-3..3) → MBTI 4 dicotomías.
 */
export const POST: APIRoute = crearSubmitHandler({
  test: "PERSONALIDAD",
  validate: (respuestas) => {
    if (!respuestas || typeof respuestas !== "object") return { ok: false, error: "respuestas requeridas" };
    if (Object.keys(respuestas as any).length !== PERSONALITY_QUESTIONS.length) {
      return { ok: false, error: `Se requieren ${PERSONALITY_QUESTIONS.length} respuestas` };
    }
    return { ok: true, value: respuestas };
  },
  score: (respuestas) => {
    const result = calculatePersonality(respuestas);
    return {
      columnas: ["tipo", "dimensiones_json", "percentages_json", "respuestas_json"],
      args: [result.type, JSON.stringify(result.dimensions), JSON.stringify(result.percentages), JSON.stringify(respuestas)],
      extra: { tipo: result.type },
    };
  },
});
