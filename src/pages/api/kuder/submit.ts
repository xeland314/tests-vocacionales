import type { APIRoute } from "astro";
import { db, initDb } from "../../../lib/db";
import { calculateKuder } from "../../../data/kuderScoring";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await initDb();
    const body = await request.json();
    const { moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra, fecha_unix, respuestas: respuestasRaw, version = 1, estudiante_id } = body;
    if (!respuestasRaw) return new Response(JSON.stringify({ error: "respuestas requeridas" }), { status: 400 });
    // normaliza 60→45 (migración banco Excel) — filtra solo 1..45 con a/b
    const respuestas: Record<string, string> = {};
    for (let i = 1; i <= 45; i++) {
      const v = (respuestasRaw as any)[i] ?? (respuestasRaw as any)[String(i)];
      if (v === "a" || v === "b") respuestas[String(i)] = v;
    }
    if (Object.keys(respuestas).length !== 45) return new Response(JSON.stringify({ error: "Se requieren 45 respuestas (diadas) — banco Excel Test_Kuder_Completo.xlsx" }), { status: 400 });

    const isMoodle = moodle_user_id != null && Number(moodle_user_id) > 0;
    if (!isMoodle) {
      return new Response(JSON.stringify({ error: "Solo se permiten usuarios de Moodle (moodle_user_id requerido)" }), { status: 400 });
    }

    const result = calculateKuder(respuestas as any);
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
    const existingRes = await db.execute({ sql: "SELECT id FROM kuder_resultados WHERE estudiante_id=? LIMIT 1", args: [estId] });
    let id: string;
    if (existingRes.rows.length > 0) {
      id = (existingRes.rows[0] as any).id as string;
      await db.execute({
        sql: `UPDATE kuder_resultados SET fecha_unix=?, version=?, top=?, ranking_json=?, scores_json=?, respuestas_json=?, verificacion=? WHERE id=?`,
        args: [fecha, version, result.top, JSON.stringify(result.ranking), JSON.stringify(result.scores), JSON.stringify(respuestas), result.verificacion, id],
      });
    } else {
      id = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO kuder_resultados (id, estudiante_id, fecha_unix, version, top, ranking_json, scores_json, respuestas_json, verificacion) VALUES (?,?,?,?,?,?,?,?,?)`,
        args: [id, estId, fecha, version, result.top, JSON.stringify(result.ranking), JSON.stringify(result.scores), JSON.stringify(respuestas), result.verificacion],
      });
    }
    return new Response(JSON.stringify({ ok: true, id, estudiante_id: estId, fecha_unix: fecha, top: result.top, updated: existingRes.rows.length > 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
