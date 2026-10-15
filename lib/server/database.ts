import "server-only";
import type { Pool } from "mysql2/promise";
import { createDatabasePool } from "./database-config.mjs";

const databaseGlobal = globalThis as typeof globalThis & { annurDatabase?: Pool };

export function isDatabaseConfigured() {
  return [process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD].some(Boolean);
}

export function getPool(): Pool {
  databaseGlobal.annurDatabase ??= createDatabasePool();
  return databaseGlobal.annurDatabase;
}
