"use server";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireOperator } from "@/lib/server/auth";
import { getNewsService } from "@/lib/server/news";
import { NewsError } from "@/lib/server/news-core.mjs";
export async function saveNewsDraft(input:{id:string;version:number;input:unknown}){
  try{await getNewsService().save(await headers(),input);return {error:"",version:input.version+1};}
  catch(error){return {error:error instanceof NewsError?error.message:"Simpan otomatis belum berhasil. Isian tetap disimpan sementara pada tab ini.",version:input.version};}
}

export async function editNews(_previous: { error: string }, form: FormData): Promise<{ error: string }> {
  await requireOperator();
  let destination: string;
  try {
    const service = getNewsService();
    const requestHeaders = await headers();
    const id = String(form.get("id") || "");
    const version = Number(form.get("version"));
    const action = String(form.get("intent"));
    let savedId: string;
    if (action === "save") {
      let blocks: unknown;
      try { blocks = JSON.parse(String(form.get("blocks") || "[]")); } catch { return { error: "Isi berita tidak valid." }; }
      savedId = await service.save(requestHeaders, { id: id || undefined, version: version || undefined, input: { title: form.get("title"), slug: form.get("slug"), excerpt: form.get("excerpt"), category: form.get("category"), image: form.get("image"), alt: form.get("alt"), blocks } });
    } else if (action === "restore") savedId = await service.restore(requestHeaders, { id, version, revisionId: String(form.get("revisionId")) });
    else savedId = await service.transition(requestHeaders, { id, version, action });
    if (action === "publish" || action === "archive") {
      revalidateTag("school-news", { expire: 0 });
      revalidatePath("/"); revalidatePath("/informasi/berita"); revalidatePath("/informasi/berita/[slug]", "page");
    }
    revalidatePath("/admin/berita");
    destination = `/admin/berita/${savedId}`;
  } catch (error) { return { error: error instanceof NewsError ? error.message : "Perubahan belum tersimpan. Coba lagi; jika berlanjut, hubungi pengelola sistem." }; }
  redirect(destination);
}
