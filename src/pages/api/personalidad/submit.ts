import type { APIRoute } from "astro";
import { db, initDb } from "../../../lib/db";
import { calculatePersonality } from "../../../data/personalidadScoring";
import { getReintentoPendiente, consumirReintento } from "../../../lib/reintentos";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await initDb();
    const body = await request.json();
    const { moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra, fecha_unix, respuestas, version = 1, estudiante_id } = body;
    if (!respuestas) return new Response(JSON.stringify({ error: "respuestas requeridas" }), { status: 400 });
    if (Object.keys(respuestas).length !== 60) return new Response(JSON.stringify({ error: "Se requieren 60 respuestas" }), { status: 400 });

    const isMoodle = moodle_user_id != null && Number(moodle_user_id) > 0;
    if (!isMoodle) {
      return new Response(JSON.stringify({ error: "Solo se permiten usuarios de Moodle (moodle_user_id requerido)" }), { status: 400 });
    }

    const result = calculatePersonality(respuestas as any);
    let estId = estudiante_id as string | undefined;
    if (!estId) {
      const existing = await db.execute({ sql: "SELECT id FROM estudiantes WHERE moodle_user_id=? LIMIT 1", args: [Number(moodle_user_id)] });
      if (existing.rows.length > 0) estId = (existing.rows[0] as any).id as string;
    }
    if (!estId) {
      estId = crypto.randomUUID();
      await db.execute({ sql: `INSERT INTO estudiantes (id, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra_json) VALUES (?,?,?,?,?,?)`, args: [estId, Number(moodle_user_id), moodle_user_name ?? null, moodle_user_email ?? null, moodle_course_id ? Number(moodle_course_id) : null, moodle_extra ? JSON.stringify(moodle_extra) : null] });
    } else {
      const exists = await db.execute({ sql: "SELECT id FROM estudiantes WHERE id=?", args: [estId] });
      if (exists.rows.length === 0) {
        await db.execute({ sql: `INSERT INTO estudiantes (id, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra_json) VALUES (?,?,?,?,?,?)`, args: [estId, Number(moodle_user_id), moodle_user_name ?? null, moodle_user_email ?? null, moodle_course_id ? Number(moodle_course_id) : null, moodle_extra ? JSON.stringify(moodle_extra) : null] });
      } else {
        await db.execute({ sql: `UPDATE estudiantes SET moodle_user_name=?, moodle_user_email=?, moodle_course_id=?, moodle_extra_json=? WHERE id=?`, args: [moodle_user_name ?? null, moodle_user_email ?? null, moodle_course_id ? Number(moodle_course_id) : null, moodle_extra ? JSON.stringify(moodle_extra) : null, estId] });
      }
    }
    const fecha = fecha_unix ?? Math.floor(Date.now() / 1000);
    // Regla de reintentos: si ya existe un intento previo, solo se permite un nuevo
    // envío con un reintento habilitado (auditado). Los intentos previos NUNCA se borran
    // ni se sobrescriben: cada intento es una fila nueva con intento_numero.
    const existingRes = await db.execute({ sql: "SELECT id FROM personalidad_resultados WHERE estudiante_id=? LIMIT 1", args: [estId] });
    if (existingRes.rows.length > 0) {
      const pendiente = await getReintentoPendiente(estId, "PERSONALIDAD");
      if (!pendiente) {
        return new Response(JSON.stringify({ error: "Ya completaste este test. Para volver a rendirlo, solicita la habilitación de un reintento a tu docente o administrador." }), { status: 403 });
      }
    }
    const maxR = await db.execute({ sql: "SELECT MAX(intento_numero) as m FROM personalidad_resultados WHERE estudiante_id=?", args: [estId] });
    const intento = Number((maxR.rows[0] as any)?.m || 0) + 1;
    const id = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO personalidad_resultados (id, estudiante_id, fecha_unix, version, tipo, dimensiones_json, percentages_json, respuestas_json, intento_numero) VALUES (?,?,?,?,?,?,?,?,?)`,
      args: [id, estId, fecha, version, result.type, JSON.stringify(result.dimensions), JSON.stringify(result.percentages), JSON.stringify(respuestas), intento],
    });
    // Si este envío consumió un reintento habilitado, márcalo como usado (auditoría).
    await consumirReintento(estId, "PERSONALIDAD", id);
    return new Response(JSON.stringify({ ok: true, id, estudiante_id: estId, fecha_unix: fecha, tipo: result.type, intento_numero: intento, reintentoUsado: existingRes.rows.length > 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
