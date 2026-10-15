import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createDatabasePool} from "../../lib/server/database-config.mjs";
import {createSchoolAuth} from "../../lib/server/auth-core.mjs";
import {createCmsService} from "../../lib/server/cms-core.mjs";
import {createNewsService} from "../../lib/server/news-core.mjs";
import {operatorFixture} from "./helpers.mjs";

test("trash preserves revisions, withdraws publication, rejects stale actions and restores only drafts", async()=>{
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3000",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"};
 const pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),cms=createCmsService(pool,auth),news=createNewsService(pool,auth);
 let admin,editor,cid,nid;
 try{
  admin=await operatorFixture(auth,pool,env,"super_admin");editor=await operatorFixture(auth,pool,env,"editor");
  const key=`profil/trash-${randomUUID()}`,payload={title:"Halaman pengujian sampah",description:"Informasi madrasah untuk pengujian",image:"school.jpg",alt:"Gerbang madrasah",blocks:[{type:"paragraph",text:"Belajar bersama di madrasah."}],example:true};
  cid=await cms.save(admin.headers,{type:"page",key,payload});
  for(const action of ["submit","publish","trash"]){const row=await cms.get(admin.headers,cid);await cms.transition(admin.headers,{id:cid,version:row.version,action});}
  assert.equal(await cms.publicByKey("page",key),null);assert.equal(await cms.exists("page",key),true);
  assert.ok(!(await cms.list(admin.headers)).some(r=>r.id===cid));
  let row=(await cms.list(admin.headers,undefined,true)).find(r=>r.id===cid);assert.ok(row);
  await assert.rejects(cms.get(admin.headers,cid),/Sampah|ditemukan/);
  await assert.rejects(cms.transition(editor.headers,{id:cid,version:row.version,action:"untrash"}));
  await assert.rejects(cms.transition(admin.headers,{id:cid,version:row.version-1,action:"untrash"}),/berubah/);
  await cms.transition(admin.headers,{id:cid,version:row.version,action:"untrash"});row=await cms.get(admin.headers,cid);
  assert.equal(row.status,"draft");assert.equal(row.history.length,1);assert.equal(await cms.publicByKey("page",key),null);
  nid=await news.save(admin.headers,{input:{title:"Berita pengujian sampah madrasah",slug:`trash-${randomUUID()}`,excerpt:"Kegiatan pembelajaran bersama seluruh warga madrasah.",category:"Kegiatan",image:"school.jpg",alt:"Gerbang madrasah",blocks:[{type:"paragraph",text:"Belajar bersama di madrasah."}]}});
  row=await news.get(admin.headers,nid);await assert.rejects(news.transition(editor.headers,{id:nid,version:row.version,action:"trash"}));
  for(const action of ["submit","publish","trash"]){row=await news.get(admin.headers,nid);await news.transition(admin.headers,{id:nid,version:row.version,action});}
  assert.ok(!(await news.list(admin.headers)).some(r=>r.id===nid));row=(await news.list(admin.headers,true)).find(r=>r.id===nid);assert.ok(row);
  await assert.rejects(news.get(admin.headers,nid));await news.transition(admin.headers,{id:nid,version:row.version,action:"untrash"});
  row=await news.get(admin.headers,nid);assert.equal(row.status,"draft");assert.equal(row.history.length,1);assert.equal(await news.publicBySlug(row.slug),null);
 }finally{
  if(cid){await pool.execute("UPDATE cms_entries SET current_revision_id=NULL,published_revision_id=NULL WHERE id=?",[cid]);await pool.execute("DELETE FROM cms_revisions WHERE entry_id=?",[cid]);await pool.execute("DELETE FROM cms_entries WHERE id=?",[cid]);}
  if(nid){await pool.execute("UPDATE articles SET current_revision_id=NULL,published_revision_id=NULL WHERE id=?",[nid]);await pool.execute("DELETE FROM article_revisions WHERE article_id=?",[nid]);await pool.execute("DELETE FROM articles WHERE id=?",[nid]);}
  await admin?.cleanup();await editor?.cleanup();await pool.end();
 }
});
