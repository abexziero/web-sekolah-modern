"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCmsService } from "@/lib/server/cms";
import { CmsError } from "@/lib/server/cms-core.mjs";
export async function saveCmsDraft(input:{id:string;type:string;key:string;version:number;payload:Record<string,any>}){
    try{
        const h=await headers(),service=getCmsService();
        await service.save(h,input);
        return {error:"",version:input.version+1};
    }catch(error){return {error:error instanceof CmsError?error.message:"Simpan otomatis belum berhasil. Isian tetap disimpan sementara pada tab ini.",version:input.version};}
}
export async function editCms(_state: {
    error: string;
}, form: FormData): Promise<{
    error: string;
}> {
    let id: string;
    try {
        const service = getCmsService(), requestHeaders = await headers(), action = String(form.get("intent")), target = String(form.get("id") || ""), version = Number(form.get("version"));
        if (action === "save") {
            let payload;
            try {
                payload = JSON.parse(String(form.get("payload")));
            }
            catch {
                return { error: "Isi formulir tidak valid." };
            }
            id = await service.save(requestHeaders, { id: target || undefined, version, type: String(form.get("type")), key: String(form.get("key")), payload });
        }
        else if (action === "restore")
            id = await service.restore(requestHeaders, { id: target, version, revisionId: String(form.get("revisionId")) });
        else
            id = await service.transition(requestHeaders, { id: target, version, action });
        revalidateTag("school-cms", { expire: 0 });
        if (["save", "publish", "archive", "restore"].includes(action)) {
            revalidatePath("/", "layout");
        }
        revalidatePath("/admin/konten");
    }
    catch (error) {
        return { error: error instanceof CmsError ? error.message : "Perubahan belum tersimpan. Periksa hak akses atau coba lagi." };
    }
    redirect(`/admin/konten/${id}`);
}
export async function importCmsExamples() {
    const service = getCmsService(), h = await headers();
    const existing = [...await service.list(h),...await service.list(h,undefined,true)];
    const { cmsExamples } = await import("@/lib/cms-seed");
    for (const entry of cmsExamples())
        if (!existing.some((row: {
            type: string;
            entry_key: string;
        }) => row.type === entry.type && row.entry_key === entry.key))
            await service.save(h, { id: undefined, version: undefined, ...entry });
    if(!existing.some((row:{type:string;entry_key:string})=>row.type==="document"&&row.entry_key==="panduan-contoh")){
        const {PDFDocument}=await import("pdf-lib");
        const {getMediaService}=await import("@/lib/server/media");
        const pdf=await PDFDocument.create();
        const page=pdf.addPage();
        page.drawText("CONTOH - Informasi Madrasah",{x:45,y:760,size:20});
        page.drawText("Dokumen pratinjau. Bukan ketentuan resmi sekolah.",{x:45,y:720,size:12});
        page.drawText("Isi dan kontak resmi perlu ditinjau sebelum diterbitkan.",{x:45,y:695,size:12});
        const media=getMediaService();
        const mediaId=await media.upload(h,{bytes:Buffer.from(await pdf.save()),filename:"panduan-contoh.pdf",contentType:"application/pdf",alt:"Dokumen informasi contoh",caption:"Dokumen contoh, bukan ketentuan resmi sekolah",credit:""});
        try{await service.save(h,{id:undefined,version:undefined,type:"document",key:"panduan-contoh",payload:{title:"Panduan informasi (contoh)",category:"Contoh",description:"Berkas pratinjau untuk ditinjau sekolah, bukan ketentuan resmi.",mediaId,example:true}});}
        catch(error){await media.remove(h,mediaId);throw error;}
    }
    revalidateTag("school-cms", {expire:0});
    revalidatePath("/", "layout");
    revalidatePath("/admin/konten");
}
