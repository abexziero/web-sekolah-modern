import { AuthForm } from "@/components/admin/auth-form";
export default function LoginPage() {
  return <section className="admin-auth"><p className="eyebrow">Akses pengelola</p><h1>Selamat bekerja.</h1><p className="admin-lead">Masuk dengan akun pribadi untuk mengelola informasi madrasah. Verifikasi autentikator diperlukan setelah login.</p><AuthForm mode="login" /></section>;
}
