import { describe, it, expect } from "vitest";
import { KUDER_DIADAS, KUDER_ORDER } from "../data/kuder";
import { calculateKuder, kuderAnswersFromChoices } from "../data/kuderScoring";

describe("kuder: 60 diadas", () => {
  it("60 diadas y cada área aparece", () => {
    expect(KUDER_DIADAS.length).toBe(60);
    const counts: Record<string, number> = {};
    for(const d of KUDER_DIADAS){ counts[d.a.area]=(counts[d.a.area]||0)+1; counts[d.b.area]=(counts[d.b.area]||0)+1; }
    // cada área debe aparecer al menos 8 veces (balance ipsativo)
    for(const k of KUDER_ORDER) expect(counts[k]).toBeGreaterThanOrEqual(8);
  });
  it("todo 'a' -> puntajes suman 60", () => {
    const ans = kuderAnswersFromChoices(Array(60).fill("a"));
    const r = calculateKuder(ans);
    expect(r.total).toBe(60);
    expect(Object.values(r.scores).reduce((a,b)=>a+b,0)).toBe(60);
    expect(r.verificacion).toBe("válido");
  });
  it("incompleto -> dudoso", () => {
    const ans: any = { 1:"a" };
    const r = calculateKuder(ans);
    expect(r.verificacion).toBe("dudoso");
  });
});
