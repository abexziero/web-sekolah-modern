import sharp from "sharp";
export async function validateMedia(bytes, { filename, contentType }) {
    if (!Buffer.isBuffer(bytes) || !bytes.length || typeof filename !== "string" || filename.length > 180 || /[\\/\0]/.test(filename))
        throw new Error("File tidak valid.");
    const ext = filename.split(".").at(-1).toLowerCase();
    if (ext === "pdf" && contentType === "application/pdf") {
        if (bytes.length > 10 * 1024 * 1024 || !bytes.subarray(0, 5).equals(Buffer.from("%PDF-")))
            throw new Error("PDF tidak valid atau melebihi10MiB.");
        const { PDFDocument } = await import("pdf-lib");
        let doc;
        try {
            doc = await PDFDocument.load(bytes, { throwOnInvalidObject: true, updateMetadata: false });
            if (doc.isEncrypted || !doc.getPageCount())
                throw new Error();
        }
        catch {
            throw new Error("Struktur PDF tidak valid atau terenkripsi.");
        }
        return { bytes, mime: "application/pdf", size: bytes.length };
    }
    const formats = { jpg: ["image/jpeg", "jpeg"], jpeg: ["image/jpeg", "jpeg"], png: ["image/png", "png"], webp: ["image/webp", "webp"] };
    if (!formats[ext] || formats[ext][0] !== contentType || bytes.length > 5 * 1024 * 1024)
        throw new Error("Gunakan JPEG, PNG atau WebP maksimal5MiB.");
    const signature = ext === "png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : ext === "webp" ? bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP" : bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
    if (!signature)
        throw new Error("Signature gambar tidak sesuai format.");
    try {
        const image = sharp(bytes, { limitInputPixels: 20000000, failOn: "warning" });
        const meta = await image.metadata();
        if (meta.format !== formats[ext][1] || (meta.pages || 1) > 1 || !meta.width || !meta.height || meta.width * meta.height > 20000000)
            throw new Error();
        const output = await image.rotate().webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
        return { bytes: output.data, mime: "image/webp", size: output.data.length, width: output.info.width, height: output.info.height };
    }
    catch {
        throw new Error("Gambar rusak, format tidak cocok atau dimensi melebihi20megapiksel.");
    }
}
export async function readBoundedFile(request, limit = 10 * 1024 * 1024) {
    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > limit)
        throw new Error("Ukuran file melebihi batas.");
    if (!request.body)
        throw new Error("File kosong.");
    const reader = request.body.getReader(), parts = [];
    let size = 0;
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done)
                break;
            size += value.byteLength;
            if (size > limit) {
                await reader.cancel();
                throw new Error("Ukuran file melebihi batas.");
            }
            parts.push(value);
        }
        return Buffer.concat(parts, size);
    }
    finally {
        reader.releaseLock();
    }
}
