/**
 * Hashing de contraseñas con bcrypt (bcryptjs — implementación JS pura,
 * funciona en cualquier hosting con Node sin dependencias nativas).
 */
import * as bcrypt from "bcryptjs";

export const BCRYPT_ROUNDS = 10;

export async function hashPasswordSafe(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPasswordSafe(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
