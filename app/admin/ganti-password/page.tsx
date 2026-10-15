import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/server/auth";
import { PasswordForm } from "@/components/admin/password-form";
export default async function InitialPasswordPage() {
    const session = await getAuth().api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
    if (!session)
        redirect("/admin/login");
    return <section className="admin-auth"><p className="eyebrow">Amankan akun</p><h1>Ganti password awal.</h1><p className="admin-lead">Gunakan password pribadi minimal16karakter, lalu siapkan autentikator.</p><PasswordForm /></section>;
}
