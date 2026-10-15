import {test,expect} from "@playwright/test";
import {createDatabasePool} from "../../lib/server/database-config.mjs";
import {createSchoolAuth} from "../../lib/server/auth-core.mjs";
import {operatorFixture} from "../backend/helpers.mjs";

test("module navigation, automatic URL, visual picker, unsaved guard and recoverable CRUD",async({page,context})=>{
 const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3101",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"},pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),fixture=await operatorFixture(auth,pool,env,"super_admin");let id:string|undefined;
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 try{
  await context.addCookies(fixture.cookies.split("; ").map(pair=>{const i=pair.indexOf("=");return {name:pair.slice(0,i),value:pair.slice(i+1),url:"http://127.0.0.1:3101"};}));
  await page.goto("/admin");await expect(page.getByRole("heading",{name:"Ringkasan website."})).toBeVisible();
  await page.getByRole("navigation",{name:"Navigasi operator"}).getByRole("link",{name:"Guru",exact:true}).click();
  await page.getByRole("link",{name:"Tambah konten",exact:true}).click();
  await expect(page.getByLabel("Jenis konten")).toHaveCount(0);
  await page.getByLabel("Nama",{exact:true}).fill("Guru pengujian dashboard");
  await page.getByLabel("Jabatan",{exact:true}).fill("Guru Bahasa Indonesia");
  await page.getByLabel("Profil singkat",{exact:true}).fill("Mendampingi pembelajaran literasi dan karakter siswa.");
  await expect(page.getByText("Ditampilkan di: /profil/guru-tenaga-kependidikan",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Pilih gambar",exact:true}).click();
  const picker=page.getByRole("dialog",{name:"Pilih gambar",exact:true});await expect(picker).toBeVisible();
  await picker.getByRole("button",{name:"Ilustrasi guru",exact:true}).click();await expect(picker).not.toBeVisible();
  await page.getByLabel("Teks alternatif",{exact:true}).fill("Ilustrasi guru madrasah");
  page.once("dialog",dialog=>dialog.dismiss());await page.getByRole("link",{name:"Kembali ke daftar",exact:true}).click();await expect(page).toHaveURL(/\/baru\?type=teacher$/);
  page.once("dialog",dialog=>dialog.dismiss());await page.getByRole("button",{name:"Keluar",exact:true}).click();
  await expect(page.getByRole("button",{name:"Simpan draft",exact:true})).toBeEnabled();
  page.once("dialog",dialog=>dialog.dismiss());await page.evaluate(()=>history.back());
  await expect(page).toHaveURL(/\/baru\?type=teacher$/);
  await page.getByRole("button",{name:"Simpan draft",exact:true}).click();await expect(page).toHaveURL(/\/admin\/konten\/[a-f0-9-]{36}$/);id=new URL(page.url()).pathname.split("/").at(-1);
  await page.getByRole("link",{name:"Kembali ke daftar",exact:true}).click();
  await page.getByLabel("Cari konten",{exact:true}).fill("Tidak ada guru ini");await page.getByRole("button",{name:"Cari",exact:true}).click();await expect(page.getByRole("heading",{name:"Konten tidak ditemukan."})).toBeVisible();
  await page.getByLabel("Cari konten",{exact:true}).fill("Guru pengujian dashboard");await page.getByRole("button",{name:"Cari",exact:true}).click();await page.getByRole("combobox",{name:"Status",exact:true}).selectOption("draft");
  const row=page.getByRole("row").filter({hasText:"Guru pengujian dashboard"});await expect(row.getByRole("link",{name:"Lihat",exact:true})).toBeVisible();
  page.once("dialog",dialog=>dialog.accept());await row.getByRole("button",{name:"Hapus",exact:true}).click();await expect(row).toHaveCount(0);
  await page.getByRole("link",{name:"Sampah",exact:true}).click();const trashed=page.getByRole("row").filter({hasText:"Guru pengujian dashboard"});await expect(trashed).toBeVisible();
  await trashed.getByRole("button",{name:"Pulihkan",exact:true}).click();await expect(trashed).toHaveCount(0);
  await page.getByRole("link",{name:"Daftar aktif",exact:true}).click();await expect(page.getByRole("row").filter({hasText:"Guru pengujian dashboard"})).toContainText("Draft");
  await page.setViewportSize({width:360,height:800});await page.getByRole("button",{name:"Menu pengelolaan"}).click();await expect(page.getByRole("navigation",{name:"Navigasi operator"})).toBeVisible();
  await page.getByRole("navigation",{name:"Navigasi operator"}).getByRole("link",{name:"Halaman",exact:true}).click();await expect(page.getByRole("button",{name:"Menu pengelolaan"})).toHaveAttribute("aria-expanded","false");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:".npm-cache/dashboard-modules-mobile.png",fullPage:true});expect(errors).toEqual([]);
 }finally{
  const [rows]=await pool.execute<any[]>("SELECT id FROM cms_entries WHERE owner_id=?",[fixture.user.id]);
  for(const row of rows){await pool.execute("UPDATE cms_entries SET current_revision_id=NULL,published_revision_id=NULL WHERE id=?",[row.id]);await pool.execute("DELETE FROM cms_revisions WHERE entry_id=?",[row.id]);await pool.execute("DELETE FROM cms_entries WHERE id=?",[row.id]);}
  await fixture.cleanup();await pool.end();
 }
});
