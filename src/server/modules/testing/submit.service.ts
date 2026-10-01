/**
 * Módulo Testing — Casos de uso (application services) de envío de tests.
 * Orquestan: upsert de estudiante Moodle → regla de reintentos → insert resultado
 * → consumo del reintento. Recordatorio de negocio: los intentos previos nunca se
 * borran; un reintento habilitado (auditado) es lo único que permite volver a rendir.
 */
import crypto from "node:crypto";
import type { APIRoute } from "astro";
import { upsertMoodleEstudiante } from "./estudiantes.repo";
import { existeResultado, insertResultado, nextIntentoNumero } from "./resultados.repo";
import { getReintentoPendiente, consumirReintento, dentroDeVentana } from "./reintentos.repo";
import { RESULTADOS_TABLE, type TestCodigo } from "./domain";

export interface SubmitBody {
  moodle_user_id?: number | string;
  moodle_user_name?: string;
  moodle_user_email?: string;
  moodle_course_id?: number | string;
  moodle_extra?: unknown;
  fecha_unix?: number;
  version?: number;
  estudiante_id?: string;
  respuestas: unknown;
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/**
 * Factory del endpoint POST de envío para cada test.
 * `validate`/`score` los aporta el dominio (scoring de cada test).
 */
export function crearSubmitHandler(opts: {
  test: TestCodigo;
  validate: (respuestas: unknown) => { ok: true; value: unknown } | { ok: false; error: string };
  score: (respuestas: any) => { columnas: string[]; args: any[]; extra: Record<string, unknown> };
}): APIRoute {
  return async ({ request }) => {
    try {
      const body = (await request.json()) as SubmitBody;
      const valida = opts.validate(body.respuestas);
      if (!valida.ok) return jsonResponse({ error: valida.error }, 400);

      // Solo Moodle: exige moodle_user_id
      const isMoodle = body.moodle_user_id != null && Number(body.moodle_user_id) > 0;
      if (!isMoodle) {
        return jsonResponse({ error: "Solo se permiten usuarios de Moodle (moodle_user_id requerido)" }, 400);
      }

      const estId = await upsertMoodleEstudiante({
        id: body.estudiante_id,
        moodle_user_id: Number(body.moodle_user_id),
        moodle_user_name: body.moodle_user_name ?? null,
        moodle_user_email: body.moodle_user_email ?? null,
        moodle_course_id: body.moodle_course_id ? Number(body.moodle_course_id) : null,
        moodle_extra: body.moodle_extra,
      });

      const fecha = body.fecha_unix ?? Math.floor(Date.now() / 1000);
      const yaRendido = await existeResultado(estId, opts.test);
      if (yaRendido) {
        const pendiente = await getReintentoPendiente(estId, opts.test);
        if (!pendiente) {
          return jsonResponse({ error: "Ya completaste este test. Para volver a rendirlo, solicita la habilitación de un reintento a tu docente o administrador." }, 403);
        }
        if (!dentroDeVentana(pendiente)) {
          const hasta = pendiente.ventana_hasta_unix ? new Date(pendiente.ventana_hasta_unix * 1000).toLocaleString() : null;
          const desde = pendiente.ventana_desde_unix ? new Date(pendiente.ventana_desde_unix * 1000).toLocaleString() : null;
          return jsonResponse({ error: `Tu reintento está habilitado ${desde ? `desde ${desde}` : ""}${hasta ? ` hasta ${hasta}` : ""}. Vuelve dentro de esa ventana.` }, 403);
        }
      }
      const intento = await nextIntentoNumero(estId, opts.test);
      const scored = opts.score(valida.value);
      const id = crypto.randomUUID();
      await insertResultado(opts.test, {
        id,
        estudiante_id: estId,
        fecha_unix: fecha,
        version: body.version ?? 1,
        intento_numero: intento,
        columnas: scored.columnas,
        args: scored.args,
      });
      await consumirReintento(estId, opts.test, id);
      return jsonResponse(
        { ok: true, id, estudiante_id: estId, fecha_unix: fecha, intento_numero: intento, reintentoUsado: yaRendido, ...scored.extra },
        200
      );
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  };
}

export { RESULTADOS_TABLE };
