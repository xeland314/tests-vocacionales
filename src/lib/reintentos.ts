/**
 * Módulo dedicado reintentos — habilitación auditada de nuevos intentos
 * para CHASIDE / PERSONALIDAD / KUDER, y comparación (diff) entre intentos.
 *
 * Reglas de negocio implementadas:
 * - Nunca se borran intentos previos (eso vive en *_resultados y no se toca aquí).
 * - Un reintento debe ser habilitado explícitamente (admin o docente) antes de que
 *   el estudiante pueda volver a rendir un test ya completado.
 * - Cada habilitación queda auditada: quién, cuándo, motivo, y si ya fue usada.
 * - Solo puede existir UN reintento pendiente (usado=0) por estudiante+test a la vez.
 */
import { randomUUID } from "node:crypto";
import { db, initDb } from "./db";

export type TestCodigo = "CHASIDE" | "PERSONALIDAD" | "KUDER";

export interface ReintentoRow {
  id: string;
  estudiante_id: string;
  test_codigo: TestCodigo;
  habilitado_por: string;
  habilitado_en: number;
  motivo: string | null;
  ventana_desde_unix: number | null;
  ventana_hasta_unix: number | null;
  usado: number;
  usado_en: number | null;
  resultado_id: string | null;
}

/** ¿El reintento está dentro de su ventana de fechas (si tiene)? */
export function dentroDeVentana(r: ReintentoRow | null): boolean {
  if (!r) return false;
  const now = Math.floor(Date.now() / 1000);
  if (r.ventana_desde_unix && now < Number(r.ventana_desde_unix)) return false;
  if (r.ventana_hasta_unix && now > Number(r.ventana_hasta_unix)) return false;
  return true;
}

function parseFechaAUnix(v: any): number | null {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return Math.floor(d.getTime() / 1000);
}

/**
 * Habilita un nuevo intento para un estudiante en un test específico.
 * Regla de "ronda única": antes de insertar, REVIRA (revoca) los reintentos
 * pendientes de los OTROS tests, de modo que solo puede haber una ronda de
 * test abierta a la vez por estudiante. Lanza error si ya existe un reintento
 * pendiente (usado=0) para el mismo test.
 * ventanaDesde/ventanaHasta (ISO o yyyy-mm-dd) acotan CUÁNDO puede rendirse.
 */
export async function habilitarReintento(params: {
  estudianteId: string;
  testCodigo: TestCodigo;
  habilitadoPor: string; // user.id de quien habilita (admin o docente)
  motivo?: string;
  ventanaDesde?: string | null;
  ventanaHasta?: string | null;
}): Promise<ReintentoRow> {
  await initDb();
  const { estudianteId, testCodigo, habilitadoPor, motivo, ventanaDesde, ventanaHasta } = params;

  const pendiente = await getReintentoPendiente(estudianteId, testCodigo);
  if (pendiente) {
    throw new Error(
      `Ya existe un reintento pendiente sin usar para este estudiante y test (habilitado el ${new Date(pendiente.habilitado_en * 1000).toISOString()})`
    );
  }

  const desde = parseFechaAUnix(ventanaDesde);
  const hasta = parseFechaAUnix(ventanaHasta);
  if (desde && hasta && desde > hasta) {
    throw new Error("La fecha 'desde' no puede ser posterior a la fecha 'hasta'");
  }

  // Ronda única: cierra los reintentos pendientes de los demás tests.
  const otros: TestCodigo[] = (["CHASIDE", "PERSONALIDAD", "KUDER"] as TestCodigo[]).filter((t) => t !== testCodigo);
  await db.execute({
    sql: `DELETE FROM reintentos_habilitados WHERE estudiante_id=? AND usado=0 AND test_codigo IN (?,?)`,
    args: [estudianteId, otros[0], otros[1]],
  });

  const id = randomUUID();
  await db.execute({
    sql: `INSERT INTO reintentos_habilitados (id, estudiante_id, test_codigo, habilitado_por, motivo, ventana_desde_unix, ventana_hasta_unix)
          VALUES (?,?,?,?,?,?,?)`,
    args: [id, estudianteId, testCodigo, habilitadoPor, motivo ?? null, desde, hasta],
  });
  const r = await db.execute({ sql: "SELECT * FROM reintentos_habilitados WHERE id=?", args: [id] });
  return r.rows[0] as any as ReintentoRow;
}

/**
 * Devuelve el reintento pendiente (no usado) más reciente para un estudiante+test,
 * o null si no hay ninguno habilitado. Esto es lo que debe consultar el flujo de
 * toma del examen para decidir si permite un nuevo envío cuando ya existe un resultado previo.
 */
export async function getReintentoPendiente(estudianteId: string, testCodigo: TestCodigo): Promise<ReintentoRow | null> {
  await initDb();
  const r = await db.execute({
    sql: `SELECT * FROM reintentos_habilitados
          WHERE estudiante_id=? AND test_codigo=? AND usado=0
          ORDER BY habilitado_en DESC LIMIT 1`,
    args: [estudianteId, testCodigo],
  });
  return r.rows.length ? (r.rows[0] as any as ReintentoRow) : null;
}

/** Todos los reintentos pendientes (por test) de un estudiante — para pintar qué exámenes están habilitados. */
export async function getReintentosPendientes(estudianteId: string): Promise<ReintentoRow[]> {
  await initDb();
  const r = await db.execute({
    sql: `SELECT * FROM reintentos_habilitados WHERE estudiante_id=? AND usado=0 ORDER BY test_codigo`,
    args: [estudianteId],
  });
  return r.rows as any as ReintentoRow[];
}

/** Historial completo de habilitaciones (usadas y pendientes) para auditoría en el panel de administración. */
export async function getHistorialReintentos(estudianteId: string, testCodigo?: TestCodigo): Promise<ReintentoRow[]> {
  await initDb();
  if (testCodigo) {
    const r = await db.execute({
      sql: `SELECT * FROM reintentos_habilitados WHERE estudiante_id=? AND test_codigo=? ORDER BY habilitado_en DESC`,
      args: [estudianteId, testCodigo],
    });
    return r.rows as any as ReintentoRow[];
  }
  const r = await db.execute({
    sql: `SELECT * FROM reintentos_habilitados WHERE estudiante_id=? ORDER BY habilitado_en DESC`,
    args: [estudianteId],
  });
  return r.rows as any as ReintentoRow[];
}

/**
 * Marca un reintento como usado una vez que el nuevo resultado fue insertado
 * en la tabla *_resultados correspondiente. Debe llamarse justo después de
 * guardar el resultado, dentro del mismo flujo de envío del examen.
 */
export async function consumirReintento(estudianteId: string, testCodigo: TestCodigo, resultadoId: string): Promise<void> {
  await initDb();
  const pendiente = await getReintentoPendiente(estudianteId, testCodigo);
  if (!pendiente) return; // primer intento normal: no había reintento que consumir
  await db.execute({
    sql: `UPDATE reintentos_habilitados SET usado=1, usado_en=unixepoch(), resultado_id=? WHERE id=?`,
    args: [resultadoId, pendiente.id],
  });
}

/** Revoca (elimina) un reintento pendiente sin usar — por si se habilitó por error. */
export async function revocarReintentoPendiente(estudianteId: string, testCodigo: TestCodigo): Promise<boolean> {
  await initDb();
  const r = await db.execute({
    sql: `DELETE FROM reintentos_habilitados WHERE estudiante_id=? AND test_codigo=? AND usado=0`,
    args: [estudianteId, testCodigo],
  });
  return (r.rowsAffected ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Diffs entre intentos — para la vista "diferencia entre examen actual y previos"
// ---------------------------------------------------------------------------

export interface DiffNumerico {
  clave: string;
  anterior: number;
  actual: number;
  delta: number;
  cambioSignificativo: boolean;
}

/** Umbral por defecto (en puntos porcentuales / puntos de escala) para marcar un cambio como significativo. */
const UMBRAL_CAMBIO_SIGNIFICATIVO = 15;

function diffMapas(anterior: Record<string, number>, actual: Record<string, number>, umbral = UMBRAL_CAMBIO_SIGNIFICATIVO): DiffNumerico[] {
  const claves = new Set([...Object.keys(anterior || {}), ...Object.keys(actual || {})]);
  const out: DiffNumerico[] = [];
  for (const clave of claves) {
    const a = anterior?.[clave] ?? 0;
    const b = actual?.[clave] ?? 0;
    const delta = Math.round((b - a) * 10) / 10;
    out.push({ clave, anterior: a, actual: b, delta, cambioSignificativo: Math.abs(delta) >= umbral });
  }
  return out.sort((x, y) => x.clave.localeCompare(y.clave));
}

export interface DiffPersonalidad {
  tipoAnterior: string;
  tipoActual: string;
  tipoCambio: boolean;
  dimensiones: DiffNumerico[]; // EI, SN, TF, JP (percent)
  cambioSignificativo: boolean;
}

export function diffPersonalidad(
  anterior: { tipo: string; percentages: Record<string, number> },
  actual: { tipo: string; percentages: Record<string, number> }
): DiffPersonalidad {
  const dimensiones = diffMapas(anterior.percentages, actual.percentages);
  return {
    tipoAnterior: anterior.tipo,
    tipoActual: actual.tipo,
    tipoCambio: anterior.tipo !== actual.tipo,
    dimensiones,
    cambioSignificativo: anterior.tipo !== actual.tipo || dimensiones.some((d) => d.cambioSignificativo),
  };
}

export interface DiffChaside {
  topInteresAnterior: string;
  topInteresActual: string;
  topAptitudAnterior: string;
  topAptitudActual: string;
  intereses: DiffNumerico[];
  aptitudes: DiffNumerico[];
  cambioSignificativo: boolean;
}

export function diffChaside(
  anterior: { top_interes: string; top_aptitud: string; intereses: Record<string, number>; aptitudes: Record<string, number> },
  actual: { top_interes: string; top_aptitud: string; intereses: Record<string, number>; aptitudes: Record<string, number> }
): DiffChaside {
  const intereses = diffMapas(anterior.intereses, actual.intereses);
  const aptitudes = diffMapas(anterior.aptitudes, actual.aptitudes);
  return {
    topInteresAnterior: anterior.top_interes,
    topInteresActual: actual.top_interes,
    topAptitudAnterior: anterior.top_aptitud,
    topAptitudActual: actual.top_aptitud,
    intereses,
    aptitudes,
    cambioSignificativo:
      anterior.top_interes !== actual.top_interes ||
      anterior.top_aptitud !== actual.top_aptitud ||
      intereses.some((d) => d.cambioSignificativo) ||
      aptitudes.some((d) => d.cambioSignificativo),
  };
}

export interface DiffKuder {
  topAnterior: string;
  topActual: string;
  scores: DiffNumerico[];
  cambioSignificativo: boolean;
}

export function diffKuder(
  anterior: { top: string; scores: Record<string, number> },
  actual: { top: string; scores: Record<string, number> }
): DiffKuder {
  const scores = diffMapas(anterior.scores, actual.scores);
  return {
    topAnterior: anterior.top,
    topActual: actual.top,
    scores,
    cambioSignificativo: anterior.top !== actual.top || scores.some((d) => d.cambioSignificativo),
  };
}
