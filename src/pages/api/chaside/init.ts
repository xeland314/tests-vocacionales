import type { APIRoute } from "astro";
import { initDb } from "../../../server/db";

export const prerender = false;

export const POST: APIRoute = async () => {
  await initDb();
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
export const GET: APIRoute = async () => {
  await initDb();
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
