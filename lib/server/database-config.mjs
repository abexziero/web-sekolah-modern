import { createPool } from "mysql2/promise";

export function createDatabasePool(env = process.env, options = {}) {
  const pool = createPool(readDatabaseConfig(env, options));
  // mysql2 timezone converts values; the SQL session timezone must also be UTC.
  pool.on("connection", connection => connection.query("SET time_zone = '+00:00'", error => { if (error) connection.destroy(); }));
  return pool;
}

export function readDatabaseConfig(env = process.env, { test = false } = {}) {
  const host = env.DATABASE_HOST || "127.0.0.1";
  const port = env.DATABASE_PORT || "3307";
  const database = env.DATABASE_NAME || "";
  const user = env.DATABASE_USER || "";
  const password = env.DATABASE_PASSWORD || "";
  if (!/^[a-zA-Z0-9_.:-]+$/.test(host) || !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535 || !/^[a-zA-Z][a-zA-Z0-9_]{0,62}$/.test(database) || !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(user) || user.toLowerCase() === "root" || password.length < 16 || password === "CHANGE_ME") {
    throw new Error("Konfigurasi database tidak valid: periksa host, port, nama, user non-root, dan password minimal 16 karakter.");
  }
  if (test && !database.endsWith("_test")) throw new Error("Pengujian database wajib memakai nama berakhiran _test.");
  const local = ["127.0.0.1", "localhost", "::1"].includes(host);
  if (!local && env.DATABASE_SSL !== "required") throw new Error("Database di luar loopback wajib memakai DATABASE_SSL=required.");
  return { host, port: Number(port), database, user, password, charset: "utf8mb4", timezone: "Z", connectionLimit: 5, connectTimeout: 5000, multipleStatements: false, ...(env.DATABASE_SSL === "required" ? { ssl: { rejectUnauthorized: true, verifyIdentity: true } } : {}) };
}
