import type { PersonalityResult } from "../personalidadScoring";
import type { IdentityScore } from "./identity";
import { TRAIT_PAIRS, type TraitPair } from "./traits";

export interface TraitGauge {
  pair: TraitPair;
  leftPercent: number;
  rightPercent: number;
  winner: "left" | "right";
  winnerName: string;
  winnerPercent: number;
}

export function buildGauges(result: PersonalityResult, identity: IdentityScore): TraitGauge[] {
  const leftPercents: Record<string, number> = {
    EI: result.percentages.E,
    SN: result.percentages.N,
    TF: result.percentages.T,
    JP: result.percentages.J,
    ID: identity.percentA,
  };

  return TRAIT_PAIRS.map((pair) => {
    const leftPercent = leftPercents[pair.key];
    const rightPercent = 100 - leftPercent;
    const winner: "left" | "right" = leftPercent >= 50 ? "left" : "right";
    return {
      pair,
      leftPercent,
      rightPercent,
      winner,
      winnerName: winner === "left" ? pair.left.name : pair.right.name,
      winnerPercent: winner === "left" ? leftPercent : rightPercent,
    };
  });
}

export const TRAIT_ICONS: Record<string, string> = {
  EI: "Users",
  SN: "Eye",
  TF: "HeartHandshake",
  JP: "CalendarCheck",
  ID: "Activity",
};
