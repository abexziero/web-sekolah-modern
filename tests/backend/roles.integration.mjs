import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createDatabasePool } from "../../lib/server/database-config.mjs";
import { createSchoolAuth, readOperator } from "../../lib/server/auth-core.mjs";
import { createOperator } from "../../lib/server/accounts.mjs";
import { operatorFixture } from "./helpers.mjs";

test("super admin role and legacy migration preserve identity and MFA", async () => {
  const env = { ...process.env, DATABASE_NAME: "annur_test", DATABASE_PORT: "3308", BETTER_AUTH_URL: "http://127.0.0.1:3000", AUTH_TRUSTED_IP_HEADER: "x-test-client-ip" };
  const pool = createDatabasePool(env, { test: true });
  const auth = createSchoolAuth(pool, env);
  let fixture;
  try {
    fixture = await operatorFixture(auth, pool, env, "super_admin");
    assert.equal((await readOperator(auth, pool, fixture.headers)).role, "super_admin");
    const [[before]] = await pool.execute("SELECT u.id, u.twoFactorEnabled, a.password FROM `user` u JOIN account a ON a.userId=u.id WHERE u.id=?", [fixture.user.id]);
    await pool.execute("UPDATE `user` SET role='administrator' WHERE id=?", [fixture.user.id]);
    await assert.rejects(readOperator(auth, pool, fixture.headers));
    const sql = await readFile(new URL("../../migrations/004-super-admin-role.sql", import.meta.url), "utf8");
    await pool.query(sql); await pool.query(sql);
    const [[after]] = await pool.execute("SELECT u.id, u.twoFactorEnabled, a.password FROM `user` u JOIN account a ON a.userId=u.id WHERE u.id=?", [fixture.user.id]);
    assert.deepEqual(after, before);
    assert.equal((await readOperator(auth, pool, fixture.headers)).role, "super_admin");
    await assert.rejects(createOperator(auth, pool, { email: "legacy@example.test", name: "Legacy", password: "a".repeat(32), role: "administrator" }));
  } finally { await fixture?.cleanup(); await pool.end(); }
});
