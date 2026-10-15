"use client";
import { useState } from "react";
import { useUnsavedChanges, confirmLeavingEditor } from "./use-unsaved-changes";
type Media = { id: string; mime: string; alt: string; size: number; caption?: string; credit?: string };
export function MediaManager({ initial,initialPage }: { initial: Media[];initialPage:{total:number;page:number;pages:number} }) {
  const [pagination,setPagination]=useState(initialPage);
  const [files, setFiles] = useState(initial), [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [trash, setTrash] = useState(false), [search, setSearch] = useState(""), [editing, setEditing] = useState<Media | null>(null);
  const [dirty, setDirty] = useState(false); useUnsavedChanges(dirty, busy);
  function chooseEdit(next: Media | null) { if(!confirmLeavingEditor()) return; setDirty(false); setEditing(next); }
  async function load(deleted: boolean,page=1) {
    if(!confirmLeavingEditor()) return;
    setBusy(true); setMessage("");
    try { const query=new URLSearchParams({q:search,page:String(page),trash:deleted?"1":"0"});const response = await fetch(`/api/admin/media?${query}`, { cache: "no-store" }), json = await response.json(); if(!response.ok) throw new Error(json.error); setFiles(json.rows);setPagination(json); setTrash(deleted); setEditing(null); setDirty(false); }
    catch(e) { setMessage(e instanceof Error ? e.message : "Media gagal dimuat."); } finally { setBusy(false); }
  }
  async function mutate(file: Media, action: "trash" | "restore" | "update", data?: FormData) {
    if(action === "trash" && editing?.id === file.id && !confirmLeavingEditor())return;
    if(action === "trash" && !confirm("Pindahkan file yang tidak dipakai ke Sampah? File dapat dipulihkan.")) return;
    setBusy(true); setMessage("");
    try {
      const values = action === "update" ? { alt: String(data?.get("alt")), caption: String(data?.get("caption")), credit: String(data?.get("credit")) } : {};
      const response = await fetch(`/api/admin/media?id=${file.id}`, { method: action === "trash" ? "DELETE" : "PATCH", headers: { "content-type": "application/json" }, ...(action !== "trash" ? { body: JSON.stringify({ action, id: file.id, ...values }) } : {}) }), json = await response.json();
      if(!response.ok) throw new Error(json.error);
      setFiles(current => action === "update" ? current.map(f => f.id === file.id ? { ...f, ...values } : f) : current.filter(f => f.id !== file.id));
      if(action === "update" || editing?.id === file.id){setEditing(null);setDirty(false);}
      if(action!=="update")setPagination(p=>({...p,total:Math.max(0,p.total-1)}));
      setMessage(action === "trash" ? "Media dihapus ke Sampah." : action === "restore" ? "Media dipulihkan." : "Deskripsi media tersimpan.");
    } catch(e) { setMessage(e instanceof Error ? e.message : "Perubahan gagal."); } finally { setBusy(false); }
  }
  async function upload(form: HTMLFormElement) {
    const data = new FormData(form), selected = data.getAll("files").filter((v): v is File => v instanceof File && !!v.size);
    if(!selected.length || selected.length > 10) { setMessage("Pilih 1–10 file."); return; }
    setBusy(true); setMessage("");
    try {
      for(let index = 0;index < selected.length;index++) {
        setMessage(`Mengunggah ${index + 1}/${selected.length}…`);
        const file = selected[index], query = new URLSearchParams({ alt: String(data.get("alt")), caption: String(data.get("caption")), credit: String(data.get("credit")) });
        const response = await fetch(`/api/admin/media?${query}`, { method: "POST", headers: { "content-type": file.type, "x-filename": encodeURIComponent(file.name) }, body: file }), json = await response.json();
        if(!response.ok) throw new Error(json.error);
        setFiles(current => [{ id: json.id, mime: file.type.startsWith("image/") ? "image/webp" : file.type, alt: String(data.get("alt")), size: file.size, caption: String(data.get("caption")), credit: String(data.get("credit")) }, ...current]);
      }
      setMessage("Upload selesai. File privat sampai kontennya diterbitkan."); form.reset(); setDirty(false);
    } catch(e) { setMessage(e instanceof Error ? e.message : "Upload gagal."); } finally { setBusy(false); }
  }
  const filtered = files;
  return <>
    <div className="admin-tabs">
      <button type="button" aria-pressed={!trash} disabled={busy||!trash} onClick={() => void load(false)}>Daftar aktif</button>
      <button type="button" aria-pressed={trash} disabled={busy||trash} onClick={() => void load(true)}>Sampah</button>
    </div>
    {!trash && !editing && <details className="admin-panel" open>
      <summary>Tambah media</summary>
      <form className="admin-form" onChange={() => setDirty(true)} onSubmit={e => { e.preventDefault(); void upload(e.currentTarget); }}>
        <fieldset disabled={busy}>
          <label>Gambar atau PDF<input name="files" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" required /></label>
          <label>Teks alternatif / judul dokumen<input name="alt" required maxLength={250} /></label>
          <div className="admin-field-grid">
            <label>Caption<input name="caption" maxLength={400} /></label>
            <label>Kredit foto<input name="credit" maxLength={250} /></label>
          </div>
          <p className="content-note">Gambar maksimal 5 MiB/20 MP; PDF 10 MiB; maksimal 10 file. Media yang dipakai riwayat revisi dilindungi.</p>
          <button className="button">
            {busy ? "Mengunggah…" : "Unggah media"}
          </button>
        </fieldset>
      </form>
    </details>}
    <p role="status" className="admin-feedback" aria-live="polite">
      {message}
    </p>
    {editing && <form key={editing.id} onChange={() => setDirty(true)} className="admin-form admin-panel" onSubmit={e => { e.preventDefault(); void mutate(editing, "update", new FormData(e.currentTarget)); }}>
      <fieldset disabled={busy}>
        <h2>Ubah deskripsi media</h2>
        <label>Teks alternatif<input name="alt" defaultValue={editing.alt} maxLength={250} required /></label>
        <label>Caption<input name="caption" defaultValue={editing.caption} maxLength={400} /></label>
        <label>Kredit foto<input name="credit" defaultValue={editing.credit} maxLength={250} /></label>
        <div className="admin-actions">
          <button className="button">Simpan perubahan</button>
          <button type="button" onClick={() => chooseEdit(null)}>Batal</button>
        </div>
      </fieldset>
    </form>}
    <section className="admin-panel">
      <form className="admin-list-tools" onSubmit={e=>{e.preventDefault();void load(trash);}}>
        <label>Cari media<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Deskripsi file…" /></label>
        <button className="button button-outline" disabled={busy}>Cari</button><span>{pagination.total} file</span>
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table admin-record-table" role="table">
          <thead>
            <tr>
              <th>Media</th>
              <th>Alamat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(file => <tr key={file.id}>
              <th scope="row">
                <div className="admin-content-title">
                  {!trash && file.mime.startsWith("image/") && <img src={`/media/${file.id}`} alt="" width={80} height={60} loading="lazy" />}
                  <div>
                    {file.alt}
                    <small>{file.mime} · {Math.ceil(file.size / 1024)} KB</small>
                  </div>
                </div>
              </th>
              <td data-label="Alamat">
                {!trash && <>
                  <a href={`/media/${file.id}`} target="_blank" rel="noopener noreferrer">Lihat file</a>
                  <label className="sr-only" htmlFor={`url-${file.id}`}>URL {file.alt}</label>
                  <input id={`url-${file.id}`} aria-label={`URL ${file.alt}`} readOnly value={`/media/${file.id}`} />
                </>}
              </td>
              <td data-label="Aksi">
                <div className="admin-row-actions">
                  {trash ? <button className="text-link" disabled={busy} onClick={() => void mutate(file, "restore")}>Pulihkan</button> : <>
                    <button className="text-link" disabled={busy} onClick={() => chooseEdit(file)}>Ubah</button>
                    <button className="text-link admin-danger" disabled={busy} onClick={() => void mutate(file, "trash")}>Hapus</button>
                  </>}
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {!filtered.length && <p className="admin-empty">
        {trash ? "Sampah kosong." : "Belum ada media yang cocok."}
      </p>}
      <div className="admin-pagination"><p>Halaman {pagination.page} dari {pagination.pages}</p><div className="admin-actions"><button type="button" disabled={busy||pagination.page<=1} onClick={()=>void load(trash,pagination.page-1)}>Sebelumnya</button><button type="button" disabled={busy||pagination.page>=pagination.pages} onClick={()=>void load(trash,pagination.page+1)}>Berikutnya</button></div></div>
    </section>
  </>;
}
