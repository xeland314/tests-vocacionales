import { createClient } from "@libsql/client";
import { QUESTIONS } from "../data/chaside";
import { PERSONALITY_QUESTIONS } from "../data/personalidad";
import { KUDER_DIADAS } from "../data/kuder";

const url = process.env.TURSO_DATABASE_URL || `file:${process.cwd()}/data/chaside.db`;

export const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

async function hasColumn(table: string, column: string): Promise<boolean> {
  const r = await db.execute({ sql: `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, args: [table] });
  if (r.rows.length === 0) return false;
  const sql = (r.rows[0] as any).sql as string;
  return sql.includes(column);
}

export async function initDb() {
  await db.execute("PRAGMA journal_mode=WAL");
  await db.execute("PRAGMA foreign_keys=ON");

  // Legacy migration: old estudiantes has test_codigo
  const isLegacy = await hasColumn("estudiantes", "test_codigo");
  if (isLegacy) {
    // backup and drop legacy to recreate clean persona model
    await db.execute("DROP TABLE IF EXISTS respuestas");
    await db.execute("DROP TABLE IF EXISTS estudiantes");
  }

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

  await db.execute(`INSERT OR IGNORE INTO test_versiones (codigo, version, vigencia_desde, activo) VALUES ('CHASIDE', 1, strftime('%s','2026-01-01'), 1)`);
  await db.execute(`INSERT OR IGNORE INTO test_versiones (codigo, version, vigencia_desde, activo) VALUES ('PERSONALIDAD', 1, strftime('%s','2026-01-01'), 1)`);
  await db.execute(`INSERT OR IGNORE INTO test_versiones (codigo, version, vigencia_desde, activo) VALUES ('KUDER', 1, strftime('%s','2026-01-01'), 1)`);

  // Estudiantes = solo Moodle (sin datos anon) — guarda únicamente datos de Moodle
  // Detecta esquema legacy con columnas anon (nombre_estudiante, telefono, etc.)
  const hasLegacyEstudiantes = (await hasColumn("estudiantes", "nombre_estudiante")) || (await hasColumn("estudiantes", "telefono")) || (await hasColumn("estudiantes", "email")) || (await hasColumn("estudiantes", "nombre_padre"));
  if (hasLegacyEstudiantes) {
    // Borra datos anon: recrea tabla solo con campos moodle y migra solo registros con moodle_user_id
    await db.execute(`
      CREATE TABLE IF NOT EXISTS estudiantes_new (
        id TEXT PRIMARY KEY,
        moodle_user_id INTEGER NOT NULL UNIQUE,
        moodle_user_name TEXT,
        moodle_user_email TEXT,
        moodle_course_id INTEGER,
        moodle_extra_json TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);
    // Copia solo registros moodle válidos
    await db.execute(`INSERT OR IGNORE INTO estudiantes_new (id, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra_json, created_at)
      SELECT id, moodle_user_id, moodle_user_name, moodle_user_email, moodle_course_id, moodle_extra_json, created_at FROM estudiantes WHERE moodle_user_id IS NOT NULL`);
    await db.execute(`DROP TABLE estudiantes`);
    await db.execute(`ALTER TABLE estudiantes_new RENAME TO estudiantes`);
  }
  await db.execute(`
    CREATE TABLE IF NOT EXISTS estudiantes (
      id TEXT PRIMARY KEY,
      moodle_user_id INTEGER NOT NULL UNIQUE,
      moodle_user_name TEXT,
      moodle_user_email TEXT,
      moodle_course_id INTEGER,
      moodle_extra_json TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
  // Limpia cualquier registro anon huérfano (si existe tabla)
  try { await db.execute(`DELETE FROM estudiantes WHERE moodle_user_id IS NULL`); } catch {}
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_estudiantes_created ON estudiantes(created_at)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_estudiantes_moodle ON estudiantes(moodle_user_id)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS preguntas (
      test_codigo TEXT NOT NULL,
      version INTEGER NOT NULL,
      pregunta_id INTEGER NOT NULL,
      texto TEXT NOT NULL,
      PRIMARY KEY (test_codigo, version, pregunta_id)
    )
  `);

  // Resultados por test
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chaside_resultados (
      id TEXT PRIMARY KEY,
      estudiante_id TEXT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
      fecha_unix INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      top_interes TEXT NOT NULL,
      segundo_interes TEXT,
      top_aptitud TEXT NOT NULL,
      intereses_json TEXT NOT NULL,
      aptitudes_json TEXT NOT NULL,
      respuestas_json TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_chaside_est ON chaside_resultados(estudiante_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_chaside_fecha ON chaside_resultados(fecha_unix)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS personalidad_resultados (
      id TEXT PRIMARY KEY,
      estudiante_id TEXT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
      fecha_unix INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      tipo TEXT NOT NULL,
      dimensiones_json TEXT NOT NULL,
      percentages_json TEXT NOT NULL,
      respuestas_json TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_pers_est ON personalidad_resultados(estudiante_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_pers_tipo ON personalidad_resultados(tipo)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS kuder_resultados (
      id TEXT PRIMARY KEY,
      estudiante_id TEXT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
      fecha_unix INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      top TEXT NOT NULL,
      ranking_json TEXT NOT NULL,
      scores_json TEXT NOT NULL,
      respuestas_json TEXT NOT NULL,
      verificacion TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_kuder_est ON kuder_resultados(estudiante_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_kuder_top ON kuder_resultados(top)`);

  // Legacy respuestas table kept for compatibility if needed (not used now) – ensure dropped if exists with old shape
  // Do not create respuestas anymore; stats use *_resultados

  // Seed preguntas si vacías
  const c1 = await db.execute({ sql: "SELECT COUNT(*) as c FROM preguntas WHERE test_codigo='CHASIDE' AND version=1", args: [] });
  if (Number((c1.rows[0] as any).c) === 0) {
    for (const q of QUESTIONS) {
      await db.execute({ sql: "INSERT OR IGNORE INTO preguntas (test_codigo, version, pregunta_id, texto) VALUES (?,?,?,?)", args: ["CHASIDE", 1, q.id, q.text] });
    }
  }
  const c2 = await db.execute({ sql: "SELECT COUNT(*) as c FROM preguntas WHERE test_codigo='PERSONALIDAD' AND version=1", args: [] });
  if (Number((c2.rows[0] as any).c) === 0) {
    for (const q of PERSONALITY_QUESTIONS) {
      await db.execute({ sql: "INSERT OR IGNORE INTO preguntas (test_codigo, version, pregunta_id, texto) VALUES (?,?,?,?)", args: ["PERSONALIDAD", 1, q.id, q.text] });
    }
  }
  const c3 = await db.execute({ sql: "SELECT COUNT(*) as c FROM preguntas WHERE test_codigo='KUDER' AND version=1", args: [] });
  if (Number((c3.rows[0] as any).c) === 0) {
    for (const d of KUDER_DIADAS) {
      await db.execute({ sql: "INSERT OR IGNORE INTO preguntas (test_codigo, version, pregunta_id, texto) VALUES (?,?,?,?)", args: ["KUDER", 1, d.id, `${d.a.texto} vs ${d.b.texto}`] });
    }
  }

  // Auth — roles: admin (gestiona usuarios) / docente (solo lectura formularios)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT NOT NULL DEFAULT 'docente' CHECK (role IN ('admin','docente')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);
  // Migración: añade columna role si la tabla existía sin ella (instalaciones previas)
  if (!(await hasColumn("users", "role"))) {
    await db.execute(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'docente' CHECK (role IN ('admin','docente'))`);
  }
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
  // Bootstrap: si no hay ningún admin, promueve el usuario más antiguo a admin (primer usuario = admin)
  try {
    const adminCount = await db.execute({ sql: `SELECT COUNT(*) as c FROM users WHERE role='admin'`, args: [] });
    if (Number((adminCount.rows[0] as any).c) === 0) {
      const first = await db.execute({ sql: `SELECT id FROM users ORDER BY created_at ASC LIMIT 1`, args: [] });
      if (first.rows.length > 0) {
        await db.execute({ sql: `UPDATE users SET role='admin' WHERE id=?`, args: [(first.rows[0] as any).id] });
      }
    }
    // Garantiza que admin@teamggm.com siempre sea admin (cuenta principal solicitada)
    await db.execute({ sql: `UPDATE users SET role='admin', is_active=1 WHERE email='admin@teamggm.com'`, args: [] });
  } catch {}
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
