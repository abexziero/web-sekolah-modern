import test from "node:test";
import assert from "node:assert/strict";
import {parseCmsInput} from "../../lib/cms-validation.ts";
import {cmsExamples} from "../../lib/cms-seed.ts";
test("all initial CMS entries validate and collections reject invalid dates, file references and empty content",()=>{
 for(const entry of cmsExamples())assert.ok(parseCmsInput(entry.type,entry.payload));
 const event={title:"Kegiatan literasi",description:"Membaca bersama.",startsAt:"2026-10-15T00:00:00Z",endsAt:"2026-10-14T00:00:00Z",location:"Madrasah",example:true};assert.throws(()=>parseCmsInput("event",event));assert.throws(()=>parseCmsInput("event",{...event,startsAt:"invalid",endsAt:""}));
 assert.throws(()=>parseCmsInput("document",{title:"Dokumen",category:"Umum",description:"Dokumen sekolah",mediaId:"javascript:alert(1)",example:true}));
});
