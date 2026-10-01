/**
 * Punto de acceso a la base de datos (MySQL) para toda la aplicación.
 * Sustituye a src/lib/db.ts (SQLite/libsql) manteniendo la forma de uso:
 *   const r = await db.execute({ sql, args }); r.rows / r.rowsAffected
 * Inicialización idempotente (initDb) = migración del esquema + semillas.
 */
import { mysqlDb, type Database, type DbResult, type SqlStatement } from "./mysql";
import { migrateSchema } from "./schema";
import questionsData from "./questionsLoader";

export { mysqlDb as db };
export type { Database, DbResult, SqlStatement };

type AnyRow = Record<string, any>;

let _initLock: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (_initLock) return _initLock;
  _initLock = (async () => {
    try {
      await mysqlDb.ping();
      await migrateSchema(mysqlDb);
      await seedPreguntas(mysqlDb);
      await bootstrapAdmin(mysqlDb);
    } catch (e) {
      _initLock = null;
      throw e;
    }
  })();
  _initLock.catch(() => { _initLock = null; });
  return _initLock;
}

async function seedPreguntas(db: Database) {
  const groups = [
    { codigo: "CHASIDE", items: questionsData.chaside.map((q: any) => [q.id, q.text]) },
    { codigo: "PERSONALIDAD", items: questionsData.personalidad.map((q: any) => [q.id, q.text]) },
    { codigo: "KUDER", items: questionsData.kuder.map((d: any) => [d.id, `${d.a.texto} vs ${d.b.texto}`]) },
  ] as const;
  for (const g of groups) {
    const c = await db.execute<AnyRow>({
      sql: "SELECT COUNT(*) as c FROM preguntas WHERE test_codigo=? AND version=1",
      args: [g.codigo],
    });
    if (Number(c.rows[0].c) === 0) {
      for (const [id, text] of g.items) {
        await db.execute({
          sql: "INSERT IGNORE INTO preguntas (test_codigo, version, pregunta_id, texto) VALUES (?,1,?,?)",
          args: [g.codigo, id, text],
        });
      }
    }
  }
}

async function bootstrapAdmin(db: Database) {
  try {
    const adminCount = await db.execute<AnyRow>({ sql: `SELECT COUNT(*) as c FROM users WHERE role='admin'`, args: [] });
    if (Number(adminCount.rows[0].c) === 0) {
      const first = await db.execute<AnyRow>({ sql: `SELECT id FROM users ORDER BY created_at ASC LIMIT 1`, args: [] });
      if (first.rows.length > 0) {
        await db.execute({ sql: `UPDATE users SET role='admin' WHERE id=?`, args: [first.rows[0].id] });
      }
    }
    // Garantiza que admin@teamggm.com siempre sea admin (cuenta principal)
    await db.execute({ sql: `UPDATE users SET role='admin', is_active=1 WHERE email='admin@teamggm.com'`, args: [] });
  } catch {}
}

/** ¿Existe una columna en una tabla? (para migraciones idempotentes) */
export async function hasColumn(table: string, column: string): Promise<boolean> {
  try {
    const r = await mysqlDb.execute<AnyRow>({
      sql: `SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?`,
      args: [table, column],
    });
    return Number(r.rows[0].c) > 0;
  } catch {
    return false;
  }
}
