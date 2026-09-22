import type { APIRoute } from "astro";
import { db, initDb } from "../../../lib/db";
import { calculateScores } from "../../../data/scoring";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await initDb();
    const body = await request.json();
    const { nombre_estudiante, nombre_padre, correo_estudiante, correo_padre, cedula_estudiante, cedula_representante, telefono, email, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra, fecha_unix, respuestas, version = 1, estudiante_id } = body;
    if (!respuestas) return new Response(JSON.stringify({ error: "respuestas requeridas" }), { status: 400 });
    if (Object.keys(respuestas).length !== 98) return new Response(JSON.stringify({ error: "Se requieren 98 respuestas" }), { status: 400 });

    // Validación reducida: Moodle -> moodle_user_id basta; Anónimo -> telefono+email obligatorios
    const isMoodle = moodle_user_id != null && Number(moodle_user_id) > 0;
    if (!isMoodle) {
      if (!telefono || !email) return new Response(JSON.stringify({ error: "telefono y email son obligatorios para anon" }), { status: 400 });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response(JSON.stringify({ error: "email inválido" }), { status: 400 });
      if (!/^[0-9+() \-]{7,20}$/.test(telefono)) return new Response(JSON.stringify({ error: "telefono inválido" }), { status: 400 });
    }
    const nombreFinal = (nombre_estudiante?.trim()) || (isMoodle ? `moodle_${moodle_user_id}` : email?.split("@")[0] || "anon");
    if (!nombreFinal) return new Response(JSON.stringify({ error: "nombre_estudiante requerido" }), { status: 400 });

    const scores = calculateScores(respuestas as any);
    let estId = estudiante_id as string | undefined;
    // si no viene id, crear estudiante persona (si es Moodle, reusar por moodle_user_id)
    if (!estId && isMoodle) {
      const existing = await db.execute({ sql: "SELECT id FROM estudiantes WHERE moodle_user_id=? LIMIT 1", args: [Number(moodle_user_id)] });
      if (existing.rows.length > 0) estId = (existing.rows[0] as any).id as string;
    }
    if (!estId) {
      estId = crypto.randomUUID();
      await db.execute({ sql: `INSERT INTO estudiantes (id, nombre_estudiante, nombre_padre, correo_estudiante, correo_padre, cedula_estudiante, cedula_representante, telefono, email, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: [estId, nombreFinal, nombre_padre ?? null, correo_estudiante ?? null, correo_padre ?? null, cedula_estudiante ?? null, cedula_representante ?? null, telefono ?? null, email ?? null, isMoodle ? Number(moodle_user_id) : null, moodle_user_name ?? null, moodle_user_email ?? null, moodle_course_id ? Number(moodle_course_id) : null, moodle_extra ? JSON.stringify(moodle_extra) : null] });
    } else {
      // upsert nombre si existe
      const exists = await db.execute({ sql: "SELECT id FROM estudiantes WHERE id=?", args: [estId] });
      if (exists.rows.length === 0) {
        await db.execute({ sql: `INSERT INTO estudiantes (id, nombre_estudiante, nombre_padre, correo_estudiante, correo_padre, cedula_estudiante, cedula_representante, telefono, email, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: [estId, nombreFinal, nombre_padre ?? null, correo_estudiante ?? null, correo_padre ?? null, cedula_estudiante ?? null, cedula_representante ?? null, telefono ?? null, email ?? null, isMoodle ? Number(moodle_user_id) : null, moodle_user_name ?? null, moodle_user_email ?? null, moodle_course_id ? Number(moodle_course_id) : null, moodle_extra ? JSON.stringify(moodle_extra) : null] });
      } else if (isMoodle) {
        await db.execute({ sql: `UPDATE estudiantes SET moodle_user_id=?, moodle_user_name=?, moodle_user_email=?, moodle_course_id=?, moodle_extra_json=? WHERE id=?`, args: [Number(moodle_user_id), moodle_user_name ?? null, moodle_user_email ?? null, moodle_course_id ? Number(moodle_course_id) : null, moodle_extra ? JSON.stringify(moodle_extra) : null, estId] });
      }
    }

    const id = crypto.randomUUID();
    const fecha = fecha_unix ?? Math.floor(Date.now() / 1000);
    await db.execute({
      sql: `INSERT INTO chaside_resultados (id, estudiante_id, fecha_unix, version, top_interes, segundo_interes, top_aptitud, intereses_json, aptitudes_json, respuestas_json) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [id, estId, fecha, version, scores.topInteres, scores.segundoInteres ?? null, scores.topAptitud, JSON.stringify(scores.intereses), JSON.stringify(scores.aptitudes), JSON.stringify(respuestas)],
    });

    return new Response(JSON.stringify({ ok: true, id, estudiante_id: estId, fecha_unix: fecha }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
