"use client";
import { useState, useEffect } from "react";
import { homeGroups, copyLabels } from "@/lib/cms-editor";
import { cmsSchemas, type CmsPayload } from "@/lib/cms-validation";
import { CmsFields } from "./cms-fields";
export function HomeEditor({ value, onChange, errors = {}, pages = [] }: { value: CmsPayload; onChange: (v: CmsPayload) => void; errors?: Record<string, string>; pages?: { label: string; href: string }[] }) {
  const [section, setSection] = useState("beranda"), group = homeGroups.find(g => g.id === section)!;
  const schema = cmsSchemas.home.fields;
  useEffect(() => { const path = Object.keys(errors)[0]; if (path?.startsWith("copy.")) { const item = value.copy[Number(path.split(".")[1])]; const n = Number(item?.id.split("-")[1]); const target = homeGroups.find(g => n >= g.from && n <= g.to); if (target) setSection(target.id); } }, [errors]);
  const copy = value.copy.filter((item: CmsPayload) => { const n = Number(item.id.split("-")[1]); return n >= group.from && n <= group.to; });
  const cards = value.cards.filter((item: CmsPayload) => item.section === ({ fasilitas: "facility", prestasi: "achievement", "akses-informasi": "service" } as Record<string, string>)[section]);
  const cardGroup = ({ fasilitas: "facility", prestasi: "achievement", "akses-informasi": "service" } as Record<string, string>)[section];
  return <>
    <div className="admin-section-tabs" role="tablist" aria-label="Bagian beranda">
      {homeGroups.map(item => <button type="button" role="tab" id={`tab-${item.id}`} aria-controls="home-section-editor" aria-selected={section === item.id} key={item.id} onClick={() => setSection(item.id)}>
        {item.label}
      </button>)}
    </div>
    <section id="home-section-editor" role="tabpanel" aria-labelledby={`tab-${section}`}>
      <h2>
        {group.label}
      </h2>
      <p className="content-note">Isi bagian ini sesuai informasi resmi madrasah. Perubahan baru tampil setelah diterbitkan.</p>
      {section === "beranda" && <CmsFields fields={{ images: schema.images, quickLinks: schema.quickLinks }} value={value} errors={errors} pages={pages} onChange={onChange} />}
      <div className="admin-copy-fields">
        {copy.map((item: CmsPayload) => <label key={item.id}>
          {copyLabels[Number(item.id.split("-")[1]) - 1]}
          {" "}
          <span className="admin-required">*</span>
          <textarea data-field={`copy.${value.copy.indexOf(item)}.text`} aria-label={copyLabels[Number(item.id.split("-")[1]) - 1]} aria-invalid={!!errors[`copy.${value.copy.indexOf(item)}.text`]} required rows={item.text.length > 120 ? 3 : 2} value={item.text} onChange={e => onChange({ ...value, copy: value.copy.map((v: CmsPayload) => v.id === item.id ? { ...v, text: e.target.value } : v) })} />
          {errors[`copy.${value.copy.indexOf(item)}.text`]&&<small className="admin-field-error">{errors[`copy.${value.copy.indexOf(item)}.text`]}</small>}
        </label>)}
      </div>
      {cardGroup && <CmsFields key={cardGroup} fields={{ cards: { ...schema.cards, fields: Object.fromEntries(Object.entries(schema.cards.fields!).filter(([key]) => key !== "section")) } }} value={{ cards }} errors={errors} pages={pages} onChange={next => onChange({ ...value, cards: [...value.cards.filter((item: CmsPayload) => item.section !== cardGroup), ...next.cards.map((item: CmsPayload) => ({ ...item, section: cardGroup }))] })} />}
    </section>
    <details className="admin-panel admin-advanced">
      <summary>Pengaturan lanjutan: urutan dan gerak bagian</summary>
      <p className="content-note">Bagian utama tetap pertama. Profil dan kontak perlu tersedia agar tautan website tetap berfungsi.</p>
      <CmsFields fields={{ sections: schema.sections, example: schema.example }} value={value} onChange={onChange} />
    </details>
  </>;
}
