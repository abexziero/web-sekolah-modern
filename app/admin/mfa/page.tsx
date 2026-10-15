import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/admin/auth-form";
import {getPool} from "@/lib/server/database";
import { getAuth } from "@/lib/server/auth";
export default async function MfaPage() {
  const session = await getAuth().api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if(session){const [[user]]=await getPool().execute<any[]>("SELECT mustChangePassword FROM `user` WHERE id=?",[session.user.id]);if(user?.mustChangePassword)redirect("/admin/ganti-password");}
  const enabled = (session?.user as unknown as { twoFactorEnabled?: boolean } | undefined)?.twoFactorEnabled;
  const verified = (session?.session as unknown as { mfaVerified?: boolean } | undefined)?.mfaVerified;
  if (enabled && verified) redirect("/admin/berita");
  const setup = !!session && !enabled;
  return <section className="admin-auth"><p className="eyebrow">Verifikasi dua langkah</p><h1>{setup ? "Amankan akunmu." : "Satu langkah lagi."}</h1><p className="admin-lead">{setup ? "Hubungkan aplikasi autentikator di perangkatmu sebelum mengakses dashboard." : "Masukkan kode dari aplikasi autentikator. Jangan membagikan kode kepada siapa pun."}</p><AuthForm mode={setup ? "setup" : "verify"} /></section>;
}
