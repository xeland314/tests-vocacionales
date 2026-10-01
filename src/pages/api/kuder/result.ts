import type { APIRoute } from "astro";
import { initDb } from "../../../server/db";
import { findByMoodleUserId, getLatestResultado, getReintentoPendiente, dentroDeVentana } from "../../../server/modules/testing";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    await initDb();
    const moodle_user_id = url.searchParams.get("moodle_user_id");
    if (!moodle_user_id) return new Response(JSON.stringify({ error: "moodle_user_id requerido" }), { status: 400 });
    const est = await findByMoodleUserId(Number(moodle_user_id));
    if (!est) return new Response(JSON.stringify({ found: false }), { status: 200, headers: { "Content-Type": "application/json" } });
    const row = await getLatestResultado(est.id, "KUDER");
    if (!row) return new Response(JSON.stringify({ found: false }), { status: 200, headers: { "Content-Type": "application/json" } });
    const pendiente = await getReintentoPendiente(est.id, "KUDER");
    return new Response(JSON.stringify({
      found: true,
      estudiante_id: est.id,
      id: row.id,
      fecha_unix: row.fecha_unix,
      version: row.version,
      intento_numero: row.intento_numero ?? 1,
      top: row.top,
      ranking: JSON.parse(row.ranking_json),
      scores: JSON.parse(row.scores_json),
      respuestas: JSON.parse(row.respuestas_json),
      verificacion: row.verificacion,
      reintentoPendiente: !!pendiente,
      reintentoVigente: !!pendiente && dentroDeVentana(pendiente),
      reintentoVentana: pendiente ? { desde_unix: pendiente.ventana_desde_unix, hasta_unix: pendiente.ventana_hasta_unix } : null,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
