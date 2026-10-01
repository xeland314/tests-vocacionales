/**
 * Adaptador MySQL (mysql2/promise) que expone una API compatible con @libsql/client:
 *   db.execute({ sql, args })       → Result { rows, rowsAffected }
 *   db.execute(sql)                 → Result { rows, rowsAffected }
 *   db.batch(statements)            → Result[] (transacción implícita)
 * Así los repositorios/módulos no cambian su forma de consultar al migrar de SQLite a MySQL.
 */
import type { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import mysql from "mysql2/promise";

export interface SqlStatement {
  sql: string;
  args?: unknown[];
}

export interface DbResult<T = RowDataPacket> {
  rows: T[];
  rowsAffected: number;
}

export interface Database {
  execute<T = RowDataPacket>(sql: string | SqlStatement, args?: unknown[]): Promise<DbResult<T>>;
  batch(statements: (string | SqlStatement)[]): Promise<DbResult[]>;
  transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T>;
  ping(): Promise<void>;
}

let _pool: Pool | null = null;

/** Lee env vars de process.env y de import.meta.env (Astro carga .env aquí). */
function envVar(key: string): string {
  try {
    const meta = (import.meta as any).env;
    if (meta && meta[key] !== undefined && meta[key] !== "") return String(meta[key]);
  } catch {}
  const v = process.env[key];
  return v ?? "";
}

export function mysqlConfigFromEnv() {
  const url = envVar("MYSQL_URL") || envVar("DATABASE_URL");
  if (url) {
    return { uri: url };
  }
  return {
    host: envVar("MYSQL_HOST") || "127.0.0.1",
    port: Number(envVar("MYSQL_PORT") || 3306),
    user: envVar("MYSQL_USER") || envVar("MYSQL_USERNAME"),
    password: envVar("MYSQL_PASSWORD"),
    database: envVar("MYSQL_DATABASE") || envVar("MYSQL_DBNAME"),
  };
}

export function getPool(): Pool {
  if (_pool) return _pool;
  const cfg = mysqlConfigFromEnv();
  _pool = mysql.createPool({
    ...(cfg as any),
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_LIMIT || 10),
    charset: "utf8mb4",
    timezone: "Z",
    supportBigNumbers: true,
    dateStrings: false,
    // mysql2 named placeholder off: usamos ? posicional estilo libsql
  });
  return _pool;
}

export function closePool(): Promise<void> {
  if (!_pool) return Promise.resolve();
  const p = _pool;
  _pool = null;
  return p.end().then(() => undefined);
}

function toStatement(sql: string | SqlStatement, args?: unknown[]): SqlStatement {
  if (typeof sql === "string") return { sql, args: args ?? [] };
  return { sql: sql.sql, args: (args ?? sql.args) ?? [] };
}

class MySqlDatabase implements Database {
  private conn: PoolConnection | null;

  constructor(conn: PoolConnection | null = null) {
    this.conn = conn;
  }

  private async acquire(): Promise<PoolConnection> {
    if (this.conn) return this.conn;
    return await getPool().getConnection();
  }

  private async release(conn: PoolConnection) {
    if (!this.conn) conn.release();
  }

  async execute<T = RowDataPacket>(sql: string | SqlStatement, args?: unknown[]): Promise<DbResult<T>> {
    const stmt = toStatement(sql, args);
    const conn = await this.acquire();
    try {
      // En MySQL no existe PRAGMA; se ignora silenciosamente si llega (compat SQLite)
      if (/^\s*PRAGMA\b/i.test(stmt.sql)) return { rows: [], rowsAffected: 0 };
      const [result] = await conn.query({ sql: stmt.sql, values: stmt.args as any[] });
      if (Array.isArray(result)) {
        return { rows: result as unknown as T[], rowsAffected: (result as unknown[]).length };
      }
      const header = result as ResultSetHeader;
      // Para DELETE/UPDATE devolvemos las filas afectadas; para SELECT, rows
      return { rows: [], rowsAffected: header.affectedRows ?? 0 };
    } finally {
      this.release(conn);
    }
  }

  async batch(statements: (string | SqlStatement)[]): Promise<DbResult[]> {
    const out: DbResult[] = [];
    return this.transaction(async (tx) => {
      for (const s of statements) out.push(await tx.execute(s as string));
      return out;
    });
  }

  async transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T> {
    if (this.conn) return fn(this);
    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      try {
        const res = await fn(new MySqlDatabase(conn));
        await conn.commit();
        return res;
      } catch (e) {
        try { await conn.rollback(); } catch {}
        throw e;
      }
    } finally {
      conn.release();
    }
  }

  async ping(): Promise<void> {
    const conn = await this.acquire();
    try { await conn.ping(); } finally { this.release(conn); }
  }
}

/** Tiene getConnection aunque sea la colección del pool (usado por migraciones) */
export function isMysqlConnection(v: unknown): v is PoolConnection {
  return !!v && typeof (v as any).query === "function";
}

export const mysqlDb: Database = new MySqlDatabase();

/** Conexión cruda para scripts externos (seed/migrate) */
export async function rawConnection(): Promise<PoolConnection> {
  return await getPool().getConnection();
}
