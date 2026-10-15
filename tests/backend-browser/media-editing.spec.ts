import {test,expect} from "@playwright/test";
import sharp from "sharp";
import {createDatabasePool} from "../../lib/server/database-config.mjs";
import {createSchoolAuth} from "../../lib/server/auth-core.mjs";
import {createMediaService} from "../../lib/server/media-core.mjs";
import {createLocalMediaStorage} from "../../lib/server/media-storage.mjs";
import {operatorFixture} from "../backend/helpers.mjs";

test("switching media editors confirms discard and loads the selected file metadata",async({page,context})=>{
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3101",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"};
 const pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),fixture=await operatorFixture(auth,pool,env,"super_admin"),storage=createLocalMediaStorage(),media=createMediaService(pool,auth,storage),ids:string[]=[];
 try{
  const bytes=await sharp({create:{width:12,height:12,channels:3,background:"green"}}).png().toBuffer();
  for(const alt of ["Foto pertama UX","Foto kedua UX","Foto ketiga UX"])ids.push(await media.upload(fixture.headers,{bytes,filename:"foto.png",contentType:"image/png",alt,caption:`Caption ${alt}`,credit:"Madrasah"}));
  await context.addCookies(fixture.cookies.split("; ").map(pair=>{const i=pair.indexOf("=");return {name:pair.slice(0,i),value:pair.slice(i+1),url:"http://127.0.0.1:3101"};}));
  await page.goto("/admin/media");
  await page.getByRole("row").filter({hasText:"Foto pertama UX"}).getByRole("button",{name:"Ubah",exact:true}).click();
  await page.getByLabel("Teks alternatif",{exact:true}).fill("Perubahan belum disimpan");
  page.once("dialog",d=>d.accept());
  await page.getByRole("row").filter({hasText:"Foto ketiga UX"}).getByRole("button",{name:"Hapus",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("Sampah");
  await expect(page.getByLabel("Teks alternatif",{exact:true})).toHaveValue("Perubahan belum disimpan");
  page.once("dialog",d=>d.dismiss());
  await page.getByRole("row").filter({hasText:"Foto kedua UX"}).getByRole("button",{name:"Ubah",exact:true}).click();
  await expect(page.getByLabel("Teks alternatif",{exact:true})).toHaveValue("Perubahan belum disimpan");
  page.once("dialog",d=>d.accept());
  await page.getByRole("row").filter({hasText:"Foto kedua UX"}).getByRole("button",{name:"Ubah",exact:true}).click();
  await expect(page.getByLabel("Teks alternatif",{exact:true})).toHaveValue("Foto kedua UX");
  await expect(page.getByLabel("Caption",{exact:true}).last()).toHaveValue("Caption Foto kedua UX");
  await page.getByLabel("Teks alternatif",{exact:true}).fill("Foto kedua diperbarui");
  await page.getByRole("button",{name:"Simpan perubahan",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("tersimpan");
  const files=await media.list(fixture.headers);
  expect(files.find((file:{id:string;alt:string})=>file.id===ids[0])?.alt).toBe("Foto pertama UX");
  expect(files.find((file:{id:string;alt:string})=>file.id===ids[1])?.alt).toBe("Foto kedua diperbarui");
  await page.getByLabel("Cari media",{exact:true}).fill("Caption");await page.getByRole("button",{name:"Cari",exact:true}).click();
  await expect(page.getByRole("row").filter({hasText:"Foto kedua diperbarui"})).toBeVisible();
 }finally{
  for(const id of ids){await pool.execute("DELETE FROM media WHERE id=?",[id]);await storage.remove(id);}
  await fixture.cleanup();await pool.end();
 }
});
