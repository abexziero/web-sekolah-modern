import { expect, test } from "@playwright/test";

test("homepage summaries match the navbar and clearly label sample content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#informasi .news-card")).toHaveCount(3);
  await expect(page.locator("#informasi")).toContainText("Konten contoh");
  await expect(page.locator("#akses-informasi")).toContainText("Program Pendidikan");
  await expect(page.locator("#akses-informasi")).toContainText("Ekstrakurikuler");
  await expect(page.locator("#prestasi")).toContainText("Konten contoh");
  await expect(page.locator('#laboratorium a')).toHaveAttribute("href", "/fasilitas/laboratorium");
  const links = await page.locator("#konten a[href^='/']").evaluateAll(items => items.map(item => item.getAttribute("href")!));
  expect(links).toContain("/informasi/berita");
  expect(links).toContain("/prestasi/akademik");
});

test("every topic has relevant readable sample content and downloads are real", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/profil/sambutan-kepala", "/profil/sejarah", "/profil/visi-misi", "/profil/struktur-organisasi", "/layanan/program-pendidikan", "/layanan/ekstrakurikuler", "/informasi/berita", "/informasi/pengumuman", "/informasi/agenda", "/prestasi/akademik", "/prestasi/nonakademik"]) {
    await page.goto(path);
    await expect(page.locator("#konten")).toContainText("Konten contoh");
    await expect(page.locator(".topic-body")).not.toContainText("Informasi belum tersedia");
    expect((await page.locator(".topic-body").innerText()).length).toBeGreaterThan(250);
  }
  await page.goto("/layanan/unduhan");
  const downloads = page.locator("a[download]");
  expect(await downloads.count()).toBeGreaterThanOrEqual(2);
  for (const href of await downloads.evaluateAll(items => items.map(item => item.getAttribute("href")!))) {
    const response = await request.get(href);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("CONTOH");
  }
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
