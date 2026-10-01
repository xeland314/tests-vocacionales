/**
 * Puente entre la capa DB y el dominio: expone las preguntas de los tres tests
 * (CHASIDE, MBTI/Personalidad, Kuder) para sembrar la tabla `preguntas`,
 * sin que la capa de persistencia dependa directamente de la estructura interna
 * de los archivos de datos del dominio.
 */
import { QUESTIONS } from "../../data/chaside";
import { PERSONALITY_QUESTIONS } from "../../data/personalidad";
import { KUDER_DIADAS } from "../../data/kuder";

export default {
  chaside: QUESTIONS.map((q) => ({ id: q.id, text: q.text })),
  personalidad: PERSONALITY_QUESTIONS.map((q) => ({ id: q.id, text: q.text })),
  kuder: KUDER_DIADAS.map((d) => ({ id: d.id, a: d.a, b: d.b })),
};
