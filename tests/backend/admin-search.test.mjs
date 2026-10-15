import test from "node:test";
import assert from "node:assert/strict";
import {readAdminPage} from "../../lib/server/admin-search.mjs";
test("admin search binds filters, clamps pages and keeps editor ownership",async()=>{
 const calls=[];const pool={execute:async(sql,args)=>{calls.push({sql,args});return sql.includes("COUNT(*)")?[[{total:41}]]:[[{id:"result"}]];}};
 const result=await readAdminPage(pool,"news",{q:"a%_'",status:"draft",page:999,ownerId:"editor-id"});
 assert.equal(result.page,3);assert.equal(result.total,41);assert.equal(result.rows.length,1);
 assert.ok(calls.every(call=>!call.sql.includes("a%_'")));assert.ok(calls[0].args.includes("editor-id"));
 await assert.rejects(readAdminPage(pool,"injected-table",{}));
});
