import { createConnection } from "mysql2/promise";
import { fileURLToPath } from "node:url";
import { readDatabaseConfig } from "../lib/server/database-config.mjs";
import { runMigrations } from "../lib/server/migrations.mjs";

let connection;
try {
  const test = process.argv.includes("--test");
  if (process.env.NODE_ENV === "production" && !test) throw new Error("Migrasi produksi memerlukan prosedur backup dan persetujuan tersendiri.");
  const { connectionLimit, ...config } = readDatabaseConfig({ ...process.env, ...(test ? { DATABASE_NAME: "annur_test", DATABASE_PORT: "3308" } : {}) }, { test });
  if (!["127.0.0.1", "localhost", "::1"].includes(config.host)) throw new Error("Migrasi batch ini hanya untuk database lokal.");
  // Multiple statements are allowed only for trusted versioned SQL, never app input.
  connection = await createConnection({ ...config, multipleStatements: true });
  const count = await runMigrations(connection, fileURLToPath(new URL("../migrations", import.meta.url)));
  console.log(`${count} migrasi baru diterapkan.`);
} catch (error) {
  const known = /^(Checksum|Migrasi|Konfigurasi|Database di|File migrasi)/.test(error.message);
  console.error(known ? error.message : "Migrasi gagal. Periksa Engine, koneksi, hak skema, dan status schema_migrations secara lokal. Rahasia tidak ditampilkan.");
  process.exitCode = 1;
} finally {
  await connection?.end();
}
