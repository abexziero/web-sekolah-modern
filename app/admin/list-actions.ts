"use server";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCmsService } from "@/lib/server/cms";
import { getNewsService } from "@/lib/server/news";
import { CmsError } from "@/lib/server/cms-core.mjs";
import { NewsError } from "@/lib/server/news-core.mjs";
export async function changeListEntry(_state: { error: string; success: string }, form: FormData) {
  try {
    const kind = String(form.get("kind")), action = String(form.get("intent"));
    if (!["cms", "news"].includes(kind) || !["trash", "untrash"].includes(action)) return { error: "Aksi tidak valid.", success: "" };
    await (kind === "cms" ? getCmsService() : getNewsService()).transition(await headers(), { id: String(form.get("id")), version: Number(form.get("version")), action });
    revalidateTag(kind === "cms" ? "school-cms" : "school-news", { expire: 0 }); revalidatePath("/", "layout");
    return { error: "", success: action === "trash" ? "Konten dipindahkan ke Sampah." : "Konten dipulihkan sebagai draft." };
  } catch (error) { return { error: error instanceof CmsError || error instanceof NewsError ? error.message : "Perubahan gagal. Muat ulang dan coba kembali.", success: "" }; }
}
