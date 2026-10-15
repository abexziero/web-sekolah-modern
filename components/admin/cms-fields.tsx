"use client";
import { MediaPicker } from "./media-picker";
import { sectionIds, type CmsPayload, type Field } from "@/lib/cms-validation";
import { contentSlug, toWitaInput, fromWitaInput } from "@/lib/admin-content";
import { useState } from "react";
import { schoolPages } from "@/lib/school-pages";
import { homeGroups } from "@/lib/cms-editor";
export function emptyFields(fields: Record<string, Field>): CmsPayload {
  return Object.fromEntries(Object.entries(fields).map(([key, f]) => [key, f.type === "list" ? [] : f.type === "boolean" ? true : f.type === "number" ? 0 : f.type === "select" ? f.options![0] : ""]));
}
const optionLabels: Record<string, string> = { paragraph: "Paragraf", heading: "Subjudul", default: "Animasi utama", reveal: "Muncul saat scroll", none: "Tanpa animasi", facility: "Fasilitas", service: "Layanan", achievement: "Prestasi", quick: "Akses cepat", info: "Informasi" };
export function CmsFields({ fields, value, onChange, errors = {}, prefix = "", pages = [] }: { fields: Record<string, Field>; value: CmsPayload; onChange: (v: CmsPayload) => void; errors?: Record<string, string>; prefix?: string; pages?: { label: string; href: string }[] }) {
  const [undo, setUndo] = useState<{ key: string; item: CmsPayload; index: number } | null>(null);
  return <>

    {Object.entries(fields).map(([key, field]) => {
      const input = value[key];
      const path = prefix ? `${prefix}.${key}` : key, error = errors[path];
      const attrs = { "aria-label": field.label, "data-field": path, "aria-invalid": !!error, required: field.required !== false, "aria-describedby": error ? `error-${path}` : undefined };
      const update = (next: unknown) => onChange({ ...value, [key]: next, ...(key === "title" && fields.id && !value.id ? { id: contentSlug(String(next)) } : {}) });
      if (key === "id") return !input && field.label === "ID section" ? <label key={key}>Section<select value={input || ""} onChange={e => update(e.target.value)}>

        <option value="">Pilih section</option>

        {sectionIds.map(id => <option key={id} value={id}>

          {id}

        </option>)}

      </select></label> : null;
      if (key === "mediaId") return <MediaPicker key={key} label="Dokumen PDF" pdf value={input || ""} onChange={update} />;
      if (field.type === "list") {
        const items: CmsPayload[] = input || [], fixed = key === "copy" || key === "images";
        return <details className="admin-panel" key={key} open={key === "blocks" || key === "sections"}>

          <summary>{field.label} ({items.length})</summary>

          {fixed && <p className="content-note">Ubah isi pada posisi yang tersedia. Hubungan dengan tampilan website tetap terjaga.</p>}

          {items.map((item, index) => <details className="cms-list-item" key={index} open={key === "blocks" || key === "sections"}>

            <summary>

              {String(homeGroups.find(g => g.id === item.id)?.label || item.title || item.text || item.label || item.question || item.alt || item.id || `${field.label} ${index + 1}`).slice(0, 90)}

            </summary>

            <fieldset>

              <CmsFields fields={field.fields!} value={item} errors={errors} prefix={`${path}.${index}`} pages={pages} onChange={next => update(items.map((v, i) => i === index ? next : v))} />

              {!fixed && <div className="admin-actions">

                <button type="button" disabled={!index || (key === "sections" && index === 1)} onClick={() => { const next = [...items];[next[index - 1], next[index]] = [next[index], next[index - 1]]; update(next); }}>Naik</button>

                <button type="button" disabled={index === items.length - 1 || (key === "sections" && index === 0)} onClick={() => { const next = [...items];[next[index + 1], next[index]] = [next[index], next[index + 1]]; update(next); }}>Turun</button>

                <button type="button" disabled={key === "sections" && ["beranda", "profil", "kontak"].includes(item.id)} onClick={() => { setUndo({ key, item: structuredClone(item), index }); update(items.filter((_, i) => i !== index)); }}>Hapus item</button>

              </div>}

            </fieldset>

          </details>)}

          {undo?.key === key && <p role="status">Item dihapus. <button type="button" className="text-link" onClick={() => { const next = [...items]; next.splice(undo.index, 0, undo.item); update(next); setUndo(null); }}>Batalkan penghapusan</button></p>}

          {!fixed && <button type="button" className="button button-outline" disabled={items.length >= (field.max || 40)} onClick={() => {const next=emptyFields(field.fields!);if(field.fields?.id&&field.fields.id.label!=="ID section")next.id=`item-${crypto.randomUUID()}`;update([...items,next]);}}>Tambah {field.label}</button>}

        </details>;
      }
      if (field.type === "boolean") return <label key={key}>

        <span>

          <input type="checkbox" checked={!!input} onChange={e => update(e.target.checked)} />

          {field.label}

        </span>

      </label>;
      if (field.type === "textarea") return <label key={key}>

        {field.label}
        {field.required !== false && <span aria-hidden="true"> *</span>}

        <textarea {...attrs} value={input || ""} rows={3} maxLength={field.max} onChange={e => update(e.target.value)} />

        {error && <small id={`error-${path}`} className="admin-field-error">
          {error}
        </small>}

      </label>;
      if (field.type === "select") return <label key={key}>

        {field.label}

        <select {...attrs} value={input || field.options![0]} onChange={e => update(e.target.value)}>

          {field.options?.map(option => <option key={option} value={option}>

            {optionLabels[option] || option}

          </option>)}

        </select>

      </label>;
      if (field.type === "image") return <MediaPicker key={key} label={field.label} value={input || ""} onChange={update} />;
      if (key === "href") return <label key={key}>Halaman tujuan<select {...attrs} aria-label="Halaman tujuan" value={input || ""} onChange={e => update(e.target.value)}>
        <option value="">Pilih halaman</option>
        {[...new Map([...homeGroups.map(g => ({ label: `Beranda — ${g.label}`, href: `/#${g.id}` })), ...schoolPages.map(p => ({ label: p.title, href: `/${p.area}/${p.slug}` })), ...pages].map(p => [p.href, p])).values()].map(p => <option value={p.href} key={p.href}>
          {p.label}
        </option>)}
        {input && !input.startsWith("/#") && !pages.some(p => p.href === input) && !schoolPages.some(p => `/${p.area}/${p.slug}` === input) && <option value={input}>Tujuan tersimpan: {input}</option>}
      </select><small>Halaman harus diterbitkan sebelum tautannya ditampilkan.</small>{error && <small id={`error-${path}`} className="admin-field-error">
        {error}
      </small>}</label>;
      if (key === "area" || key === "section") return <details key={key}>
        <summary>Pengaturan kelompok</summary>
        <label>
          {field.label}
          <input {...attrs} value={input || ""} onChange={e => update(e.target.value)} />
        </label>
      </details>;
      const date = field.type === "datetime";
      let display = input ?? "";
      if (date) display = toWitaInput(input || "");
      return <label key={key}>

        {field.label}
        {field.required !== false && <span aria-hidden="true"> *</span>}

        {date ? " (WITA)" : ""}

        <input {...attrs} type={date ? "datetime-local" : field.type === "number" ? "number" : field.type === "email" ? "email" : "text"} value={display} min={field.type === "number" ? 0 : undefined} max={field.type === "number" ? field.max : undefined} maxLength={field.max} onChange={e => update(date ? fromWitaInput(e.target.value) : field.type === "number" ? Number(e.target.value) : e.target.value)} />

        {key === "alt" && <small>Contoh: Siswa membaca bersama di perpustakaan. Jelaskan isi foto secara singkat.</small>}

        {error && <small id={`error-${path}`} className="admin-field-error">
          {error}
        </small>}

      </label>;
    })}

  </>;
}
