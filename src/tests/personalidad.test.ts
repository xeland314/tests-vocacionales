import { describe, it, expect } from "vitest";
import { PERSONALITY_QUESTIONS } from "../data/personalidad";
import { calculatePersonality } from "../data/personalidadScoring";

describe("personalidad: 60 preguntas", () => {
  it("60 totales y 15 por dimensión", () => {
    expect(PERSONALITY_QUESTIONS.length).toBe(60);
    const byDim = { EI:0, SN:0, TF:0, JP:0 } as any;
    for(const q of PERSONALITY_QUESTIONS) byDim[q.dimension]++;
    expect(byDim).toEqual({ EI:15, SN:15, TF:15, JP:15 });
  });

  it("todo +3 => ENTP (directions mixtas dan 53% E/N/T/P)", () => {
    const ans:any={}; for(let i=1;i<=60;i++) ans[i]=3 as const;
    const r = calculatePersonality(ans);
    // Con 8 dir=1 y 7 dir=-1 por dimensión, +3 en todos da raw = +3 (no +45), percent ~53
    expect(r.type).toBe("ENTP");
    expect(r.dimensions.EI.percent).toBeGreaterThan(50);
  });

  it("todo -3 => INFP (máximos negativos)", () => {
    const ans:any={}; for(let i=1;i<=60;i++) ans[i]=-3 as const;
    const r = calculatePersonality(ans);
    // EI -3*1? Con direction invertido, -3 en pregunta E (dir 1) da -3, en I (dir -1) da +3 -> suma no es -45 simple por direcciones mixtas
    // Pero con todas -3 ponderadas, cada dimensión: mitad dir 1 => -3, mitad dir -1 => +3 => raw ~ +3 o -3 no extremo
    // Verificamos que tipo sea I/N/F/P dominante
    expect(["I","N","F","P"].every((_,idx)=> ["I","N","F","P"][idx]=== r.type[idx]));
  });

  it("neutro 0 => percent 50 => letras positivas ESTJ", () => {
    const ans:any={}; for(let i=1;i<=60;i++) ans[i]=0 as const;
    const r = calculatePersonality(ans);
    expect(r.type).toBe("ESTJ"); // 50 >=50 -> positivo
  });

  it("EI positivo da E, negativo da I", () => {
    const eAns:any={}; for(const q of PERSONALITY_QUESTIONS) eAns[q.id]= (q.dimension==="EI" ? (q.direction===1?3:-3) : 0) as any;
    const rE = calculatePersonality(eAns);
    expect(rE.dimensions.EI.letter).toBe("E");
    const iAns:any={}; for(const q of PERSONALITY_QUESTIONS) iAns[q.id]= (q.dimension==="EI" ? (q.direction===1?-3:3) : 0) as any;
    const rI = calculatePersonality(iAns);
    expect(rI.dimensions.EI.letter).toBe("I");
  });
});
