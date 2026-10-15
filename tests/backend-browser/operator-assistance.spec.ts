import {test,expect} from "@playwright/test";
import {createDatabasePool} from "../../lib/server/database-config.mjs";
import {createSchoolAuth} from "../../lib/server/auth-core.mjs";
import {createCmsService} from "../../lib/server/cms-core.mjs";
import {operatorFixture} from "../backend/helpers.mjs";
test("assisted forms validate, recover unfinished input, autosave drafts and preview both device sizes",async({page,context})=>{
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3101",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"},pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),fixture=await operatorFixture(auth,pool,env,"super_admin"),cms=createCmsService(pool,auth);let id:string|undefined;
 try{
  await context.addCookies(fixture.cookies.split("; ").map(pair=>{const i=pair.indexOf("=");return {name:pair.slice(0,i),value:pair.slice(i+1),url:"http://127.0.0.1:3101"};}));
  await page.goto("/admin/konten/baru?type=teacher");
  await page.getByRole("button",{name:"Simpan draft",exact:true}).click();await expect(page.getByLabel("Nama",{exact:true})).toBeFocused();await expect(page.getByText("Nama wajib diisi.",{exact:true})).toBeVisible();
  await page.getByLabel("Nama",{exact:true}).fill("Guru uji pemulihan");page.once("dialog",d=>d.accept());await page.reload();
  await page.getByRole("button",{name:"Pulihkan isian",exact:true}).click();await expect(page.getByLabel("Nama",{exact:true})).toHaveValue("Guru uji pemulihan");
  await page.getByLabel("Jabatan",{exact:true}).fill("Guru Bahasa");await page.getByLabel("Profil singkat",{exact:true}).fill("Mendampingi pembelajaran siswa.");
  await page.getByRole("button",{name:"Simpan draft",exact:true}).click();await expect(page).toHaveURL(/\/admin\/konten\/[a-f0-9-]{36}$/);id=new URL(page.url()).pathname.split("/").at(-1)!;
  await page.getByLabel("Nama",{exact:true}).fill("Guru tersimpan otomatis");
  await expect.poll(async()=> (await cms.get(fixture.headers,id!)).payload.name).toBe("Guru tersimpan otomatis");
  await expect(page.getByRole("button",{name:"Ajukan tinjauan",exact:true})).toBeEnabled();expect((await cms.get(fixture.headers,id)).published_revision_id).toBeNull();
  await page.getByRole("button",{name:"Pratinjau desktop / ponsel",exact:true}).click();const dialog=page.getByRole("dialog",{name:"Pratinjau website"});await expect(dialog).toBeVisible();
  await expect(page.frameLocator('iframe[title="Tampilan website sebelum diterbitkan"]').getByRole("heading",{name:"Guru tersimpan otomatis"}).first()).toBeVisible();
  await dialog.getByRole("button",{name:"Ponsel",exact:true}).click();await expect(dialog.locator("iframe")).toHaveAttribute("width","360");await dialog.getByRole("button",{name:"Tutup pratinjau"}).click();
  await page.setViewportSize({width:360,height:800});await expect(page.getByRole("button",{name:"Simpan draft",exact:true})).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }finally{
  const [rows]=await pool.execute<any[]>("SELECT id FROM cms_entries WHERE owner_id=?",[fixture.user.id]);for(const row of rows){await pool.execute("UPDATE cms_entries SET current_revision_id=NULL,published_revision_id=NULL WHERE id=?",[row.id]);await pool.execute("DELETE FROM cms_revisions WHERE entry_id=?",[row.id]);await pool.execute("DELETE FROM cms_entries WHERE id=?",[row.id]);}
  await fixture.cleanup();await pool.end();
 }
});
