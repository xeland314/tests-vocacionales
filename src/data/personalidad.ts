/**
 * Test de Personalidad 60 preguntas - estilo 16Personalities / NERIS (MBTI 4 dicotomías + 16 tipos)
 * Diseño prima 16Personalities. 15 preguntas por dicotomía.
 * Escala Likert 7 puntos: -3 .. +3 (Muy en desacuerdo -> Muy de acuerdo)
 */

export type Dimension = "EI" | "SN" | "TF" | "JP";
export type AnswerValue = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export interface PersonalityQuestion {
  id: number; // 1..60
  text: string;
  dimension: Dimension;
  direction: 1 | -1; // 1 = polo positivo (E/S/T/J), -1 = polo opuesto (I/N/F/P) invertido
}

export const PERSONALITY_QUESTIONS: PersonalityQuestion[] = [
  // EI (Mente) 15 - E = Extraversión, I = Introversión
  { id: 1, text: "Haces nuevos amigos con frecuencia.", dimension: "EI", direction: 1 },
  { id: 2, text: "Evitas llamar por teléfono cuando puedes resolverlo por mensaje.", dimension: "EI", direction: -1 },
  { id: 3, text: "Te sientes con energía después de pasar tiempo con mucha gente.", dimension: "EI", direction: 1 },
  { id: 4, text: "Prefieres trabajar solo que en equipo.", dimension: "EI", direction: -1 },
  { id: 5, text: "Te resulta fácil iniciar una conversación con desconocidos.", dimension: "EI", direction: 1 },
  { id: 6, text: "Necesitas tiempo a solas para recargar energía.", dimension: "EI", direction: -1 },
  { id: 7, text: "Hablas mucho en reuniones sociales.", dimension: "EI", direction: 1 },
  { id: 8, text: "Te consideras una persona reservada.", dimension: "EI", direction: -1 },
  { id: 9, text: "Disfrutas ser el centro de atención.", dimension: "EI", direction: 1 },
  { id: 10, text: "Prefieres escuchar antes que hablar.", dimension: "EI", direction: -1 },
  { id: 11, text: "Te adaptas rápido a nuevos grupos.", dimension: "EI", direction: 1 },
  { id: 12, text: "Evitas exponer tus ideas en público.", dimension: "EI", direction: -1 },
  { id: 13, text: "Tomas la iniciativa para organizar planes con otros.", dimension: "EI", direction: 1 },
  { id: 14, text: "Te agotan las interacciones sociales prolongadas.", dimension: "EI", direction: -1 },
  { id: 15, text: "Buscas actividades con mucha gente.", dimension: "EI", direction: 1 },

  // SN (Energía) 15 - S = Observador/Sensorial, N = Intuitivo
  { id: 16, text: "Te gusta explorar ideas y puntos de vista desconocidos.", dimension: "SN", direction: -1 }, // N
  { id: 17, text: "Confías más en la experiencia que en la teoría.", dimension: "SN", direction: 1 }, // S
  { id: 18, text: "Te fascinan las posibilidades futuras más que los hechos actuales.", dimension: "SN", direction: -1 },
  { id: 19, text: "Prefieres instrucciones concretas a ideas abstractas.", dimension: "SN", direction: 1 },
  { id: 20, text: "Imaginas con facilidad cómo podría ser el futuro.", dimension: "SN", direction: -1 },
  { id: 21, text: "Te concentras en el presente y en lo práctico.", dimension: "SN", direction: 1 },
  { id: 22, text: "Disfrutas las metáforas y los símbolos.", dimension: "SN", direction: -1 },
  { id: 23, text: "Te interesan los detalles precisos de las cosas.", dimension: "SN", direction: 1 },
  { id: 24, text: "Piensas que todo tiene un significado oculto.", dimension: "SN", direction: -1 },
  { id: 25, text: "Prefieres lo probado a lo nuevo.", dimension: "SN", direction: 1 },
  { id: 26, text: "Te gusta hacer conexiones entre ideas distintas.", dimension: "SN", direction: -1 },
  { id: 27, text: "Valoras la realidad tal como es.", dimension: "SN", direction: 1 },
  { id: 28, text: "Sueles tener intuiciones sobre las personas.", dimension: "SN", direction: -1 },
  { id: 29, text: "Te guías por lo que puedes ver y tocar.", dimension: "SN", direction: 1 },
  { id: 30, text: "Te atraen las teorías complejas.", dimension: "SN", direction: -1 },

  // TF (Naturaleza) 15 - T = Pensamiento, F = Sentimiento
  { id: 31, text: "No te dejas influenciar fácilmente por argumentos emocionales.", dimension: "TF", direction: 1 }, // T
  { id: 32, text: "Priorizas los sentimientos de los demás al decidir.", dimension: "TF", direction: -1 }, // F
  { id: 33, text: "Crees que la verdad debe prevalecer sobre la armonía.", dimension: "TF", direction: 1 },
  { id: 34, text: "Te conmueves con facilidad.", dimension: "TF", direction: -1 },
  { id: 35, text: "Analizas pros y contras antes de decidir.", dimension: "TF", direction: 1 },
  { id: 36, text: "Te preocupa cómo se sentirán los otros con tu decisión.", dimension: "TF", direction: -1 },
  { id: 37, text: "Valoras la lógica por encima de la empatía.", dimension: "TF", direction: 1 },
  { id: 38, text: "Evitas herir sentimientos aunque sea incómodo decir la verdad.", dimension: "TF", direction: -1 },
  { id: 39, text: "Eres crítico y objetivo al evaluar.", dimension: "TF", direction: 1 },
  { id: 40, text: "Buscas el consenso en el equipo.", dimension: "TF", direction: -1 },
  { id: 41, text: "Decides con la cabeza más que con el corazón.", dimension: "TF", direction: 1 },
  { id: 42, text: "Te identificas con las emociones ajenas.", dimension: "TF", direction: -1 },
  { id: 43, text: "Prefieres ser justo aunque no seas popular.", dimension: "TF", direction: 1 },
  { id: 44, text: "Perdonas con facilidad.", dimension: "TF", direction: -1 },
  { id: 45, text: "Sostienes tus argumentos aunque generen conflicto.", dimension: "TF", direction: 1 },

  // JP (Táctica) 15 - J = Juzgador, P = Prospección/Percepción
  { id: 46, text: "Te cuesta cumplir los plazos.", dimension: "JP", direction: -1 }, // P
  { id: 47, text: "Te gusta tener todo planificado y en orden.", dimension: "JP", direction: 1 }, // J
  { id: 48, text: "Prefieres improvisar en lugar de planear.", dimension: "JP", direction: -1 },
  { id: 49, text: "Haces listas y horarios para organizarte.", dimension: "JP", direction: 1 },
  { id: 50, text: "Dejas las cosas para el último momento.", dimension: "JP", direction: -1 },
  { id: 51, text: "Cumples lo que prometes sin falta.", dimension: "JP", direction: 1 },
  { id: 52, text: "Te adaptas fácil a los cambios de planes.", dimension: "JP", direction: -1 },
  { id: 53, text: "Mantienes tu espacio ordenado.", dimension: "JP", direction: 1 },
  { id: 54, text: "Trabajas mejor bajo presión de último minuto.", dimension: "JP", direction: -1 },
  { id: 55, text: "Terminas una tarea antes de empezar otra.", dimension: "JP", direction: 1 },
  { id: 56, text: "Exploras varias opciones antes de decidir.", dimension: "JP", direction: -1 },
  { id: 57, text: "Te molesta la improvisación.", dimension: "JP", direction: 1 },
  { id: 58, text: "Cambias de opinión con facilidad.", dimension: "JP", direction: -1 },
  { id: 59, text: "Eres puntual y disciplinado.", dimension: "JP", direction: 1 },
  { id: 60, text: "Prefieres mantener tus opciones abiertas.", dimension: "JP", direction: -1 },
];

export type PersonalityTypeCode =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export interface TypeInfo {
  code: PersonalityTypeCode;
  name: string;
  role: "Analistas" | "Diplomáticos" | "Centinelas" | "Exploradores";
  color: string;
  tagline: string;
  strengths: string[];
  description: string;
}

export const TYPES: Record<PersonalityTypeCode, TypeInfo> = {
  INTJ: { code: "INTJ", name: "Arquitecto", role: "Analistas", color: "#662483", tagline: "Imaginativo y estratégico, con un plan para todo.", strengths: ["Visión a largo plazo","Determinación","Mente analítica"], description: "Piensan en grande y no descansan hasta alcanzar sus objetivos. Independientes y perfeccionistas." },
  INTP: { code: "INTP", name: "Lógico", role: "Analistas", color: "#662483", tagline: "Inventivo y curioso, ama las teorías.", strengths: ["Lógica","Creatividad conceptual","Objetividad"], description: "Fascinados por los sistemas y cómo funcionan. Analíticos y reservados." },
  ENTJ: { code: "ENTJ", name: "Comandante", role: "Analistas", color: "#662483", tagline: "Líder audaz, siempre encuentra la forma.", strengths: ["Liderazgo","Eficiencia","Decisión"], description: "Líderes naturales que organizan y movilizan a otros hacia metas." },
  ENTP: { code: "ENTP", name: "Innovador", role: "Analistas", color: "#662483", tagline: "Inteligente y curioso, adora debatir.", strengths: ["Ingenio","Versatilidad","Energía"], description: "Cuestionan el statu quo y generan ideas." },
  INFJ: { code: "INFJ", name: "Abogado", role: "Diplomáticos", color: "#10B981", tagline: "Idealista y reservado, inspirado en ayudar.", strengths: ["Empatía","Visión","Compromiso"], description: "Buscan sentido y conexión profunda. Callados pero influyentes." },
  INFP: { code: "INFP", name: "Mediador", role: "Diplomáticos", color: "#10B981", tagline: "Poético y altruista, fiel a sus valores.", strengths: ["Idealismo","Adaptabilidad","Creatividad"], description: "Guiados por sus principios, buscan armonía." },
  ENFJ: { code: "ENFJ", name: "Protagonista", role: "Diplomáticos", color: "#10B981", tagline: "Carismático e inspirador, une a las personas.", strengths: ["Carisma","Altruismo","Liderazgo humano"], description: "Líderes empáticos que inspiran a otros." },
  ENFP: { code: "ENFP", name: "Activista", role: "Diplomáticos", color: "#10B981", tagline: "Entusiasta y creativo, ve posibilidades.", strengths: ["Entusiasmo","Sociabilidad","Imaginación"], description: "Espíritus libres, sociables y llenos de ideas." },
  ISTJ: { code: "ISTJ", name: "Logista", role: "Centinelas", color: "#0EA5E9", tagline: "Práctico y meticuloso, cumple lo que promete.", strengths: ["Responsabilidad","Orden","Lealtad"], description: "Serios y confiables, valoran la tradición y el orden." },
  ISFJ: { code: "ISFJ", name: "Defensor", role: "Centinelas", color: "#0EA5E9", tagline: "Dedicado y cálido, protege a los suyos.", strengths: ["Apoyo","Paciencia","Observación"], description: "Protectores humildes y comprometidos." },
  ESTJ: { code: "ESTJ", name: "Ejecutivo", role: "Centinelas", color: "#0EA5E9", tagline: "Organizador excelente, domina la gestión.", strengths: ["Organización","Fuerza de voluntad","Pragmatismo"], description: "Administradores que ponen orden y ejecutan." },
  ESFJ: { code: "ESFJ", name: "Cónsul", role: "Centinelas", color: "#0EA5E9", tagline: "Sociable y atento, busca armonía.", strengths: ["Cooperación","Lealtad","Sensibilidad"], description: "Atentos a las necesidades de los demás." },
  ISTP: { code: "ISTP", name: "Virtuoso", role: "Exploradores", color: "#F59E0B", tagline: "Experimentador audaz y práctico.", strengths: ["Practicidad","Calma","Técnica"], description: "Maestros con herramientas, resuelven con ingenio." },
  ISFP: { code: "ISFP", name: "Aventurero", role: "Exploradores", color: "#F59E0B", tagline: "Artista flexible y encantador.", strengths: ["Sensibilidad","Espontaneidad","Estética"], description: "Viven el presente y disfrutan lo bello." },
  ESTP: { code: "ESTP", name: "Emprendedor", role: "Exploradores", color: "#F59E0B", tagline: "Enérgico y astuto, vive el momento.", strengths: ["Energía","Pragmatismo","Audacia"], description: "Actúan rápido y disfrutan la acción." },
  ESFP: { code: "ESFP", name: "Animador", role: "Exploradores", color: "#F59E0B", tagline: "Espontáneo y entusiasta, anima a todos.", strengths: ["Entusiasmo","Sociabilidad","Estética"], description: "Sociables y divertidos, disfrutan el presente." },
};

export const ROLE_COLOR: Record<TypeInfo["role"], string> = {
  Analistas: "#662483",
  Diplomáticos: "#10B981",
  Centinelas: "#0EA5E9",
  Exploradores: "#F59E0B",
};
