import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { parseCookies } from "better-auth/cookies";
import { createHmac } from "node:crypto";

function allowedOrigins(base) {
  return base.protocol === "http:" && ["127.0.0.1", "localhost"].includes(base.hostname)
    ? [`http://127.0.0.1:${base.port || "80"}`, `http://localhost:${base.port || "80"}`].map(value => new URL(value).origin)
    : [base.origin];
}

export function createSchoolAuth(pool, env = process.env) {
  const base = new URL(env.BETTER_AUTH_URL || "http://127.0.0.1:3000");
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) throw new Error("Secret autentikasi minimal 32 karakter wajib dikonfigurasi.");
  if (base.protocol !== "https:" && !["127.0.0.1", "localhost"].includes(base.hostname)) throw new Error("Autentikasi di luar loopback wajib HTTPS.");
  return betterAuth({
    appName: "MA Annur Samarinda", baseURL: base.origin, secret: env.BETTER_AUTH_SECRET,
    database: pool, trustedOrigins: allowedOrigins(base), logger: { disabled: true },
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 16, maxPasswordLength: 128 },
    user: { additionalFields: { mustChangePassword: { type: "boolean", defaultValue: false, input: false }, role: { type: "string", defaultValue: "editor", input: false }, active: { type: "boolean", defaultValue: true, input: false } } },
    session: { expiresIn: 28800, disableSessionRefresh: true, cookieCache: { enabled: false }, additionalFields: { mfaVerified: { type: "boolean", defaultValue: false, input: false } } },
    advanced: { useSecureCookies: base.protocol === "https:", ipAddress: { ipAddressHeaders: env.AUTH_TRUSTED_IP_HEADER ? [env.AUTH_TRUSTED_IP_HEADER] : [] }, defaultCookieAttributes: { httpOnly: true, sameSite: "lax" } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 100, customRules: { "/sign-in/email": { window: 60, max: 100 }, "/two-factor/*": { window: 60, max: 100 } } },
    plugins: [twoFactor({ issuer: "MA Annur Samarinda", skipVerificationOnEnable: false, accountLockout: { enabled: true, maxFailedAttempts: 5, durationSeconds: 300 }, backupCodeOptions: { storeBackupCodes: "encrypted" } })],
    databaseHooks: { session: { create: { before: async (session, context) => {
      const [[user]] = await pool.execute("SELECT active FROM `user` WHERE id = ?", [session.userId]);
      if (!user?.active) return false;
      const verified = ["/two-factor/verify-totp", "/two-factor/verify-backup-code"].includes(context?.path);
      return { data: { ...session, expiresAt: new Date(Math.min(new Date(session.expiresAt).getTime(), Date.now() + 28800000)), mfaVerified: verified } };
    } } } }
  });
}

export async function readOperator(auth, pool, headers) {
  const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
  if (!session) throw new Error("Login diperlukan.");
  if (!session.session.mfaVerified || !session.user.twoFactorEnabled) throw new Error("Verifikasi MFA diperlukan.");
  const [[user]] = await pool.execute("SELECT id, name, email, role, active, mustChangePassword FROM `user` WHERE id = ?", [session.user.id]);
  if (!user?.active || !["super_admin", "editor"].includes(user.role)) throw new Error("Akses akun ditolak.");
  if (user.mustChangePassword) throw new Error("Ganti password awal sebelum mengakses konten.");
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

const routes = new Map([["/get-session", "GET"], ["/sign-in/email", "POST"], ["/sign-out", "POST"], ["/two-factor/enable", "POST"], ["/two-factor/verify-totp", "POST"], ["/two-factor/verify-backup-code", "POST"]]);
const failure = (status, message) => Response.json({ message }, { status, headers: { "cache-control": "no-store", ...(status === 429 ? { "retry-after": "300" } : {}) } });
const digest = (env, value) => createHmac("sha256", env.BETTER_AUTH_SECRET).update(value).digest("hex");

export async function reserveAttempt(pool, key, seconds, max) {
  await pool.execute("INSERT INTO auth_throttle (`key`, attempts, window_start) VALUES (?, 1, UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE attempts = IF(window_start <= TIMESTAMPADD(SECOND, ?, UTC_TIMESTAMP(3)), 1, attempts + 1), window_start = IF(window_start <= TIMESTAMPADD(SECOND, ?, UTC_TIMESTAMP(3)), UTC_TIMESTAMP(3), window_start)", [key, -seconds, -seconds]);
  const [[row]] = await pool.execute("SELECT attempts FROM auth_throttle WHERE `key` = ?", [key]);
  return Number(row.attempts) <= max;
}

async function readJson(request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("body");
  const reader = request.body?.getReader();
  if (!reader) return {};
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) { await reader.cancel(); throw new Error("body"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const body = JSON.parse(new TextDecoder().decode(bytes));
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("body");
  return body;
}

function sessionHeaders(request, response) {
  const cookies = new Map((request.headers.get("cookie") || "").split(";").filter(Boolean).map(pair => { const i = pair.indexOf("="); return [pair.slice(0, i).trim(), pair.slice(i + 1)]; }));
  for (const value of response.headers.getSetCookie()) {
    const pair = value.split(";")[0];
    const i = pair.indexOf("=");
    if (/Max-Age=0/i.test(value)) cookies.delete(pair.slice(0, i));
    else cookies.set(pair.slice(0, i), pair.slice(i + 1));
  }
  return new Headers({ cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join("; ") });
}

export async function handleAuthRequest(auth, pool, env, request) {
  const origins = allowedOrigins(new URL(env.BETTER_AUTH_URL));
  const path = new URL(request.url).pathname.slice("/api/auth".length);
  if (!routes.has(path)) return failure(404, "Endpoint tidak tersedia.");
  if (request.method !== routes.get(path)) return failure(405, "Metode tidak diizinkan.");
  if ((request.method === "POST" || request.headers.has("origin")) && !origins.includes(request.headers.get("origin"))) return failure(403, "Asal permintaan ditolak.");
  let body;
  try { if (request.method === "POST") body = await readJson(request); } catch { return failure(400, "Isian tidak valid."); }
  try {
    // Without an explicitly configured trusted proxy, callers share a conservative limiter.
    const header = env.AUTH_TRUSTED_IP_HEADER;
    const source = header ? request.headers.get(header)?.slice(0, 100) || "unknown" : "untrusted-source";
    if (!await reserveAttempt(pool, digest(env, `source:${source}`), 60, 100)) return failure(429, "Terlalu banyak percobaan. Tunggu sebelum mencoba kembali.");
    await pool.execute("DELETE FROM auth_throttle WHERE window_start < UTC_TIMESTAMP() - INTERVAL 1 DAY LIMIT 100");
    let accountKey;
    let otpKey;
    if (path === "/sign-in/email") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (email.length > 254 || typeof body.password !== "string" || body.password.length > 128) return failure(401, "Login atau verifikasi gagal.");
      body.email = email;
      accountKey = digest(env, `login:${email}`);
      if (!await reserveAttempt(pool, accountKey, 900, 5)) return failure(429, "Terlalu banyak percobaan. Tunggu sebelum mencoba kembali.");
    }
    if (path === "/two-factor/enable") body.method = "totp";
    if (path.startsWith("/two-factor/verify-")) {
      const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
      const context = await auth.$context;
      const challenge = parseCookies(request.headers.get("cookie") || "").get(context.createAuthCookie("two_factor").name);
      otpKey = digest(env, `otp:${session?.user.id || challenge || "anonymous"}`);
      if (!await reserveAttempt(pool, otpKey, 300, 5)) return failure(429, "Terlalu banyak percobaan. Tunggu sebelum mencoba kembali.");
    }
    if (body) { body.trustDevice = false; body.disableSession = false; }
    const cleanHeaders = new Headers(request.headers);
    cleanHeaders.delete("content-length");
    const cleanRequest = new Request(request.url, { method: request.method, headers: cleanHeaders, ...(body ? { body: JSON.stringify(body) } : {}) });
    const response = await auth.handler(cleanRequest);
    response.headers.set("cache-control", "no-store");
    if (!response.ok) return failure(response.status === 429 ? 429 : 401, "Login atau verifikasi gagal.");
    if (accountKey) await pool.execute("DELETE FROM auth_throttle WHERE `key` = ?", [accountKey]);
    if (otpKey) await pool.execute("DELETE FROM auth_throttle WHERE `key` = ?", [otpKey]);
    if (path === "/two-factor/verify-totp") {
      const session = await auth.api.getSession({ headers: sessionHeaders(request, response) });
      if (!session?.session.mfaVerified) return failure(401, "Verifikasi MFA gagal.");
      const hash = digest(env, `${session.user.id}:${body.code}`);
      await pool.execute("DELETE FROM auth_totp_used WHERE expires_at < UTC_TIMESTAMP(3) LIMIT 100");
      try {
        await pool.execute("INSERT INTO auth_totp_used (code_hash, user_id, expires_at) VALUES (?, ?, UTC_TIMESTAMP(3) + INTERVAL 90 SECOND)", [hash, session.user.id]);
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") throw error;
        const context = await auth.$context;
        await context.internalAdapter.deleteSession(session.session.token);
        return failure(401, "Kode sudah digunakan. Gunakan kode berikutnya atau kode pemulihan.");
      }
    }
    return response;
  } catch { return failure(503, "Layanan autentikasi belum tersedia. Coba kembali nanti."); }
}
