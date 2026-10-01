/**
 * Módulo Moodle Integration — índice público del módulo (servidor).
 * Cliente de inicialización con Moodle: ver src/client/moodle.ts (postMessage).
 */
export type { MoodleConfig } from "./config";
export { getMoodleConfig, setMoodleConfig } from "./config";
export type { TestKey, MoodleContext, ValidationResult } from "./validator";
export { extraerContexto, validarContexto } from "./validator";
