/**
 * Módulo Testing — Índice público del módulo. Los entrypoints (pages/api)
 * deben importar de aquí, nunca de los repositorios internos.
 */
export * from "./domain";
export * from "./diffs";
export * from "./viewTokens.repo";
export * from "./reintentos.repo";
export * from "./estudiantes.repo";
export * from "./resultados.repo";
export { crearSubmitHandler, jsonResponse } from "./submit.service";
export type { SubmitBody } from "./submit.service";
