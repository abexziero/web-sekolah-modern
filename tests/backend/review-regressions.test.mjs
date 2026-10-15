import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {parseCmsInput} from "../../lib/cms-validation.ts";
import {defaultHome} from "../../lib/cms-defaults.ts";
import {cmsExamples} from "../../lib/cms-seed.ts";
test("optimizer only accepts trusted assets and hero focal controls are validated",async()=>{
 const {default:config}=await import("../../next.config.ts");assert.deepEqual(config.images?.localPatterns,[{pathname:"/images/**",search:""}]);
 const home=structuredClone(defaultHome);home.images[0].focalX=101;home.images[0].focalY=50;assert.throws(()=>parseCmsInput("home",home));
 for(const type of ["teacher","album","faq","event","announcement"])assert.ok(cmsExamples().some(entry=>entry.type===type));
});
test("database acquisition failure leaves no uploaded media on disk",async()=>{
 const {createMediaService}=await import("../../lib/server/media-core.mjs");let saved=false,removed=false;
 const pool={execute:async()=>[[{id:"operator",name:"Owner",role:"super_admin",active:true}]],getConnection:async()=>{throw new Error("database unavailable");}};
 const auth={api:{getSession:async()=>({session:{mfaVerified:true},user:{id:"operator",twoFactorEnabled:true}})}};
 const media=createMediaService(pool,auth,{put:async()=>{saved=true;},remove:async()=>{removed=true;}});
 const bytes=await sharp({create:{width:2,height:2,channels:3,background:"green"}}).png().toBuffer();await assert.rejects(media.upload(new Headers(),{bytes,filename:"test.png",contentType:"image/png",alt:"Test image"}));assert.ok(!saved||removed);
});
