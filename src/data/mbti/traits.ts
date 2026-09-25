import type { TraitPair } from "./types";

export type { TraitPair } from "./types";

export const TRAIT_PAIRS: TraitPair[] = [
  {
    key: "EI",
    label: "Energía",
    left: {
      key: "E",
      name: "Extravertido",
      scene: "Una escena que muestra a una persona compartiendo con un grupo de amigos, riendo y conversando con entusiasmo.",
      generic: "Los individuos Extravertidos obtienen su energía de la interacción con otras personas. Suelen ser sociables, habladores y se sienten cómodos en entornos dinámicos y concurridos.",
    },
    right: {
      key: "I",
      name: "Introvertido",
      scene: "Una escena que muestra a un hombre sentado junto a un árbol, escuchando música.",
      generic: "Los individuos Introvertidos prefieren un menor número de interacciones sociales, pero que sean profundas y significativas. A menudo se sienten atraídos por entornos más tranquilos.",
    },
  },
  {
    key: "SN",
    label: "Mente",
    left: {
      key: "N",
      name: "Intuitivo",
      scene: "Una escena que muestra a una persona contemplando las estrellas, imaginando todo lo que podría llegar a ser.",
      generic: "Las personas Intuitivas son muy imaginativas, de mente abierta y curiosas. Prefieren centrarse en las ideas y las posibilidades antes que en los hechos y los detalles concretos.",
    },
    right: {
      key: "S",
      name: "Observador",
      scene: "Una escena que muestra a una pareja discutiendo la compra de una casa.",
      generic: "Las personas Observadoras son pragmáticas y realistas. Suelen centrarse mucho en lo que está ocurriendo o en lo que es muy probable que ocurra.",
    },
  },
  {
    key: "TF",
    label: "Naturaleza",
    left: {
      key: "T",
      name: "Racional",
      scene: "Una escena que muestra a una persona analizando datos con calma para tomar una decisión objetiva.",
      generic: "Los individuos Racionales priorizan la lógica y la objetividad. Le dan mucha importancia a la coherencia, la imparcialidad y la eficiencia al tomar decisiones.",
    },
    right: {
      key: "F",
      name: "Emocional",
      scene: "Una escena donde aparecen dos amigos, uno de los cuales está triste y el otro lo consuela.",
      generic: "Los individuos Emocionales valoran la expresión emocional y la sensibilidad. Le dan mucha importancia a la empatía, la armonía social y la cooperación.",
    },
  },
  {
    key: "JP",
    label: "Tácticas",
    left: {
      key: "J",
      name: "Planificador",
      scene: "Una escena que muestra a una persona marcando tareas completadas en una agenda cuidadosamente organizada.",
      generic: "Los individuos Planificadores son decisivos y organizados. Prefieren la estructura, los planes concretos y cerrar las opciones antes que mantenerlas abiertas.",
    },
    right: {
      key: "P",
      name: "Prospectivo",
      scene: "Una escena que muestra a una pareja comprando un montón de artículos en oferta.",
      generic: "Los individuos Prospectivos son muy buenos improvisando y adaptándose a las oportunidades. Tienden a ser flexibles y no conformistas, valorando la novedad por encima de la estabilidad.",
    },
  },
  {
    key: "ID",
    label: "Identidad",
    left: {
      key: "A",
      name: "Asertivo",
      scene: "Una escena que muestra a una persona con una postura serena y segura de sí misma.",
      generic: "Los individuos Asertivos son seguros de sí mismos, resistentes al estrés y no se preocupan demasiado por lo que los demás piensen de ellos.",
    },
    right: {
      key: "T",
      name: "Turbulento",
      scene: "Una escena que muestra a un estudiante estresado tratando de terminar su tesis tarde en la noche, con varios borradores descartados a su alrededor.",
      generic: "Los individuos Turbulentos son autoconscientes y sensibles al estrés. Tienen un sentido de urgencia en sus emociones y tienden a ser perfeccionistas, a sentirse impulsados por el éxito y deseosos de mejorar.",
    },
  },
];
