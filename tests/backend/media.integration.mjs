import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {resolve} from "node:path";
import sharp from "sharp";
import {createDatabasePool} from "../../lib/server/database-config.mjs";
import {createSchoolAuth} from "../../lib/server/auth-core.mjs";
import {createMediaService} from "../../lib/server/media-core.mjs";
import {createLocalMediaStorage} from "../../lib/server/media-storage.mjs";
import {createCmsService} from "../../lib/server/cms-core.mjs";
import {operatorFixture} from "./helpers.mjs";
test("media access follows immutable publication and referenced revisions prevent deletion",async()=>{
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3000",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"},pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),root=await mkdtemp(resolve('.npm-cache/media-test-')),storage=createLocalMediaStorage(root),media=createMediaService(pool,auth,storage),cms=createCmsService(pool,auth);let admin,editor,id,entryId;
 try{admin=await operatorFixture(auth,pool,env,"super_admin");editor=await operatorFixture(auth,pool,env,"editor");const bytes=await sharp({create:{width:10,height:10,channels:3,background:"green"}}).png().toBuffer();const input={bytes,filename:"test.png",contentType:"image/png",alt:"Foto pengujian"};await assert.rejects(media.upload(editor.headers,input));id=await media.upload(admin.headers,input);await assert.rejects(media.read(new Headers(),id));await assert.rejects(media.read(editor.headers,id));assert.equal((await media.read(admin.headers,id)).mime,"image/webp");entryId=await cms.save(admin.headers,{type:"page",key:"profil/tes-media",payload:{title:"Halaman media",description:"Media pengujian madrasah",image:`/media/${id}`,alt:"Foto pengujian",blocks:[{type:"paragraph",text:"Dokumentasi kegiatan."}],example:true}});let row=await cms.get(admin.headers,entryId);await cms.transition(admin.headers,{id:entryId,version:row.version,action:"submit"});row=await cms.get(admin.headers,entryId);await cms.transition(admin.headers,{id:entryId,version:row.version,action:"publish"});assert.equal((await media.read(new Headers(),id)).mime,"image/webp");await assert.rejects(media.remove(admin.headers,id),/riwayat/);row=await cms.get(admin.headers,entryId);await cms.transition(admin.headers,{id:entryId,version:row.version,action:"archive"});await assert.rejects(media.read(new Headers(),id));await assert.rejects(media.remove(admin.headers,id),/riwayat/);
 }finally{if(entryId){await pool.execute("DELETE m FROM cms_revision_media m JOIN cms_revisions r ON r.id=m.revision_id WHERE r.entry_id=?",[entryId]);await pool.execute("UPDATE cms_entries SET current_revision_id=NULL,published_revision_id=NULL WHERE id=?",[entryId]);await pool.execute("DELETE FROM cms_revisions WHERE entry_id=?",[entryId]);await pool.execute("DELETE FROM cms_entries WHERE id=?",[entryId]);}if(id)await pool.execute("DELETE FROM media WHERE id=?",[id]);await admin?.cleanup();await editor?.cleanup();await pool.end();await rm(root,{recursive:true,force:true});}
});
