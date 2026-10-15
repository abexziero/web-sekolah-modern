import { getMediaService } from "@/lib/server/media";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    try {
        const { id } = await params, file = await getMediaService().read(request.headers, id);
        return new Response(new Uint8Array(file.bytes), { headers: { "content-type": file.mime, "content-length": String(file.bytes.length), "cache-control": "private, no-store", "x-content-type-options": "nosniff", "content-disposition": file.mime === "application/pdf" ? 'attachment; filename="dokumen-madrasah.pdf"' : "inline", "content-security-policy": "default-src 'none'; sandbox" } });
    }
    catch {
        return new Response("File tidak ditemukan.", { status: 404, headers: { "cache-control": "no-store" } });
    }
}
