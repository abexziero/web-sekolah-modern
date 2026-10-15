import { getAuth } from "@/lib/server/auth";
import { getPool } from "@/lib/server/database";
import { handleAuthRequest } from "@/lib/server/auth-core.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  try { return await handleAuthRequest(getAuth(), getPool(), process.env, request); }
  catch { return Response.json({ message: "Layanan autentikasi belum tersedia." }, { status: 503, headers: { "cache-control": "no-store" } }); }
}
export { handle as GET, handle as POST };
