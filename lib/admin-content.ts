export const contentModules = [
  { type: "home", label: "Beranda" }, { type: "page", label: "Halaman" }, { type: "teacher", label: "Guru" }, { type: "event", label: "Kegiatan" },
  { type: "album", label: "Galeri" }, { type: "document", label: "Dokumen" }, { type: "announcement", label: "Pengumuman" }, { type: "faq", label: "FAQ" },
  { type: "navigation", label: "Menu website" }, { type: "settings", label: "Pengaturan" },
];
export const statusLabels: Record<string, string> = { draft: "Draft", review: "Dalam tinjauan", published: "Terbit", archived: "Arsip" };
export function contentSlug(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120).replace(/-$/g, "");
}
export function toWitaInput(value: string) { return value ? new Date(new Date(value).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16) : ""; }
export function fromWitaInput(value: string) { return value ? new Date(`${value}+08:00`).toISOString() : ""; }
