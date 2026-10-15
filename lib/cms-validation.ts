import { defaultHome } from "./cms-defaults.ts";
import { sitePath } from "./site-path.ts";
export type CmsPayload = Record<string, any>;
export type Field = {
    label: string;
    type?: "text" | "textarea" | "boolean" | "number" | "image" | "url" | "email" | "datetime" | "select" | "list";
    max?: number;
    required?: boolean;
    options?: string[];
    fields?: Record<string, Field>;
};
const text = (label: string, max = 180, required = true): Field => ({ label, max, required });
const area = (label: string, max = 5000): Field => ({ ...text(label, max), type: "textarea" });
const image: Field = { label: "Gambar", type: "image", required: false };
const blocks: Field = { label: "Isi bacaan", type: "list", max: 40, fields: { type: { label: "Jenis", type: "select", options: ["paragraph", "heading"] }, text: area("Teks") } };
const example: Field = { label: "Konten contoh / belum disahkan", type: "boolean" };
const order: Field = { label: "Urutan", type: "number" };
const media: Field = { label: "ID media", required: false, max: 36 };
export const cmsSchemas: Record<string, {
    label: string;
    fields: Record<string, Field>;
}> = {
    page: { label: "Halaman", fields: { title: text("Judul"), description: area("Ringkasan", 400), image, alt: text("Teks alternatif", 250, false), blocks, example } },
    settings: { label: "Identitas & kontak", fields: { name: text("Nama madrasah"), shortName: text("Nama singkat"), caption: text("Keterangan identitas"), address: area("Alamat", 500), location: text("Lokasi singkat"), phone: text("Telepon", 30), email: { label: "Email", type: "email" }, whatsapp: { label: "WhatsApp (https://wa.me/...)", type: "url" }, map: { label: "Tautan peta", type: "url", required: false }, logo: { ...image, label: "Logo madrasah" }, footerNote: text("Catatan footer", 400, false), social: { label: "Media sosial", type: "list", max: 8, fields: { label: text("Nama"), url: { label: "URL", type: "url" } } }, example } },
    navigation: { label: "Menu website", fields: { items: { label: "Menu utama", type: "list", max: 7, fields: { label: text("Label", 60), href: text("URL internal atau /#anchor", 180, false), area: text("Kelompok URL", 40, false), section: text("ID section", 160, false), visible: { label: "Tampilkan", type: "boolean" }, children: { label: "Submenu", type: "list", max: 12, fields: { label: text("Label", 60), href: text("URL internal", 180), group: text("Kelompok submenu", 60, false), visible: { label: "Tampilkan", type: "boolean" } } } } }, example } },
    home: { label: "Beranda", fields: { title: text("Nama konfigurasi"), copy: { label: "Teks beranda", type: "list", max: 150, fields: { id: text("ID teks", 80), text: area("Teks") } }, images: { label: "Gambar beranda", type: "list", max: 20, fields: { id: text("ID gambar", 80), image, alt: text("Teks alternatif", 250, false) } }, sections: { label: "Urutan bagian halaman", type: "list", max: 20, fields: { id: text("ID section", 80), visible: { label: "Tampilkan", type: "boolean" }, animation: { label: "Animasi", type: "select", options: ["default", "reveal", "none"] } } }, example } },
    teacher: { label: "Guru & tenaga kependidikan", fields: { name: text("Nama"), role: text("Jabatan"), description: area("Profil singkat", 2000), image, alt: text("Teks alternatif", 250, false), order, example } },
    announcement: { label: "Pengumuman", fields: { title: text("Judul"), description: area("Ringkasan", 400), pinned: { label: "Sematkan", type: "boolean" }, expiresAt: { label: "Berakhir", type: "datetime", required: false }, blocks, example } },
    event: { label: "Agenda", fields: { title: text("Judul"), description: area("Deskripsi", 2000), startsAt: { label: "Mulai", type: "datetime" }, endsAt: { label: "Selesai", type: "datetime", required: false }, location: text("Lokasi"), example } },
    album: { label: "Galeri", fields: { title: text("Judul album"), items: { label: "Foto", type: "list", max: 40, fields: { image, alt: text("Teks alternatif", 250), caption: text("Caption", 400, false), credit: text("Kredit foto", 250, false) } }, example } },
    document: { label: "Dokumen", fields: { title: text("Judul"), category: text("Kategori", 60), description: area("Deskripsi", 400), mediaId: { ...media, required: true }, example } },
    faq: { label: "FAQ", fields: { question: text("Pertanyaan"), answer: area("Jawaban"), order, example } }
};
cmsSchemas.home.fields.images.fields!.focalX={label:"Titik fokus horizontal (0-100)",type:"number",max:100};
cmsSchemas.home.fields.images.fields!.focalY={label:"Titik fokus vertikal (0-100)",type:"number",max:100};
export const sectionIds = ["beranda", "pengumuman", "profil", "informasi", "fasilitas", "galeri", "agenda", "prestasi", "akses-informasi", "kontak"];
cmsSchemas.home.fields.cards = { label: "Kartu fasilitas, layanan dan prestasi", type: "list", max: 40, fields: { id: text("ID kartu", 80), section: { label: "Kelompok", type: "select", options: ["facility", "service", "achievement"] }, title: text("Judul"), description: area("Deskripsi", 2000), image, alt: text("Teks alternatif", 250, false), href: text("URL internal", 180) } };
cmsSchemas.home.fields.quickLinks = { label: "Akses cepat dalam hero", type: "list", max: 4, fields: { label: text("Label"), href: text("URL internal", 180) } };
cmsSchemas.settings.fields.footerLinks = { label: "Tautan footer", type: "list", max: 20, fields: { group: { label: "Kolom", type: "select", options: ["quick", "info"] }, label: text("Label"), href: text("URL internal", 180) } };
const assets = ["school.jpg", "classroom.jpg", "lab.jpg", "study-illustration.jpg", "teacher-placeholder.svg", "logo.png"];
export function imageUrl(value: string) {
    return sitePath(value?.startsWith("/media/") ? value : `/images/${assets.includes(value) ? value : "school.jpg"}`);
}
export function parseCmsInput(type: string, value: unknown): CmsPayload {
    const schema = cmsSchemas[type];
    if (!schema || !value || typeof value !== "object" || Array.isArray(value))
        throw new Error("Jenis atau isi konten tidak valid.");
    let total = 0;
    function parse(fields: Record<string, Field>, input: CmsPayload): CmsPayload {
        return Object.fromEntries(Object.entries(fields).map(([key, field]) => {
            const raw = input[key];
            let result: unknown;
            if (field.type === "list") {
                if (!Array.isArray(raw) || raw.length > (field.max || 40))
                    throw new Error(`${field.label}: jumlah item tidak valid.`);
                result = raw.map(item => {
                    if (!item || typeof item !== "object" || Array.isArray(item))
                        throw new Error("Item tidak valid.");
                    return parse(field.fields!, item);
                });
            }
            else if (field.type === "boolean") {
                if (typeof raw !== "boolean")
                    throw new Error(`${field.label} harus dipilih.`);
                result = raw;
            }
            else if (field.type === "number") {
                if (!Number.isSafeInteger(raw) || raw < 0 || raw > (field.max || 10000))
                    throw new Error(`${field.label} tidak valid.`);
                result = raw;
            }
            else {
                if (raw != null && typeof raw !== "string")
                    throw new Error(`${field.label} harus teks.`);
                const s = String(raw || "").trim();
                if (key === "mediaId" && s && !/^[a-f0-9-]{36}$/.test(s))
                    throw new Error("ID media tidak valid.");
                if (key === "href" && s && !/^(?:\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?)?(?:#[a-z0-9-]+)?$/.test(s))
                    throw new Error("Tautan internal tidak valid.");
                if ((!s && field.required !== false) || s.length > (field.max || 500) || /\0|<\/?[a-z][^>]*>/i.test(s))
                    throw new Error(`${field.label}: teks kosong, terlalu panjang atau mengandung HTML.`);
                if (s && field.type === "select" && !field.options?.includes(s))
                    throw new Error(`${field.label} tidak valid.`);
                if (s && field.type === "image" && !assets.includes(s) && !/^\/media\/[a-f0-9-]{36}$/.test(s))
                    throw new Error("Gambar tidak valid.");
                if (s && field.type === "url") {
                    let u;
                    try {
                        u = new URL(s);
                    }
                    catch {
                        throw new Error("URL tidak valid.");
                    }
                    if (u.protocol !== "https:" || u.username || u.password)
                        throw new Error("URL wajib HTTPS tanpa kredensial.");
                }
                if (s && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
                    throw new Error("Email tidak valid.");
                if (s && field.type === "datetime" && (!/Z$|[+-]\d\d:\d\d$/.test(s) || !Number.isFinite(Date.parse(s))))
                    throw new Error("Tanggal wajib memiliki zona waktu.");
                total += s.length;
                result = s;
            }
            return [key, result];
        }));
    }
    const clean = parse(schema.fields, value as CmsPayload);
    if (total > 80000)
        throw new Error("Isi terlalu panjang (maksimal80.000karakter).");
    if (type === "home") {
        if (defaultHome.copy.some(item => !clean.copy.some((v: CmsPayload) => v.id === item.id)) || clean.copy.some((item: CmsPayload) => !defaultHome.copy.some(v => v.id === item.id)))
            throw new Error("ID teks beranda harus mengikuti konten awal. Ubah isinya, bukan ID-nya.");
        const ids = clean.sections.map((s: CmsPayload) => s.id);
        if (ids[0] !== "beranda" || !clean.sections[0].visible || !clean.sections.some((s: CmsPayload) => s.id === "kontak" && s.visible) || ids.some((id: string) => !sectionIds.includes(id)) || new Set(ids).size !== ids.length)
            throw new Error("Hero harus pertama, kontak wajib tersedia, dan ID section harus unik/terdaftar.");
        for (const list of [clean.copy, clean.images])
            if (new Set(list.map((v: CmsPayload) => v.id)).size !== list.length)
                throw new Error("ID konten harus unik.");
    }
    if (type === "event" && clean.endsAt && Date.parse(clean.endsAt) < Date.parse(clean.startsAt))
        throw new Error("Waktu selesai harus setelah mulai.");
    if (type === "navigation") {
        if (clean.items.some((item: CmsPayload) => item.visible && !item.href && !item.children.some((child: CmsPayload) => child.visible)))
            throw new Error("Menu aktif harus memiliki tujuan atau submenu.");
        if (new Set(clean.items.map((item: CmsPayload) => item.label)).size !== clean.items.length)
            throw new Error("Label menu utama harus unik.");
        const links = clean.items.flatMap((i: CmsPayload) => [i.href, ...i.children.map((c: CmsPayload) => c.href)]).filter(Boolean);
        if (links.some((url: string) => !/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?(?:#[a-z0-9-]+)?$/.test(url)))
            throw new Error("Menu harus memakai URL internal yang valid.");
        if (!clean.items.some((i: CmsPayload) => i.visible && i.href === "/#beranda") || !clean.items.some((i: CmsPayload) => i.visible && i.href === "/#kontak"))
            throw new Error("Menu Beranda dan Kontak wajib tersedia.");
    }
    return clean;
}
