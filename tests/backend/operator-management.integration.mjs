import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createDatabasePool} from "../../lib/server/database-config.mjs";
import {createSchoolAuth,readOperator} from "../../lib/server/auth-core.mjs";
import {operatorFixture} from "./helpers.mjs";
test("account dashboard enforces reauthentication, editor boundary and initial password change",async()=>{
 const {createOperatorManagement}=await import("../../lib/server/operator-management.mjs");
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3000",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"},pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),service=createOperatorManagement(auth,pool,env);
 let admin,editor,created;
 try{admin=await operatorFixture(auth,pool,env,"super_admin");editor=await operatorFixture(auth,pool,env,"editor");await assert.rejects(service.list(editor.headers));await assert.rejects(service.create(admin.headers,{email:`new-${randomUUID()}@example.test`,name:"Editor baru",password:randomUUID()+randomUUID(),role:"editor",reauth:"wrong"}));
 created=await service.create(admin.headers,{email:`new-${randomUUID()}@example.test`,name:"Editor baru",password:randomUUID()+randomUUID(),role:"editor",reauth:admin.password});const [[row]]=await pool.execute("SELECT mustChangePassword FROM `user` WHERE id=?",[created.id]);assert.equal(!!row.mustChangePassword,true);
 assert.ok((await service.audit(admin.headers)).some(item=>item.action==="dashboard.account.create"&&item.object_id===created.id&&item.actor==="Operator pengujian"));await assert.rejects(service.audit(editor.headers));
 await pool.execute("UPDATE `user` SET mustChangePassword=true WHERE id=?",[editor.user.id]);await assert.rejects(readOperator(auth,pool,editor.headers),/password/i);
 await service.changeInitialPassword(editor.headers,{currentPassword:editor.password,newPassword:randomUUID()+randomUUID()});assert.equal((await readOperator(auth,pool,editor.headers)).role,"editor");
 }finally{if(created){await pool.execute("DELETE FROM account WHERE userId=?",[created.id]);await pool.execute("DELETE FROM `user` WHERE id=?",[created.id]);}await admin?.cleanup();await editor?.cleanup();await pool.end();}
});
