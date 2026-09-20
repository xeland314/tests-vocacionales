import { KUDER_DIADAS, KUDER_ORDER, type KuderAreaKey } from "./kuder";

export type KuderAnswers = Record<number, "a"|"b">; // diada id -> elección

export interface KuderScores {
  scores: Record<KuderAreaKey, number>;
  total: number;
  top: KuderAreaKey;
  ranking: KuderAreaKey[];
  verificacion: "válido"|"dudoso"; // escala V simplificada: si respuestas muy rápidas o patrón, aquí siempre válido
}

export function calculateKuder(answers: KuderAnswers): KuderScores {
  const scores: Record<KuderAreaKey, number> = { EXT:0, MEC:0, CAL:0, CIE:0, PER:0, ART:0, LIT:0, MUS:0, SOC:0, OFI:0 };
  let total=0;
  for(const d of KUDER_DIADAS){
    const choice = answers[d.id];
    if(!choice) continue;
    const area = choice==="a" ? d.a.area : d.b.area;
    scores[area]+=1;
    total+=1;
  }
  const ranking = [...KUDER_ORDER].sort((a,b)=> scores[b]-scores[a] || KUDER_ORDER.indexOf(a)-KUDER_ORDER.indexOf(b));
  const top = ranking[0];
  // Escala V: si total <60 (incompleto) -> dudoso
  const verificacion = total===60 ? "válido" : "dudoso";
  return { scores, total, top, ranking, verificacion };
}

export function kuderAnswersFromChoices(choices: ("a"|"b")[]): KuderAnswers {
  const a: KuderAnswers = {};
  choices.forEach((c,i)=> a[i+1]=c);
  return a;
}
