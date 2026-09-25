import type { PersonalityTypeCode } from "../personalidad";
import type { MbtiTypeProfile } from "./types";
import { ANALISTAS } from "./analistas";
import { DIPLOMATICOS } from "./diplomaticos";
import { CENTINELAS } from "./centinelas";
import { EXPLORADORES } from "./exploradores";

export * from "./types";
export * from "./traits";
export * from "./identity";

export const MBTI_PROFILES: Record<PersonalityTypeCode, MbtiTypeProfile> = {} as Record<PersonalityTypeCode, MbtiTypeProfile>;

for (const profile of [...ANALISTAS, ...DIPLOMATICOS, ...CENTINELAS, ...EXPLORADORES]) {
  MBTI_PROFILES[profile.code] = profile;
}

export function getProfile(code: PersonalityTypeCode): MbtiTypeProfile {
  return MBTI_PROFILES[code];
}

export const MBTI_IMAGE = {
  named: (code: PersonalityTypeCode) => `/mbti/${code}-${MBTI_PROFILES[code].imageSlug}.webp`,
  light: (code: PersonalityTypeCode) => `/mbti/${code}-fondo-claro.webp`,
  dark: (code: PersonalityTypeCode) => `/mbti/${code}-fondo-oscuro.webp`,
};
