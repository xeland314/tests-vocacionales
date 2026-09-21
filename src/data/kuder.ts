/**
 * Kuder Forma C - Inventario de Intereses Vocacionales (10 áreas + V)
 * Simplificación web: 60 diadas (120 actividades) -> 60 elecciones. Cada elección puntúa 1 en su área.
 * Baremo original: 10 áreas x ~6-7 items cada una + escala V (verificación).
 * Para implementación 60 diadas = 60 respuestas, 6 por área promedio (equivale a forma abreviada usada en orientación escolar).
 * Referencias: PUCV Kuder, U. Lima Forma C, Psicólogos Córdoba.
 */

export type KuderAreaKey = "EXT" | "MEC" | "CAL" | "CIE" | "PER" | "ART" | "LIT" | "MUS" | "SOC" | "OFI";

export interface KuderAreaInfo {
  key: KuderAreaKey;
  nombre: string;
  nombreCorto: string;
  color: string;
  descripcion: string;
  carreras: string;
  icono: string; // Lucide icon name (e.g. "Trees")
}

export const KUDER_AREAS: Record<KuderAreaKey, KuderAreaInfo> = {
  EXT: { key:"EXT", nombre:"Aire Libre", nombreCorto:"Aire Libre", color:"#16A34A", icono:"Trees", descripcion:"Gusto por actividades al aire libre, naturaleza, agricultura y trabajo físico.", carreras:"Agronomía, Veterinaria, Forestal, Biología de campo, Educación física, Topografía y afines." },
  MEC: { key:"MEC", nombre:"Mecánico", nombreCorto:"Mecánico", color:"#EA580C", icono:"Wrench", descripcion:"Interés por manipular herramientas, máquinas y construir/reparar.", carreras:"Ing. Mecánica, Industrial, Electrónica, Automotriz, Arquitectura, Diseño industrial." },
  CAL: { key:"CAL", nombre:"Cálculo", nombreCorto:"Cálculo", color:"#2563EB", icono:"Calculator", descripcion:"Gusto por trabajar con números, estadísticas y cálculos.", carreras:"Matemática, Economía, Contaduría, Finanzas, Estadística, Actuaría, Auditoría." },
  CIE: { key:"CIE", nombre:"Científico", nombreCorto:"Científico", color:"#0891B2", icono:"FlaskConical", descripcion:"Interés por investigar, experimentar y descubrir causas.", carreras:"Medicina, Química, Farmacia, Física, Bioquímica, Investigación, Laboratorio." },
  PER: { key:"PER", nombre:"Persuasivo", nombreCorto:"Persuasivo", color:"#DC2626", icono:"Handshake", descripcion:"Gusto por convencer, liderar, negociar y tratar con gente.", carreras:"Marketing, Ventas, Derecho, RRPP, Comercio, Administración, Política." },
  ART: { key:"ART", nombre:"Artístico", nombreCorto:"Artístico", color:"#9333EA", icono:"Palette", descripcion:"Interés por lo estético, diseño, creación visual y manual.", carreras:"Diseño gráfico, Bellas artes, Arquitectura, Moda, Publicidad, Fotografía." },
  LIT: { key:"LIT", nombre:"Literario", nombreCorto:"Literario", color:"#4F46E5", icono:"BookOpen", descripcion:"Gusto por leer, escribir, idiomas e historia.", carreras:"Literatura, Periodismo, Comunicación, Filosofía, Historia, Traducción, Educación." },
  MUS: { key:"MUS", nombre:"Musical", nombreCorto:"Musical", color:"#DB2777", icono:"Music", descripcion:"Interés por la música, canto e instrumentos.", carreras:"Música, Musicoterapia, Producción musical, Docencia musical." },
  SOC: { key:"SOC", nombre:"Servicio Social", nombreCorto:"Asistencial", color:"#0D9488", icono:"HeartHandshake", descripcion:"Deseo de ayudar, enseñar y servir a los demás.", carreras:"Psicología, Trabajo social, Enfermería, Medicina, Educación, Terapia, Cuidado." },
  OFI: { key:"OFI", nombre:"Oficina", nombreCorto:"Oficina", color:"#64748B", icono:"Building2", descripcion:"Gusto por tareas organizadas, de oficina, orden y precisión.", carreras:"Administración, Secretariado, Contaduría, RRHH, Logística, Archivo." },
};

// 60 diadas: [opción A área, opción B área]. El usuario elige 1 de las 2.
// Se usan pares que cruzan áreas para forzar preferencia (método ipsativo Kuder).
export interface KuderDiada {
  id: number; // 1..60
  a: { texto: string; area: KuderAreaKey };
  b: { texto: string; area: KuderAreaKey };
}

export const KUDER_DIADAS: KuderDiada[] = [
  { id: 1, a: { texto: "Cultivar nuevas variedades de plantas", area: "EXT" }, b: { texto: "Armar un motor", area: "MEC" } },
  { id: 2, a: { texto: "Resolver ejercicios de matemática", area: "CAL" }, b: { texto: "Analizar muestras en laboratorio", area: "CIE" } },
  { id: 3, a: { texto: "Convencer a otros de una idea", area: "PER" }, b: { texto: "Dibujar un afiche", area: "ART" } },
  { id: 4, a: { texto: "Escribir un cuento", area: "LIT" }, b: { texto: "Tocar un instrumento", area: "MUS" } },
  { id: 5, a: { texto: "Ayudar a personas con problemas", area: "SOC" }, b: { texto: "Organizar archivos de oficina", area: "OFI" } },
  { id: 6, a: { texto: "Trabajar en el campo", area: "EXT" }, b: { texto: "Calcular presupuestos", area: "CAL" } },
  { id: 7, a: { texto: "Investigar una enfermedad", area: "CIE" }, b: { texto: "Negociar un contrato", area: "PER" } },
  { id: 8, a: { texto: "Diseñar un logotipo", area: "ART" }, b: { texto: "Corregir un texto", area: "LIT" } },
  { id: 9, a: { texto: "Dirigir un coro", area: "MUS" }, b: { texto: "Atender a pacientes", area: "SOC" } },
  { id: 10, a: { texto: "Llevar contabilidad", area: "OFI" }, b: { texto: "Reparar una bicicleta", area: "MEC" } },
  { id: 11, a: { texto: "Estudiar el crecimiento de árboles", area: "EXT" }, b: { texto: "Experimentar con químicos", area: "CIE" } },
  { id: 12, a: { texto: "Vender un producto", area: "PER" }, b: { texto: "Escribir poemas", area: "LIT" } },
  { id: 13, a: { texto: "Componer una canción", area: "MUS" }, b: { texto: "Clasificar documentos", area: "OFI" } },
  { id: 14, a: { texto: "Construir una maqueta", area: "MEC" }, b: { texto: "Resolver problemas de cálculo", area: "CAL" } },
  { id: 15, a: { texto: "Pintar un mural", area: "ART" }, b: { texto: "Cuidar a niños", area: "SOC" } },
  { id: 16, a: { texto: "Trabajar en un vivero", area: "EXT" }, b: { texto: "Dar una charla motivacional", area: "PER" } },
  { id: 17, a: { texto: "Programar una app que calcula promedios", area: "CAL" }, b: { texto: "Diseñar una portada de libro", area: "ART" } },
  { id: 18, a: { texto: "Investigar el origen de palabras", area: "LIT" }, b: { texto: "Enseñar a leer a adultos", area: "SOC" } },
  { id: 19, a: { texto: "Afinar un piano", area: "MUS" }, b: { texto: "Reparar un tractor", area: "MEC" } },
  { id: 20, a: { texto: "Ordenar facturas", area: "OFI" }, b: { texto: "Observar aves en la naturaleza", area: "EXT" } },
  { id: 21, a: { texto: "Hacer análisis de sangre", area: "CIE" }, b: { texto: "Escribir artículos", area: "LIT" } },
  { id: 22, a: { texto: "Liderar un equipo de ventas", area: "PER" }, b: { texto: "Tocar en una banda", area: "MUS" } },
  { id: 23, a: { texto: "Calcular costos de producción", area: "CAL" }, b: { texto: "Atender en un albergue", area: "SOC" } },
  { id: 24, a: { texto: "Diseñar muebles", area: "MEC" }, b: { texto: "Decorar interiores", area: "ART" } },
  { id: 25, a: { texto: "Trabajar en una reserva natural", area: "EXT" }, b: { texto: "Archivar historias clínicas", area: "OFI" } },
  { id: 26, a: { texto: "Investigar vacunas", area: "CIE" }, b: { texto: "Crear una escultura", area: "ART" } },
  { id: 27, a: { texto: "Recitar en público", area: "LIT" }, b: { texto: "Organizar un concierto", area: "MUS" } },
  { id: 28, a: { texto: "Aconsejar a jóvenes", area: "SOC" }, b: { texto: "Armar un circuito eléctrico", area: "MEC" } },
  { id: 29, a: { texto: "Hacer balances contables", area: "CAL" }, b: { texto: "Persuadir a clientes", area: "PER" } },
  { id: 30, a: { texto: "Explorar una cueva", area: "EXT" }, b: { texto: "Escribir una novela", area: "LIT" } },
  { id: 31, a: { texto: "Estudiar bacterias", area: "CIE" }, b: { texto: "Cantar en un coro", area: "MUS" } },
  { id: 32, a: { texto: "Coordinar un evento", area: "PER" }, b: { texto: "Ordenar una biblioteca", area: "OFI" } },
  { id: 33, a: { texto: "Calcular intereses bancarios", area: "CAL" }, b: { texto: "Pintar retratos", area: "ART" } },
  { id: 34, a: { texto: "Cuidar animales", area: "EXT" }, b: { texto: "Enseñar matemáticas", area: "SOC" } },
  { id: 35, a: { texto: "Reparar celulares", area: "MEC" }, b: { texto: "Investigar el espacio", area: "CIE" } },
  { id: 36, a: { texto: "Debatir en público", area: "PER" }, b: { texto: "Diseñar joyas", area: "ART" } },
  { id: 37, a: { texto: "Traducir un libro", area: "LIT" }, b: { texto: "Llevar agenda de oficina", area: "OFI" } },
  { id: 38, a: { texto: "Componer música", area: "MUS" }, b: { texto: "Hacer trabajo de campo", area: "EXT" } },
  { id: 39, a: { texto: "Atender quejas de clientes", area: "SOC" }, b: { texto: "Calcular impuestos", area: "CAL" } },
  { id: 40, a: { texto: "Diseñar un puente", area: "MEC" }, b: { texto: "Escribir crónicas", area: "LIT" } },
  { id: 41, a: { texto: "Negociar precios", area: "PER" }, b: { texto: "Cuidar un huerto", area: "EXT" } },
  { id: 42, a: { texto: "Analizar datos científicos", area: "CIE" }, b: { texto: "Archivar contratos", area: "OFI" } },
  { id: 43, a: { texto: "Ilustrar un libro", area: "ART" }, b: { texto: "Dar clases", area: "SOC" } },
  { id: 44, a: { texto: "Tocar guitarra", area: "MUS" }, b: { texto: "Arreglar una impresora", area: "MEC" } },
  { id: 45, a: { texto: "Hacer inventario", area: "OFI" }, b: { texto: "Resolver ecuaciones", area: "CAL" } },
  { id: 46, a: { texto: "Guiar una excursión", area: "EXT" }, b: { texto: "Investigar ADN", area: "CIE" } },
  { id: 47, a: { texto: "Vender seguros", area: "PER" }, b: { texto: "Restaurar cuadros", area: "ART" } },
  { id: 48, a: { texto: "Corregir estilos", area: "LIT" }, b: { texto: "Dirigir orquesta", area: "MUS" } },
  { id: 49, a: { texto: "Apoyar a personas mayores", area: "SOC" }, b: { texto: "Programar planillas", area: "OFI" } },
  { id: 50, a: { texto: "Instalar paneles solares", area: "MEC" }, b: { texto: "Calcular estadísticas", area: "CAL" } },
  { id: 51, a: { texto: "Fotografiar paisajes", area: "EXT" }, b: { texto: "Negociar acuerdos", area: "PER" } },
  { id: 52, a: { texto: "Estudiar virus", area: "CIE" }, b: { texto: "Escribir guiones", area: "LIT" } },
  { id: 53, a: { texto: "Modelar en 3D", area: "ART" }, b: { texto: "Enseñar música", area: "MUS" } },
  { id: 54, a: { texto: "Organizar donaciones", area: "SOC" }, b: { texto: "Manejar caja", area: "OFI" } },
  { id: 55, a: { texto: "Sincronizar motores", area: "MEC" }, b: { texto: "Cultivar orquídeas", area: "EXT" } },
  { id: 56, a: { texto: "Auditar cuentas", area: "CAL" }, b: { texto: "Investigar clima", area: "CIE" } },
  { id: 57, a: { texto: "Presentar un producto", area: "PER" }, b: { texto: "Escribir reseñas", area: "LIT" } },
  { id: 58, a: { texto: "Grabar un disco", area: "MUS" }, b: { texto: "Clasificar correspondencia", area: "OFI" } },
  { id: 59, a: { texto: "Diseñar jardines", area: "ART" }, b: { texto: "Cuidar enfermos", area: "SOC" } },
  { id: 60, a: { texto: "Soldar piezas", area: "MEC" }, b: { texto: "Calcular dosis", area: "CAL" } },
];

export const KUDER_ORDER: KuderAreaKey[] = ["EXT","MEC","CAL","CIE","PER","ART","LIT","MUS","SOC","OFI"];
