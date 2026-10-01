/**
 * DDL MySQL — espejo 1:1 del esquema SQLite de src/lib/db.ts (ahora eliminado).
 * Tipos: TEXT→VARCHAR(n)/TEXT, INTEGER unixepoch→BIGINT, CHECK→ENUM o validación en app.
 * Se ejecuta de forma idempotente (IF NOT EXISTS) sobre la BD de SiteGround.
 */
import type { Database } from "./mysql";

export const DDL_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS test_versiones (
    id INT NOT NULL AUTO_INCREMENT,
    codigo ENUM('CHASIDE','PERSONALIDAD','KUDER') NOT NULL,
    version INT NOT NULL,
    vigencia_desde BIGINT NOT NULL,
    activo TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_test_versiones_codigo_version (codigo, version)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Estudiantes = solo Moodle (sin datos anon) — guarda únicamente datos de Moodle
  `CREATE TABLE IF NOT EXISTS estudiantes (
    id VARCHAR(64) NOT NULL,
    moodle_user_id BIGINT NOT NULL,
    moodle_user_name VARCHAR(191) NULL,
    moodle_user_email VARCHAR(191) NULL,
    moodle_course_id BIGINT NULL,
    moodle_extra_json TEXT NULL,
    created_at BIGINT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    UNIQUE KEY uq_estudiantes_moodle_user (moodle_user_id),
    KEY idx_estudiantes_created (created_at),
    KEY idx_estudiantes_moodle (moodle_user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS preguntas (
    test_codigo VARCHAR(20) NOT NULL,
    version INT NOT NULL,
    pregunta_id INT NOT NULL,
    texto TEXT NOT NULL,
    PRIMARY KEY (test_codigo, version, pregunta_id),
    KEY idx_preguntas_version (test_codigo, version)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS chaside_resultados (
    id VARCHAR(64) NOT NULL,
    estudiante_id VARCHAR(64) NOT NULL,
    fecha_unix BIGINT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    top_interes VARCHAR(8) NOT NULL,
    segundo_interes VARCHAR(8) NULL,
    top_aptitud VARCHAR(8) NOT NULL,
    intereses_json MEDIUMTEXT NOT NULL,
    aptitudes_json MEDIUMTEXT NOT NULL,
    respuestas_json MEDIUMTEXT NOT NULL,
    intento_numero INT NULL,
    created_at BIGINT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    KEY idx_chaside_est (estudiante_id),
    KEY idx_chaside_fecha (fecha_unix),
    CONSTRAINT fk_chaside_est FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS personalidad_resultados (
    id VARCHAR(64) NOT NULL,
    estudiante_id VARCHAR(64) NOT NULL,
    fecha_unix BIGINT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    tipo VARCHAR(8) NOT NULL,
    dimensiones_json MEDIUMTEXT NOT NULL,
    percentages_json MEDIUMTEXT NOT NULL,
    respuestas_json MEDIUMTEXT NOT NULL,
    intento_numero INT NULL,
    created_at BIGINT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    KEY idx_pers_est (estudiante_id),
    KEY idx_pers_tipo (tipo),
    CONSTRAINT fk_pers_est FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuder_resultados (
    id VARCHAR(64) NOT NULL,
    estudiante_id VARCHAR(64) NOT NULL,
    fecha_unix BIGINT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    top VARCHAR(8) NOT NULL,
    ranking_json MEDIUMTEXT NOT NULL,
    scores_json MEDIUMTEXT NOT NULL,
    respuestas_json MEDIUMTEXT NOT NULL,
    verificacion VARCHAR(16) NOT NULL,
    intento_numero INT NULL,
    created_at BIGINT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    KEY idx_kuder_est (estudiante_id),
    KEY idx_kuder_top (top),
    CONSTRAINT fk_kuder_est FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Auth — roles: admin (gestiona usuarios) / docente (lectura; ambos habilitan reintentos)
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    first_name VARCHAR(120) NULL,
    last_name VARCHAR(120) NULL,
    role ENUM('admin','docente') NOT NULL DEFAULT 'docente',
    is_active TINYINT NOT NULL DEFAULT 1,
    created_at BIGINT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS knox_authtoken (
    digest CHAR(128) NOT NULL,
    token_key VARCHAR(16) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    created BIGINT NOT NULL,
    expiry BIGINT NOT NULL,
    PRIMARY KEY (digest),
    KEY idx_knox_user (user_id),
    KEY idx_knox_expiry (expiry),
    CONSTRAINT fk_knox_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS moodle_config (
    id INT NOT NULL,
    moodle_domains TEXT NULL,
    chaside_cmid BIGINT NULL,
    mbti_cmid BIGINT NULL,
    kuder_cmid BIGINT NULL,
    course_id BIGINT NULL,
    course_ids TEXT NULL,
    chaside_cmids TEXT NULL,
    mbti_cmids TEXT NULL,
    kuder_cmids TEXT NULL,
    referer_required TINYINT NOT NULL DEFAULT 1,
    updated_at BIGINT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    CONSTRAINT ck_moodle_config_id CHECK (id = 1)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Tokens opacos (uuid4) para abrir el detalle de un estudiante en otra pestaña
  `CREATE TABLE IF NOT EXISTS admin_view_tokens (
    token VARCHAR(64) NOT NULL,
    estudiante_id VARCHAR(64) NOT NULL,
    created_at BIGINT NULL DEFAULT (UNIX_TIMESTAMP()),
    expires_unix BIGINT NOT NULL,
    PRIMARY KEY (token),
    KEY idx_view_tokens_exp (expires_unix)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Reintentos: habilitación explícita + auditoría de quién/cuándo/por qué,
  // y si ya fue consumido por un nuevo resultado. NO se usa para borrar intentos previos.
  `CREATE TABLE IF NOT EXISTS reintentos_habilitados (
    id VARCHAR(64) NOT NULL,
    estudiante_id VARCHAR(64) NOT NULL,
    test_codigo ENUM('CHASIDE','PERSONALIDAD','KUDER') NOT NULL,
    habilitado_por VARCHAR(64) NOT NULL,
    habilitado_en BIGINT NULL DEFAULT (UNIX_TIMESTAMP()),
    motivo TEXT NULL,
    ventana_desde_unix BIGINT NULL,
    ventana_hasta_unix BIGINT NULL,
    usado TINYINT NOT NULL DEFAULT 0,
    usado_en BIGINT NULL,
    resultado_id VARCHAR(64) NULL,
    PRIMARY KEY (id),
    KEY idx_reintentos_est (estudiante_id, test_codigo),
    KEY idx_reintentos_pendientes (estudiante_id, test_codigo, usado),
    CONSTRAINT fk_reintentos_est FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    CONSTRAINT fk_reintentos_user FOREIGN KEY (habilitado_por) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

export const SEED_VERSIONES = [
  { codigo: "CHASIDE", version: 1, vigencia: 1767225600 },
  { codigo: "PERSONALIDAD", version: 1, vigencia: 1767225600 },
  { codigo: "KUDER", version: 1, vigencia: 1767225600 },
] as const;

export const SEED_MOODLE_CONFIG = { id: 1, chaside_cmid: 9, mbti_cmid: 10, kuder_cmid: 11, course_id: 2 } as const;

export async function migrateSchema(db: Database): Promise<void> {
  for (const ddl of DDL_STATEMENTS) {
    await db.execute({ sql: ddl, args: [] });
  }
  await migrarColumnasLista(db);
  for (const v of SEED_VERSIONES) {
    await db.execute({
      sql: `INSERT IGNORE INTO test_versiones (codigo, version, vigencia_desde, activo) VALUES (?,?,?,1)`,
      args: [v.codigo, v.version, v.vigencia],
    });
  }
  await db.execute({
    sql: `INSERT IGNORE INTO moodle_config (id, moodle_domains, chaside_cmid, mbti_cmid, kuder_cmid, course_id, course_ids, chaside_cmids, mbti_cmids, kuder_cmids)
          VALUES (${SEED_MOODLE_CONFIG.id}, '[]', ${SEED_MOODLE_CONFIG.chaside_cmid}, ${SEED_MOODLE_CONFIG.mbti_cmid}, ${SEED_MOODLE_CONFIG.kuder_cmid}, ${SEED_MOODLE_CONFIG.course_id}, '[${SEED_MOODLE_CONFIG.course_id}]', '[${SEED_MOODLE_CONFIG.chaside_cmid}]', '[${SEED_MOODLE_CONFIG.mbti_cmid}]', '[${SEED_MOODLE_CONFIG.kuder_cmid}]')`,
    args: [],
  });
}

/** ¿Existe una columna? (information_schema, sobre la BD conectada) */
async function columnExists(db: Database, table: string, column: string): Promise<boolean> {
  const r = await db.execute<any>({
    sql: `SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?`,
    args: [table, column],
  });
  return Number(r.rows[0].c) > 0;
}

/**
 * Migración: columnas únicas legacy (course_id, *_cmid) → columnas lista (JSON).
 * Copia el valor antiguo como lista de un elemento.
 */
async function migrarColumnasLista(db: Database): Promise<void> {
  const pares: Array<{ legacy: string; lista: string }> = [
    { legacy: "course_id", lista: "course_ids" },
    { legacy: "chaside_cmid", lista: "chaside_cmids" },
    { legacy: "mbti_cmid", lista: "mbti_cmids" },
    { legacy: "kuder_cmid", lista: "kuder_cmids" },
  ];
  for (const { legacy, lista } of pares) {
    if (!(await columnExists(db, "moodle_config", legacy))) continue;
    if (await columnExists(db, "moodle_config", lista)) continue;
    await db.execute({ sql: `ALTER TABLE moodle_config ADD COLUMN ${lista} TEXT NULL`, args: [] });
    await db.execute({
      sql: `UPDATE moodle_config SET ${lista} = JSON_ARRAY(${legacy})
            WHERE ${legacy} IS NOT NULL AND (${lista} IS NULL OR ${lista} = '' OR ${lista} = '[]')`,
      args: [],
    });
  }
  // referer_required: instalaciones previas no lo tienen
  if (!(await columnExists(db, "moodle_config", "referer_required"))) {
    await db.execute({ sql: `ALTER TABLE moodle_config ADD COLUMN referer_required TINYINT NOT NULL DEFAULT 1`, args: [] });
  }
}
