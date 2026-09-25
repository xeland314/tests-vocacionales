import type { PersonalityTypeCode } from "../personalidad";

export interface TraitPole {
  key: string;
  name: string;
  scene: string;
  generic: string;
}

export interface TraitPair {
  key: "EI" | "SN" | "TF" | "JP" | "ID";
  label: string;
  left: TraitPole;
  right: TraitPole;
}

export interface ItemTituloDesc {
  title: string;
  text: string;
}

export interface RasgoInfluyente {
  name: string;
  text: string;
}

export interface SeccionPerfil {
  caption: string;
  paragraphs: string[];
  influential: RasgoInfluyente[];
  strengths: ItemTituloDesc[];
  weaknesses: ItemTituloDesc[];
}

export interface SeccionCarrera extends SeccionPerfil {
  careerIdeas: ItemTituloDesc[];
  workStyles: ItemTituloDesc[];
}

export interface SeccionCrecimiento extends SeccionPerfil {
  energyGivers: ItemTituloDesc[];
  energyDrainers: ItemTituloDesc[];
}

export interface MbtiTypeProfile {
  code: PersonalityTypeCode;
  title: string;
  role: "Analistas" | "Diplomáticos" | "Centinelas" | "Exploradores";
  imageSlug: string;
  intro: string[];
  insights: Record<"EI" | "SN" | "TF" | "JP" | "ID", string[]>;
  career: SeccionCarrera;
  growth: SeccionCrecimiento;
}
