import test from "node:test";
import assert from "node:assert/strict";
import { createDatabasePool } from "../../lib/server/database-config.mjs";
import { createSchoolAuth } from "../../lib/server/auth-core.mjs";
import { createCmsService } from "../../lib/server/cms-core.mjs";
import { operatorFixture } from "./helpers.mjs";
test("CMS immutable publication, dependency guards, optimistic conflicts and editor denial",async()=>{
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3000",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"}; const pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),service=createCmsService(pool,auth); const admin=await operatorFixture(auth,pool,env,"super_admin"),editor=await operatorFixture(auth,pool,env,"editor");const ids=[];
 try{
  const input={title:"Profil madrasah",description:"Pendidikan dan karakter.",image:"school.jpg",alt:"Gerbang madrasah",blocks:[{type:"paragraph",text:"Belajar bersama."}],example:true};
  await assert.rejects(service.list(editor.headers));
  const id=await service.save(admin.headers,{type:"page",key:"profil/tes-cms",payload:input});ids.push(id);
  assert.equal(await service.publicByKey("page","profil/tes-cms"),null);
  await assert.rejects(service.save(admin.headers,{id,type:"page",key:"profil/tes-cms",version:0,payload:input}),/berubah/);
  let row=await service.get(admin.headers,id);
  await service.transition(admin.headers,{id,version:row.version,action:"submit"});row=await service.get(admin.headers,id);
  await service.transition(admin.headers,{id,version:row.version,action:"publish"});row=await service.get(admin.headers,id);
  await service.save(admin.headers,{id,type:"page",key:"profil/tes-cms",version:row.version,payload:{...input,title:"Perubahan belum terbit"}});
  assert.equal((await service.publicByKey("page","profil/tes-cms")).payload.title,input.title);
  row=await service.get(admin.headers,id);assert.ok(row.history[0].saved_by_name);
  await service.restore(admin.headers,{id,version:row.version,revisionId:row.history.at(-1).id});row=await service.get(admin.headers,id);assert.equal(row.payload.title,input.title);
  await service.transition(admin.headers,{id,version:row.version,action:"archive"});assert.equal(await service.publicByKey("page","profil/tes-cms"),null);
 }finally{for(const id of ids){await pool.execute("UPDATE cms_entries SET current_revision_id=NULL,published_revision_id=NULL WHERE id=?",[id]);await pool.execute("DELETE FROM cms_revisions WHERE entry_id=?",[id]);await pool.execute("DELETE FROM cms_entries WHERE id=?",[id]);}await admin.cleanup();await editor.cleanup();await pool.end();}
});
