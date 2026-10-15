"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MediaPicker } from "./media-picker";
import { useUnsavedChanges } from "./use-unsaved-changes";
import { contentSlug } from "@/lib/admin-content";
import { useEditorDraft } from "./use-editor-draft";
import { EditorPreview } from "./editor-preview";
import { parseNewsInput } from "@/lib/news-validation";
import { saveNewsDraft } from "@/app/admin/berita/actions";
import { editNews } from "@/app/admin/berita/actions";
import { type NewsInput, type NewsBlock } from "@/lib/news-validation";

export type ManagedArticle = NewsInput & { id: string; version: number; status: string; published_at: string | Date | null; history: { id: string; title: string; revision_number: number; created_at: string | Date; saved_by_name: string }[] };
export function NewsForm({ article, role, operatorId }: { article?: ManagedArticle; role: string; operatorId: string }) {
  const [draft, setDraft] = useState<NewsInput>(article ? { title: article.title, slug: article.slug, excerpt: article.excerpt, category: article.category, image: article.image, alt: article.alt, blocks: article.blocks } : { title: "", slug: "", excerpt: "", category: "", image: "classroom.jpg", alt: "", blocks: [{ type: "paragraph", text: "" }] });

  const [state, action, pending] = useActionState(editNews, { error: "" });
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [undo, setUndo] = useState<{ block: NewsBlock; index: number } | null>(null);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state]);
  const editor = useEditorDraft({ storageKey: `annur:news:${operatorId}:${article?.id || "new"}`, version: article?.version || 0, data: draft, onRecover: setDraft, locked: pending || article?.status === "review", valid: value => { try { parseNewsInput(value); return true; } catch { return false; } }, save: article ? (input, version) => saveNewsDraft({ id: article.id, version, input }) : undefined });
  const dirty = editor.dirty, status = article && editor.version > article.version ? "draft" : article?.status || "draft";
  useUnsavedChanges(dirty, pending || editor.busy);
  const locked = article?.status === "review";
  const admin = role === "super_admin";
  const workflowDisabled = pending || editor.busy || dirty || !article;
  function change(field: "title" | "slug" | "excerpt" | "category" | "alt", value: string) { setDraft(previous => ({ ...previous, [field]: value, ...(field === "title" && !article && (!previous.slug || previous.slug === contentSlug(previous.title)) ? { slug: contentSlug(value) } : {}) })); }
  function blocks(next: NewsBlock[]) { setDraft(previous => ({ ...previous, blocks: next })); }
  function move(index: number, direction: number) { const next = [...draft.blocks];[next[index], next[index + direction]] = [next[index + direction], next[index]]; blocks(next); }
  function removeBlock(index: number) { setUndo({ block: structuredClone(draft.blocks[index]), index }); blocks(draft.blocks.filter((_, i) => i !== index)); }
  useEffect(() => { if (!article) return; try { const storage = `annur:news:${operatorId}:new`, raw = sessionStorage.getItem(storage); if (raw && JSON.stringify(parseNewsInput(JSON.parse(raw).data)) === JSON.stringify(parseNewsInput(article))) sessionStorage.removeItem(storage); } catch { } }, []);
  return <form action={action} className="admin-form admin-assisted-editor" aria-busy={pending}>

    <input type="hidden" name="id" value={article?.id || ""} />
    <input type="hidden" name="version" value={editor.version} />
    <input type="hidden" name="blocks" value={JSON.stringify(draft.blocks)} />

    <p className="admin-editor-feedback" role="status">
      {editor.busy ? "Menyimpan perubahan..." : editor.message}
    </p>
    {editor.recovery && <div className="admin-unsaved">
      <p>Ditemukan isian sementara.</p>
      <button type="button" onClick={editor.recover}>Pulihkan isian</button>
      <button type="button" onClick={editor.discard}>Abaikan isian</button>
    </div>}
    {editor.error && <p role="alert" className="admin-error">
      {editor.error}
      <button type="button" onClick={editor.retry}>Coba lagi</button>
    </p>}
    {state.error && <p ref={errorRef} tabIndex={-1} className="admin-error" role="alert">
      {state.error}
    </p>}

    <div className="admin-editor-grid">
      <div className="admin-panel">
        <fieldset disabled={pending || locked}>
          <legend className="sr-only">Isi berita</legend>

          <label>Judul<input name="title" required minLength={10} maxLength={180} value={draft.title} onChange={event => change("title", event.target.value)} /></label>

          <label>Alamat berita<input name="slug" required minLength={3} maxLength={160} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.slug} readOnly={!!article?.published_at} onChange={event => change("slug", event.target.value)} aria-describedby="slug-hint" /></label>
          <p id="slug-hint" className="content-note">Contoh: kegiatan-literasi. Alamat tidak dapat diubah setelah berita pernah terbit.</p>

          <label>Ringkasan<textarea name="excerpt" required minLength={20} maxLength={400} rows={3} value={draft.excerpt} onChange={event => change("excerpt", event.target.value)} /></label>

          <label>Kategori<input name="category" required minLength={2} maxLength={60} value={draft.category} onChange={event => change("category", event.target.value)} /></label>

          <div className="admin-field-grid">
            <div>
              <input type="hidden" name="image" value={draft.image} />
              <MediaPicker value={draft.image} library={admin} onChange={image => { setDraft({ ...draft, image }); }} />
            </div>
            <label>Deskripsi gambar<input name="alt" required minLength={5} maxLength={250} value={draft.alt} onChange={event => change("alt", event.target.value)} /></label>
          </div>

          <p className="content-note">Gambar dipilih dari aset yang tersedia. Foto literasi merupakan ilustrasi; kredit sumber ditampilkan otomatis.</p>

          <div className="admin-block-heading">
            <h2>Isi artikel</h2>
            <span>{draft.blocks.length}/40 blok</span>
          </div>

          {draft.blocks.map((block, index) => <div className="admin-block" key={index}>
            <div className="admin-block-tools">
              <label className="sr-only" htmlFor={`type-${index}`}>Jenis blok {index + 1}</label>
              <select id={`type-${index}`} value={block.type} onChange={event => blocks(draft.blocks.map((item, i) => i === index ? { ...item, type: event.target.value as NewsBlock["type"] } : item))}>
                <option value="paragraph">Paragraf {index + 1}</option>
                <option value="heading">Subjudul {index + 1}</option>
              </select>
              <button type="button" className="text-link" disabled={index === 0} aria-label={`Naikkan blok ${index + 1}`} onClick={() => move(index, -1)}>Naik</button>
              <button type="button" className="text-link" disabled={index === draft.blocks.length - 1} aria-label={`Turunkan blok ${index + 1}`} onClick={() => move(index, 1)}>Turun</button>
              <button type="button" className="text-link" disabled={draft.blocks.length === 1} aria-label={`Hapus blok ${index + 1}`} onClick={() => removeBlock(index)}>Hapus</button>
            </div>
            <label className="sr-only" htmlFor={`block-${index}`}>Isi blok {index + 1}</label>
            <textarea id={`block-${index}`} required maxLength={5000} rows={block.type === "heading" ? 2 : 5} value={block.text} onChange={event => blocks(draft.blocks.map((item, i) => i === index ? { ...item, text: event.target.value } : item))} />
          </div>)}

          {undo && <p role="status">Paragraf dihapus. <button type="button" onClick={() => { const next = [...draft.blocks]; next.splice(undo.index, 0, undo.block); blocks(next); setUndo(null); }}>Batalkan penghapusan</button></p>}
          <div className="admin-actions">
            <button type="button" className="button button-outline" disabled={draft.blocks.length >= 40} onClick={() => blocks([...draft.blocks, { type: "paragraph", text: "" }])}>Tambah paragraf</button>
            <button type="button" className="button button-outline" disabled={draft.blocks.length >= 40} onClick={() => blocks([...draft.blocks, { type: "heading", text: "" }])}>Tambah subjudul</button>
          </div>

          <p className="content-note">Maksimal 5.000 karakter per blok dan 80.000 karakter keseluruhan. HTML ditampilkan sebagai teks.</p>

        </fieldset>
      </div>
      <section className="admin-panel admin-workflow" aria-labelledby="workflow-heading">
        <p className="eyebrow">Alur publikasi</p>
        <h2 id="workflow-heading">
          {({ draft: "Draft", review: "Dalam tinjauan", published: "Sudah terbit", archived: "Diarsipkan" } as Record<string, string>)[status]}
        </h2>
        <p>Draft → tinjauan → terbit. Hanya Super Admin yang dapat menerbitkan.</p>
        {article?.published_at && <p className="content-note">Suntingan draft tidak mengganti versi publik sampai diterbitkan kembali.</p>}
        {dirty && <p role="status" className="admin-unsaved">Ada perubahan belum disimpan. Simpan draft sebelum melanjutkan alur.</p>}

        <div className="admin-actions admin-actions-column admin-mobile-actions">
          <button className="button" name="intent" value="save" disabled={pending || editor.busy || locked}>
            {pending || editor.busy ? "Memproses…" : "Simpan draft"}
          </button>
          {article && <>
            <Link href={`/admin/berita/${article.id}/preview`} className="text-link" aria-disabled={dirty} tabIndex={dirty ? -1 : undefined}>Preview draft tersimpan</Link>
            {status==="draft"&&<button className="button button-outline" name="intent" value="submit" disabled={workflowDisabled}>Ajukan tinjauan</button>}
            {admin && <>
              {locked&&<><button className="button" name="intent" value="publish" disabled={workflowDisabled}>Terbitkan versi ini</button>
              <button className="button button-outline" name="intent" value="return" disabled={workflowDisabled}>Kembalikan ke draft</button></>}
              <button className="text-link admin-danger" name="intent" value="archive" disabled={workflowDisabled || status === "archived"} onClick={event => { if (!window.confirm("Arsipkan berita? Berita tidak lagi tersedia untuk pengunjung.")) event.preventDefault(); }}>Arsipkan berita</button>
            </>}
          </>}
        </div>

        {article && <EditorPreview href={`/admin/berita/${article.id}/preview`} version={editor.version} disabled={dirty || pending || editor.busy} />}

        {article && <details className="admin-history">
          <summary>Riwayat revisi ({article.history.length})</summary>
          <label>Pulihkan sebagai draft<select name="revisionId" disabled={pending || locked}>
            {article.history.map(item => <option key={item.id} value={item.id}>Revisi{item.revision_number} · {item.saved_by_name} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Makassar" }).format(new Date(item.created_at))}</option>)}
          </select></label>
          <button className="button button-outline" name="intent" value="restore" disabled={workflowDisabled || locked}>Pulihkan revisi</button>
          <p className="content-note">Pemulihan membuat draft baru; tidak langsung mengubah konten publik.</p>
        </details>}

      </section>
    </div>

  </form>;
}
