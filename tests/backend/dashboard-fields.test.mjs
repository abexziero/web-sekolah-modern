import test from "node:test";
import assert from "node:assert/strict";
import {contentSlug,toWitaInput,fromWitaInput} from "../../lib/admin-content.ts";

test("automatic content URLs normalize names and bound long titles",()=>{
 assert.equal(contentSlug("  Guru & Kegiatan Madrasah!  "),"guru-kegiatan-madrasah");
 assert.equal(contentSlug("Profil École"),"profil-ecole");
 assert.equal(contentSlug("/admin?x=1"),"admin-x-1");
 assert.equal(contentSlug("---"),"");
 assert.ok(contentSlug("a ".repeat(150)).length<=120);
});
test("agenda input always displays and parses WITA independent of device zone",()=>{
 assert.equal(toWitaInput("2026-10-15T01:00:00Z"),"2026-10-15T09:00");
 assert.equal(fromWitaInput("2026-10-15T09:00"),"2026-10-15T01:00:00.000Z");
 assert.equal(toWitaInput(""),"");assert.equal(fromWitaInput(""),"");
});
