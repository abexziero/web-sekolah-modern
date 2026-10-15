"use client";
import { useActionState, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { defaultHome } from "@/lib/cms-defaults";
import { defaultSettings, defaultNavigation } from "@/lib/cms-seed";
import { cmsSchemas, parseCmsInput, type CmsPayload } from "@/lib/cms-validation";
import { contentSlug, statusLabels } from "@/lib/admin-content";
import { cmsFieldErrors, focusCmsError, publicContentPath, editorTitle } from "@/lib/cms-editor";
import { CmsFields, emptyFields } from "./cms-fields";
import { HomeEditor } from "./home-editor";
import { EditorPreview } from "./editor-preview";
import { useUnsavedChanges } from "./use-unsaved-changes";
import { useEditorDraft } from "./use-editor-draft";
import { editCms, saveCmsDraft } from "@/app/admin/konten/actions";
const singleton = (type: string) => ["home", "navigation", "settings"].includes(type);
function defaults(type: string) { return structuredClone(type === "home" ? defaultHome : type === "settings" ? defaultSettings : type === "navigation" ? defaultNavigation : emptyFields(cmsSchemas[type].fields)); }
export function CmsForm({ entry, initialType = "page", operatorId, pages = [] }: { entry?: CmsPayload; initialType?: string; operatorId: string; pages?: { label: string; href: string }[] }) {
  const type = entry?.type || initialType;
  const [key, setKey] = useState(entry?.entry_key || ""), [area, setArea] = useState("profil"), [payload, setPayload] = useState<CmsPayload>(entry?.payload || defaults(type));
  const [errors, setErrors] = useState<Record<string, string>>({}), [checked, setChecked] = useState(false);
  const [state, action, pending] = useActionState(editCms, { error: "" }), alert = useRef<HTMLParagraphElement>(null), form = useRef<HTMLFormElement>(null);
  const locked = entry?.status === "review";
  const automatic = contentSlug(payload.title || payload.name || payload.question || ""), urlKey = entry ? key : singleton(type) ? "main" : key || (type === "page" ? `${area}/${automatic}` : automatic);
  const draft = useEditorDraft({ storageKey: `annur:cms:${operatorId}:${entry?.id || `new:${type}`}`, version: entry?.version || 0, data: { payload, key, area }, onRecover: value => { setPayload(value.payload); setKey(value.key); setArea(value.area); }, locked: locked || pending, valid: value => { try { parseCmsInput(type, value.payload); return true; } catch { return false; } }, save: entry ? (value, version) => saveCmsDraft({ id: entry.id, type, key: entry.entry_key, version, payload: value.payload }) : undefined });
  const status = entry && draft.version > entry.version ? "draft" : entry?.status || "draft", busy = pending || draft.busy;
  useUnsavedChanges(draft.dirty, busy);
  useEffect(() => { if (state.error) alert.current?.focus(); }, [state]);
  useEffect(() => { if (!entry) return; try { const storage = `annur:cms:${operatorId}:new:${type}`, raw = sessionStorage.getItem(storage); if (raw && JSON.stringify(parseCmsInput(type, JSON.parse(raw).data.payload)) === JSON.stringify(entry.payload)) sessionStorage.removeItem(storage); } catch { } }, []);
  useEffect(() => { if (Object.keys(errors).length) setErrors(cmsFieldErrors(type, payload)); }, [payload]);
  function validate() { const next = cmsFieldErrors(type, payload); setErrors(next); const path = Object.keys(next)[0]; if (path) { setTimeout(() => { if (form.current) focusCmsError(form.current, path); }, 60); return false; } return true; }
  const path = publicContentPath(type, urlKey), preview = entry ? `/admin/konten/${entry.id}/preview` : "";
  return <form ref={form} action={action} noValidate className="admin-form admin-assisted-editor" aria-busy={busy} onSubmit={event => { const intent = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value"); if (intent === "save" && !validate()) event.preventDefault(); }}>

    <input type="hidden" name="id" value={entry?.id || ""} />
    <input type="hidden" name="version" value={draft.version} />
    <input type="hidden" name="payload" value={JSON.stringify(payload)} />
    <input type="hidden" name="key" value={urlKey} />
    <input type="hidden" name="type" value={type} />

    <p className="admin-editor-feedback" role="status">
      {draft.busy ? "Menyimpan perubahan…" : draft.message || (entry ? "Versi tersimpan sudah dimuat." : "Isi formulir, lalu simpan untuk membuat draft pertama.")}
    </p>

    {draft.recovery && <div className="admin-unsaved">
      <p>Ditemukan isian sementara pada tab ini. Pulihkan atau abaikan sebelum melanjutkan.</p>
      <div className="admin-actions">
        <button type="button" onClick={draft.recover}>Pulihkan isian</button>
        <button type="button" onClick={draft.discard}>Abaikan isian</button>
      </div>
    </div>}

    {(state.error || draft.error) && <p ref={alert} tabIndex={-1} role="alert" className="admin-error">
      {state.error || draft.error}
      {draft.error && <button type="button" onClick={draft.retry}>Coba simpan otomatis lagi</button>}
    </p>}

    {Object.keys(errors).length > 0 && <p role="alert" className="admin-error">Periksa {Object.keys(errors).length} kolom yang ditandai. Isian lain tetap ada.</p>}

    <div className="admin-editor-grid">
      <section className="admin-panel">
        <fieldset disabled={pending || locked}>

          <p className="content-note">Kolom bertanda * wajib diisi. Simpan otomatis tidak menerbitkan perubahan.</p>

          {type === "page" && !entry && <label>Kelompok halaman<select value={area} onChange={e => setArea(e.target.value)}>
            <option value="profil">Profil</option>
            <option value="akademik">Akademik</option>
            <option value="kegiatan">Kegiatan</option>
            <option value="fasilitas">Fasilitas</option>
            <option value="informasi">Informasi</option>
            <option value="layanan">Layanan</option>
          </select></label>}

          {!singleton(type) && <p className="content-note">{type === "page" ? "Alamat halaman" : "Ditampilkan di"}: {path}</p>}

          {type === "page" && !entry && <details>
            <summary>Sesuaikan alamat (opsional)</summary>
            <label>Alamat konten<input value={key} placeholder={urlKey} onChange={e => setKey(e.target.value)} /></label>
            <p className="content-note">Alamat tetap setelah draft pertama disimpan.</p>
          </details>}

          {type === "home" ? <HomeEditor value={payload} onChange={setPayload} errors={errors} pages={pages} /> : <CmsFields fields={cmsSchemas[type].fields} value={payload} onChange={setPayload} errors={errors} pages={pages} />}

        </fieldset>
      </section>
      <section className="admin-panel admin-workflow">
        <p className="eyebrow">Simpan dan tampilkan</p>
        <h2>
          {statusLabels[status]}
        </h2>

        <p>Status: <strong>
          {statusLabels[status]}
        </strong> · Versi {draft.version}</p>

        <p>
          <strong>Website:</strong>
          {" "}
          {entry?.published_revision_id ? "Versi yang diterbitkan masih tayang." : "Konten ini belum tayang."}
        </p>

        <p>
          <strong>Perubahan:</strong>
          {" "}
          {draft.dirty ? "Belum tersimpan di server." : status === "published" ? "Versi ini sudah diterbitkan." : "Tersimpan. Belum tampil di website."}
        </p>

        {draft.dirty && <p className="admin-unsaved">Ada perubahan belum disimpan.{entry ? " Simpan otomatis bekerja setelah isian lengkap." : " Isian sementara tersedia jika halaman dimuat ulang."}</p>}

        <fieldset disabled={busy}>
          <div className="admin-actions admin-actions-column admin-mobile-actions">
            <button className="button" name="intent" value="save" disabled={locked}>
              {busy ? "Memproses…" : "Simpan draft"}
            </button>
            {entry && <>
              <Link className="text-link" href={preview}>Pratinjau tersimpan</Link>
              {status === "draft" && <button className="button button-outline" name="intent" value="submit" disabled={draft.dirty}>Ajukan tinjauan</button>}
              {locked && <>
                <button className="button button-outline" name="intent" value="return">Kembalikan draft</button>
                <label className="admin-checkbox"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />Saya sudah memeriksa isi dan pratinjau.</label>
                <button className="button" name="intent" value="publish" disabled={!checked || draft.dirty}>Terbitkan</button>
              </>}
            </>}
          </div>

          {entry && <EditorPreview href={preview} version={draft.version} disabled={draft.dirty || busy} />}

          {entry && <details className="admin-history">
            <summary>Pengaturan lanjutan dan riwayat revisi ({entry.history.length})</summary>
            <p className="content-note">Versi sebelum perubahan tetap tercatat. Pemulihan tidak menerbitkan otomatis.</p>
            <label>Revisi<select name="revisionId">
              {entry.history.map((r: CmsPayload) => <option value={r.id} key={r.id}>Versi {r.revision_number} · {r.saved_by_name}</option>)}
            </select></label>
            <button className="button button-outline" name="intent" value="restore" disabled={draft.dirty || locked}>Pulihkan sebagai draft</button>
            {!singleton(type) && <button name="intent" value="archive" className="text-link admin-danger" disabled={draft.dirty || status === "archived"} onClick={e => { if (!confirm("Arsipkan dan tarik konten ini dari publik?")) e.preventDefault(); }}>Arsipkan</button>}
          </details>}
        </fieldset>

        <Link className="text-link" href={`/admin/konten?type=${type}`}>Kembali ke daftar</Link>

      </section>
    </div>

  </form>;
}
