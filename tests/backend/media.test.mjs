import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
test("media validator rejects disguised content and normalizes image metadata",async()=>{
 const {validateMedia}=await import("../../lib/server/media-validation.mjs");
 await assert.rejects(validateMedia(Buffer.from('<svg onload="alert(1)"/>'),{filename:"image.jpg",contentType:"image/jpeg"}));
 const image=await sharp({create:{width:20,height:20,channels:3,background:"green"}}).jpeg().toBuffer();
 const result=await validateMedia(image,{filename:"image.jpg",contentType:"image/jpeg"});assert.equal(result.mime,"image/webp");assert.equal(result.width,20);
 await assert.rejects(validateMedia(image,{filename:"image.svg",contentType:"image/svg+xml"}));
 await assert.rejects(validateMedia(Buffer.alloc(5*1024*1024+1),{filename:"image.jpg",contentType:"image/jpeg"}));
 await assert.rejects(validateMedia(Buffer.from('%PDF-1.7 bad document'),{filename:"doc.pdf",contentType:"application/pdf"}));
 const {PDFDocument}=await import("pdf-lib");const doc=await PDFDocument.create();doc.addPage();const pdf=await validateMedia(Buffer.from(await doc.save()),{filename:"document.pdf",contentType:"application/pdf"});assert.equal(pdf.mime,"application/pdf");
 const [major,minor,patch]=sharp.versions.sharp.split(".").map(Number);assert.ok(major>0||minor>35||(minor===35&&patch>=5),"Known Sharp librsvg advisory requires patched release");
});

test("stream limits work without content length and storage rejects traversal",async()=>{
 const {readBoundedFile}=await import("../../lib/server/media-validation.mjs");
 const {createLocalMediaStorage}=await import("../../lib/server/media-storage.mjs");
 const {assertRequestOrigin}=await import("../../lib/server/request-origin.mjs");
 const stream=()=>new ReadableStream({start(controller){controller.enqueue(new Uint8Array(6));controller.enqueue(new Uint8Array(6));controller.close();}});
 await assert.rejects(readBoundedFile(new Request("http://localhost/upload",{method:"POST",body:stream(),duplex:"half"}),10),/batas/);
 assert.throws(()=>createLocalMediaStorage().read("../file"));
 assert.throws(()=>assertRequestOrigin(new Request("http://localhost:3000/api",{method:"POST",headers:{origin:"https://foreign.example"}}),{BETTER_AUTH_URL:"http://localhost:3000"}));
 assert.doesNotThrow(()=>assertRequestOrigin(new Request("http://localhost:3000/api",{method:"POST",headers:{origin:"http://127.0.0.1:3000"}}),{BETTER_AUTH_URL:"http://localhost:3000"}));
});
