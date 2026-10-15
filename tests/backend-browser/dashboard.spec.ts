import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createDatabasePool } from "../../lib/server/database-config.mjs";
import { createSchoolAuth } from "../../lib/server/auth-core.mjs";
import { operatorFixture } from "../backend/helpers.mjs";

test("login never sends credentials in a URL when JavaScript is unavailable", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:3101/admin/login");
    await page.getByLabel("Email", { exact: true }).fill("unused@example.test");
    await page.getByLabel("Password", { exact: true }).fill("not-a-real-password");
    const [response] = await Promise.all([page.waitForEvent("response", { predicate: response => response.request().isNavigationRequest() }), page.getByRole("button", { name: "Masuk", exact: true }).click()]);
    expect(response.request().method()).toBe("POST");
    expect(new URL(response.url()).search.length === 0).toBe(true);
  } finally { await context.close(); }
});

test("configured empty database shows an empty public list without sample fallback", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/informasi/berita");
  await expect(page.locator("main")).toContainText("Belum ada berita yang diterbitkan.");
  await expect(page.locator(".news-card")).toHaveCount(0);
  await expect(page.locator(".sample-notice")).toHaveCount(0);
  await page.goto("/");
  await expect(page.locator("#informasi")).toContainText("Belum ada berita yang diterbitkan.");
  expect(errors).toEqual([]);
});

test("login with recovery, write, review, publish, protect draft and archive in production server", async ({ page, request, context }) => {
  const env = { ...process.env, DATABASE_NAME: "annur_test", DATABASE_PORT: "3308", BETTER_AUTH_URL: "http://127.0.0.1:3101", AUTH_TRUSTED_IP_HEADER: "x-test-client-ip" };
  const pool = createDatabasePool(env, { test: true });
  const auth = createSchoolAuth(pool, env);
  const fixture = await operatorFixture(auth, pool, env, "super_admin");
  let id = "";
  const slug = `browser-${randomUUID()}`;
  const title = `Berita madrasah ${randomUUID().slice(0, 8)}`;
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto("/admin/berita");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.screenshot({ path: ".npm-cache/admin-login.png", fullPage: true });
    await page.getByLabel("Email", { exact: true }).fill(fixture.user.email);
    await page.getByLabel("Password", { exact: true }).fill(fixture.password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/mfa$/);
    await page.getByRole("button", { name: "Gunakan kode pemulihan" }).click();
    await page.getByLabel("Kode pemulihan", { exact: true }).fill(fixture.backupCodes[0]);
    await page.getByRole("button", { name: "Verifikasi dan lanjutkan" }).click();
    await expect(page).toHaveURL(/\/admin\/berita$/);
    await page.getByRole("link", { name: "Tulis berita", exact: true }).click();
    await page.getByLabel("Judul", { exact: true }).fill(title);
    await page.getByLabel("Alamat berita", { exact: true }).fill(slug);
    await page.getByLabel("Ringkasan", { exact: true }).fill("Berita pengujian untuk memverifikasi alur publikasi madrasah.");
    await page.getByLabel("Kategori", { exact: true }).fill("Pengujian");
    await page.getByLabel("Deskripsi gambar", { exact: true }).fill("Ilustrasi ruang kelas madrasah");
    await page.getByLabel("Isi blok 1", { exact: true }).fill("Isi publik yang telah disiapkan untuk pengujian.");
    await page.getByRole("button", { name: "Tambah subjudul", exact: true }).click();
    await page.getByLabel("Isi blok 2", { exact: true }).fill("Kegiatan membaca bersama");
    await page.getByRole("button", { name: "Tambah paragraf", exact: true }).click();
    await page.getByLabel("Isi blok 3", { exact: true }).fill("Siswa berlatih membaca dan berbagi gagasan bersama.");
    await page.getByRole("button", { name: "Simpan draft", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/berita\/[0-9a-f-]{36}$/);
    id = new URL(page.url()).pathname.split("/").pop()!;
    await page.getByText("Riwayat revisi (1)", { exact: true }).click();
    await expect(page.getByLabel("Pulihkan sebagai draft").locator("option").first()).toContainText("Operator pengujian");
    expect((await request.get(`/informasi/berita/${slug}`)).status()).toBe(404);
    const privateResponse = await request.get(`/admin/berita/${id}/preview`, { maxRedirects: 0 });
    expect(privateResponse.status()).toBe(307);
    expect(privateResponse.headers()["cache-control"]).toContain("no-store");
    await page.getByRole("link", { name: "Preview draft tersimpan", exact: true }).click();
    await expect(page.locator("main")).toContainText(title);
    await expect(page.getByRole("heading", { name: "Kegiatan membaca bersama" })).toBeVisible();
    await page.getByRole("link", { name: "Kembali menyunting", exact: true }).click();
    await page.getByRole("button", { name: "Ajukan tinjauan", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Dalam tinjauan", exact: true })).toBeVisible();
    await page.screenshot({ path: ".npm-cache/admin-review.png", fullPage: true });
    await page.getByRole("button", { name: "Terbitkan versi ini", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Sudah terbit", exact: true })).toBeVisible();
    expect(await (await request.get(`/informasi/berita/${slug}`)).text()).toContain(title);
    expect(await (await request.get("/informasi/berita")).text()).toContain(title);
    expect(await (await request.get("/")).text()).toContain(title);
    const privateTitle = "Revisi privat yang belum diterbitkan";
    await page.getByLabel("Judul", { exact: true }).fill(privateTitle);
    await page.getByRole("button", { name: "Simpan draft", exact: true }).click();
    await expect(page.getByLabel("Judul", { exact: true })).toHaveValue(privateTitle);
    await expect(page.getByRole("heading", { name: "Draft", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Simpan draft", exact: true })).toBeEnabled();
    await expect(page.locator(".admin-unsaved")).toHaveCount(0);
    const publicHtml = await (await request.get(`/informasi/berita/${slug}`)).text();
    expect(publicHtml).toContain(title);
    expect(publicHtml).not.toContain(privateTitle);
    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: ".npm-cache/admin-editor-mobile.png", fullPage: true });
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Arsipkan berita", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Diarsipkan", exact: true })).toBeVisible();
    expect((await request.get(`/informasi/berita/${slug}`)).status()).toBe(404);
    expect(await (await request.get("/informasi/berita")).text()).not.toContain(title);
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    expect(errors).toEqual([]);
  } finally {
    if (id) {
      await pool.execute("UPDATE articles SET current_revision_id = NULL, published_revision_id = NULL WHERE id = ?", [id]);
      await pool.execute("DELETE FROM article_revisions WHERE article_id = ?", [id]);
      await pool.execute("DELETE FROM articles WHERE id = ?", [id]);
    }
    await fixture.cleanup(); await pool.end();
  }
});
