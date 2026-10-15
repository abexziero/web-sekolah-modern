"use client";
import { useActionState, useRef, useEffect, useState } from "react";
import { manageAccount } from "@/app/admin/akun/actions";
import { useUnsavedChanges } from "./use-unsaved-changes";
export type OperatorAccount = { id: string; email: string; name: string; role: string; active: boolean };
export function AccountForm({ account, trash = false, initialAction="profile" }: { account?: OperatorAccount; trash?: boolean;initialAction?:string }) {
  const [state, action, pending] = useActionState(manageAccount, { error: "", success: "" }), form = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false); useUnsavedChanges(dirty, pending);
  useEffect(() => { if(state.success) { setDirty(false); if(!account) form.current?.reset(); else { const secret = form.current?.elements.namedItem("reauth") as HTMLInputElement | null; if(secret) secret.value = ""; } } }, [state, account]);
  return <form ref={form} action={action} onChange={() => setDirty(true)} className="admin-form admin-panel" onSubmit={e => { if(!confirm("Terapkan perubahan akun ini? Sesi akun terkait akan dicabut.")) e.preventDefault(); }}>
    <fieldset disabled={pending}>
      <h2>
        {account ? `Kelola ${account.name}` : "Tambah akun operator"}
      </h2>
      {account ? <>
        <input type="hidden" name="email" value={account.email} />
        <p>
          {account.email}
        </p>
        <label>Operasi<select name="intent" defaultValue={initialAction}>
          {trash ? <option value="untrash">Pulihkan sebagai nonaktif</option> : <>
            <option value="profile">Ubah nama</option>
            <option value="role">Ubah peran</option>
            <option value={account.active ? "disable" : "enable"}>
              {account.active ? "Nonaktifkan" : "Aktifkan"}
            </option>
            <option value="revoke">Cabut semua sesi</option>
            <option value="trash">Hapus ke Sampah</option>
          </>}
        </select></label>
      </> : <>
        <input type="hidden" name="intent" value="create" />
        <label>Email akun<input name="email" type="email" required autoComplete="off" /></label>
      </>}
      <label>
        {account ? "Nama" : "Nama (untuk akun baru)"}
        <input name="name" defaultValue={account?.name} required maxLength={100} />
      </label>
      <label>Peran<select name="role" defaultValue={account?.role || "editor"}>
        <option value="editor">Editor</option>
        <option value="super_admin">Super Admin</option>
      </select></label>
      {!account && <label>Password awal akun baru<input name="password" type="password" autoComplete="new-password" required minLength={16} maxLength={128} /></label>}
      <label>Konfirmasi password akunmu<input name="reauth" type="password" autoComplete="current-password" required maxLength={128} /></label>
      <p className="content-note">Akun baru wajib mengganti password awal dan menyiapkan autentikator. Akun pulihan tetap nonaktif sampai diaktifkan kembali. Super Admin aktif terakhir dilindungi.</p>
      {state.error && <p role="alert" className="admin-error">
        {state.error}
      </p>}
      {state.success && <p role="status">
        {state.success}
      </p>}
      <button className="button">
        {pending ? "Memproses…" : "Terapkan"}
      </button>
    </fieldset>
  </form>;
}
