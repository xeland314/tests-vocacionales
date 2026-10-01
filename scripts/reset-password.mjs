/**
 * Resetea la contraseña de un usuario (por si se olvidó).
 * Uso:
 *   node scripts/reset-password.mjs admin@teamggm.com NuevaPassword123
 */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const [email, nueva] = process.argv.slice(2);
if (!email || !nueva) {
  console.error("Uso: node scripts/reset-password.mjs <email> <nueva-password>");
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}
if (nueva.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const cfg = process.env.MYSQL_URL
  ? { uri: process.env.MYSQL_URL }
  : {
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "chaside",
    };

const pool = mysql.createPool({ ...cfg, connectionLimit: 2, charset: "utf8mb4" });
const hash = await bcrypt.hash(nueva, 10);
const [r] = await pool.query("UPDATE users SET password_hash=? WHERE email=?", [hash, email.toLowerCase()]);
if (r.affectedRows === 0) {
  console.error(`No existe usuario con email ${email}`);
  process.exit(1);
}
console.log(`✓ Contraseña actualizada para ${email.toLowerCase()}`);
await pool.end();
