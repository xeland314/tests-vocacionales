import { createClient } from "@libsql/client";
import { QUESTIONS } from "../data/chaside";

// DB local file: data/chaside.db (SQLite via libsql)
// Para Turso remoto usar env TURSO_DATABASE_URL / TURSO_AUTH_TOKEN
const url = process.env.TURSO_DATABASE_URL || "file:data/chaside.db";

export const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

export async function initDb() {
  // Pragmas SQLite
  await db.execute("PRAGMA journal_mode=WAL");
  await db.execute("PRAGMA foreign_keys=ON");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS test_versiones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL CHECK (codigo IN ('CHASIDE','PERSONALIDAD','KUDER')),
      version INTEGER NOT NULL,
      vigencia_desde INTEGER NOT NULL,
      activo INTEGER NOT NULL DEFAULT 0,
      UNIQUE(codigo, version)
    )
  `);

  // Asegurar versión 1 CHASIDE
  await db.execute(`
    INSERT OR IGNORE INTO test_versiones (id, codigo, version, vigencia_desde, activo)
    VALUES (1, 'CHASIDE', 1, strftime('%s','2026-01-01'), 1)
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS estudiantes (
      id TEXT PRIMARY KEY,
      nombre_estudiante TEXT NOT NULL,
      nombre_padre TEXT,
      correo_estudiante TEXT,
      correo_padre TEXT,
      cedula_estudiante TEXT CHECK (cedula_estudiante IS NULL OR length(cedula_estudiante)=10),
      cedula_representante TEXT CHECK (cedula_representante IS NULL OR length(cedula_representante)=10),
      fecha_unix INTEGER NOT NULL,
      test_codigo TEXT NOT NULL DEFAULT 'CHASIDE',
      version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_estudiantes_fecha ON estudiantes(fecha_unix)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_estudiantes_test ON estudiantes(test_codigo, version)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS preguntas (
      test_codigo TEXT NOT NULL,
      version INTEGER NOT NULL,
      pregunta_id INTEGER NOT NULL CHECK (pregunta_id BETWEEN 1 AND 98),
      texto TEXT NOT NULL,
      PRIMARY KEY (test_codigo, version, pregunta_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS respuestas (
      estudiante_id TEXT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
      pregunta_id INTEGER NOT NULL,
      respuesta INTEGER NOT NULL CHECK (respuesta IN (0,1)),
      version INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (estudiante_id, pregunta_id)
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_respuestas_pregunta ON respuestas(pregunta_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_respuestas_version ON respuestas(version)`);

  // Seed preguntas CHASIDE v1 si no existen
  const cnt = await db.execute({ sql: "SELECT COUNT(*) as c FROM preguntas WHERE test_codigo='CHASIDE' AND version=1", args: [] });
  const n = Number((cnt.rows[0] as any).c ?? 0);
  if (n === 0) {
    for (const q of QUESTIONS) {
      await db.execute({
        sql: "INSERT OR IGNORE INTO preguntas (test_codigo, version, pregunta_id, texto) VALUES (?,?,?,?)",
        args: ["CHASIDE", 1, q.id, q.text],
      });
    }
  }

  // Auth: users + knox tokens
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS knox_authtoken (
      digest TEXT PRIMARY KEY,
      token_key TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created INTEGER NOT NULL,
      expiry INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_knox_user ON knox_authtoken(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_knox_expiry ON knox_authtoken(expiry)`);
}
