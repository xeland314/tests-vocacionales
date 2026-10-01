/**
 * Módulo Moodle Integration — configuración (dominios, cursos, actividades)
 * almacenada en BD (moodle_config). Ya NO gestiona envío de notas: la escritura
 * en Moodle fue eliminada — el módulo solo VALIDA desde dónde se abre un test.
 *
 * Todo es OPCIONAL e independiente: lo que quede vacío, el validador lo salta.
 */
import { db, initDb } from "../../db";

type AnyRow = Record<string, any>;

export interface MoodleConfig {
  /** dominios Moodle desde los que se permite abrir los tests (ej: https://campus.colegio.edu.ec) */
  moodle_domains: string[];
  /** curso(s) Moodle donde viven los tests — vacío = no se valida el curso */
  course_ids: number[];
  /** cmid(s) válidos por test — vacío = no se valida la actividad */
  chaside_cmids: number[];
  mbti_cmids: number[];
  kuder_cmids: number[];
  /** true (default): sin Referer (acceso directo) → bloquea. false: solo pruebas sin HTTPS. */
  referer_required: boolean;
  updated_at?: number;
}

const DEFAULTS: MoodleConfig = {
  moodle_domains: [],
  course_ids: [],
  chaside_cmids: [9],
  mbti_cmids: [10],
  kuder_cmids: [11],
  referer_required: true,
};

export async function getMoodleConfig(): Promise<MoodleConfig> {
  await initDb();
  const r = await db.execute<AnyRow>({
    sql: "SELECT moodle_domains, chaside_cmid, mbti_cmid, kuder_cmid, course_id, course_ids, chaside_cmids, mbti_cmids, kuder_cmids, referer_required, updated_at FROM moodle_config WHERE id=1",
    args: [],
  });
  if (r.rows.length === 0) {
    return { ...DEFAULTS };
  }
  const row = r.rows[0];
  // Fallback legacy: columnas únicas (course_id, *_cmid) como lista de un elemento
  const courseIds = parseNumbers(row.course_ids);
  if (courseIds.length === 0 && row.course_id != null) courseIds.push(Number(row.course_id));
  const chasideCmids = parseNumbers(row.chaside_cmids);
  if (chasideCmids.length === 0 && row.chaside_cmid != null) chasideCmids.push(Number(row.chaside_cmid));
  const mbtiCmids = parseNumbers(row.mbti_cmids);
  if (mbtiCmids.length === 0 && row.mbti_cmid != null) mbtiCmids.push(Number(row.mbti_cmid));
  const kuderCmids = parseNumbers(row.kuder_cmids);
  if (kuderCmids.length === 0 && row.kuder_cmid != null) kuderCmids.push(Number(row.kuder_cmid));
  return {
    moodle_domains: parseDomains(row.moodle_domains),
    course_ids: courseIds,
    chaside_cmids: chasideCmids,
    mbti_cmids: mbtiCmids,
    kuder_cmids: kuderCmids,
    referer_required: row.referer_required == null ? true : Number(row.referer_required) === 1,
    updated_at: row.updated_at,
  };
}

function parseDomains(json: unknown): string[] {
  if (!json) return [];
  if (Array.isArray(json)) return json.map(String).filter(Boolean);
  try {
    const parsed = JSON.parse(String(json));
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return String(json).split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function parseNumbers(json: unknown): number[] {
  if (json == null || json === "") return [];
  let raw: unknown[] = [];
  if (Array.isArray(json)) raw = json;
  else {
    try {
      const parsed = JSON.parse(String(json));
      if (Array.isArray(parsed)) raw = parsed;
    } catch {
      raw = String(json).split(",");
    }
  }
  return raw.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
}

export async function setMoodleConfig(cfg: Partial<MoodleConfig>): Promise<MoodleConfig> {
  await initDb();
  const current = await getMoodleConfig();
  const next: MoodleConfig = {
    moodle_domains: cfg.moodle_domains !== undefined ? cfg.moodle_domains : current.moodle_domains,
    course_ids: cfg.course_ids !== undefined ? cfg.course_ids : current.course_ids,
    chaside_cmids: cfg.chaside_cmids !== undefined ? cfg.chaside_cmids : current.chaside_cmids,
    mbti_cmids: cfg.mbti_cmids !== undefined ? cfg.mbti_cmids : current.mbti_cmids,
    kuder_cmids: cfg.kuder_cmids !== undefined ? cfg.kuder_cmids : current.kuder_cmids,
    referer_required: cfg.referer_required !== undefined ? cfg.referer_required : current.referer_required,
  };
  await db.execute({
    sql: `INSERT INTO moodle_config (id, moodle_domains, chaside_cmid, mbti_cmid, kuder_cmid, course_id, course_ids, chaside_cmids, mbti_cmids, kuder_cmids, referer_required, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())
          ON DUPLICATE KEY UPDATE moodle_domains=VALUES(moodle_domains), chaside_cmid=VALUES(chaside_cmid), mbti_cmid=VALUES(mbti_cmid), kuder_cmid=VALUES(kuder_cmid), course_id=VALUES(course_id), course_ids=VALUES(course_ids), chaside_cmids=VALUES(chaside_cmids), mbti_cmids=VALUES(mbti_cmids), kuder_cmids=VALUES(kuder_cmids), referer_required=VALUES(referer_required), updated_at=UNIX_TIMESTAMP()`,
    // columnas únicas legacy se mantienen con el primer elemento de cada lista
    args: [
      JSON.stringify(next.moodle_domains),
      next.chaside_cmids[0] ?? null,
      next.mbti_cmids[0] ?? null,
      next.kuder_cmids[0] ?? null,
      next.course_ids[0] ?? null,
      JSON.stringify(next.course_ids),
      JSON.stringify(next.chaside_cmids),
      JSON.stringify(next.mbti_cmids),
      JSON.stringify(next.kuder_cmids),
      next.referer_required ? 1 : 0,
    ],
  });
  return getMoodleConfig();
}
