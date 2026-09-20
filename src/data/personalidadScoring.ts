import { PERSONALITY_QUESTIONS, type AnswerValue, type Dimension, type PersonalityTypeCode } from "./personalidad";

export type AnswersPers = Record<number, AnswerValue>; // id 1..60 -> -3..3

export interface DimensionScore {
  dimension: Dimension;
  raw: number; // suma ponderada
  max: number; // 15*3=45
  percent: number; // 0..100 hacia polo positivo
  letter: string; // E/I, S/N, T/F, J/P
}

export interface PersonalityResult {
  type: PersonalityTypeCode;
  dimensions: Record<Dimension, DimensionScore>;
  percentages: { E:number, I:number, S:number, N:number, T:number, F:number, J:number, P:number };
}

function toLetter(dim: Dimension, percent: number): string {
  if (dim==="EI") return percent>=50 ? "E" : "I";
  if (dim==="SN") return percent>=50 ? "S" : "N";
  if (dim==="TF") return percent>=50 ? "T" : "F";
  return percent>=50 ? "J" : "P";
}

export function calculatePersonality(answers: AnswersPers): PersonalityResult {
  const sums: Record<Dimension, number> = { EI:0, SN:0, TF:0, JP:0 };
  const counts: Record<Dimension, number> = { EI:0, SN:0, TF:0, JP:0 };

  for (const q of PERSONALITY_QUESTIONS) {
    const v = answers[q.id];
    if (v===undefined) continue;
    // direction 1 = positivo, -1 = invertido. Para que +3 siempre sea polo positivo, multiplicamos por direction
    const weighted = v * q.direction;
    sums[q.dimension] += weighted;
    counts[q.dimension] += 1;
  }

  // Normalizar a 0..100. raw -45..+45 -> percent = (raw+45)/90*100
  const dims: Record<Dimension, DimensionScore> = {} as any;
  for (const d of ["EI","SN","TF","JP"] as Dimension[]) {
    const raw = sums[d];
    const percent = Math.round(((raw + 45) / 90) * 100);
    const letter = toLetter(d, percent);
    dims[d] = { dimension: d, raw, max: 45, percent: Math.max(0, Math.min(100, percent)), letter };
  }

  const type = (dims.EI.letter + dims.SN.letter + dims.TF.letter + dims.JP.letter) as PersonalityTypeCode;

  const percentages = {
    E: dims.EI.percent,
    I: 100-dims.EI.percent,
    S: dims.SN.percent,
    N: 100-dims.SN.percent,
    T: dims.TF.percent,
    F: 100-dims.TF.percent,
    J: dims.JP.percent,
    P: 100-dims.JP.percent,
  };

  return { type, dimensions: dims, percentages };
}

export function answersFromArray(arr: number[]): AnswersPers {
  const a: AnswersPers = {};
  arr.forEach((v,i)=> a[i+1]= v as AnswerValue);
  return a;
}
