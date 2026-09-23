import type { APIRoute } from "astro";
import { db, initDb } from "../../../lib/db";
import { calculateScores } from "../../../data/scoring";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await initDb();
    const body = await request.json();
    const { moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra, fecha_unix, respuestas, version = 1, estudiante_id } = body;
    if (!respuestas) return new Response(JSON.stringify({ error: "respuestas requeridas" }), { status: 400 });
    if (Object.keys(respuestas).length !== 98) return new Response(JSON.stringify({ error: "Se requieren 98 respuestas" }), { status: 400 });

    // Solo Moodle: exige moodle_user_id
    const isMoodle = moodle_user_id != null && Number(moodle_user_id) > 0;
    if (!isMoodle) {
      return new Response(JSON.stringify({ error: "Solo se permiten usuarios de Moodle (moodle_user_id requerido)" }), { status: 400 });
    }

    const scores = calculateScores(respuestas as any);
    let estId = estudiante_id as string | undefined;
    // Reusar estudiante por moodle_user_id (solo Moodle)
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
    // Idempotencia: si ya existe resultado para este estudiante, actualizar en lugar de duplicar
    const existingRes = await db.execute({ sql: "SELECT id FROM chaside_resultados WHERE estudiante_id=? LIMIT 1", args: [estId] });
    let id: string;
    if (existingRes.rows.length > 0) {
      id = (existingRes.rows[0] as any).id as string;
      await db.execute({
        sql: `UPDATE chaside_resultados SET fecha_unix=?, version=?, top_interes=?, segundo_interes=?, top_aptitud=?, intereses_json=?, aptitudes_json=?, respuestas_json=? WHERE id=?`,
        args: [fecha, version, scores.topInteres, scores.segundoInteres ?? null, scores.topAptitud, JSON.stringify(scores.intereses), JSON.stringify(scores.aptitudes), JSON.stringify(respuestas), id],
      });
    } else {
      id = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO chaside_resultados (id, estudiante_id, fecha_unix, version, top_interes, segundo_interes, top_aptitud, intereses_json, aptitudes_json, respuestas_json) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        args: [id, estId, fecha, version, scores.topInteres, scores.segundoInteres ?? null, scores.topAptitud, JSON.stringify(scores.intereses), JSON.stringify(scores.aptitudes), JSON.stringify(respuestas)],
      });
    }

    return new Response(JSON.stringify({ ok: true, id, estudiante_id: estId, fecha_unix: fecha, updated: existingRes.rows.length > 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
