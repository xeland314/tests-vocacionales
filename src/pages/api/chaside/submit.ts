import type { APIRoute } from "astro";
import { db, initDb } from "../../../lib/db";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await initDb();
    const body = await request.json();
    const {
      nombre_estudiante,
      nombre_padre,
      correo_estudiante,
      correo_padre,
      cedula_estudiante,
      cedula_representante,
      fecha_unix,
      respuestas, // Record<number, boolean> 1..98
      version = 1,
    } = body;

    if (!nombre_estudiante || !respuestas) {
      return new Response(JSON.stringify({ error: "nombre_estudiante y respuestas requeridos" }), { status: 400 });
    }

    // Validar 98 respuestas
    const keys = Object.keys(respuestas);
    if (keys.length !== 98) {
      return new Response(JSON.stringify({ error: "Se requieren 98 respuestas" }), { status: 400 });
    }

    const id = crypto.randomUUID();
    const fecha = fecha_unix ?? Math.floor(Date.now() / 1000);

    await db.execute({
      sql: `INSERT INTO estudiantes (id, nombre_estudiante, nombre_padre, correo_estudiante, correo_padre, cedula_estudiante, cedula_representante, fecha_unix, test_codigo, version)
            VALUES (?,?,?,?,?,?,?,?, 'CHASIDE', ?)`,
      args: [id, nombre_estudiante, nombre_padre ?? null, correo_estudiante ?? null, correo_padre ?? null, cedula_estudiante ?? null, cedula_representante ?? null, fecha, version],
    });

    // Insertar 98 respuestas en transacción
    const stmts: any[] = [];
    for (let i = 1; i <= 98; i++) {
      const v = respuestas[i] ? 1 : 0;
      stmts.push(db.execute({
        sql: "INSERT INTO respuestas (estudiante_id, pregunta_id, respuesta, version) VALUES (?,?,?,?)",
        args: [id, i, v, version],
      }));
    }
    await Promise.all(stmts);

    return new Response(JSON.stringify({ ok: true, id, fecha_unix: fecha }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
