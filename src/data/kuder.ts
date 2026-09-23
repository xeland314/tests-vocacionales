/**
 * Kuder Forma C - Inventario de Intereses Vocacionales (10 áreas)
 * Banco adaptado exactamente al Excel docs/Test_Kuder_Completo.xlsx (45 diadas = 90 actividades)
 * Referencia: Test_Kuder_Completo.xlsx Resultados 0-9
 */

export type KuderAreaKey = "EXT" | "MEC" | "CAL" | "CIE" | "PER" | "ART" | "LIT" | "MUS" | "SOC" | "OFI";

export interface KuderAreaInfo {
  key: KuderAreaKey;
  nombre: string;
  nombreCorto: string;
  color: string;
  descripcion: string;
  carreras: string;
  icono: string;
}

export const KUDER_AREAS: Record<KuderAreaKey, KuderAreaInfo> = {
  EXT: { key:"EXT", nombre:"Aire Libre", nombreCorto:"Exterior", color:"#16A34A", icono:"Trees", descripcion:"Gusto por actividades al aire libre, naturaleza, agricultura y trabajo físico.", carreras:"Agronomía, Veterinaria, Forestal, Biología de campo, Educación física, Topografía y afines." },
  MEC: { key:"MEC", nombre:"Mecánico", nombreCorto:"Mecánica", color:"#EA580C", icono:"Wrench", descripcion:"Interés por manipular herramientas, máquinas y construir/reparar.", carreras:"Ing. Mecánica, Industrial, Electrónica, Automotriz, Arquitectura, Diseño industrial." },
  CAL: { key:"CAL", nombre:"Cálculo", nombreCorto:"Cálculo", color:"#2563EB", icono:"Calculator", descripcion:"Gusto por trabajar con números, estadísticas y cálculos.", carreras:"Matemática, Economía, Contaduría, Finanzas, Estadística, Actuaría, Auditoría." },
  CIE: { key:"CIE", nombre:"Científico", nombreCorto:"Científica", color:"#0891B2", icono:"FlaskConical", descripcion:"Interés por investigar, experimentar y descubrir causas.", carreras:"Medicina, Química, Farmacia, Física, Bioquímica, Investigación, Laboratorio." },
  PER: { key:"PER", nombre:"Persuasivo", nombreCorto:"Persuasiva", color:"#DC2626", icono:"Handshake", descripcion:"Gusto por convencer, liderar, negociar y tratar con gente.", carreras:"Marketing, Ventas, Derecho, RRPP, Comercio, Administración, Política." },
  ART: { key:"ART", nombre:"Artístico", nombreCorto:"Artística", color:"#9333EA", icono:"Palette", descripcion:"Interés por lo estético, diseño, creación visual y manual.", carreras:"Diseño gráfico, Bellas artes, Arquitectura, Moda, Publicidad, Fotografía." },
  LIT: { key:"LIT", nombre:"Literario", nombreCorto:"Literaria", color:"#4F46E5", icono:"BookOpen", descripcion:"Gusto por leer, escribir, idiomas e historia.", carreras:"Literatura, Periodismo, Comunicación, Filosofía, Historia, Traducción, Educación." },
  MUS: { key:"MUS", nombre:"Musical", nombreCorto:"Musical", color:"#DB2777", icono:"Music", descripcion:"Interés por la música, canto e instrumentos.", carreras:"Música, Musicoterapia, Producción musical, Docencia musical." },
  SOC: { key:"SOC", nombre:"Servicio Social", nombreCorto:"Servicio Social", color:"#0D9488", icono:"HeartHandshake", descripcion:"Deseo de ayudar, enseñar y servir a los demás.", carreras:"Psicología, Trabajo social, Enfermería, Medicina, Educación, Terapia, Cuidado." },
  OFI: { key:"OFI", nombre:"Oficina", nombreCorto:"Oficina", color:"#64748B", icono:"Building2", descripcion:"Gusto por tareas organizadas, de oficina, orden y precisión.", carreras:"Administración, Secretariado, Contaduría, RRHH, Logística, Archivo." },
};

export interface KuderDiada {
  id: number;
  a: { texto: string; area: KuderAreaKey };
  b: { texto: string; area: KuderAreaKey };
}

export const KUDER_DIADAS: KuderDiada[] = [
  { id: 1, a: { texto: "Ser un(a) artista.", area: "MUS" }, b: { texto: "Dirigir la crianza de ganado", area: "EXT" } },
  { id: 2, a: { texto: "Conocer datos útiles para navegar en internet.", area: "MEC" }, b: { texto: "Dar charlas sobre química", area: "CIE" } },
  { id: 3, a: { texto: "Trabajar en una agencia de publicidad.", area: "PER" }, b: { texto: "Estudiar métodos de regadío", area: "EXT" } },
  { id: 4, a: { texto: "Tomar clases de locución y expresión corporal.", area: "ART" }, b: { texto: "Realizar experimentos", area: "CIE" } },
  { id: 5, a: { texto: "Ilustrar cuentos infantiles.", area: "ART" }, b: { texto: "Ser protagonista de una obra de teatro", area: "LIT" } },
  { id: 6, a: { texto: "Animar un programa de televisión.", area: "PER" }, b: { texto: "Crear el vestuario para una obra de teatro", area: "ART" } },
  { id: 7, a: { texto: "Ser guía de excursiones.", area: "EXT" }, b: { texto: "Participar en campaña de ayuda a niños discapacitados", area: "SOC" } },
  { id: 8, a: { texto: "Aprender bailes folclóricos.", area: "MUS" }, b: { texto: "Ser escultor(a)", area: "ART" } },
  { id: 9, a: { texto: "Trabajar como soporte técnico computacional.", area: "CAL" }, b: { texto: "Asistir a una conferencia sobre los derechos de los trabajadores", area: "PER" } },
  { id: 10, a: { texto: "Enseñar cómo funciona un motor de avión.", area: "MEC" }, b: { texto: "Dirigir la clasificación de fruta según su calidad", area: "EXT" } },
  { id: 11, a: { texto: "Participar en un Comité de Navidad recolectando juguetes para niños de escasos recursos.", area: "SOC" }, b: { texto: "Componer la música para un poema.", area: "MUS" } },
  { id: 12, a: { texto: "Crear afiches para una agencia de publicidad.", area: "PER" }, b: { texto: "Saber armar y desarmar computadores.", area: "MEC" } },
  { id: 13, a: { texto: "Intervenir en un conflicto familiar ante tribunales de justicia.", area: "SOC" }, b: { texto: "Ser relacionador(a) público(a) de una empresa.", area: "OFI" } },
  { id: 14, a: { texto: "Dirigir una función teatral de aficionados.", area: "ART" }, b: { texto: "Investigar sobre los nuevos usos de las matemáticas.", area: "CAL" } },
  { id: 15, a: { texto: "Aprender estadística.", area: "CAL" }, b: { texto: "Ser conocido(a) como un(a) buen(a) escritor(a)", area: "LIT" } },
  { id: 16, a: { texto: "Ser programador(a) en computación.", area: "CAL" }, b: { texto: "Manejar aparatos y maquinas industriales como prensas, tornos, etc.", area: "MEC" } },
  { id: 17, a: { texto: "Efectuar análisis de muestras de sangre.", area: "CIE" }, b: { texto: "Investigar las causas de enfermedades mentales.", area: "SOC" } },
  { id: 18, a: { texto: "Pertenecer a una Academia Literaria.", area: "LIT" }, b: { texto: "Tener a cargo el equipo agrícola en su fundo.", area: "MEC" } },
  { id: 19, a: { texto: "Pertenecer a un grupo musical.", area: "MUS" }, b: { texto: "Ser dentista.", area: "CIE" } },
  { id: 20, a: { texto: "Ayudar a niños con dificultades de aprendizaje.", area: "SOC" }, b: { texto: "Dirigir investigaciones sobre televisión.", area: "PER" } },
  { id: 21, a: { texto: "Realizar un estudio sobre el desarrollo económico en una empresa.", area: "OFI" }, b: { texto: "Pintar loza.", area: "ART" } },
  { id: 22, a: { texto: "Ser gerente de ventas de una revista.", area: "OFI" }, b: { texto: "Manejar bases de datos", area: "CAL" } },
  { id: 23, a: { texto: "Investigar los roles del hombre y de la mujer en algunas sociedades primitivas.", area: "PER" }, b: { texto: "Inventar nuevas formas de poesía.", area: "MUS" } },
  { id: 24, a: { texto: "Trabajar en un laboratorio.", area: "CIE" }, b: { texto: "Entrevistar aspirantes a un empleo.", area: "PER" } },
  { id: 25, a: { texto: "Ser químico(a).", area: "CIE" }, b: { texto: "Leer artículos acerca de los avances tecnológicos en computación.", area: "CAL" } },
  { id: 26, a: { texto: "Seguir un curso de biología.", area: "CIE" }, b: { texto: "Escribir una obra de teatro.", area: "LIT" } },
  { id: 27, a: { texto: "Dar una conferencia sobre literatura universal.", area: "LIT" }, b: { texto: "Asistir a la ceremonia de entrega de los premios Oscar.", area: "PER" } },
  { id: 28, a: { texto: "Ser el (la) director(a) de una película.", area: "ART" }, b: { texto: "Ser experto(a) en cuidar árboles.", area: "EXT" } },
  { id: 29, a: { texto: "Mantener en buen estado y reparar calculadoras electrónicas.", area: "MEC" }, b: { texto: "Componer música.", area: "MUS" } },
  { id: 30, a: { texto: "Ayudar en un servicio de Asistencia Social.", area: "SOC" }, b: { texto: "Arreglar un motor.", area: "MEC" } },
  { id: 31, a: { texto: "Calcular el costo de producción de un artículo.", area: "CAL" }, b: { texto: "Recolectar dinero para obras sociales.", area: "SOC" } },
  { id: 32, a: { texto: "Solucionar conflictos interpersonales.", area: "SOC" }, b: { texto: "Escribir el guion para una película.", area: "LIT" } },
  { id: 33, a: { texto: "Diseñar equipos para excursionistas.", area: "MEC" }, b: { texto: "Confeccionar el presupuesto de materiales para una empresa.", area: "OFI" } },
  { id: 34, a: { texto: "Ser el rostro de un producto recién lanzado al mercado.", area: "PER" }, b: { texto: "Dictar un curso sobre sistemas de rendimiento en las oficinas.", area: "OFI" } },
  { id: 35, a: { texto: "Analizar la calidad de la tierra para fines agrícolas.", area: "EXT" }, b: { texto: "Instalar redes internas en diversas empresas.", area: "CAL" } },
  { id: 36, a: { texto: "Asistir a una conferencia sobre nuevos métodos para aprovechar la madera.", area: "EXT" }, b: { texto: "Realizar el balance anual de una empresa.", area: "OFI" } },
  { id: 37, a: { texto: "Planificar campañas de publicidad.", area: "OFI" }, b: { texto: "Estudiar ballet.", area: "MUS" } },
  { id: 38, a: { texto: "Hacer análisis químicos de nuevos productos.", area: "CIE" }, b: { texto: "Cultivar verduras para el mercado.", area: "EXT" } },
  { id: 39, a: { texto: "Reparar fallas de artefactos electrónicos (planchas, jugueras, secadores de pelo, etc)", area: "MEC" }, b: { texto: "Escribir para una revista de arte.", area: "ART" } },
  { id: 40, a: { texto: "Arreglar música para una orquesta.", area: "MUS" }, b: { texto: "Inventar problemas matemáticos.", area: "CAL" } },
  { id: 41, a: { texto: "Recomendar sitios de veraneo.", area: "EXT" }, b: { texto: "Ser el (la) autor(a) de un libro.", area: "LIT" } },
  { id: 42, a: { texto: "Seguir un curso de literatura moderna.", area: "LIT" }, b: { texto: "Calcular las ganancias y pérdidas de un producto.", area: "OFI" } },
  { id: 43, a: { texto: "Diseñar joyas.", area: "ART" }, b: { texto: "Participar en una campaña contra el alcoholismo.", area: "SOC" } },
  { id: 44, a: { texto: "Dirigir y supervisar a los empleados de una oficina.", area: "OFI" }, b: { texto: "Ser secretario(a) de un científico famoso.", area: "MUS" } },
  { id: 45, a: { texto: "Enseñar sobre los diferentes estilos literarios.", area: "LIT" }, b: { texto: "Cantar en un coro.", area: "MUS" } },
];

export const KUDER_ORDER: KuderAreaKey[] = ["EXT","MEC","CAL","CIE","PER","ART","LIT","MUS","SOC","OFI"];
