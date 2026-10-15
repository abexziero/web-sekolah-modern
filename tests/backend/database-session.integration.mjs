import test from "node:test";
import assert from "node:assert/strict";
import { createDatabasePool } from "../../lib/server/database-config.mjs";

test("every pooled SQL connection uses UTC server session time", async () => {
  const pool = createDatabasePool({ ...process.env, DATABASE_NAME: "annur_test", DATABASE_PORT: "3308" }, { test: true });
  const connections = [];
  try {
    for (let i = 0; i < 2; i++) connections.push(await pool.getConnection());
    for (const connection of connections) {
      const [[row]] = await connection.query("SELECT @@session.time_zone AS zone");
      assert.equal(row.zone, "+00:00");
    }
  } finally { for (const connection of connections) connection.release(); await pool.end(); }
});
