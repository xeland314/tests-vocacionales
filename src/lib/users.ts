/**
 * Módulo dedicado CRUD usuarios — bcrypt
 */
import { db, initDb } from "./db";
import { hashPassword, verifyPassword } from "./auth";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: number;
  created_at: number;
}

export async function createUser(data: { email: string; password: string; first_name?: string; last_name?: string }): Promise<UserRow> {
  await initDb();
  if (!data.email || !data.password) throw new Error("email y password requeridos");
  if (data.password.length < 8) throw new Error("password debe tener al menos 8 caracteres");
  const exists = await db.execute({ sql: "SELECT id FROM users WHERE email=?", args: [data.email.toLowerCase()] });
  if (exists.rows.length) throw new Error("email ya registrado");
  const id = crypto.randomUUID();
  const hash = await hashPassword(data.password);
  await db.execute({
    sql: "INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?,?,?,?,?)",
    args: [id, data.email.toLowerCase(), hash, data.first_name ?? null, data.last_name ?? null],
  });
  const r = await db.execute({ sql: "SELECT * FROM users WHERE id=?", args: [id] });
  return r.rows[0] as any;
}

export async function listUsers(): Promise<Omit<UserRow,"password_hash">[]> {
  await initDb();
  const r = await db.execute("SELECT id, email, first_name, last_name, is_active, created_at FROM users ORDER BY created_at DESC");
  return r.rows as any;
}

export async function getUserById(id: string) {
  await initDb();
  const r = await db.execute({ sql: "SELECT id, email, first_name, last_name, is_active, created_at FROM users WHERE id=?", args: [id] });
  return r.rows[0] ?? null;
}

export async function getUserByEmail(email: string) {
  await initDb();
  const r = await db.execute({ sql: "SELECT * FROM users WHERE email=?", args: [email.toLowerCase()] });
  return r.rows[0] as any as UserRow | undefined;
}

export async function updateUser(id: string, data: Partial<Pick<UserRow,"email"|"first_name"|"last_name"|"is_active">>) {
  await initDb();
  const fields: string[] = [];
  const args: any[] = [];
  if (data.email !== undefined) { fields.push("email=?"); args.push(data.email.toLowerCase()); }
  if (data.first_name !== undefined) { fields.push("first_name=?"); args.push(data.first_name); }
  if (data.last_name !== undefined) { fields.push("last_name=?"); args.push(data.last_name); }
  if (data.is_active !== undefined) { fields.push("is_active=?"); args.push(data.is_active); }
  if (fields.length===0) return getUserById(id);
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
  const r = await db.execute({ sql: "SELECT * FROM users WHERE id=?", args: [id] });
  if (!r.rows.length) throw new Error("usuario no encontrado");
  const user = r.rows[0] as any as UserRow;
  if (requireOld) {
    if (!oldPassword) throw new Error("old_password requerido");
    const ok = await verifyPassword(oldPassword, user.password_hash);
    if (!ok) throw new Error("old_password incorrecta");
  }
  const hash = await hashPassword(newPassword);
  await db.execute({ sql: "UPDATE users SET password_hash=? WHERE id=?", args: [hash, id] });
}
