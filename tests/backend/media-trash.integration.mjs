import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createDatabasePool} from "../../lib/server/database-config.mjs";
import {createSchoolAuth} from "../../lib/server/auth-core.mjs";
import {createMediaService} from "../../lib/server/media-core.mjs";
import {createOperator,manageOperator} from "../../lib/server/accounts.mjs";
import {operatorFixture} from "./helpers.mjs";

test("media trash retains bytes and account trash revokes access and restores inactive",async()=>{
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3000",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"},pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env);
 let admin,account;const id=randomUUID();let removed=false;
 const media=createMediaService(pool,auth,{read:async()=>Buffer.from("retained"),remove:async()=>{removed=true;}});
 try{
  admin=await operatorFixture(auth,pool,env,"super_admin");
  await pool.execute("INSERT INTO media(id,storage_key,mime,size,alt,uploaded_by) VALUES(?,?,'image/webp',8,'Media pengujian',?)",[id,id,admin.user.id]);
  await media.remove(admin.headers,id);assert.equal(removed,false);await assert.rejects(media.read(admin.headers,id));
  assert.ok((await media.list(admin.headers,true)).some(f=>f.id===id));
  await media.restore(admin.headers,id);assert.equal((await media.read(admin.headers,id)).bytes.toString(),"retained");
  await media.update(admin.headers,{id,alt:"Deskripsi baru",caption:"Keterangan",credit:"Madrasah"});assert.equal((await media.list(admin.headers)).find(f=>f.id===id).alt,"Deskripsi baru");
  account=await createOperator(auth,pool,{email:`trash-${randomUUID()}@example.test`,name:"Operator sampah",password:randomUUID()+randomUUID(),role:"editor"});
  await manageOperator(auth,pool,{email:account.email,action:"trash"});
  await assert.rejects(manageOperator(auth,pool,{email:account.email,action:"enable"}),/Sampah/);
  await manageOperator(auth,pool,{email:account.email,action:"untrash"});
  const [[row]]=await pool.execute("SELECT active,deleted_at FROM `user` WHERE id=?",[account.id]);assert.equal(!!row.active,false);assert.equal(row.deleted_at,null);
 }finally{await pool.execute("DELETE FROM media WHERE id=?",[id]);if(account){await pool.execute("DELETE FROM account WHERE userId=?",[account.id]);await pool.execute("DELETE FROM `user` WHERE id=?",[account.id]);}await admin?.cleanup();await pool.end();}
});
