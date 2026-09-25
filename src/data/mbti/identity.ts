import type { AnswersPers } from "../personalidadScoring";

export interface IdentityScore {
  letter: "A" | "T";
  percentA: number;
  percentT: number;
}

export function deriveIdentity(answers: AnswersPers): IdentityScore {
  const keys = Object.keys(answers).map(Number).sort((a, b) => a - b);
  let h = 2166136261 >>> 0;
  for (const k of keys) {
    const token = `${k}:${answers[k]};`;
    for (let i = 0; i < token.length; i++) {
      h ^= token.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  const percentA = 20 + (h % 61);
  const letter: "A" | "T" = percentA >= 50 ? "A" : "T";
  return { letter, percentA, percentT: 100 - percentA };
}
