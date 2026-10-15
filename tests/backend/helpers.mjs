import { randomUUID } from "node:crypto";
import { base32 } from "@better-auth/utils/base32";
import { createOperator } from "../../lib/server/accounts.mjs";
import { handleAuthRequest } from "../../lib/server/auth-core.mjs";

export async function operatorFixture(auth, pool, env, role) {
  const password = randomUUID() + randomUUID();
  const user = await createOperator(auth, pool, { email: `fixture-${randomUUID()}@example.test`, name: "Operator pengujian", password, role });
  const jar = new Map();
  const cookies = () => [...jar].map(([key, value]) => `${key}=${value}`).join("; ");
  const source = `192.0.2.${Math.floor(Math.random() * 254) + 1}`;
  async function post(path, body) {
    const result = await handleAuthRequest(auth, pool, env, new Request(`${env.BETTER_AUTH_URL}/api/auth${path}`, { method: "POST", headers: { origin: env.BETTER_AUTH_URL, "content-type": "application/json", cookie: cookies(), "x-test-client-ip": source }, body: JSON.stringify(body) }));
    if (!result.ok) throw new Error(`Fixture authentication failed (${result.status}, ${path}).`);
    for (const header of result.headers.getSetCookie()) { const pair = header.split(";")[0]; const i = pair.indexOf("="); jar.set(pair.slice(0, i), pair.slice(i + 1)); }
    return result.json();
  }
  await post("/sign-in/email", { email: user.email, password });
  const enrollment = await post("/two-factor/enable", { password });
  const secret = new TextDecoder().decode(base32.decode(new URL(enrollment.totpURI).searchParams.get("secret")));
  const { code } = await auth.api.generateTOTP({ body: { secret } });
  await post("/two-factor/verify-totp", { code });
  return { user, headers: new Headers({ cookie: cookies() }), cookies: cookies(), password, backupCodes: enrollment.backupCodes, cleanup: async () => {
    await pool.execute("DELETE FROM session WHERE userId = ?", [user.id]);
    await pool.execute("DELETE FROM account WHERE userId = ?", [user.id]);
    await pool.execute("DELETE FROM twoFactor WHERE userId = ?", [user.id]);
    await pool.execute("DELETE FROM `user` WHERE id = ?", [user.id]);
  } };
}
