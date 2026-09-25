import type { APIRoute } from "astro";
import { db, initDb } from "../../../lib/db";
import { getReintentoPendiente } from "../../../lib/reintentos";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    await initDb();
    const moodle_user_id = url.searchParams.get("moodle_user_id");
    if (!moodle_user_id) return new Response(JSON.stringify({ error: "moodle_user_id requerido" }), { status: 400 });
    const est = await db.execute({ sql: "SELECT id FROM estudiantes WHERE moodle_user_id=? LIMIT 1", args: [Number(moodle_user_id)] });
    if (est.rows.length === 0) return new Response(JSON.stringify({ found: false }), { status: 200, headers: { "Content-Type": "application/json" } });
    const estId = (est.rows[0] as any).id as string;
    const r = await db.execute({ sql: "SELECT * FROM chaside_resultados WHERE estudiante_id=? ORDER BY fecha_unix DESC LIMIT 1", args: [estId] });
    if (r.rows.length === 0) return new Response(JSON.stringify({ found: false }), { status: 200, headers: { "Content-Type": "application/json" } });
    const row = r.rows[0] as any;
    const pendiente = await getReintentoPendiente(estId, "CHASIDE");
    return new Response(JSON.stringify({
      found: true,
      estudiante_id: estId,
      id: row.id,
      fecha_unix: row.fecha_unix,
      version: row.version,
      intento_numero: row.intento_numero ?? 1,
      top_interes: row.top_interes,
      segundo_interes: row.segundo_interes,
      top_aptitud: row.top_aptitud,
      intereses: JSON.parse(row.intereses_json),
      aptitudes: JSON.parse(row.aptitudes_json),
      respuestas: JSON.parse(row.respuestas_json),
      // Si hay un reintento habilitado sin usar, el estudiante puede volver a rendir.
      reintentoPendiente: !!pendiente,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
