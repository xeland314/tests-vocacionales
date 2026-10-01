/**
 * Módulo Moodle Integration — Validador de contexto Moodle (server-side).
 *
 * Propósito: garantizar que un test solo se tome desde el dominio/curso/actividad
 * correcta de Moodle. NO llama a la API REST de Moodle: todo se decide con la URL
 * de la petición HTTP (query params + Referer) y la configuración en BD (moodle_config).
 *
 * Contrato por test:
 *   CHASIDE       → cursos `course_ids` y actividades `chaside_cmids`
 *   PERSONALIDAD  → cursos `course_ids` y actividades `mbti_cmids`
 *   KUDER         → cursos `course_ids` y actividades `kuder_cmids`
 *
 * REGLA: cada dimensión es opcional e independiente. Lo que no esté configurado,
 * el validador lo salta (modo permisivo).
 */
import type { MoodleConfig } from "./config";

export type { MoodleConfig };

export type TestKey = "CHASIDE" | "PERSONALIDAD" | "KUDER";

export interface MoodleContext {
  /** dominio desde el que se abre el test (Referer o ?host=) */
  origin: string;
  courseId: number | null;
  /** cmid de la actividad URL que embebe el test (parámetro `cmid` o `id` de Moodle) */
  cmid: number | null;
}

export interface ValidationOk {
  ok: true;
  ctx: MoodleContext;
  cfg: MoodleConfig;
}

export interface ValidationErrores {
  ok: false;
  /** qué validaciones fallaron */
  errores: string[];
  /** hint interno para el docente/admin (no se muestra al estudiante) */
  hint: string;
}

export type ValidationResult = ValidationOk | ValidationErrores;

/** Extrae el contexto Moodle de la URL con la que el navegador abre el test. */
export function extraerContexto(url: URL): MoodleContext {
  const p = new URLSearchParams(url.search);
  const num = (v: string | null) => {
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const courseId = num(p.get("courseId") || p.get("course_id") || p.get("cid") || p.get("course"));
  const cmid = num(p.get("cmid") || p.get("id"));
  const origin = url.origin || "";
  return { origin, courseId, cmid };
}

/** cmid(s) esperados por test según la configuración en BD — vacío = no se valida. */
function cmidsEsperados(test: TestKey, cfg: MoodleConfig): number[] {
  switch (test) {
    case "CHASIDE": return cfg.chaside_cmids;
    case "PERSONALIDAD": return cfg.mbti_cmids;
    case "KUDER": return cfg.kuder_cmids;
  }
}

/**
 * ¿`origin` pertenece a `dominio`?
 * - `https://campus.colegio.edu.ec` → coincide exacto o subdominio (sub.colegio.edu.ec)
 * - `https://*.trycloudflare.com`   → wildcard: cualquier subdominio (a.trycloudflare.com, b.trycloudflare.com)
 * El sufijo se compara por segmento de dominio: `eviltrycloudflare.com` NO pasa como `trycloudflare.com`.
 */
export function matchearDominio(origin: string, dominio: string): boolean {
  const limpiar = (s: string) => s.trim().toLowerCase().replace(/\/+$/, "");
  const host = limpiar(origin).replace(/^https?:\/\//, "");
  const dom = limpiar(dominio);
  if (!host || !dom) return false;
  const wildcard = dom.match(/^(?:https?:\/\/)?\*\.(.+)$/);
  if (wildcard) {
    const sufijo = wildcard[1];
    return host === sufijo || host.endsWith("." + sufijo);
  }
  const dominioHost = dom.replace(/^https?:\/\//, "");
  return host === dominioHost || host.endsWith("." + dominioHost);
}

/**
 * Valida origin + curso + actividad contra moodle_config.
 * REGLA: cada dimensión es OPCIONAL e independiente — si no está configurada,
 * se salta (modo permisivo). Solo se exige lo que el admin haya configurado.
 */
export function validarContexto(
  test: TestKey,
  ctx: MoodleContext,
  cfg: MoodleConfig
): ValidationResult {
  const errores: string[] = [];
  const cmidsEsperado = cmidsEsperados(test, cfg);

  // 1) Dominio — si no hay dominios configurados, se salta
  if (cfg.moodle_domains.length > 0) {
    if (!ctx.origin) {
      // Sin Referer (acceso directo): solo bloquea si "exigir Referer" está activo
      if (cfg.referer_required) errores.push("Acceso directo no permitido: abre el test desde Moodle");
    } else {
      const dominioOk = cfg.moodle_domains.some((d) => matchearDominio(ctx.origin, d));
      if (!dominioOk) errores.push(`Dominio no permitido: ${ctx.origin || "desconocido"}`);
    }
  }

  // 2) Curso — si no hay cursos configurados, se salta
  if (cfg.course_ids.length > 0) {
    if (ctx.courseId == null) {
      errores.push(`Falta ?courseId= en la URL del test (cursos válidos: ${cfg.course_ids.join(", ")})`);
    } else if (!cfg.course_ids.includes(ctx.courseId)) {
      errores.push(`Curso incorrecto: esperado ${cfg.course_ids.join(" o ")}, recibido ${ctx.courseId}`);
    }
  }

  // 3) Actividad — si no hay cmids configurados para el test, se salta
  if (cmidsEsperado.length > 0) {
    if (ctx.cmid == null) {
      errores.push(`Falta ?cmid= en la URL del test (cmids válidos: ${cmidsEsperado.join(", ")})`);
    } else if (!cmidsEsperado.includes(ctx.cmid)) {
      errores.push(`Actividad incorrecta: esperada cmid=${cmidsEsperado.join(" o ")}, recibida cmid=${ctx.cmid}`);
    }
  }

  if (errores.length > 0) {
    const cursos = cfg.course_ids.length ? ` del curso ${cfg.course_ids.join(" o ")}` : "";
    return {
      ok: false,
      errores,
      hint: `Abre el test desde la actividad URL correspondiente${cursos} de Moodle`,
    };
  }
  return { ok: true, ctx, cfg };
}
