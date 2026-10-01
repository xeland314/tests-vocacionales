/**
 * Seed — crea usuarios de demostración en MySQL (estudiantes con resultados falsos
 * fue deprecado: la BD solo acepta usuarios Moodle reales).
 * Uso: npm run seed
 */
import mysql from "mysql2/promise";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const cfg = process.env.MYSQL_URL
  ? ({ uri: process.env.MYSQL_URL })
  : {
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "chaside",
    };

const pool = mysql.createPool({ ...cfg, connectionLimit: 2, charset: "utf8mb4" });

(async () => {
  const [rows] = await pool.query("SELECT COUNT(*) as c FROM users");
  if (Number(rows[0].c) === 0) {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "admin12345", 10);
    await pool.query(
      "INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active) VALUES (?,?,?,?,?,?,1)",
      [id, process.env.SEED_ADMIN_EMAIL || "admin@teamggm.com", hash, "Admin", "TeamGGM", "admin"]
    );
    console.log("Usuario admin creado:", process.env.SEED_ADMIN_EMAIL || "admin@teamggm.com");
  } else {
    console.log("users ya tiene registros, no se crea nada");
  }
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
