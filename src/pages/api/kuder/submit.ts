import type { APIRoute } from "astro";
import { crearSubmitHandler } from "../../../server/modules/testing";
import { calculateKuder } from "../../../data/kuderScoring";
import { KUDER_DIADAS } from "../../../data/kuder";

export const prerender = false;

/**
 * POST /api/kuder/submit — 45 diadas (a/b), banco Excel Test_Kuder_Completo.xlsx.
 * Normaliza 60→45 por compatibilidad con el banco antiguo.
 */
export const POST: APIRoute = crearSubmitHandler({
  test: "KUDER",
  validate: (respuestasRaw) => {
    if (!respuestasRaw || typeof respuestasRaw !== "object") return { ok: false, error: "respuestas requeridas" };
    const respuestas: Record<string, string> = {};
    for (let i = 1; i <= KUDER_DIADAS.length; i++) {
      const v = (respuestasRaw as any)[i] ?? (respuestasRaw as any)[String(i)];
      if (v === "a" || v === "b") respuestas[String(i)] = v;
    }
    if (Object.keys(respuestas).length !== KUDER_DIADAS.length) {
      return { ok: false, error: `Se requieren ${KUDER_DIADAS.length} respuestas (diadas) — banco Excel Test_Kuder_Completo.xlsx` };
    }
    return { ok: true, value: respuestas };
  },
  score: (respuestas) => {
    const result = calculateKuder(respuestas);
    return {
      columnas: ["top", "ranking_json", "scores_json", "respuestas_json", "verificacion"],
      args: [result.top, JSON.stringify(result.ranking), JSON.stringify(result.scores), JSON.stringify(respuestas), result.verificacion],
      extra: { top: result.top },
    };
  },
});
