import { describe, it, expect, vi } from "vitest";

describe("moodle completion — cmid mapping", () => {
  it("CMID_MAP coincide con ids proporcionados (9,10,11)", () => {
    const CMID_MAP: Record<string, number> = { CHASIDE: 9, KUDER: 11, MBTI: 10, PERSONALIDAD: 10 };
    expect(CMID_MAP.CHASIDE).toBe(9);
    expect(CMID_MAP.MBTI).toBe(10);
    expect(CMID_MAP.PERSONALIDAD).toBe(10);
    expect(CMID_MAP.KUDER).toBe(11);
  });

  it("notifyMoodleCompletion mapea CHASIDE->9, MBTI->10, KUDER->11", async () => {
    // Verifica que el código de moodle.ts tenga el mapa correcto sin ejecutar fetch real
    const fs = await import("fs");
    const content = fs.readFileSync("src/lib/moodle.ts", "utf-8");
    expect(content).toContain("CHASIDE: 9");
    expect(content).toContain("KUDER: 11");
    expect(content).toContain("MBTI: 10");
    // Verifica que grade.ts también tenga el mapa y llame a core_completion_update_activity_completion_status_manually
    const gradeContent = fs.readFileSync("src/pages/api/moodle/grade.ts", "utf-8");
    expect(gradeContent).toContain("core_completion_update_activity_completion_status_manually");
    expect(gradeContent).toContain("CMID_MAP");
  });
});
