import test from "node:test";
import assert from "node:assert/strict";
import {homeGroups,copyLabels,cmsFieldErrors,publicContentPath} from "../../lib/cms-editor.ts";
import {defaultHome} from "../../lib/cms-defaults.ts";
test("home editor groups every stable text once and collection addresses use real public pages",()=>{
 const ids=homeGroups.flatMap(group=>Array.from({length:group.to-group.from+1},(_,i)=>`text-${group.from+i}`));
 assert.deepEqual(ids,defaultHome.copy.map(c=>c.id));assert.equal(copyLabels.length,ids.length);
 assert.equal(publicContentPath("teacher","guru-contoh"),"/profil/guru-tenaga-kependidikan");
 assert.equal(publicContentPath("page","profil/sejarah"),"/profil/sejarah");
 assert.equal(Object.keys(cmsFieldErrors("home",defaultHome)).length,0);
 assert.match(cmsFieldErrors("teacher",{name:"",role:"",description:"",order:0,image:"",alt:"",example:true}).name,/wajib/);
});
