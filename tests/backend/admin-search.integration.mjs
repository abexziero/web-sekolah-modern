import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createDatabasePool} from "../../lib/server/database-config.mjs";
import {createSchoolAuth} from "../../lib/server/auth-core.mjs";
import {createNewsService} from "../../lib/server/news-core.mjs";
import {createCmsService} from "../../lib/server/cms-core.mjs";
import {operatorFixture} from "./helpers.mjs";
test("server search reaches news beyond the old limit and cannot expose another editor's records",async()=>{
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3000",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"},pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),news=createNewsService(pool,auth),cms=createCmsService(pool,auth);
 let admin,editor,cid;const ids=[],marker=`search-${randomUUID()}`;
 try{
  admin=await operatorFixture(auth,pool,env,"super_admin");editor=await operatorFixture(auth,pool,env,"editor");
  for(let i=0;i<101;i++){const id=randomUUID(),rid=randomUUID();ids.push(id);await pool.execute("INSERT INTO articles(id,slug,author_id,version) VALUES(?,?,?,1)",[id,`${marker}-${i}`,admin.user.id]);await pool.execute("INSERT INTO article_revisions(id,article_id,revision_number,title,excerpt,category,image,image_alt,blocks,saved_by) VALUES(?,?,1,?,'Kegiatan pembelajaran madrasah','Kegiatan','school.jpg','Gerbang madrasah','[]',?)",[rid,id,`${marker} judul ${i}`,admin.user.id]);await pool.execute("UPDATE articles SET current_revision_id=? WHERE id=?",[rid,id]);}
  const first=await news.search(admin.headers,{q:marker});assert.equal(first.total,101);assert.equal(first.rows.length,20);assert.equal(first.pages,6);
  assert.equal((await news.search(admin.headers,{q:marker,page:6})).rows.length,1);
  assert.equal((await news.search(editor.headers,{q:marker,ownerId:admin.user.id})).total,0);
  cid=await cms.save(admin.headers,{type:"teacher",key:marker,payload:{name:`Guru ${marker}`,role:"Pendidik",description:"Profil pengujian",image:"",alt:"",order:0,example:true}});
  assert.equal((await cms.search(admin.headers,{q:marker,type:"teacher"})).total,1);
  await assert.rejects(cms.search(editor.headers,{q:marker}));
 }finally{
  if(cid){await pool.execute("UPDATE cms_entries SET current_revision_id=NULL WHERE id=?",[cid]);await pool.execute("DELETE FROM cms_revisions WHERE entry_id=?",[cid]);await pool.execute("DELETE FROM cms_entries WHERE id=?",[cid]);}
  for(const id of ids){await pool.execute("UPDATE articles SET current_revision_id=NULL,published_revision_id=NULL WHERE id=?",[id]);await pool.execute("DELETE FROM article_revisions WHERE article_id=?",[id]);await pool.execute("DELETE FROM articles WHERE id=?",[id]);}
  await admin?.cleanup();await editor?.cleanup();await pool.end();
 }
});
