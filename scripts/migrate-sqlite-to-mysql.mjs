/**
 * Script de migración de datos: SQLite (data/chaside.db) → MySQL.
 * Uso:
 *   node scripts/migrate-sqlite-to-mysql.mjs [ruta/chaside.db]
 * Requiere MYSQL_* (o MYSQL_URL) en .env y que las tablas ya existan
 * (arranca la app una vez para que initDb cree el esquema).
 * Idempotente: usa INSERT IGNORE por PK.
 */
import { createClient } from "@libsql/client";
import mysql from "mysql2/promise";

const TABLES = [
  "test_versiones",
  "estudiantes",
  "chaside_resultados",
  "personalidad_resultados",
  "kuder_resultados",
  "users",
  "knox_authtoken",
  "moodle_config",
  "admin_view_tokens",
  "reintentos_habilitados",
  "preguntas",
];

const cfg = process.env.MYSQL_URL
  ? { uri: process.env.MYSQL_URL }
  : {
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "chaside",
    };

const pool = mysql.createPool({ ...cfg, connectionLimit: 4, charset: "utf8mb4" });
const sqlitePath = process.argv[2] || "data/chaside.db";
const sqlite = createClient({ url: `file:${sqlitePath}` });

async function migrateTable(table) {
  let rows;
  try {
    const r = await sqlite.execute(`SELECT * FROM ${table}`);
    rows = r.rows;
  } catch {
    console.log(`${table}: no existe en SQLite, se omite`);
    return;
  }
  if (!rows.length) { console.log(`${table}: 0 filas, nada que migrar`); return; }
  const cols = Object.keys(rows[0]);
  const [dest] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?`,
    [table]
  );
  const destCols = new Set(dest.map((r) => r.COLUMN_NAME));
  const usable = cols.filter((c) => destCols.has(c));
  const usableList = usable.map((c) => `\`${c}\``).join(",");
  const usablePh = usable.map(() => "?").join(",");
  let n = 0;
  for (const row of rows) {
    const values = usable.map((c) => {
      const v = row[c];
      if (v === undefined) return null;
      if (v instanceof Uint8Array) return Buffer.from(v).toString("utf8");
      return v;
    });
    try {
      await pool.query(`INSERT IGNORE INTO ${table} (${usableList}) VALUES (${usablePh})`, values);
      n++;
    } catch (e) {
      console.error(`${table} fila PK=${row.id ?? "?"} error:`, e.message);
    }
  }
  console.log(`${table}: ${n}/${rows.length} filas insertadas`);
}

(async () => {
  await pool.query("SET FOREIGN_KEY_CHECKS=0");
  for (const t of TABLES) await migrateTable(t);
  await pool.query("SET FOREIGN_KEY_CHECKS=1");
  await pool.end();
  sqlite.close();
  console.log("Migración SQLite → MySQL completada");
})().catch((e) => { console.error(e); process.exit(1); });
