import {test,expect} from "@playwright/test";
import {randomUUID} from "node:crypto";
import {createDatabasePool} from "../../lib/server/database-config.mjs";
import {createSchoolAuth} from "../../lib/server/auth-core.mjs";
import {operatorFixture} from "../backend/helpers.mjs";
test("Super Admin creates a CMS page, privately previews, publishes and archives it",async({page,context,request})=>{
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3101",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"},pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),fixture=await operatorFixture(auth,pool,env,"super_admin");let id:string|undefined;
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const key=`profil/tes-${randomUUID().slice(0,8)}`;
 try{
  await context.addCookies(fixture.cookies.split("; ").map(pair=>{const index=pair.indexOf("=");return {name:pair.slice(0,index),value:pair.slice(index+1),url:"http://127.0.0.1:3101"};}));
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/admin/konten/baru");await expect(page.getByText("Super Admin",{exact:false}).first()).toBeVisible();
  await page.getByText("Sesuaikan alamat (opsional)",{exact:true}).click();await page.getByLabel("Alamat konten",{exact:true}).fill(key);await page.getByLabel("Judul",{exact:true}).fill("Profil dari dashboard CMS");await page.getByLabel("Ringkasan",{exact:true}).fill("Informasi madrasah yang disiapkan melalui dashboard.");await page.getByRole("button",{name:"Tambah Isi bacaan",exact:true}).click();await page.getByLabel("Teks",{exact:true}).fill("Isi lengkap halaman yang hanya terlihat setelah publikasi.");
  await page.getByRole("button",{name:"Simpan draft",exact:true}).click();await expect(page).toHaveURL(/\/admin\/konten\/[a-f0-9-]{36}$/);id=new URL(page.url()).pathname.split("/").at(-1)!;
  expect((await request.get(`/${key}`)).status()).toBe(404);expect((await request.get(`/admin/konten/${id}/preview`,{maxRedirects:0})).status()).toBe(307);
  await page.getByRole("link",{name:"Pratinjau tersimpan"}).click();await expect(page.locator("main")).toContainText("Isi lengkap halaman");await page.getByRole("link",{name:"Kembali menyunting",exact:true}).click();
  await page.getByRole("button",{name:"Ajukan tinjauan",exact:true}).click();await expect(page.getByRole("button",{name:"Terbitkan",exact:true})).toBeVisible();await page.getByRole("checkbox",{name:"Saya sudah memeriksa isi dan pratinjau."}).check();await page.getByRole("button",{name:"Terbitkan",exact:true}).click();await expect(page.locator("strong").filter({hasText:"Terbit"})).toBeVisible();
  const published=await request.get(`/${key}`);expect(published.status()).toBe(200);expect(await published.text()).toContain("Isi lengkap halaman");
  await page.setViewportSize({width:360,height:800});await page.screenshot({path:".npm-cache/cms-mobile.png",fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByText(/Pengaturan lanjutan dan riwayat revisi/).click();page.once("dialog",dialog=>dialog.accept());await page.getByRole("button",{name:"Arsipkan",exact:true}).click();await expect(page.locator("strong").filter({hasText:"Arsip"})).toBeVisible();expect((await request.get(`/${key}`)).status()).toBe(404);expect(errors).toEqual([]);
 }finally{if(id){await pool.execute("UPDATE cms_entries SET current_revision_id=NULL,published_revision_id=NULL WHERE id=?",[id]);await pool.execute("DELETE FROM cms_revisions WHERE entry_id=?",[id]);await pool.execute("DELETE FROM cms_entries WHERE id=?",[id]);}await fixture.cleanup();await pool.end();}
});
