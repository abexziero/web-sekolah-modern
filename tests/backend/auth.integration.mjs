import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { base32 } from "@better-auth/utils/base32";
import { createDatabasePool } from "../../lib/server/database-config.mjs";
import { createSchoolAuth, handleAuthRequest, readOperator } from "../../lib/server/auth-core.mjs";
import { createOperator } from "../../lib/server/accounts.mjs";

test("real MariaDB authentication, mandatory MFA, recovery, revocation and account limits", async t => {
  const env = { ...process.env, DATABASE_NAME: "annur_test", DATABASE_PORT: "3308", BETTER_AUTH_URL: "http://127.0.0.1:3000", AUTH_TRUSTED_IP_HEADER: "x-test-client-ip" };
  const pool = createDatabasePool(env, { test: true });
  const auth = createSchoolAuth(pool, env);
  const password = randomUUID() + randomUUID();
  const email = `auth-${randomUUID()}@example.test`;
  const user = await createOperator(auth, pool, { email, name: "Operator tes", password, role: "super_admin" });
  const cookies = new Map();
  const source = `192.0.2.${Math.floor(Math.random() * 254) + 1}`;
  const cookieHeader = () => [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
  async function request(path, body, origin = env.BETTER_AUTH_URL, cookieOverride) {
    const headers = new Headers({ origin, cookie: cookieOverride ?? cookieHeader(), "x-test-client-ip": source });
    if (body) headers.set("content-type", "application/json");
    const response = await handleAuthRequest(auth, pool, env, new Request(`${env.BETTER_AUTH_URL}/api/auth${path}`, { method: body ? "POST" : "GET", headers, ...(body ? { body: JSON.stringify(body) } : {}) }));
    for (const value of response.headers.getSetCookie()) {
      const [pair] = value.split(";");
      const index = pair.indexOf("=");
      cookies.set(pair.slice(0, index), pair.slice(index + 1));
      if (/Max-Age=0/i.test(value)) cookies.delete(pair.slice(0, index));
    }
    return { response, data: await response.json() };
  }
  try {
    assert.equal((await request("/sign-up/email", { email, password, name: "X" })).response.status, 404);
    assert.equal((await request("/sign-in/email", { email, password }, "https://untrusted.example")).response.status, 403);
    assert.equal((await request("/sign-in/email", { email, password }, env.BETTER_AUTH_URL.replace("127.0.0.1", "localhost"))).response.status, 200, "Both local project URLs must support login");
    assert.equal((await request("/sign-in/email", { email, password, rememberMe: false })).response.status, 200);
    const firstSession = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader() }) });
    assert.ok(new Date(firstSession.session.expiresAt).getTime() - Date.now() <= 28800000, "Client option must not extend session beyond eight hours");
    const provisionalCookies = cookieHeader();
    await assert.rejects(readOperator(auth, pool, new Headers({ cookie: provisionalCookies })), /MFA/);
    cookies.clear();
    await request("/sign-in/email", { email, password, rememberMe: false });
    const enrollment = await request("/two-factor/enable", { password, method: "totp" });
    assert.equal(enrollment.response.status, 200);
    assert.ok(enrollment.data.totpURI.startsWith("otpauth://"));
    assert.ok(enrollment.data.backupCodes.length > 0);
    const secret = new URL(enrollment.data.totpURI).searchParams.get("secret");
    const { code } = await auth.api.generateTOTP({ body: { secret: new TextDecoder().decode(base32.decode(secret)) } });
    assert.equal((await request("/two-factor/verify-totp", { code, trustDevice: true })).response.status, 200);
    assert.equal((await readOperator(auth, pool, new Headers({ cookie: cookieHeader() }))).role, "super_admin");
    const verifiedSession = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader() }) });
    assert.ok(new Date(verifiedSession.session.expiresAt).getTime() - Date.now() <= 28800000);
    await assert.rejects(readOperator(auth, pool, new Headers({ cookie: provisionalCookies })));
    for (let i = 0; i < 5; i++) assert.equal((await request("/two-factor/verify-totp", { code: "wrong" }, env.BETTER_AUTH_URL, `${provisionalCookies}; irrelevant=${i}`)).response.status, 401);
    assert.equal((await request("/two-factor/verify-totp", { code: "wrong" }, env.BETTER_AUTH_URL, `${provisionalCookies}; irrelevant=next`)).response.status, 429, "Unrelated cookies must not bypass the account OTP limit");
    assert.ok(![...cookies.keys()].some(key => key.includes("trust_device")));
    const sessionCookies = cookieHeader();
    await request("/sign-out", {});
    await assert.rejects(readOperator(auth, pool, new Headers({ cookie: sessionCookies })));
    cookies.clear();
    assert.equal((await request("/sign-in/email", { email, password })).data.twoFactorRedirect, true);
    assert.equal((await request("/two-factor/verify-totp", { code })).response.status, 401, "TOTP reuse must be rejected across login challenges");
    cookies.clear();
    await request("/sign-in/email", { email, password });
    assert.equal((await request("/two-factor/verify-backup-code", { code: enrollment.data.backupCodes[0] })).response.status, 200);
    const activeCookies = cookieHeader();
    await pool.execute("UPDATE `user` SET active = false WHERE id = ?", [user.id]);
    await assert.rejects(readOperator(auth, pool, new Headers({ cookie: activeCookies })));
    await pool.execute("UPDATE `user` SET active = true WHERE id = ?", [user.id]);
    cookies.clear();
    await request("/sign-in/email", { email, password });
    assert.equal((await request("/two-factor/verify-backup-code", { code: enrollment.data.backupCodes[0] })).response.status, 401, "Recovery code is single use");
    const nonexistent = `absent-${randomUUID()}@example.test`;
    for (let i = 0; i < 5; i++) assert.equal((await request("/sign-in/email", { email: nonexistent, password })).response.status, 401);
    assert.equal((await request("/sign-in/email", { email: nonexistent, password })).response.status, 429);
  } finally {
    await pool.execute("DELETE FROM auth_totp_used WHERE user_id = ?", [user.id]);
    await pool.execute("DELETE FROM session WHERE userId = ?", [user.id]);
    await pool.execute("DELETE FROM account WHERE userId = ?", [user.id]);
    await pool.execute("DELETE FROM twoFactor WHERE userId = ?", [user.id]);
    await pool.execute("DELETE FROM `user` WHERE id = ?", [user.id]);
    await pool.end();
  }
});
