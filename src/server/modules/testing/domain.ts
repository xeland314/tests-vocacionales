/**
 * Módulo Testing — núcleo de negocio de la aplicación de tests vocacionales.
 * Agregados: Estudiante, ResultadoTest (CHASIDE/PERSONALIDAD/KUDER), Reintento.
 */
export type TestCodigo = "CHASIDE" | "PERSONALIDAD" | "KUDER";
export const TEST_CODIGOS: TestCodigo[] = ["CHASIDE", "PERSONALIDAD", "KUDER"];

export const RESULTADOS_TABLE: Record<TestCodigo, string> = {
  CHASIDE: "chaside_resultados",
  PERSONALIDAD: "personalidad_resultados",
  KUDER: "kuder_resultados",
};

export interface EstudianteRow {
  id: string;
  moodle_user_id: number;
  moodle_user_name: string | null;
  moodle_user_email: string | null;
  moodle_course_id: number | null;
  moodle_extra_json: string | null;
  created_at: number;
}

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
