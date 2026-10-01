/**
 * Módulo Testing — Tokens opacos de vista de estudiante (uuid4, 30 min).
 * No exponen el id real de la BD ni datos en la URL; expiran solos.
 */
import { randomUUID } from "node:crypto";
import { db, initDb } from "../../db";

type AnyRow = Record<string, any>;

export const VIEW_TOKEN_TTL_SECONDS = 30 * 60;

export interface ViewToken {
  token: string;
  expires_unix: number;
}

export async function createAdminViewToken(estudianteId: string): Promise<ViewToken> {
  await initDb();
  const now = Math.floor(Date.now() / 1000);
  await db.execute({ sql: "DELETE FROM admin_view_tokens WHERE expires_unix < ?", args: [now] });
  const token = randomUUID();
  const expires = now + VIEW_TOKEN_TTL_SECONDS;
  await db.execute({
    sql: "INSERT INTO admin_view_tokens (token, estudiante_id, created_at, expires_unix) VALUES (?,?,?,?)",
    args: [token, estudianteId, now, expires],
  });
  return { token, expires_unix: expires };
}

export async function resolveAdminViewToken(token: string): Promise<string | null> {
  if (!token) return null;
  await initDb();
  const now = Math.floor(Date.now() / 1000);
  const r = await db.execute<AnyRow>({
    sql: "SELECT estudiante_id, expires_unix FROM admin_view_tokens WHERE token = ?",
    args: [token],
  });
  if (!r.rows.length) return null;
  const row = r.rows[0];
  if (Number(row.expires_unix) < now) {
    await db.execute({ sql: "DELETE FROM admin_view_tokens WHERE token = ?", args: [token] });
    return null;
  }
  return row.estudiante_id as string;
}
