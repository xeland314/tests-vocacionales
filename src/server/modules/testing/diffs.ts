/**
 * Módulo Testing — Differences (diffs) entre intentos, para la vista
 * "diferencia entre examen actual y previos". Pureza de dominio: no toca la BD.
 */
export interface DiffNumerico {
  clave: string;
  anterior: number;
  actual: number;
  delta: number;
  cambioSignificativo: boolean;
}

export interface DiffPersonalidad {
  tipoAnterior: string;
  tipoActual: string;
  tipoCambio: boolean;
  dimensiones: DiffNumerico[];
  cambioSignificativo: boolean;
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

export interface DiffKuder {
  topAnterior: string;
  topActual: string;
  scores: DiffNumerico[];
  cambioSignificativo: boolean;
}

/** Umbral (en puntos porcentuales / puntos de escala) para marcar un cambio significativo. */
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
