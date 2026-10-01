/**
 * Módulo Testing — Repositorio MySQL de Estudiantes.
 * Reglas: un estudiante = una cuenta Moodle (moodle_user_id único). Sin datos anon.
 */
import crypto from "node:crypto";
import { db, initDb } from "../../db";
import type { EstudianteRow } from "./domain";

type AnyRow = Record<string, any>;

export async function findByMoodleUserId(moodleUserId: number): Promise<EstudianteRow | null> {
  await initDb();
  const r = await db.execute<AnyRow>({ sql: "SELECT * FROM estudiantes WHERE moodle_user_id=? LIMIT 1", args: [moodleUserId] });
  return (r.rows[0] as EstudianteRow) ?? null;
}

export async function findById(id: string): Promise<EstudianteRow | null> {
  await initDb();
  const r = await db.execute<AnyRow>({ sql: "SELECT * FROM estudiantes WHERE id=?", args: [id] });
  return (r.rows[0] as EstudianteRow) ?? null;
}

export interface UpsertMoodleInput {
  id?: string;
  moodle_user_id: number;
  moodle_user_name?: string | null;
  moodle_user_email?: string | null;
  moodle_course_id?: number | null;
  moodle_extra?: unknown;
}

/**
 * Localiza o registra al estudiante a partir de la identidad Moodle.
 * Si recibe `id` y existe, actualiza los datos de Moodle; si no existe, lo crea con ese id.
 */
export async function upsertMoodleEstudiante(input: UpsertMoodleInput): Promise<string> {
  await initDb();
  const argsCommon = [
    input.moodle_user_name ?? null,
    input.moodle_user_email ?? null,
    input.moodle_course_id ? Number(input.moodle_course_id) : null,
    input.moodle_extra ? JSON.stringify(input.moodle_extra) : null,
  ];
  if (input.id) {
    const exists = await db.execute<AnyRow>({ sql: "SELECT id FROM estudiantes WHERE id=?", args: [input.id] });
    if (exists.rows.length > 0) {
      await db.execute({
        sql: `UPDATE estudiantes SET moodle_user_name=?, moodle_user_email=?, moodle_course_id=?, moodle_extra_json=? WHERE id=?`,
        args: [...argsCommon, input.id],
      });
      return input.id;
    }
    await insertEstudiante(input.id, input, argsCommon);
    return input.id;
  }
  const existing = await findByMoodleUserId(Number(input.moodle_user_id));
  if (existing) {
    await db.execute({
      sql: `UPDATE estudiantes SET moodle_user_name=?, moodle_user_email=?, moodle_course_id=?, moodle_extra_json=? WHERE id=?`,
      args: [...argsCommon, existing.id],
    });
    return existing.id;
  }
  const estId = crypto.randomUUID();
  await insertEstudiante(estId, input, argsCommon);
  return estId;
}

async function insertEstudiante(id: string, input: UpsertMoodleInput, argsCommon: any[]) {
  await db.execute({
    sql: `INSERT INTO estudiantes (id, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra_json) VALUES (?,?,?,?,?,?)`,
    args: [id, Number(input.moodle_user_id), ...argsCommon],
  });
}

export async function listEstudiantes(limit = 200): Promise<EstudianteRow[]> {
  await initDb();
  const r = await db.execute<AnyRow>({
    sql: `SELECT id, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra_json, created_at,
                 moodle_user_name as nombre_estudiante, moodle_user_email as correo_estudiante,
                 NULL as nombre_padre, NULL as correo_padre, NULL as cedula_estudiante, NULL as cedula_representante
          FROM estudiantes ORDER BY created_at DESC LIMIT ?`,
    args: [limit],
  });
  return r.rows as EstudianteRow[];
}

export async function listAllIds(): Promise<string[]> {
  await initDb();
  const r = await db.execute<AnyRow>("SELECT id FROM estudiantes");
  return r.rows.map((x) => x.id);
}
