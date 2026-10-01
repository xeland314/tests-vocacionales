/**
 * Módulo Testing — Repositorio MySQL de Resultados (chaside/personalidad/kuder).
 * Los intentos previos NUNCA se borran ni sobrescriben: cada envío inserta una fila
 * nueva con intento_number consecutivo por estudiante.
 */
import { db, initDb } from "../../db";
import { RESULTADOS_TABLE, type TestCodigo } from "./domain";

type AnyRow = Record<string, any>;

export async function existeResultado(estudianteId: string, test: TestCodigo): Promise<boolean> {
  await initDb();
  const r = await db.execute<AnyRow>({
    sql: `SELECT id FROM ${RESULTADOS_TABLE[test]} WHERE estudiante_id=? LIMIT 1`,
    args: [estudianteId],
  });
  return r.rows.length > 0;
}

export async function nextIntentoNumero(estudianteId: string, test: TestCodigo): Promise<number> {
  await initDb();
  const r = await db.execute<AnyRow>({
    sql: `SELECT MAX(intento_numero) as m FROM ${RESULTADOS_TABLE[test]} WHERE estudiante_id=?`,
    args: [estudianteId],
  });
  return Number(r.rows[0]?.m || 0) + 1;
}

export interface InsertResultadoInput {
  id: string;
  estudiante_id: string;
  fecha_unix: number;
  version: number;
  intento_numero: number;
  columnas: string[];
  args: any[];
}

export async function insertResultado(test: TestCodigo, input: InsertResultadoInput) {
  await initDb();
  const cols = ["id", "estudiante_id", "fecha_unix", "version", ...input.columnas, "intento_numero"];
  const placeholders = cols.map(() => "?").join(",");
  await db.execute({
    sql: `INSERT INTO ${RESULTADOS_TABLE[test]} (${cols.join(", ")}) VALUES (${placeholders})`,
    args: [input.id, input.estudiante_id, input.fecha_unix, input.version, ...input.args, input.intento_numero],
  });
}

export async function getLatestResultado(estudianteId: string, test: TestCodigo) {
  await initDb();
  const r = await db.execute<AnyRow>({
    sql: `SELECT * FROM ${RESULTADOS_TABLE[test]} WHERE estudiante_id=? ORDER BY fecha_unix DESC LIMIT 1`,
    args: [estudianteId],
  });
  return (r.rows[0] as AnyRow) ?? null;
}

/** Historial completo de intentos, del más antiguo al más reciente. */
export async function getHistorial(estudianteId: string, test: TestCodigo) {
  await initDb();
  const r = await db.execute<AnyRow>({
    sql: `SELECT * FROM ${RESULTADOS_TABLE[test]} WHERE estudiante_id=? ORDER BY fecha_unix ASC`,
    args: [estudianteId],
  });
  return r.rows as AnyRow[];
}

/** Último intento por estudiante (Map estudiante_id → fila más reciente). */
export async function mapLatestPorEstudiante(test: TestCodigo): Promise<Map<string, AnyRow>> {
  await initDb();
  const r = await db.execute<AnyRow>({
    sql: `SELECT estudiante_id, fecha_unix, intento_numero${selectExtra(test)} FROM ${RESULTADOS_TABLE[test]} ORDER BY fecha_unix ASC`,
    args: [],
  });
  return new Map<string, AnyRow>(r.rows.map((row: any) => [row.estudiante_id, row]));
}

function selectExtra(test: TestCodigo): string {
  switch (test) {
    case "CHASIDE": return ", top_interes, segundo_interes";
    case "PERSONALIDAD": return ", tipo";
    case "KUDER": return ", top";
  }
}

export async function countAll(test: TestCodigo): Promise<number> {
  await initDb();
  const r = await db.execute<AnyRow>({ sql: `SELECT COUNT(*) as c FROM ${RESULTADOS_TABLE[test]}`, args: [] });
  return Number(r.rows[0].c);
}

export async function listIds(test: TestCodigo): Promise<string[]> {
  await initDb();
  const r = await db.execute<AnyRow>({ sql: `SELECT estudiante_id as id FROM ${RESULTADOS_TABLE[test]}`, args: [] });
  return r.rows.map((x: any) => x.id);
}

export async function listAll(test: TestCodigo): Promise<AnyRow[]> {
  await initDb();
  const r = await db.execute<AnyRow>({ sql: `SELECT * FROM ${RESULTADOS_TABLE[test]}`, args: [] });
  return r.rows as AnyRow[];
}

export async function listLatestRaw(test: TestCodigo): Promise<AnyRow[]> {
  await initDb();
  const r = await db.execute<AnyRow>({ sql: `SELECT * FROM ${RESULTADOS_TABLE[test]} ORDER BY fecha_unix DESC`, args: [] });
  return r.rows as AnyRow[];
}
