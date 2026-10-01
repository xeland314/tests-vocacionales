/**
 * Capa server de la aplicación (backend/DDD).
 *
 * Estructura:
 * - db/       → infraestructura de persistencia (MySQL) + esquema + init
 * - modules/  → módulos de negocio (bounded contexts):
 *     identity            → usuarios, roles, tokens Knox
 *     testing             → estudiantes, resultados de tests, reintentos, tokens de vista, diffs
 *     admin-panel         → reportes y consultas del panel de administración
 *     moodle-integration  → configuración Moodle (cmids, course_id)
 *
 * Convención: pages/api (entrypoints HTTP) importan de modules/<modulo> o db,
 * nunca escriben SQL por su cuenta.
 */
export { db, initDb, hasColumn } from "./db";
export type { Database, DbResult, SqlStatement } from "./db";
