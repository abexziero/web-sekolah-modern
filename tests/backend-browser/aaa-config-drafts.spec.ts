import {test,expect} from "@playwright/test";
import {createDatabasePool} from "../../lib/server/database-config.mjs";
import {createSchoolAuth} from "../../lib/server/auth-core.mjs";
import {createCmsService} from "../../lib/server/cms-core.mjs";
import {createMediaService} from "../../lib/server/media-core.mjs";
import {createLocalMediaStorage} from "../../lib/server/media-storage.mjs";
import {defaultHome} from "../../lib/cms-defaults";
import {defaultSettings,defaultNavigation} from "../../lib/cms-seed";
import {operatorFixture} from "../backend/helpers.mjs";

async function fixtureFor(context:any){const env={...process.env,DATABASE_NAME:"annur_test",DATABASE_PORT:"3308",BETTER_AUTH_URL:"http://127.0.0.1:3101",AUTH_TRUSTED_IP_HEADER:"x-test-client-ip"},pool=createDatabasePool(env,{test:true}),auth=createSchoolAuth(pool,env),fixture=await operatorFixture(auth,pool,env,"super_admin");await context.addCookies(fixture.cookies.split("; ").map(pair=>{const i=pair.indexOf("=");return {name:pair.slice(0,i),value:pair.slice(i+1),url:"http://127.0.0.1:3101"};}));return {pool,auth,fixture,cms:createCmsService(pool,auth)};}
async function cleanup({pool,auth,fixture}:Awaited<ReturnType<typeof fixtureFor>>){const [rows]=await pool.execute<any[]>("SELECT id FROM cms_entries WHERE owner_id=?",[fixture.user.id]);for(const row of rows){await pool.execute("DELETE m FROM cms_revision_media m JOIN cms_revisions r ON r.id=m.revision_id WHERE r.entry_id=?",[row.id]);await pool.execute("UPDATE cms_entries SET current_revision_id=NULL,published_revision_id=NULL WHERE id=?",[row.id]);await pool.execute("DELETE FROM cms_revisions WHERE entry_id=?",[row.id]);await pool.execute("DELETE FROM cms_entries WHERE id=?",[row.id]);}const [files]=await pool.execute<any[]>("SELECT id FROM media WHERE uploaded_by=?",[fixture.user.id]);for(const file of files){await pool.execute("DELETE FROM media WHERE id=?",[file.id]);await createLocalMediaStorage().remove(file.id);}await fixture.cleanup();await pool.end();}

test("initial drafts preserve the landing page, navigation and footer without leaking draft content",async({page,context})=>{
 const setup=await fixtureFor(context);
 try{await page.goto("/");const home=structuredClone(defaultHome);home.copy[1].text="PRIVATE HERO NOT PUBLISHED";const nav=structuredClone(defaultNavigation);nav.items[1].label="PRIVATE MENU";for(const entry of [{type:"settings",key:"main",payload:{...defaultSettings,shortName:"PRIVATE IDENTITY",email:"private-test@example.test"}},{type:"navigation",key:"main",payload:nav},{type:"home",key:"main",payload:home}]){const id=await setup.cms.save(setup.fixture.headers,{id:undefined,version:undefined,...entry});await page.goto(`/admin/konten/${id}`);await page.getByRole("button",{name:"Simpan draft",exact:true}).click();await expect(page.getByRole("button",{name:"Simpan draft",exact:true})).toBeEnabled();}await page.goto("/");await expect(page.locator(".site-header .nav-group").first()).toBeVisible();await expect(page.locator(".hero")).toBeVisible();await expect(page.locator(".site-footer")).toContainText("Akses Cepat");expect(await page.content()).not.toContain("PRIVATE HERO NOT PUBLISHED");expect(await page.content()).not.toContain("PRIVATE MENU");expect(await page.content()).not.toContain("private-test@example.test");}
 finally{await cleanup(setup);}
});

test("home editor keeps add and undo available after deleting the last card",async({page,context})=>{
 const setup=await fixtureFor(context);
 try{
  const home=structuredClone(defaultHome);home.cards=home.cards.filter(card=>card.section!=="facility").concat(defaultHome.cards.filter(card=>card.section==="facility").slice(0,1));
  const id=await setup.cms.save(setup.fixture.headers,{id:undefined,version:undefined,type:"home",key:"main",payload:home});
  await page.goto("/admin/konten/baru?type=home");await expect(page).toHaveURL(new RegExp(`/admin/konten/${id}$`));
  const editor=page.getByRole("tabpanel");expect(await editor.locator("textarea").count()).toBeLessThan(20);
  await page.getByRole("tab",{name:"Fasilitas",exact:true}).click();
  const cards=editor.locator("details.admin-panel");await cards.locator(":scope > summary").click();await cards.locator(".cms-list-item > summary").click();
  await cards.getByRole("button",{name:"Hapus item",exact:true}).click();await expect(cards.locator(".cms-list-item")).toHaveCount(0);
  await expect(cards.getByRole("button",{name:/^Tambah /})).toBeVisible();await cards.getByRole("button",{name:"Batalkan penghapusan",exact:true}).click();await expect(cards.locator(".cms-list-item")).toHaveCount(1);
  await cards.getByRole("button",{name:/^Tambah /}).click();await expect(cards.locator(".cms-list-item")).toHaveCount(2);
  await expect(cards.getByRole("button",{name:"Batalkan penghapusan",exact:true})).toHaveCount(0);
  page.once("dialog",dialog=>dialog.accept());await page.goto("/admin");
 }finally{await cleanup(setup);}
});

test("initial content import creates editable example collections and a private PDF idempotently",async({page,context,request})=>{
 const setup=await fixtureFor(context);
 try{await page.goto("/admin/konten");await page.getByText("Persiapan website pertama kali",{exact:true}).click();await page.getByRole("button",{name:"Siapkan konten awal sebagai draft"}).click();await expect(page.getByRole("link",{name:"Panduan informasi (contoh)",exact:true})).toBeVisible();const rows=await setup.cms.list(setup.fixture.headers);for(const type of ["home","settings","navigation","page","teacher","album","faq","event","announcement","document"])expect(rows.some((row:any)=>row.type===type&&row.status==="draft")).toBe(true);const doc=rows.find((row:any)=>row.type==="document")!;expect((await request.get(`/media/${doc.payload.mediaId}`)).status()).toBe(404);const before=rows.length;await Promise.all([page.waitForResponse(response=>response.request().method()==="POST"&&response.url().endsWith("/admin/konten")),page.getByRole("button",{name:"Siapkan konten awal sebagai draft"}).click()]);expect((await setup.cms.list(setup.fixture.headers)).length).toBe(before);const album=rows.find((row:any)=>row.type==="album")!;await page.goto(`/admin/konten/${album.id}/preview`);await expect(page.locator("main")).toContainText("Konten contoh");}
 finally{await cleanup(setup);}
});
