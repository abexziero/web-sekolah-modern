import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSchoolAuth, readOperator } from "./auth-core.mjs";
import { getPool } from "./database";

let authInstance: ReturnType<typeof createSchoolAuth> | undefined;
export function getAuth() {
  authInstance ??= createSchoolAuth(getPool());
  return authInstance;
}

export async function requireOperator() {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders, query: { disableCookieCache: true } });
  if (!session) redirect("/admin/login");
  const [[account]] = await getPool().execute<any[]>("SELECT mustChangePassword FROM `user` WHERE id=?", [session.user.id]);
  if (account?.mustChangePassword) redirect("/admin/ganti-password");
  if (!(session.session as unknown as { mfaVerified?: boolean }).mfaVerified || !(session.user as unknown as { twoFactorEnabled?: boolean }).twoFactorEnabled) redirect("/admin/mfa");
  try { return await readOperator(getAuth(), getPool(), requestHeaders); }
  catch { redirect("/admin/login"); }
}
