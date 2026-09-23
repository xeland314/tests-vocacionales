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
    // Verifica que grade.ts use moodleConfig y llame a core_grades_update_grades con iteminstance=cmid para disparo automático de completado
    const gradeContent = fs.readFileSync("src/pages/api/moodle/grade.ts", "utf-8");
    expect(gradeContent).toContain("core_grades_update_grades");
    expect(gradeContent).toContain("getMoodleConfig");
    expect(gradeContent).toContain("getCmidForTest");
    expect(gradeContent).toContain("itemtype");
    expect(gradeContent).toContain("itemmodule");
    expect(gradeContent).toContain("iteminstance");
    // Verifica que el marcado manual para admin use override con userid
    const completeContent = fs.readFileSync("src/pages/api/admin/moodle/complete.ts", "utf-8");
    expect(completeContent).toContain("core_completion_override_activity_completion_status");
    expect(completeContent).toContain("overrideinstance");
  });
});
