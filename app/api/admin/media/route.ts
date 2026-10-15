import { getMediaService } from "@/lib/server/media";
import { assertRequestOrigin } from "@/lib/server/request-origin.mjs";
import { readBoundedFile } from "@/lib/server/media-validation.mjs";
import { MediaError } from "@/lib/server/media-core.mjs";
export const runtime = "nodejs";
export async function GET(request:Request){
    try{const p=new URL(request.url).searchParams;return Response.json(await getMediaService().search(request.headers,{q:p.get("q"),page:p.get("page"),format:p.get("format"),trash:p.get("trash")==="1"}),{headers:{"cache-control":"private, no-store"}});}
    catch{return Response.json({error:"Akses perpustakaan media ditolak."},{status:403,headers:{"cache-control":"no-store"}});}
}
export async function PATCH(request:Request){
    try{
        assertRequestOrigin(request);
        const service=getMediaService();await service.operator(request.headers);
        const input=JSON.parse((await readBoundedFile(request,4096)).toString("utf8"));
        if(input.action==="restore")await service.restore(request.headers,input.id);
        else if(input.action==="update")await service.update(request.headers,input);
        else throw new MediaError("Aksi tidak valid.");
        return Response.json({ok:true},{headers:{"cache-control":"no-store"}});
    }catch(error){return Response.json({error:error instanceof MediaError?error.message:"Perubahan media gagal."},{status:400,headers:{"cache-control":"no-store"}});}
}
export async function POST(request: Request) {
    try {
        assertRequestOrigin(request);
        const service = getMediaService();
        await service.operator(request.headers);
        const url = new URL(request.url), bytes = await readBoundedFile(request);
        const id = await service.upload(request.headers, { bytes, filename: decodeURIComponent(request.headers.get("x-filename") || ""), contentType: request.headers.get("content-type"), alt: url.searchParams.get("alt"), caption: url.searchParams.get("caption") || "", credit: url.searchParams.get("credit") || "" });
        return Response.json({ id, url: `/media/${id}` }, { headers: { "cache-control": "no-store" } });
    }
    catch (error) {
        return Response.json({ error: error instanceof MediaError ? error.message : "Upload gagal. Periksa izin, format dan ukuran file." }, { status: 400, headers: { "cache-control": "no-store" } });
    }
}
export async function DELETE(request: Request) {
    try {
        assertRequestOrigin(request);
        await getMediaService().remove(request.headers, new URL(request.url).searchParams.get("id"));
        return Response.json({ ok: true });
    }
    catch (error) {
        return Response.json({ error: error instanceof MediaError ? error.message : "File belum dihapus. Periksa izin dan pemakaian file." }, { status: 400 });
    }
}
