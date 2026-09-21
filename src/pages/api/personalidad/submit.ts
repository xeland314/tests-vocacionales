import type { APIRoute } from "astro";
import { db, initDb } from "../../../lib/db";
import { calculatePersonality } from "../../../data/personalidadScoring";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await initDb();
    const body = await request.json();
    const { nombre_estudiante, nombre_padre, correo_estudiante, correo_padre, cedula_estudiante, cedula_representante, fecha_unix, respuestas, version = 1, estudiante_id } = body;
    if (!nombre_estudiante || !respuestas) return new Response(JSON.stringify({ error: "nombre_estudiante y respuestas requeridos" }), { status: 400 });
    if (Object.keys(respuestas).length !== 60) return new Response(JSON.stringify({ error: "Se requieren 60 respuestas" }), { status: 400 });

    const result = calculatePersonality(respuestas as any);
    let estId = estudiante_id as string | undefined;
    if (!estId) {
      estId = crypto.randomUUID();
      await db.execute({ sql: `INSERT INTO estudiantes (id, nombre_estudiante, nombre_padre, correo_estudiante, correo_padre, cedula_estudiante, cedula_representante) VALUES (?,?,?,?,?,?,?)`, args: [estId, nombre_estudiante, nombre_padre ?? null, correo_estudiante ?? null, correo_padre ?? null, cedula_estudiante ?? null, cedula_representante ?? null] });
    } else {
      const exists = await db.execute({ sql: "SELECT id FROM estudiantes WHERE id=?", args: [estId] });
      if (exists.rows.length === 0) {
        await db.execute({ sql: `INSERT INTO estudiantes (id, nombre_estudiante, nombre_padre, correo_estudiante, correo_padre, cedula_estudiante, cedula_representante) VALUES (?,?,?,?,?,?,?)`, args: [estId, nombre_estudiante, nombre_padre ?? null, correo_estudiante ?? null, correo_padre ?? null, cedula_estudiante ?? null, cedula_representante ?? null] });
      }
    }
    const id = crypto.randomUUID();
    const fecha = fecha_unix ?? Math.floor(Date.now() / 1000);
    await db.execute({
      sql: `INSERT INTO personalidad_resultados (id, estudiante_id, fecha_unix, version, tipo, dimensiones_json, percentages_json, respuestas_json) VALUES (?,?,?,?,?,?,?,?)`,
      args: [id, estId, fecha, version, result.type, JSON.stringify(result.dimensions), JSON.stringify(result.percentages), JSON.stringify(respuestas)],
    });
    return new Response(JSON.stringify({ ok: true, id, estudiante_id: estId, fecha_unix: fecha, tipo: result.type }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
