import { db, initDb } from "./db";

export interface MoodleConfig {
  chaside_cmid: number | null;
  mbti_cmid: number | null;
  kuder_cmid: number | null;
  course_id: number | null;
  updated_at?: number;
}

export async function getMoodleConfig(): Promise<MoodleConfig> {
  await initDb();
  const r = await db.execute({ sql: "SELECT chaside_cmid, mbti_cmid, kuder_cmid, course_id, updated_at FROM moodle_config WHERE id=1", args: [] });
  if (r.rows.length === 0) {
    return { chaside_cmid: 9, mbti_cmid: 10, kuder_cmid: 11, course_id: 2 };
  }
  const row = r.rows[0] as any;
  return {
    chaside_cmid: row.chaside_cmid ?? 9,
    mbti_cmid: row.mbti_cmid ?? 10,
    kuder_cmid: row.kuder_cmid ?? 11,
    course_id: row.course_id ?? 2,
    updated_at: row.updated_at,
  };
}

export async function setMoodleConfig(cfg: Partial<MoodleConfig>): Promise<MoodleConfig> {
  await initDb();
  const current = await getMoodleConfig();
  const next: MoodleConfig = {
    chaside_cmid: cfg.chaside_cmid !== undefined ? cfg.chaside_cmid : current.chaside_cmid,
    mbti_cmid: cfg.mbti_cmid !== undefined ? cfg.mbti_cmid : current.mbti_cmid,
    kuder_cmid: cfg.kuder_cmid !== undefined ? cfg.kuder_cmid : current.kuder_cmid,
    course_id: cfg.course_id !== undefined ? cfg.course_id : current.course_id,
  };
  await db.execute({
    sql: `INSERT INTO moodle_config (id, chaside_cmid, mbti_cmid, kuder_cmid, course_id, updated_at) VALUES (1, ?, ?, ?, ?, unixepoch())
          ON CONFLICT(id) DO UPDATE SET chaside_cmid=excluded.chaside_cmid, mbti_cmid=excluded.mbti_cmid, kuder_cmid=excluded.kuder_cmid, course_id=excluded.course_id, updated_at=unixepoch()`,
    args: [next.chaside_cmid, next.mbti_cmid, next.kuder_cmid, next.course_id],
  });
  return getMoodleConfig();
}

export function getCmidForTest(test: string, cfg: MoodleConfig): number | null {
  const key = test.toUpperCase();
  if (key === "CHASIDE") return cfg.chaside_cmid;
  if (key === "MBTI" || key === "PERSONALIDAD") return cfg.mbti_cmid;
  if (key === "KUDER") return cfg.kuder_cmid;
  return null;
}
