/**
 * Módulo Testing — Reintentos: habilitación auditada de nuevos intentos.
 * Reglas:
 * - Nunca se borran intentos previos (eso vive en *_resultados).
 * - Un reintento debe ser habilitado explícitamente (admin o docente).
 * - Cada habilitación queda auditada: quién, cuándo, motivo, y si ya fue usada.
 * - Solo puede existir UN reintento pendiente (usado=0) por estudiante+test.
 * - "Ronda única": habilitar un test revoca los pendientes de los otros tests.
 */
import { randomUUID } from "node:crypto";
import { db, initDb } from "../../db";
import { TEST_CODIGOS, dentroDeVentana, type ReintentoRow, type TestCodigo } from "./domain";

type AnyRow = Record<string, any>;

export { dentroDeVentana };
export type { ReintentoRow, TestCodigo };

function parseFechaAUnix(v: any): number | null {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return Math.floor(d.getTime() / 1000);
}

export async function habilitarReintento(params: {
  estudianteId: string;
  testCodigo: TestCodigo;
  habilitadoPor: string;
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
  const otros = TEST_CODIGOS.filter((t) => t !== testCodigo);
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
  const r = await db.execute<AnyRow>({ sql: "SELECT * FROM reintentos_habilitados WHERE id=?", args: [id] });
  return r.rows[0] as ReintentoRow;
}

export async function getReintentoPendiente(estudianteId: string, testCodigo: TestCodigo): Promise<ReintentoRow | null> {
  await initDb();
  const r = await db.execute<AnyRow>({
    sql: `SELECT * FROM reintentos_habilitados
          WHERE estudiante_id=? AND test_codigo=? AND usado=0
          ORDER BY habilitado_en DESC LIMIT 1`,
    args: [estudianteId, testCodigo],
  });
  return r.rows.length ? (r.rows[0] as ReintentoRow) : null;
}

export async function getReintentosPendientes(estudianteId: string): Promise<ReintentoRow[]> {
  await initDb();
  const r = await db.execute<AnyRow>({
    sql: `SELECT * FROM reintentos_habilitados WHERE estudiante_id=? AND usado=0 ORDER BY test_codigo`,
    args: [estudianteId],
  });
  return r.rows as ReintentoRow[];
}

export async function getHistorialReintentos(estudianteId: string, testCodigo?: TestCodigo): Promise<ReintentoRow[]> {
  await initDb();
  if (testCodigo) {
    const r = await db.execute<AnyRow>({
      sql: `SELECT * FROM reintentos_habilitados WHERE estudiante_id=? AND test_codigo=? ORDER BY habilitado_en DESC`,
      args: [estudianteId, testCodigo],
    });
    return r.rows as ReintentoRow[];
  }
  const r = await db.execute<AnyRow>({
    sql: `SELECT * FROM reintentos_habilitados WHERE estudiante_id=? ORDER BY habilitado_en DESC`,
    args: [estudianteId],
  });
  return r.rows as ReintentoRow[];
}

export async function consumirReintento(estudianteId: string, testCodigo: TestCodigo, resultadoId: string): Promise<void> {
  await initDb();
  const pendiente = await getReintentoPendiente(estudianteId, testCodigo);
  if (!pendiente) return;
  await db.execute({
    sql: `UPDATE reintentos_habilitados SET usado=1, usado_en=UNIX_TIMESTAMP(), resultado_id=? WHERE id=?`,
    args: [resultadoId, pendiente.id],
  });
}

export async function revocarReintentoPendiente(estudianteId: string, testCodigo: TestCodigo): Promise<boolean> {
  await initDb();
  const r = await db.execute({
    sql: `DELETE FROM reintentos_habilitados WHERE estudiante_id=? AND test_codigo=? AND usado=0`,
    args: [estudianteId, testCodigo],
  });
  return (r.rowsAffected ?? 0) > 0;
}
