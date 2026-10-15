import { expect, test } from "@playwright/test";

test("aside is limited to articles and topic pages have no repeated contact CTA", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/profil/visi-misi", "/fasilitas/laboratorium", "/layanan/faq", "/prestasi/akademik", "/informasi/berita", "/informasi/galeri", "/profil/guru-tenaga-kependidikan"]) {
    await page.goto(path);
    await expect(page.locator(".topic-aside")).toHaveCount(0);
    await expect(page.locator("main").getByRole("link", { name: "Hubungi Madrasah", exact: true })).toHaveCount(0);
  }
  await page.goto("/profil/visi-misi");
  expect((await page.locator(".topic-main").boundingBox())!.width).toBeLessThanOrEqual(800);
  await page.goto("/informasi/berita");
  expect((await page.locator(".news-grid").boundingBox())!.width).toBeGreaterThan(1000);
  await page.goto("/informasi/berita/budaya-literasi");
  await expect(page.locator(".topic-aside")).toHaveCount(1);
  await expect(page.locator("main").getByRole("link", { name: "Hubungi Madrasah", exact: true })).toHaveCount(0);
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "Kontak", exact: true })).toBeVisible();
});

test("new submenu pages start at the top after leaving a scrolled page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  for (const title of ["Sambutan Kepala Madrasah", "Sejarah Madrasah", "Visi & Misi"]) {
    await page.evaluate(() => window.scrollTo({ top: 3000, behavior: "instant" }));
    const nav = page.locator(".desktop-nav");
    await nav.getByRole("button", { name: "Profil Madrasah", exact: true }).click();
    await nav.getByRole("link", { name: title, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator("#topic-heading .split-word").first()).toHaveCSS("transform", "none");
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator(".topic-figure img")).toBeVisible();
  }
});

test("news cards open distinct complete articles and unknown articles return 404", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/informasi/berita");
  await expect(page.locator(".news-grid .news-card")).toHaveCount(3);
  const link = page.locator(".news-grid .news-card").first().getByRole("link", { name: /Baca artikel/ });
  const href = await link.getAttribute("href");
  expect(href).toBe("/informasi/berita/budaya-literasi");
  await link.click();
  await expect(page).toHaveURL(/\/informasi\/berita\/budaya-literasi$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Membangun kebiasaan membaca");
  await expect(page.locator(".article-body")).toContainText("Mulailah dari bacaan");
  await expect(page.locator("main")).toContainText("Konten contoh");
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole("link", { name: "Kembali ke berita", exact: true }).click();
  await expect(page).toHaveURL(/\/informasi\/berita$/);
  expect((await request.get("/informasi/berita/tidak-ada")).status()).toBe(404);
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
