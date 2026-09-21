/**
 * Módulo dedicado auth — Knox-style Token Authentication
 * Inspirado en django-knox: SHA512 digest, 64 chars token, TTL 10h, prefix "Token"
 * Settings equivalentes a REST_KNOX
 */
import crypto from "node:crypto";
import * as bcrypt from "bcryptjs";
import { db, initDb } from "./db";

// --- Settings (REST_KNOX defaults) ---
export const REST_KNOX = {
  SECURE_HASH_ALGORITHM: "sha512" as const, // hashlib.sha512
  AUTH_TOKEN_CHARACTER_LENGTH: 64,
  TOKEN_TTL_SECONDS: 10 * 60 * 60, // timedelta(hours=10)
  TOKEN_LIMIT_PER_USER: null as number | null,
  AUTH_HEADER_PREFIX: "Token",
  DIGEST_LENGTH: 128, // sha512 hex
  TOKEN_KEY_LENGTH: 8, // primeros N chars para lookup rápido
  AUTO_REFRESH: false,
};

export interface KnoxTokenInstance {
  digest: string;
  token_key: string;
  user_id: string;
  created: number; // unix
  expiry: number; // unix
}

// Helpers Knox — overridables
export function get_token_ttl(): number { return REST_KNOX.TOKEN_TTL_SECONDS; }
export function get_token_limit_per_user(): number | null { return REST_KNOX.TOKEN_LIMIT_PER_USER; }
export function get_expiry_datetime_format(): string { return "iso-8601"; }
export function format_expiry_datetime(expiryUnix: number): string {
  return new Date(expiryUnix * 1000).toISOString();
}
export function get_token_ttl_expiry(createdUnix = Math.floor(Date.now()/1000)): number {
  return createdUnix + get_token_ttl();
}

// Secure hash (SHA512)
export function hashToken(token: string): string {
  return crypto.createHash(REST_KNOX.SECURE_HASH_ALGORITHM).update(token).digest("hex");
}

export function generateRawToken(): string {
  // 64 chars hex = 32 bytes
  return crypto.randomBytes(32).toString("hex").slice(0, REST_KNOX.AUTH_TOKEN_CHARACTER_LENGTH);
}

export async function create_token(user_id: string): Promise<{ token: string; instance: KnoxTokenInstance }> {
  await initDb();
  const limit = get_token_limit_per_user();
  if (limit !== null) {
    const cnt = await db.execute({ sql: "SELECT COUNT(*) as c FROM knox_authtoken WHERE user_id=? AND expiry > ?", args: [user_id, Math.floor(Date.now()/1000)] });
    const c = Number((cnt.rows[0] as any).c);
    if (c >= limit) throw new Error(`Token limit per user (${limit}) reached`);
  }
  const token = generateRawToken();
  const digest = hashToken(token);
  const token_key = token.slice(0, REST_KNOX.TOKEN_KEY_LENGTH);
  const created = Math.floor(Date.now()/1000);
  const expiry = get_token_ttl_expiry(created);
  const instance: KnoxTokenInstance = { digest, token_key, user_id, created, expiry };
  await db.execute({
    sql: "INSERT INTO knox_authtoken (digest, token_key, user_id, created, expiry) VALUES (?,?,?,?,?)",
    args: [digest, token_key, user_id, created, expiry],
  });
  // Purge expired
  await db.execute({ sql: "DELETE FROM knox_authtoken WHERE expiry <= ?", args: [created] });
  return { token, instance };
}

export async function authenticateToken(authHeader: string | null): Promise<{ user: any; instance: KnoxTokenInstance } | null> {
  if (!authHeader) return null;
  const prefix = REST_KNOX.AUTH_HEADER_PREFIX + " ";
  if (!authHeader.startsWith(prefix)) return null;
  const token = authHeader.slice(prefix.length).trim();
  if (!token) return null;
  const digest = hashToken(token);
  await initDb();
  const r = await db.execute({ sql: "SELECT * FROM knox_authtoken WHERE digest=?", args: [digest] });
  if (r.rows.length === 0) return null;
  const inst = r.rows[0] as any as KnoxTokenInstance;
  if (inst.expiry <= Math.floor(Date.now()/1000)) {
    await db.execute({ sql: "DELETE FROM knox_authtoken WHERE digest=?", args: [digest] });
    return null;
  }
  // AUTO_REFRESH opcional
  if (REST_KNOX.AUTO_REFRESH) {
    const newExpiry = get_token_ttl_expiry(Math.floor(Date.now()/1000));
    await db.execute({ sql: "UPDATE knox_authtoken SET expiry=? WHERE digest=?", args: [newExpiry, digest] });
    inst.expiry = newExpiry;
  }
  const u = await db.execute({ sql: "SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id=?", args: [inst.user_id] });
  if (u.rows.length===0) return null;
  const user = u.rows[0] as any;
  if (user.is_active === 0) return null;
  return { user, instance: inst };
}

// User helpers bcrypt
const BCRYPT_ROUNDS = 10;
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// RBAC
export type UserRole = "admin" | "docente";
export const ROLES: UserRole[] = ["admin", "docente"];

export function requireRole(user: any, allowed: UserRole | UserRole[]): boolean {
  if (!user?.role) return false;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return list.includes(user.role as UserRole);
}

// get_post_response_data equivalent
export function get_post_response_data(token: string, instance: KnoxTokenInstance, user: any) {
  return {
    expiry: format_expiry_datetime(instance.expiry),
    token,
    user,
  };
}
