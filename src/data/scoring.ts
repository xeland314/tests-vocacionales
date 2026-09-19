import { APTITUDES_TABLE, INTERESES_TABLE, type AreaKey, AREA_ORDER } from "./chaside";

export type Answers = Record<number, boolean>; // true = SI, false/undefined = NO

export interface Score {
  C: number; H: number; A: number; S: number; I: number; D: number; E: number;
}

export interface ChasideResult {
  intereses: Score;
  aptitudes: Score;
  // ranking ordenado desc, estable por orden C-H-A-S-I-D-E en empates
  interesesRanking: AreaKey[];
  aptitudesRanking: AreaKey[];
  topInteres: AreaKey;
  segundoInteres: AreaKey | null;
  topAptitud: AreaKey;
  segundoAptitud?: AreaKey | null;
}

export function calculateScores(answers: Answers): ChasideResult {
  const intereses: Score = { C: 0, H: 0, A: 0, S: 0, I: 0, D: 0, E: 0 };
  const aptitudes: Score = { C: 0, H: 0, A: 0, S: 0, I: 0, D: 0, E: 0 };

  for (const k of AREA_ORDER) {
    for (const n of INTERESES_TABLE[k]) {
      if (answers[n]) intereses[k] += 1;
    }
    for (const n of APTITUDES_TABLE[k]) {
      if (answers[n]) aptitudes[k] += 1;
    }
  }

  const interesesRanking = [...AREA_ORDER].sort((a, b) => {
    const diff = intereses[b] - intereses[a];
    if (diff !== 0) return diff;
    // desempate estable: mantiene orden C-H-A-S-I-D-E (el primero prima)
    return AREA_ORDER.indexOf(a) - AREA_ORDER.indexOf(b);
  });
  const aptitudesRanking = [...AREA_ORDER].sort((a, b) => {
    const diff = aptitudes[b] - aptitudes[a];
    if (diff !== 0) return diff;
    return AREA_ORDER.indexOf(a) - AREA_ORDER.indexOf(b);
  });

  const topInteres = interesesRanking[0];
  const topAptitud = aptitudesRanking[0];

  // Para igualar TestGratis.net: top = primer máximo (izquierda, orden C-H-A-S-I-D-E)
  // segundo = último máximo entre los empatados restantes (derecha) -> reproduce C+A+D => C y D, y C+H+E => C y E
  let segundoInteres: AreaKey | null = null;
  if (intereses[topInteres] > 0) {
    const maxScore = intereses[topInteres];
    const cands = AREA_ORDER.filter((k) => intereses[k] === maxScore && k !== topInteres);
    if (cands.length > 0) {
      segundoInteres = cands[cands.length - 1]; // derecha
    } else {
      // buscar siguiente puntaje >0 distinto
      for (let i = 1; i < interesesRanking.length; i++) {
        const k = interesesRanking[i];
        if (intereses[k] > 0) { segundoInteres = k; break; }
      }
    }
  }

  let segundoAptitud: AreaKey | null = null;
  if (aptitudes[topAptitud] > 0) {
    const maxA = aptitudes[topAptitud];
    const candsA = AREA_ORDER.filter((k) => aptitudes[k] === maxA && k !== topAptitud);
    if (candsA.length > 0 && aptitudes[candsA[candsA.length - 1]] === maxA) {
      // solo mostrar segunda aptitud si empata en el máximo (como original)
      segundoAptitud = candsA[candsA.length - 1];
    }
    // si no hay empate en máximo, no se muestra segunda aptitud (comportamiento original)
  }

  return {
    intereses,
    aptitudes,
    interesesRanking,
    aptitudesRanking,
    topInteres,
    segundoInteres,
    topAptitud,
    segundoAptitud,
  };
}

/**
 * Utilidad para tests: marca SI en los números indicados.
 */
export function answersFromYesList(yes: number[]): Answers {
  const a: Answers = {};
  for (const n of yes) a[n] = true;
  return a;
}
