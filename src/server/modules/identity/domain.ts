/**
 * Módulo Identity & Access — tipos y reglas de rol (RBAC).
 */
export type UserRole = "admin" | "docente";
export const ROLES: UserRole[] = ["admin", "docente"];

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string | null;
  last_name?: string | null;
  role: UserRole;
  is_active: number;
  created_at: number;
}

export interface KnoxTokenInstance {
  digest: string;
  token_key: string;
  user_id: string;
  created: number; // unix
  expiry: number; // unix
}

export function requireRole(user: any, allowed: UserRole | UserRole[]): boolean {
  if (!user?.role) return false;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return list.includes(user.role as UserRole);
}

/**
 * Permiso específico para habilitar/rehabilitar reintentos de exámenes psicológicos.
 * Decisión de negocio: aunque "docente" es de solo lectura sobre los formularios,
 * SÍ puede habilitar reintentos igual que "admin" (requisito explícito del sistema).
 * Toda habilitación queda auditada con habilitado_por en reintentos_habilitados.
 */
export function canEnableRetake(user: any): boolean {
  return requireRole(user, ["admin", "docente"]) && user?.is_active !== 0;
}
