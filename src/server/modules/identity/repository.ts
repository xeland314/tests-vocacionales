/**
 * Módulo Identity — Repositorio MySQL de usuarios + tokens Knox.
 * Knox-style: SHA512 digest, token de 64 chars, TTL 10h, prefix "Token".
 */
import crypto from "node:crypto";
import { db, initDb } from "../../db";
import { hashPasswordSafe, verifyPasswordSafe, BCRYPT_ROUNDS } from "./password";
import type { KnoxTokenInstance, UserRow, UserRole } from "./domain";

export const REST_KNOX = {
  SECURE_HASH_ALGORITHM: "sha512" as const,
  AUTH_TOKEN_CHARACTER_LENGTH: 64,
  TOKEN_TTL_SECONDS: 10 * 60 * 60,
  TOKEN_LIMIT_PER_USER: null as number | null,
  AUTH_HEADER_PREFIX: "Token",
  DIGEST_LENGTH: 128,
  TOKEN_KEY_LENGTH: 8,
  AUTO_REFRESH: false,
};

export { hashPasswordSafe as hashPassword, verifyPasswordSafe as verifyPassword, BCRYPT_ROUNDS };
export type { UserRow, UserRole };

// --- Tokens (knox_authtoken) ---

export function hashToken(token: string): string {
  return crypto.createHash(REST_KNOX.SECURE_HASH_ALGORITHM).update(token).digest("hex");
}

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex").slice(0, REST_KNOX.AUTH_TOKEN_CHARACTER_LENGTH);
}

export function get_token_ttl(): number { return REST_KNOX.TOKEN_TTL_SECONDS; }
export function get_token_limit_per_user(): number | null { return REST_KNOX.TOKEN_LIMIT_PER_USER; }
export function format_expiry_datetime(expiryUnix: number): string {
  return new Date(expiryUnix * 1000).toISOString();
}
export function get_token_ttl_expiry(createdUnix = Math.floor(Date.now() / 1000)): number {
  return createdUnix + get_token_ttl();
}

export async function create_token(user_id: string): Promise<{ token: string; instance: KnoxTokenInstance }> {
  await initDb();
  const limit = get_token_limit_per_user();
  if (limit !== null) {
    const cnt = await db.execute<any>({
      sql: "SELECT COUNT(*) as c FROM knox_authtoken WHERE user_id=? AND expiry > ?",
      args: [user_id, Math.floor(Date.now() / 1000)],
    });
    if (Number(cnt.rows[0].c) >= limit) throw new Error(`Token limit per user (${limit}) reached`);
  }
  const token = generateRawToken();
  const digest = hashToken(token);
  const token_key = token.slice(0, REST_KNOX.TOKEN_KEY_LENGTH);
  const created = Math.floor(Date.now() / 1000);
  const expiry = get_token_ttl_expiry(created);
  const instance: KnoxTokenInstance = { digest, token_key, user_id, created, expiry };
  await db.execute({
    sql: "INSERT INTO knox_authtoken (digest, token_key, user_id, created, expiry) VALUES (?,?,?,?,?)",
    args: [digest, token_key, user_id, created, expiry],
  });
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
  const r = await db.execute<any>({ sql: "SELECT * FROM knox_authtoken WHERE digest=?", args: [digest] });
  if (!r.rows.length) return null;
  const inst = r.rows[0] as KnoxTokenInstance;
  if (inst.expiry <= Math.floor(Date.now() / 1000)) {
    await db.execute({ sql: "DELETE FROM knox_authtoken WHERE digest=?", args: [digest] });
    return null;
  }
  if (REST_KNOX.AUTO_REFRESH) {
    const newExpiry = get_token_ttl_expiry(Math.floor(Date.now() / 1000));
    await db.execute({ sql: "UPDATE knox_authtoken SET expiry=? WHERE digest=?", args: [newExpiry, digest] });
    inst.expiry = newExpiry;
  }
  const u = await db.execute<any>({
    sql: "SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id=?",
    args: [inst.user_id],
  });
  if (!u.rows.length) return null;
  const user = u.rows[0];
  if (user.is_active === 0) return null;
  return { user, instance: inst };
}

// --- Usuarios (users) ---

export async function createUser(data: { email: string; password: string; first_name?: string; last_name?: string; role?: UserRole }): Promise<UserRow> {
  await initDb();
  if (!data.email || !data.password) throw new Error("email y password requeridos");
  if (data.password.length < 8) throw new Error("password debe tener al menos 8 caracteres");
  const role: UserRole = data.role === "admin" ? "admin" : "docente";
  if (data.role && !["admin", "docente"].includes(data.role)) throw new Error("role inválido: use admin o docente");
  const exists = await db.execute<any>({ sql: "SELECT id FROM users WHERE email=?", args: [data.email.toLowerCase()] });
  if (exists.rows.length) throw new Error("email ya registrado");
  const id = crypto.randomUUID();
  const hash = await hashPasswordSafe(data.password);
  await db.execute({
    sql: "INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES (?,?,?,?,?,?)",
    args: [id, data.email.toLowerCase(), hash, data.first_name ?? null, data.last_name ?? null, role],
  });
  const r = await db.execute<any>({ sql: "SELECT * FROM users WHERE id=?", args: [id] });
  return r.rows[0] as UserRow;
}

export async function listUsers(): Promise<Omit<UserRow, "password_hash">[]> {
  await initDb();
  const r = await db.execute<any>("SELECT id, email, first_name, last_name, role, is_active, created_at FROM users ORDER BY created_at DESC");
  return r.rows as any;
}

export async function getUserById(id: string) {
  await initDb();
  const r = await db.execute<any>({ sql: "SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE id=?", args: [id] });
  return r.rows[0] ?? null;
}

export async function getUserByEmail(email: string) {
  await initDb();
  const r = await db.execute<any>({ sql: "SELECT * FROM users WHERE email=?", args: [email.toLowerCase()] });
  return r.rows[0] as UserRow | undefined;
}

export async function updateUser(id: string, data: Partial<Pick<UserRow, "email" | "first_name" | "last_name" | "is_active" | "role">>) {
  await initDb();
  const fields: string[] = [];
  const args: any[] = [];
  if (data.email !== undefined) { fields.push("email=?"); args.push(data.email.toLowerCase()); }
  if (data.first_name !== undefined) { fields.push("first_name=?"); args.push(data.first_name); }
  if (data.last_name !== undefined) { fields.push("last_name=?"); args.push(data.last_name); }
  if (data.is_active !== undefined) { fields.push("is_active=?"); args.push(data.is_active); }
  if (data.role !== undefined) {
    if (!["admin", "docente"].includes(data.role)) throw new Error("role inválido");
    fields.push("role=?"); args.push(data.role);
  }
  if (fields.length === 0) return getUserById(id);
  args.push(id);
  await db.execute({ sql: `UPDATE users SET ${fields.join(", ")} WHERE id=?`, args });
  return getUserById(id);
}

export async function deleteUser(id: string) {
  await initDb();
  await db.execute({ sql: "DELETE FROM users WHERE id=?", args: [id] });
}

export async function changePassword(id: string, oldPassword: string | null, newPassword: string, requireOld = true) {
  await initDb();
  if (newPassword.length < 8) throw new Error("nueva password debe tener al menos 8 caracteres");
  const r = await db.execute<any>({ sql: "SELECT * FROM users WHERE id=?", args: [id] });
  if (!r.rows.length) throw new Error("usuario no encontrado");
  const user = r.rows[0] as UserRow;
  if (requireOld) {
    if (!oldPassword) throw new Error("old_password requerido");
    const ok = await verifyPasswordSafe(oldPassword, user.password_hash);
    if (!ok) throw new Error("old_password incorrecta");
  }
  const hash = await hashPasswordSafe(newPassword);
  await db.execute({ sql: "UPDATE users SET password_hash=? WHERE id=?", args: [hash, id] });
}

// Compat con la API previa de src/lib/auth.ts
export function get_post_response_data(token: string, instance: KnoxTokenInstance, user: any) {
  return {
    expiry: format_expiry_datetime(instance.expiry),
    token,
    user,
  };
}
