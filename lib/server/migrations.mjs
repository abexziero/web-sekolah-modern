import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

export function verifyMigration(previous, checksum) {
  if (!previous) return true;
  if (previous.checksum !== checksum) throw new Error("Checksum migrasi berubah. Pulihkan file migrasi asli; jangan menimpa riwayat skema.");
  if (previous.status !== "applied") throw new Error("Migrasi sebelumnya belum selesai. Periksa dan pulihkan database sebelum melanjutkan; DDL tidak dapat dianggap rollback otomatis.");
  return false;
}

export async function runMigrations(connection, directory) {
  const [[{ acquired }]] = await connection.execute("SELECT GET_LOCK(?, 10) AS acquired", ["annur_schema_migrations"]);
  if (Number(acquired) !== 1) throw new Error("Migrasi lain sedang berjalan; coba kembali setelah selesai.");
  let applied = 0;
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(160) NOT NULL PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      status ENUM('started', 'applied') NOT NULL,
      applied_at DATETIME(3) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    const files = (await readdir(directory)).filter(name => /^\d{3}-[a-z0-9-]+\.sql$/.test(name)).sort();
    if (!files.length) throw new Error("File migrasi tidak ditemukan.");
    for (const version of files) {
      const sql = await readFile(resolve(directory, version), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const [[previous]] = await connection.execute("SELECT checksum, status FROM schema_migrations WHERE version = ?", [version]);
      if (!verifyMigration(previous, checksum)) continue;
      await connection.execute("INSERT INTO schema_migrations (version, checksum, status) VALUES (?, ?, 'started')", [version, checksum]);
      // MariaDB DDL commits implicitly; a failed migration stays marked started.
      await connection.query(sql);
      await connection.execute("UPDATE schema_migrations SET status = 'applied', applied_at = UTC_TIMESTAMP(3) WHERE version = ?", [version]);
      applied++;
    }
    return applied;
  } finally {
    await connection.execute("DO RELEASE_LOCK(?)", ["annur_schema_migrations"]);
  }
}
