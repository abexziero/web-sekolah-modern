"use client";
import { useRef, useState } from "react";
import { imageUrl } from "@/lib/cms-validation";
type FileEntry = { id: string; mime: string; alt: string };
const localImages = [{ id: "school.jpg", alt: "Gerbang madrasah" }, { id: "classroom.jpg", alt: "Ruang kelas" }, { id: "lab.jpg", alt: "Laboratorium" }, { id: "study-illustration.jpg", alt: "Ilustrasi literasi" }, { id: "teacher-placeholder.svg", alt: "Ilustrasi guru" }, { id: "logo.png", alt: "Logo madrasah" }];
export function MediaPicker({ value, onChange, label = "Gambar", pdf = false, library = true }: { value: string; onChange: (value: string) => void; label?: string; pdf?: boolean; library?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null), [files, setFiles] = useState<FileEntry[]>([]), [error, setError] = useState(""), [busy, setBusy] = useState(false), [search, setSearch] = useState(""), upload = useRef<HTMLInputElement>(null), description = useRef<HTMLInputElement>(null);
  const [page,setPage]=useState(1),[pages,setPages]=useState(1);
  async function refresh(next=1) {
    setBusy(true); setError("");
    try { const query=new URLSearchParams({q:search,page:String(next),format:pdf?"pdf":"image"});const response = await fetch(`/api/admin/media?${query}`, { cache: "no-store" }), data = await response.json(); if(!response.ok) throw new Error(data.error); setFiles(data.rows);setPage(data.page);setPages(data.pages); }
    catch(e) { setError(e instanceof Error ? e.message : "Media gagal dimuat."); } finally { setBusy(false); }
  }
  function choose(next: string) { onChange(next); dialog.current?.close(); }
  async function add() {
    const file = upload.current?.files?.[0], alt = description.current?.value.trim();
    if(!file || !alt) { setError("Pilih file dan isi deskripsi terlebih dahulu."); return; }
    setBusy(true); setError("");
    try { const query = new URLSearchParams({ alt }), response = await fetch(`/api/admin/media?${query}`, { method: "POST", headers: { "content-type": file.type, "x-filename": encodeURIComponent(file.name) }, body: file }), data = await response.json(); if(!response.ok) throw new Error(data.error); choose(pdf ? data.id : data.url); }
    catch(e) { setError(e instanceof Error ? e.message : "Upload gagal."); } finally { setBusy(false); }
  }
  return <div className="admin-media-field">
    <span className="admin-field-label">
      {label}
    </span>
    {value && <div className="admin-picked-media">
      {pdf ? <a href={`/media/${value}`} target="_blank" rel="noopener noreferrer">Lihat PDF terpilih</a> : <img src={imageUrl(value)} alt="Gambar terpilih" width={180} height={110} />}
    </div>}
    <div className="admin-row-actions">
      <button type="button" className="button button-outline" onClick={() => { dialog.current?.showModal(); if(library) void refresh(); }}>
      {`${value ? "Ganti" : "Pilih"} ${pdf ? "PDF" : "gambar"}`}
      </button>
      {value && !pdf && <button type="button" className="text-link" onClick={() => onChange("")}>Kosongkan gambar</button>}
    </div>
    <dialog ref={dialog} className="admin-media-dialog" aria-label={`Pilih ${pdf ? "PDF" : "gambar"}`}>
      <div className="admin-dialog-heading">
        <h2>Perpustakaan {pdf ? "dokumen" : "gambar"}</h2>
        <button type="button" className="button button-outline" onClick={() => dialog.current?.close()}>Tutup</button>
      </div>
      <label>Cari media<input type="search" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void refresh();}}}/></label>{library&&<button type="button" className="button button-outline" disabled={busy} onClick={()=>void refresh()}>Cari seluruh media</button>}
      {error && <p role="alert" className="admin-error">
        {error}
      </p>}
      {busy && <p role="status">Memuat media…</p>}
      <div className="admin-media-grid">
        {!pdf && localImages.filter(f => f.alt.toLowerCase().includes(search.toLowerCase())).map(file => <button type="button" className="admin-media-choice" key={file.id} onClick={() => choose(file.id)} aria-pressed={value === file.id}>
          <img src={imageUrl(file.id)} alt="" width={160} height={100} />
          <span>
            {file.alt}
          </span>
        </button>)}
        {files.filter(f => (pdf ? f.mime === "application/pdf" : f.mime.startsWith("image/"))).map(file => <button type="button" className="admin-media-choice" key={file.id} onClick={() => choose(pdf ? file.id : `/media/${file.id}`)} aria-pressed={value.includes(file.id)}>
          {pdf ? <span className="admin-pdf-badge">PDF</span> : <img src={`/media/${file.id}`} alt="" width={160} height={100} loading="lazy" />}
          <span>
            {file.alt}
          </span>
        </button>)}
      </div>
      {library&&<div className="admin-pagination"><button type="button" disabled={busy||page<=1} onClick={()=>void refresh(page-1)}>Sebelumnya</button><span>{page} / {pages}</span><button type="button" disabled={busy||page>=pages} onClick={()=>void refresh(page+1)}>Berikutnya</button></div>}
      {!busy && !files.length && pdf && <p>Belum ada PDF. Unggah dokumen terlebih dahulu.</p>}
      {library && <details>
        <summary>Unggah {pdf ? "PDF" : "gambar"} baru</summary>
        <fieldset disabled={busy}>
          <label>File baru<input ref={upload} type="file" accept={pdf ? "application/pdf" : "image/jpeg,image/png,image/webp"} /></label>
          <label>Deskripsi file<input ref={description} maxLength={250} /></label>
          <p className="content-note">Gambar maksimal 5 MiB, PDF 10 MiB. File privat hingga konten diterbitkan.</p>
          <button type="button" className="button" onClick={() => void add()}>Unggah dan gunakan</button>
        </fieldset>
      </details>}
    </dialog>
  </div>;
}
