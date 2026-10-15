import {test,expect} from "@playwright/test";
import sharp from "sharp";
import {randomUUID} from "node:crypto";
import {createDatabasePool} from "../../lib/server/database-config.mjs";
import {createSchoolAuth} from "../../lib/server/auth-core.mjs";
import {createCmsService} from "../../lib/server/cms-core.mjs";
import {createMediaService} from "../../lib/server/media-core.mjs";
import {createLocalMediaStorage} from "../../lib/server/media-storage.mjs";
import {operatorFixture} from "../backend/helpers.mjs";
test("optimizer cannot cache public uploaded media and archived media returns404",async({request})=>{
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3101",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"},pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),fixture=await operatorFixture(auth,pool,env,"super_admin"),cms=createCmsService(pool,auth),media=createMediaService(pool,auth,createLocalMediaStorage());let mediaId:string|undefined,entryId:string|undefined;
 try{mediaId=await media.upload(fixture.headers,{bytes:await sharp({create:{width:30,height:20,channels:3,background:"green"}}).png().toBuffer(),filename:"public.png",contentType:"image/png",alt:"Test public media",caption:"",credit:""});entryId=await cms.save(fixture.headers,{id:undefined,version:undefined,type:"page",key:`profil/media-${randomUUID().slice(0,8)}`,payload:{title:"Media publication",description:"Checking public file access.",image:`/media/${mediaId}`,alt:"Test public media",blocks:[{type:"paragraph",text:"Media reference."}],example:true}});await cms.transition(fixture.headers,{id:entryId,version:1,action:"submit"});await cms.transition(fixture.headers,{id:entryId,version:2,action:"publish"});expect((await request.get(`/media/${mediaId}`)).status()).toBe(200);const optimizer=`/_next/image?url=${encodeURIComponent(`/media/${mediaId}`)}&w=640&q=75`;expect((await request.get(optimizer)).status()).toBe(400);await cms.transition(fixture.headers,{id:entryId,version:3,action:"archive"});expect((await request.get(`/media/${mediaId}`)).status()).toBe(404);expect((await request.get(optimizer)).status()).toBe(400);
 }finally{if(entryId){await pool.execute("DELETE m FROM cms_revision_media m JOIN cms_revisions r ON r.id=m.revision_id WHERE r.entry_id=?",[entryId]);await pool.execute("UPDATE cms_entries SET current_revision_id=NULL,published_revision_id=NULL WHERE id=?",[entryId]);await pool.execute("DELETE FROM cms_revisions WHERE entry_id=?",[entryId]);await pool.execute("DELETE FROM cms_entries WHERE id=?",[entryId]);}if(mediaId){await pool.execute("DELETE FROM media WHERE id=?",[mediaId]);await createLocalMediaStorage().remove(mediaId);}await fixture.cleanup();await pool.end();}
});
