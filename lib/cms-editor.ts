import { cmsSchemas, type CmsPayload, type Field } from "./cms-validation.ts";
export const homeGroups = [
  { id: "beranda", label: "Foto & Judul", from: 1, to: 11 },
  { id: "pengumuman", label: "Pengumuman", from: 12, to: 12 },
  { id: "profil", label: "Profil", from: 13, to: 29 },
  { id: "informasi", label: "Berita", from: 30, to: 36 },
  { id: "fasilitas", label: "Fasilitas", from: 37, to: 40 },
  { id: "galeri", label: "Galeri", from: 41, to: 43 },
  { id: "agenda", label: "Kegiatan", from: 44, to: 47 },
  { id: "prestasi", label: "Prestasi", from: 48, to: 51 },
  { id: "akses-informasi", label: "Layanan", from: 52, to: 58 },
  { id: "kontak", label: "Kontak", from: 59, to: 69 },
];
export const copyLabels = ["Nama madrasah di bagian atas", "Judul utama baris pertama", "Judul utama baris kedua", "Pengantar utama", "Tombol pengenalan", "Tombol kontak", "Ajakan mengenal sekolah", "Telepon di foto utama", "Lokasi singkat", "Penanda pratinjau", "Penjelasan konten contoh", "Judul pengumuman", "Label profil", "Judul profil", "Nama sekolah", "Pengantar profil", "Tombol profil", "Judul visi dan misi", "Pengantar visi", "Tombol visi dan misi", "Catatan visi contoh", "Judul struktur organisasi", "Pengantar struktur", "Tombol struktur", "Judul guru", "Pengantar guru", "Tombol sambutan", "Tombol sejarah", "Tombol daftar guru", "Judul berita", "Pengantar berita", "Catatan artikel contoh", "Tombol semua berita", "Tautan pengumuman", "Tautan agenda", "Tautan galeri", "Judul fasilitas", "Pengantar fasilitas", "Tombol fasilitas", "Pemisah keterangan fasilitas", "Judul galeri", "Pengantar galeri", "Keterangan foto", "Judul agenda", "Pengantar agenda", "Catatan agenda contoh", "Tombol agenda", "Judul prestasi", "Pengantar prestasi", "Catatan prestasi contoh", "Tombol prestasi", "Judul layanan", "Pengantar layanan", "Catatan layanan contoh", "Tombol program", "Judul unduhan", "Tombol dokumen", "Judul tanya jawab", "Label kontak", "Judul kontak", "Pengantar kontak", "Tombol WhatsApp", "Label alamat", "Alamat baris pertama", "Alamat baris kedua", "Label telepon", "Nomor telepon", "Label email", "Alamat email"];
export const collectionPaths: Record<string, string> = { teacher: "/profil/guru-tenaga-kependidikan", event: "/informasi/agenda", album: "/informasi/galeri", document: "/layanan/unduhan", faq: "/layanan/faq", announcement: "/informasi/pengumuman" };
export function publicContentPath(type: string, key: string) { return type === "page" ? `/${key}` : collectionPaths[type] || "/"; }
export function editorTitle(type: string, payload?: CmsPayload) {
  const names: Record<string, string> = { home: "Beranda", page: payload?.title || "halaman", teacher: "data guru", event: "kegiatan", album: "album galeri", document: "dokumen", announcement: "pengumuman", faq: "tanya jawab", navigation: "menu website", settings: "identitas dan kontak" };
  return names[type] || "konten";
}
export function cmsFieldErrors(type: string, payload: CmsPayload) {
  const errors: Record<string, string> = {};
  function inspect(fields: Record<string, Field>, value: CmsPayload, prefix = "") {
    for (const [key, field] of Object.entries(fields)) {
      const path = prefix ? `${prefix}.${key}` : key, input = value?.[key];
      if (field.type === "list") { if (Array.isArray(input)) input.forEach((item, index) => inspect(field.fields!, item, `${path}.${index}`)); continue; }
      if (field.type === "boolean") continue;
      if (field.type === "number") { if (!Number.isSafeInteger(input) || input < 0 || input > (field.max || 10000)) errors[path] = `Isi ${field.label.toLowerCase()} sesuai batas.`; continue; }
      const text = String(input ?? "").trim();
      if (!text && field.required !== false) errors[path] = `${field.label} wajib diisi.`;
      else if (text.length > (field.max || 500)) errors[path] = `Maksimal ${field.max || 500} karakter.`;
      else if (text && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) errors[path] = "Isi alamat email yang lengkap.";
    }
  }
  if (cmsSchemas[type]) inspect(cmsSchemas[type].fields, payload);
  return errors;
}
export function focusCmsError(form: HTMLFormElement, path: string) {
  const field = [...form.querySelectorAll<HTMLElement>("[data-field]")].find(el => el.dataset.field === path);
  if (!field) return;
  let parent = field.parentElement; while (parent) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; }
  field.focus(); field.scrollIntoView({ block: "center" });
}
