export const newsImages = ["school.jpg", "classroom.jpg", "lab.jpg", "study-illustration.jpg"] as const;
export type NewsBlock = { type: "paragraph" | "heading"; text: string };
export type NewsInput = { title: string; slug: string; excerpt: string; category: string; image: string; alt: string; blocks: NewsBlock[] };

function text(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== "string" || value.includes("\u0000")) throw new Error(`${label} tidak valid.`);
  const result = value.trim();
  if (result.length < min || result.length > max) throw new Error(`${label} harus ${min}–${max} karakter.`);
  return result;
}

export function parseNewsInput(input: unknown): NewsInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Isi berita tidak valid.");
  const data = input as Record<string, unknown>;
  const title = text(data.title, "Judul", 10, 180);
  const slug = text(data.slug, "Slug", 3, 160);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Slug hanya boleh huruf kecil, angka, dan tanda hubung antar-kata.");
  const excerpt = text(data.excerpt, "Ringkasan", 20, 400);
  const category = text(data.category, "Kategori", 2, 60);
  const alt = text(data.alt, "Deskripsi gambar", 5, 250);
  if (typeof data.image !== "string" || (!newsImages.includes(data.image as typeof newsImages[number]) && !/^\/media\/[a-f0-9-]{36}$/.test(data.image))) throw new Error("Pilih gambar dari aset madrasah yang tersedia.");
  if (!Array.isArray(data.blocks) || !data.blocks.length || data.blocks.length > 40) throw new Error("Isi berita harus memiliki 1–40 blok.");
  const blocks: NewsBlock[] = data.blocks.map(block => {
    if (!block || typeof block !== "object" || !["paragraph", "heading"].includes(block.type)) throw new Error("Jenis blok berita tidak valid.");
    return { type: block.type, text: text(block.text, "Isi blok", 1, 5000) };
  });
  if (blocks.reduce((total, block) => total + block.text.length, 0) > 80000) throw new Error("Isi berita maksimal 80.000 karakter.");
  return { title, slug, excerpt, category, image: data.image, alt, blocks };
}
