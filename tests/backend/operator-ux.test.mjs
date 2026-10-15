import test from "node:test";
import assert from "node:assert/strict";
import {createOperatorManagement} from "../../lib/server/operator-management.mjs";

test("successful account confirmations do not exhaust the failed-password budget",async()=>{
 let attempts=0;
 const user={id:"admin",name:"Audit",email:"audit@example.test",role:"super_admin",active:true};
 const db={beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{},query:async()=>[[{id:"admin"}]],execute:async sql=>sql.startsWith("SELECT")?[[{id:"target",role:"editor",active:true}]]:[{affectedRows:1}]};
 const pool={getConnection:async()=>db,execute:async sql=>{
  if(sql.startsWith("INSERT INTO auth_throttle")){attempts++;return [{}];}
  if(sql.startsWith("SELECT attempts"))return [[{attempts}]];
  if(sql.startsWith("DELETE FROM auth_throttle")){attempts=0;return [{}];}
  if(sql.startsWith("SELECT id, name"))return [[user]];
  throw Error("Unexpected query");
 }};
 const auth={api:{getSession:async()=>({session:{mfaVerified:true},user:{id:"admin",twoFactorEnabled:true}}),verifyPassword:async()=>({status:true})}};
 const service=createOperatorManagement(auth,pool,{BETTER_AUTH_SECRET:"a".repeat(32)});
 for(let i=0;i<6;i++)await service.change(new Headers(),{action:"revoke",email:"target@example.test",reauth:"valid-test-password"});
 assert.equal(attempts,0);
});
