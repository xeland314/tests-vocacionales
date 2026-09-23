/**
 * Datos CHASIDE - 98 preguntas extraídas de TestGratis.net referencia
 * Tablas de corrección: CUESA.pdf + JimContent (Guía 1998 Ministerio Educación Nación)
 * Intereses = 10 por área (máx 10), Aptitudes = 4 por área (máx 4) pero el formato
 * de resultado de TestGratis muestra Aptitudes máx 5? -> Verificamos: en ejemplo
 * "Obtuvo una puntuación de 1 de un máximo de 5" pero PDF dice 4. Se respeta 4, pero
 * la UI muestra dinámicamente el máximo real (4). Para compatibilidad con el texto
 * proporcionado por el usuario (máximo 5 en aptitudes -> probablemente incluye una
 * pregunta extra), mostramos 4 como correcto según tabla, pero si el usuario
 * insiste en 5, el cálculo sigue siendo correcto. Mantendremos 4 y 10.
 * 
 * Combinado simplificado = 14 por área cuando se suma todo.
 */

export type AreaKey = "C" | "H" | "A" | "S" | "I" | "D" | "E";

export interface Question {
  id: number;
  text: string;
}

export interface AreaInfo {
  key: AreaKey;
  nombre: string;
  nombreCorto: string;
  color: string;
  interesesDesc: string;
  aptitudesDesc: string;
  carreras: string;
  interesesTraits: string;
  aptitudesTraits: string;
}

export const AREAS: Record<AreaKey, AreaInfo> = {
  C: {
    key: "C",
    nombre: "Administrativas y Contables",
    nombreCorto: "Administrativa",
    color: "#1f3875",
    interesesDesc:
      "Es una persona que se interesa por actividades afines a la supervisión, el orden, organización, análisis y síntesis, colaboración y cálculo.",
    aptitudesDesc:
      "Estas carreras requieren de aptitudes tales como: ser persuasivo, objetivo, práctico, responsable, tolerante y ambicioso.",
    carreras:
      "Administración de Empresas, Contaduría Pública, Negocios y Finanzas Internacionales, Economía, Comercio Internacional, y afines.",
    interesesTraits: "supervisión, orden, organización, análisis y síntesis, colaboración y cálculo",
    aptitudesTraits: "persuasivo, objetivo, práctico, responsable, tolerante y ambicioso",
  },
  H: {
    key: "H",
    nombre: "Humanísticas y Sociales",
    nombreCorto: "Humanística",
    color: "#7C3AED",
    interesesDesc:
      "Se interesa por actividades relacionadas con el pensamiento reflexivo, la comunicación, las relaciones humanas y el estudio del hombre y la sociedad.",
    aptitudesDesc:
      "Estas carreras requieren de aptitudes tales como: precisión verbal, organización, relación de hechos, lingüística, orden y justicia.",
    carreras:
      "Derecho, Psicología, Sociología, Trabajo Social, Filosofía, Historia, Letras, Ciencias de la Educación, Comunicación Social, Antropología, Ciencias Políticas y afines.",
    interesesTraits: "investigación social, pensamiento crítico, cultura, historia y lenguaje",
    aptitudesTraits: "precisión verbal, organización, relación de hechos, lingüística, orden y justicia",
  },
  A: {
    key: "A",
    nombre: "Artísticas",
    nombreCorto: "Artística",
    color: "#EC4899",
    interesesDesc:
      "Se interesa por actividades relacionadas con la creación, el diseño, la estética, la música y la expresión artística.",
    aptitudesDesc:
      "Estas carreras requieren de aptitudes tales como: estético, armónico, manual, visual, auditivo, sensible e imaginativo.",
    carreras:
      "Arquitectura, Diseño Gráfico, Bellas Artes, Música, Teatro, Danza, Cine, Fotografía, Diseño Industrial y afines.",
    interesesTraits: "creatividad, estética, diseño, música y expresión",
    aptitudesTraits: "estético, armónico, manual, visual, auditivo, sensible e imaginativo",
  },
  S: {
    key: "S",
    nombre: "Ciencias de la Salud",
    nombreCorto: "Salud",
    color: "#10B981",
    interesesDesc:
      "Se interesa por actividades relacionadas con la asistencia, el cuidado de la salud, el servicio a las personas y la investigación médica.",
    aptitudesDesc:
      "Estas carreras requieren de aptitudes tales como: asistir, investigativo, precisión, senso-perceptivo y analítico; ser altruista, solidario, paciente y comprensivo.",
    carreras:
      "Medicina, Enfermería, Odontología, Farmacia, Bioquímica, Veterinaria, Nutrición, Kinesiología, Obstetricia, Fonoaudiología y afines.",
    interesesTraits: "asistencia, cuidado de la salud, servicio y investigación médica",
    aptitudesTraits: "asistir, investigativo, precisión, senso-perceptivo, analítico, altruista, solidario, paciente y comprensivo",
  },
  I: {
    key: "I",
    nombre: "Ingenierías y Computación",
    nombreCorto: "Ingeniería",
    color: "#F59E0B",
    interesesDesc:
      "Se interesa por actividades relacionadas con el cálculo, la tecnología, el diseño de sistemas y la construcción.",
    aptitudesDesc:
      "Estas carreras requieren de aptitudes tales como: cálculo, científico, manual, exacto y planificador; ser preciso, práctico, crítico y analítico.",
    carreras:
      "Ingeniería de Sistemas, Ingeniería Civil, Ingeniería Mecánica, Ingeniería Electrónica, Ingeniería Industrial, Computación, Programación, Telecomunicaciones y afines.",
    interesesTraits: "cálculo, tecnología, sistemas, construcción y planificación",
    aptitudesTraits: "cálculo, científico, manual, exacto, planificador, preciso, práctico, crítico y analítico",
  },
  D: {
    key: "D",
    nombre: "Defensa y Seguridad",
    nombreCorto: "Defensa",
    color: "#EF4444",
    interesesDesc:
      "Esta interesado en actividades que tengan que ver con: justicia, equidad, colaboración, espíritu de equipo y liderazgo.",
    aptitudesDesc:
      "Las aptitudes para las carreras de esta área requieren ser: arriesgado, solidario, valiente, agresivo y persuasivo.",
    carreras:
      "Las carreras afines son las relacionadas a la seguridad humana, seguridad pública, sistemas aéreos y aeroespaciales, vigilancia, criminalística como Perito en Balística, Perito en Papiloscopía, Licenciatura en Recursos Navales para la Defensa, Oficial y Suboficial de la fuerza aérea, Oficial de la Policía, entre otras.",
    interesesTraits: "justicia, equidad, colaboración, espíritu de equipo y liderazgo",
    aptitudesTraits: "arriesgado, solidario, valiente, agresivo y persuasivo",
  },
  E: {
    key: "E",
    nombre: "Ciencias Exactas y Agrarias",
    nombreCorto: "Exactas",
    color: "#06B6D4",
    interesesDesc:
      "Esta interesado en carreras que tengan que ver con: investigación, orden, organización, análisis y síntesis, números y clasificación.",
    aptitudesDesc:
      "Las aptitudes para las carreras de esta área requieren ser: metódico, analítico, observador, introvertido, paciente y seguro.",
    carreras:
      "Física, Química, Farmacia, Matemática, Bioquímica, Ciencia y Tecnología de los Alimentos, Profesorados en Ciencias, Ciencias Geológicas, Ciencias de la Atmósfera, Ciencias de la Computación, Agronomía, entre otras.",
    interesesTraits: "investigación, orden, organización, análisis y síntesis, números y clasificación",
    aptitudesTraits: "metódico, analítico, observador, introvertido, paciente y seguro",
  },
};

// 98 preguntas - texto extraído de referencia TestGratis.net (windows-1252)
export const QUESTIONS: Question[] = [
  { id: 1, text: "¿Aceptaría trabajar escribiendo artículos en la sección económica de un diario?" },
  { id: 2, text: "¿Se ofrecería para organizar la despedida de soltero/a de uno/a de uno de sus amigos/amigas?" },
  { id: 3, text: "¿Le gustaría dirigir un proyecto de urbanización en su ciudad?" },
  { id: 4, text: "¿A una frustración siempre opone un pensamiento positivo?" },
  { id: 5, text: "¿Se dedicaría a socorrer personas accidentadas o atacadas por asaltantes?" },
  { id: 6, text: "¿Cuando era niño/a, le interesaba saber cómo estaban construidos los juguetes?" },
  { id: 7, text: "¿Le interesan más los misterios de la Naturaleza que los secretos de la tecnología?" },
  { id: 8, text: "¿Escucha atentamente los problemas planteados por sus amigos/as?" },
  { id: 9, text: "¿Se ofrecería para explicar algo a alguien?" },
  { id: 10, text: "¿Es exigente y crítico con su trabajo?" },
  { id: 11, text: "¿Le atrae armar puzzles o rompecabezas?" },
  { id: 12, text: "¿Puede establecer la diferencia conceptual entre microeconomía y macroeconomía?" },
  { id: 13, text: "¿Usar un uniforme lo/a haría sentirse distinto/a e importante?" },
  { id: 14, text: "¿Participaría, como profesional, en un espectáculo de acrobacia aérea?" },
  { id: 15, text: "¿Organiza su dinero de manera que siempre alcance hasta volver a cobrar?" },
  { id: 16, text: "¿Convence fácilmente a otras personas sobre la validez de sus argumentos?" },
  { id: 17, text: "¿Se encuentra informado/a sobre los nuevos descubrimientos sobre la Teoría del Big-Bang?" },
  { id: 18, text: "¿Ante una situación de emergencia, actúa rápidamente?" },
  { id: 19, text: "¿Cuando tiene que resolver un problema matemático, es perseverante hasta encontrar la solución?" },
  { id: 20, text: "¿Si fuera convocado/a para planificar, organizar y/o dirigir un campo de deportes, aceptaría?" },
  { id: 21, text: "¿Es Ud. él/la que pone un toque de alegría en las fiestas familiares?" },
  { id: 22, text: "¿Cree que los detalles son tan importantes como el todo?" },
  { id: 23, text: "¿Se sentiría a gusto trabajando en un Hospital?" },
  { id: 24, text: "¿Le gustaría participar en el mantenimiento del orden ante grandes conflictos sociales o catástrofes?" },
  { id: 25, text: "¿Pasaría varias horas leyendo un libro de su interés?" },
  { id: 26, text: "¿Planifica cuidadosamente sus trabajos antes de iniciarlos?" },
  { id: 27, text: "¿Mantiene una relación casi personal con su computadora?" },
  { id: 28, text: "¿Disfruta modelando en arcilla?" },
  { id: 29, text: "¿Ayuda habitualmente a los no videntes a cruzar la calle?" },
  { id: 30, text: "¿Considera importante que, desde la escuela primaria, se fomente la actitud crítica y la participación activa?" },
  { id: 31, text: "¿Acepta que las mujeres formen parte de las Fuerzas Armadas, bajo las mismas normas que los hombres?" },
  { id: 32, text: "¿Le gustaría crear nuevas técnicas para descubrir las patologías de algunas enfermedades, usando un microscopio?" },
  { id: 33, text: "¿Participaría en una campaña de prevención de la enfermedad de Chagas?" },
  { id: 34, text: "¿Le interesa los temas relacionados con el pasado y con la evolución del hombre?" },
  { id: 35, text: "¿Se incluiría en un proyecto de investigación de los movimientos sísmicos y sus consecuencias?" },
  { id: 36, text: "¿Dedica algunas horas de la semana a la realización de actividad física?" },
  { id: 37, text: "¿Le interesan las actividades de mucha acción y de reacción rápida en situaciones imprevistas o de peligro?" },
  { id: 38, text: "¿Se ofrecería para colaborar como voluntario/a en los gabinetes especiales de la NASA?" },
  { id: 39, text: "¿Le gusta más el trabajo manual que el intelectual?" },
  { id: 40, text: "¿Estaría dispuesto/a a renunciar a un momento placentero para prestar su servicio como profesional?" },
  { id: 41, text: "¿Participaría de un trabajo de investigación sobre la violencia social?" },
  { id: 42, text: "¿Le gustaría trabajar en un laboratorio, mientras estudia?" },
  { id: 43, text: "¿Arriesgaría su vida para salvar la de un desconocido?" },
  { id: 44, text: "¿Le agradaría hacer un curso de primeros auxilios?" },
  { id: 45, text: "¿Toleraría empezar tantas veces como fuera necesario hasta obtener un logro deseado?" },
  { id: 46, text: "¿Distribuye los horarios adecuadamente para poder cumplir con lo planeado?" },
  { id: 47, text: "¿Haría un curso para aprender a fabricar las piezas de máquinas o aparatos?" },
  { id: 48, text: "¿Elegiría una profesión que lo/a obligara a estar alejado de su familia por algún tiempo?" },
  { id: 49, text: "¿Se radicaría en una zona agrícola-ganadera?" },
  { id: 50, text: "¿Cuando está trabajando en grupo, le entusiasma aportar ideas?" },
  { id: 51, text: "¿Le resulta fácil coordinar un grupo de trabajo?" },
  { id: 52, text: "¿Le resultan interesantes las Ciencias Biológicas?" },
  { id: 53, text: "¿Si una empresa importante solicita un profesional para Gerente de Comercialización, le gustaría desempeñar esta función?" },
  { id: 54, text: "¿Se incluiría en un proyecto nacional de desarrollo de la principal fuente de recursos de su provincia?" },
  { id: 55, text: "¿Siente interés por descubrir cuáles son las causas que determinan ciertos fenómenos, aunque no altere su vida?" },
  { id: 56, text: "¿Descubrió algún filósofo o escritor que haya expresado las mismas ideas de Ud. con anticipación?" },
  { id: 57, text: "¿Desearía que le regalen algún instrumento musical?" },
  { id: 58, text: "¿Aceptaría colaborar con el cumplimiento de las normas sociales en lugares públicos?" },
  { id: 59, text: "¿Cree que sus ideas son importantes y hace lo posible para ponerlas en práctica?" },
  { id: 60, text: "¿Cuando, en la casa, se descompone un artefacto, Ud. se dispone prontamente a repararlo?" },
  { id: 61, text: "¿Formaría parte de un equipo de trabajo orientado a la preservación de la flora y de la fauna?" },
  { id: 62, text: "¿Tiene por costumbre leer revistas relacionadas con los últimos avances científicos y tecnológicos en el área de la salud?" },
  { id: 63, text: "¿Le parece importante y necesario preservar las raíces culturales de nuestro país?" },
  { id: 64, text: "¿Le gustaría realizar una investigación que contribuyera a hacer más justa la distribución de la riqueza?" },
  { id: 65, text: "¿Le gustaría realizar tareas de mantenimiento y conservación de un barco como, por ejemplo, pintura y conservación del casco, mantenimiento de los motores, etc.?" },
  { id: 66, text: "¿Cree que el país debe poseer la más alta tecnología armamentista a cualquier precio?" },
  { id: 67, text: "¿La libertad y la justicia son valores fundamentales en la vida?" },
  { id: 68, text: "¿Aceptaría hacer práctica rentada en una industria de productos alimenticios en el sector de control de calidad?" },
  { id: 69, text: "¿Considera que la salud pública debe ser prioritaria, gratuita y eficiente para todos?" },
  { id: 70, text: "¿Le interesaría investigar sobre una nueva vacuna?" },
  { id: 71, text: "¿Le gusta ocupar el rol de coordinador/a en un equipo de trabajo?" },
  { id: 72, text: "¿En una discusión entre amigos(as), se ofrece como mediador/a?" },
  { id: 73, text: "¿Está de acuerdo con la formación de un cuerpo de soldados profesionales?" },
  { id: 74, text: "¿Lucharía por una causa justa hasta las últimas consecuencias?" },
  { id: 75, text: "¿Le gustaría investigar científicamente sobre cultivos agrícolas?" },
  { id: 76, text: "¿Haría un nuevo diseño de una prenda pasada de moda, ante una reunión imprevista?" },
  { id: 77, text: "¿Visitaría un observatorio astronómico para conocerlo en acción?" },
  { id: 78, text: "¿Le gustaría dirigir el área de importación/exportación de una empresa?" },
  { id: 79, text: "¿Se siente inhibido/a al entrar en un lugar desconocido con gente que no conoce?" },
  { id: 80, text: "¿Le gratificaría trabajar con niños?" },
  { id: 81, text: "¿Haría un logotipo para un afiche de una campaña de prevención del SIDA?" },
  { id: 82, text: "¿Dirigiría un grupo de teatro?" },
  { id: 83, text: "¿Enviaría su Currículum a una empresa automotriz que solicita un gerente para el área de producción?" },
  { id: 84, text: "¿Participaría de un grupo internacional de defensa de algo justo y benéfico para la humanidad?" },
  { id: 85, text: "¿Se costearía sus estudios trabajando?" },
  { id: 86, text: "¿Suele defender las llamadas «causas perdidas»?" },
  { id: 87, text: "¿Ante una emergencia, participaría brindando su ayuda?" },
  { id: 88, text: "¿Sabe el significado de las siglas ADN y ARN?" },
  { id: 89, text: "¿Elegiría una carrera universitaria cuyo instrumento de trabajo fuera la utilización de un idioma extranjero?" },
  { id: 90, text: "¿Trabajar con objetos le resulta más gratificante que trabajar con personas?" },
  { id: 91, text: "¿Le gustaría ser el asesor contable de una empresa?" },
  { id: 92, text: "¿Ante un llamado solidario, se ofrecería para cuidar a un enfermo?" },
  { id: 93, text: "¿Se siente atraído/a por la investigación de los misterios del universo como, por ejemplo, la capa de ozono?" },
  { id: 94, text: "¿El trabajo individual le resulta más rápido y efectivo que el trabajo grupal?" },
  { id: 95, text: "¿Dedicaría parte de su tiempo a ayudar a los habitantes de zonas carenciadas?" },
  { id: 96, text: "¿Cuando decora un ambiente, tiene en cuenta la combinación de los colores, el estilo preferido, etc.?" },
  { id: 97, text: "¿Le gustaría trabajar como profesional dirigiendo la construcción de una empresa hidroeléctrica?" },
  { id: 98, text: "¿Sabe el significado de la sigla PBI?" },
];

// Tablas oficiales CUESA - Intereses (10x7) y Aptitudes (4x7)
// Cada número aparece exactamente una vez.
export const INTERESES_TABLE: Record<AreaKey, number[]> = {
  C: [98, 12, 64, 53, 85, 1, 78, 20, 71, 91],
  H: [9, 34, 80, 25, 95, 67, 41, 74, 56, 89],
  A: [21, 45, 96, 57, 28, 11, 50, 3, 81, 36],
  S: [33, 92, 70, 8, 87, 62, 23, 44, 16, 52],
  I: [75, 6, 19, 38, 60, 27, 83, 54, 47, 97],
  D: [84, 31, 48, 73, 5, 65, 14, 37, 58, 24],
  E: [77, 42, 88, 17, 93, 32, 68, 49, 35, 61],
};

export const APTITUDES_TABLE: Record<AreaKey, number[]> = {
  C: [15, 51, 2, 46],
  H: [63, 30, 72, 86],
  A: [22, 39, 76, 82],
  S: [69, 40, 29, 4],
  I: [26, 59, 90, 10],
  D: [13, 66, 18, 43],
  E: [94, 7, 79, 55],
};

// Grids para renderizar exactamente como la referencia (10 filas Intereses, 4 filas Aptitudes)
export const INTERESES_GRID: number[][] = [
  [98, 9, 21, 33, 75, 84, 77],
  [12, 34, 45, 92, 6, 31, 42],
  [64, 80, 96, 70, 19, 48, 88],
  [53, 25, 57, 8, 38, 73, 17],
  [85, 95, 28, 87, 60, 5, 93],
  [1, 67, 11, 62, 27, 65, 32],
  [78, 41, 50, 23, 83, 14, 68],
  [20, 74, 3, 44, 54, 37, 49],
  [71, 56, 81, 16, 47, 58, 35],
  [91, 89, 36, 52, 97, 24, 61],
];

export const APTITUDES_GRID: number[][] = [
  [15, 63, 22, 69, 26, 13, 94],
  [51, 30, 39, 40, 59, 66, 7],
  [2, 72, 76, 29, 90, 18, 79],
  [46, 86, 82, 4, 10, 43, 55],
];

export const AREA_ORDER: AreaKey[] = ["C", "H", "A", "S", "I", "D", "E"];
export const AREA_LABELS: Record<AreaKey, string> = {
  C: "C",
  H: "H",
  A: "A",
  S: "S",
  I: "I",
  D: "D",
  E: "E",
};
