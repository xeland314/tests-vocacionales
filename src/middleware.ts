/**
 * Middleware de acceso — valida que los tests solo se abran desde el dominio,
 * curso y actividad de Moodle configurados en Admin → Moodle (moodle_config).
 *
 * REGLAS:
 * - Solo aplica a las páginas de tests (/chaside, /kuder, /mbti, /personalidad).
 * - Cada dimensión (dominio/curso/actividad) es opcional: lo que no esté
 *   configurado NO se valida (modo permisivo). Con todo vacío, todo pasa.
 * - El dominio Moodle se determina por el header Referer (origen de la página
 *   que enlaza/embebe el test). Sin Referer = acceso directo.
 *
 * ANTI-BYPASS: si la validación falla se responde con la MISMA página 404 del
 * sitio (estado 404), sin revelar qué comprobación falló ni cómo pasarla.
 * Los detalles quedan únicamente en el log del servidor.
 */
import { defineMiddleware } from "astro:middleware";
import { getMoodleConfig, extraerContexto, validarContexto, type TestKey } from "./server/modules/moodle-integration";

const RUTA_POR_TEST: Array<{ prefijo: string; test: TestKey; nombre: string }> = [
  { prefijo: "/chaside", test: "CHASIDE", nombre: "Test CHASIDE" },
  { prefijo: "/kuder", test: "KUDER", nombre: "Test Kuder" },
  { prefijo: "/mbti", test: "PERSONALIDAD", nombre: "Test de Personalidad (MBTI)" },
  { prefijo: "/personalidad", test: "PERSONALIDAD", nombre: "Test de Personalidad (MBTI)" },
];

/** Renderiza el 404 real del sitio con estado 404 — indistinguible de un enlace roto. */
async function responder404(next: (path?: string) => Promise<Response>): Promise<Response> {
  try {
    const page = await next("/404");
    return new Response(page.body, { status: 404, headers: page.headers });
  } catch {
    return new Response("404 - Página no encontrada", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname.replace(/\/+$/, "") || "/";
  const ruta = RUTA_POR_TEST.find((r) => pathname === r.prefijo || pathname.startsWith(r.prefijo + "/"));
  if (!ruta) return next();

  try {
    const cfg = await getMoodleConfig();
    // Modo permisivo: sin ninguna configuración, no se valida nada
    const sinConfig =
      cfg.moodle_domains.length === 0 &&
      cfg.course_ids.length === 0 &&
      cfg.chaside_cmids.length === 0 &&
      cfg.mbti_cmids.length === 0 &&
      cfg.kuder_cmids.length === 0;
    if (sinConfig) return next();

    // Dominio Moodle = origen del Referer (la página de Moodle que abre el test)
    const referer = context.request.headers.get("referer");
    let moodleOrigin = "";
    if (referer) {
      try { moodleOrigin = new URL(referer).origin; } catch {}
    }
    const ctx = extraerContexto(context.url);
    const result = validarContexto(ruta.test, { origin: moodleOrigin, courseId: ctx.courseId, cmid: ctx.cmid }, cfg);
    if (!result.ok) {
      // Solo log del servidor: al cliente no se le revela el motivo
      console.warn(`[moodle-validator] ${ruta.nombre} bloqueado ${context.url.pathname}${context.url.search} — origen=${moodleOrigin || "sin-referer"} — ${result.errores.join(" | ")}`);
      return await responder404(next);
    }
    return next();
  } catch (e) {
    // Si la BD no está disponible no bloqueamos el test por un error interno del validador
    console.warn(`[moodle-validator] error interno, se permite el acceso: ${e instanceof Error ? e.message : e}`);
    return next();
  }
});
