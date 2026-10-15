import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createDatabasePool } from "../../lib/server/database-config.mjs";
import { createSchoolAuth, readOperator } from "../../lib/server/auth-core.mjs";
import { manageOperator,createOperator } from "../../lib/server/accounts.mjs";
import { operatorFixture } from "./helpers.mjs";

test("local recovery validates before writes, resets factors and revokes sessions", async () => {
  const env = { ...process.env, DATABASE_NAME: "annur_test", DATABASE_PORT: "3308", BETTER_AUTH_URL: "http://127.0.0.1:3000", AUTH_TRUSTED_IP_HEADER: "x-test-client-ip" };
  const pool = createDatabasePool(env, { test: true });
  const auth = createSchoolAuth(pool, env);
  const fixture = await operatorFixture(auth, pool, env, "super_admin");
  try {
    await assert.rejects(manageOperator(auth, pool, { action: "recover", email: fixture.user.email, password: "" }), /Password/);
    assert.equal((await readOperator(auth, pool, fixture.headers)).role, "super_admin");
    const [[{ count }]] = await pool.query("SELECT COUNT(*) AS count FROM `user` WHERE active = true AND role = 'super_admin'");
    if (Number(count) === 1) {
      await assert.rejects(manageOperator(auth, pool, { action: "disable", email: fixture.user.email }), /terakhir/);
      await assert.rejects(manageOperator(auth, pool, { action: "trash", email: fixture.user.email }), /terakhir/);
      await assert.rejects(manageOperator(auth, pool, { action: "role", email: fixture.user.email, role: "editor" }), /terakhir/);
    }
    const password = randomUUID() + randomUUID();
    await manageOperator(auth, pool, { action: "recover", email: fixture.user.email, password });
    await assert.rejects(readOperator(auth, pool, fixture.headers));
    const [[user]] = await pool.execute("SELECT twoFactorEnabled FROM `user` WHERE id = ?", [fixture.user.id]);
    assert.equal(Boolean(user.twoFactorEnabled), false);
    const [factors] = await pool.execute("SELECT id FROM twoFactor WHERE userId = ?", [fixture.user.id]);
    assert.equal(factors.length, 0);
    const response = await auth.api.signInEmail({ body: { email: fixture.user.email, password } });
    assert.equal(response.user.id, fixture.user.id);
    await manageOperator(auth, pool, { action: "revoke", email: fixture.user.email });
    const [[{ count: sessions }]] = await pool.execute("SELECT COUNT(*) AS count FROM session WHERE userId = ?", [fixture.user.id]);
    assert.equal(Number(sessions), 0);
  } finally { await fixture.cleanup(); await pool.end(); }
});

test("parallel demotion preserves the last active Super Admin",async()=>{
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308"},pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),users=[];
 try{for(let i=0;i<2;i++)users.push(await createOperator(auth,pool,{email:`race-${randomUUID()}@example.test`,name:"Concurrent operator",password:randomUUID()+randomUUID(),role:"super_admin"}));const results=await Promise.allSettled(users.map(user=>manageOperator(auth,pool,{action:"role",email:user.email,role:"editor"})));assert.equal(results.filter(result=>result.status==="fulfilled").length,1);const [[{count}]]=await pool.query("SELECT COUNT(*) AS count FROM `user` WHERE active=true AND role='super_admin'");assert.equal(Number(count),1);
 }finally{for(const user of users){await pool.execute("DELETE FROM account WHERE userId=?",[user.id]);await pool.execute("DELETE FROM `user` WHERE id=?",[user.id]);}await pool.end();}
});
