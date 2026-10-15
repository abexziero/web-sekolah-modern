"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "login" | "setup" | "verify" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [enrollment, setEnrollment] = useState<{ totpURI: string; backupCodes: string[] } | null>(null);
  const [recovery, setRecovery] = useState(false);
  const alert = useRef<HTMLParagraphElement>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "login") {
        const result = await authClient.signIn.email({ email: String(form.get("email")), password: String(form.get("password")) });
        if (result.error) throw new Error();
        window.location.assign("/admin/mfa"); return;
      }
      if (mode === "setup" && !enrollment) {
        const result = await authClient.twoFactor.enable({ password: String(form.get("password")) });
        if (result.error || !result.data || !("totpURI" in result.data)) throw new Error();
        setEnrollment({ totpURI: result.data.totpURI, backupCodes: result.data.backupCodes });
      } else {
        const code = String(form.get("code")).trim();
        const result = recovery ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice: false }) : await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
        if (result.error) throw new Error();
        window.location.assign("/admin/berita"); return;
      }
    } catch { setError("Login atau verifikasi gagal. Periksa isian; jika terlalu banyak percobaan, tunggu sebelum mencoba kembali."); requestAnimationFrame(() => alert.current?.focus()); }
    finally { setBusy(false); }
  }
  return <form method="post" onSubmit={submit} className="admin-form" aria-busy={busy}>
    <noscript><p className="admin-error">Aktifkan JavaScript untuk login dan verifikasi akun.</p></noscript>
    {error && <p ref={alert} tabIndex={-1} role="alert" className="admin-error">{error}</p>}
    <fieldset disabled={busy}>
      {mode === "login" ? <><label>Email<input name="email" type="email" autoComplete="username" required maxLength={254} /></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label></> : mode === "setup" && !enrollment ? <label>Konfirmasi password<input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label> : <>
        {enrollment && <div className="admin-enrollment"><h2>1. Tambahkan akun di aplikasi autentikator</h2><p>Pilih masukkan kunci secara manual. Nama akun: MA Annur; jenis kode: berdasarkan waktu (TOTP).</p><label>Kunci autentikator<input readOnly value={new URL(enrollment.totpURI).searchParams.get("secret") || ""} aria-describedby="secret-note" /></label><p id="secret-note">Kunci ini rahasia. Jangan membagikannya atau memasukkannya ke website lain.</p><h2>2. Simpan kode pemulihan</h2><p>Setiap kode hanya dapat dipakai sekali jika autentikator tidak tersedia.</p><pre className="admin-recovery">{enrollment.backupCodes.join("\n")}</pre><label className="admin-checkbox"><input type="checkbox" required />Saya sudah menyimpan kode pemulihan di tempat aman.</label><h2>3. Verifikasi kode pertama</h2></div>}
        <label>{recovery ? "Kode pemulihan" : "Kode autentikator"}<input key={recovery ? "recovery" : "totp"} name="code" autoComplete="one-time-code" inputMode={recovery ? "text" : "numeric"} pattern={recovery ? undefined : "[0-9]{6}"} maxLength={recovery ? 40 : 6} required /></label>
      </>}
      <button className="button" type="submit">{busy ? "Memproses…" : mode === "login" ? "Masuk" : mode === "setup" && !enrollment ? "Siapkan autentikator" : "Verifikasi dan lanjutkan"}</button>
    </fieldset>
    {mode === "verify" && <button className="text-link" type="button" disabled={busy} onClick={() => { setRecovery(!recovery); setError(""); }}>{recovery ? "Gunakan kode autentikator" : "Gunakan kode pemulihan"}</button>}
    {mode !== "login" && <Link className="text-link" href="/admin/login">Kembali ke login</Link>}
  </form>;
}

export function LogoutButton() {
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  return <><button className="text-link" disabled={busy} onClick={async () => {
    if(!document.dispatchEvent(new Event("admin:before-leave",{cancelable:true})))return;
    setBusy(true);
    try { const result = await authClient.signOut(); if (result.error) throw new Error(); window.location.assign("/admin/login"); }
    catch { document.dispatchEvent(new Event("admin:cancel-leave"));setError(true); setBusy(false); }
  }}>{busy ? "Keluar…" : "Keluar"}</button>{error && <span role="alert">Gagal keluar. Coba lagi.</span>}</>;
}
