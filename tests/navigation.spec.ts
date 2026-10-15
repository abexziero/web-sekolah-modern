import { expect, test } from "@playwright/test";

test("native menu opened before hydration remains open when scripts initialize", async ({ page }) => {
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/*.js", async route => { await ready; await route.continue(); });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const profile = page.locator(".desktop-nav").getByRole("button", { name: "Profil Madrasah", exact: true });
  await profile.focus(); await page.keyboard.press("Enter");
  await expect(profile.locator("..")).toHaveAttribute("open");
  release();
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await expect(profile.locator("..")).toHaveAttribute("open");
  await page.keyboard.press("Escape");
  await expect(profile.locator("..")).not.toHaveAttribute("open");
});

test("reference navbar opens on hover, fades without translation and closes on exit", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator(".desktop-nav");
  const profile = nav.getByRole("button", { name: "Profil Madrasah", exact: true });
  await profile.hover();
  const group = profile.locator("..");
  await expect(group).toHaveAttribute("open");
  const panel = group.locator(".nav-submenu");
  await expect(panel).toHaveCSS("opacity", "1");
  await expect(panel).toHaveCSS("transform", "none");
  await expect(profile.locator("svg")).toHaveCSS("transform", "none");
  await page.mouse.move(0, 400);
  await expect(group).not.toHaveAttribute("open");
  await profile.focus();
  await page.keyboard.press("Enter");
  await expect(panel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(group).not.toHaveAttribute("open");
  await expect(profile).toBeFocused();
});

test("all approved menu destinations render real pages and unknown paths return 404", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const nav = page.locator(".desktop-nav");
  await expect(nav).not.toContainText(/Keuangan|Alumni/);
  const hrefs = await nav.locator(".nav-submenu a").evaluateAll(links => links.map(link => link.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThanOrEqual(17);
  for (const href of hrefs) {
    expect(href).toMatch(/^\/[a-z-]+\/[a-z-]+$/);
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
  await nav.getByRole("button", { name: "Profil Madrasah", exact: true }).click();
  await nav.getByRole("link", { name: "Visi & Misi", exact: true }).click();
  await expect(page).toHaveURL(/\/profil\/visi-misi$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Visi & Misi");
  await expect(page.locator('.nav-submenu a[aria-current="page"]')).toHaveCount(2);
  await expect(page.locator(".site-header")).not.toHaveClass(/at-top/);
  expect((await request.get("/profil/tidak-ada")).status()).toBe(404);
});

test("topic navigation refreshes motion and Escape stays closed after focusing a submenu link", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/profil/visi-misi");
  await expect(page.locator("#topic-heading .split-word").first()).toBeAttached();
  const nav = page.locator(".desktop-nav");
  const profile = nav.getByRole("button", { name: "Profil Madrasah", exact: true });
  await profile.focus();
  await page.keyboard.press("Enter");
  await nav.getByRole("link", { name: "Sejarah Madrasah", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(profile.locator("..")).not.toHaveAttribute("open");
  await expect(profile).toBeFocused();
  await nav.getByRole("button", { name: "Fasilitas", exact: true }).click();
  await nav.getByRole("link", { name: "Laboratorium Komputer", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-active-section", "fasilitas");
  await expect(page.locator("#topic-heading .split-word").first()).toBeAttached();
  await nav.getByRole("link", { name: "Beranda", exact: true }).click();
  await expect(page.locator(".hero-line-mask").first()).toBeAttached();
  await expect(page.locator("html")).toHaveAttribute("data-active-section", "beranda");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Laboratorium Komputer");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#topic-heading .split-word")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("mobile fade closes during reduced-motion changes and topic FAQ remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Menu navigasi" });
  await toggle.click();
  await expect(page.locator("#mobile-navigation")).toHaveCSS("opacity", "1");
  await expect(page.locator("#mobile-navigation")).toHaveCSS("animation-duration", "0.4s");
  await toggle.click();
  await expect(page.locator("#navigation-menu")).toHaveAttribute("data-closing");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#navigation-menu")).not.toHaveAttribute("open");
  await toggle.click();
  const nav = page.locator("#mobile-navigation");
  await nav.getByRole("button", { name: "Layanan", exact: true }).click();
  await nav.getByRole("link", { name: "Pertanyaan Umum", exact: true }).click();
  await expect(page).toHaveURL(/\/layanan\/faq$/);
  await page.getByText("Di mana lokasi madrasah?", { exact: true }).click();
  await expect(page.locator(".faq-list details[open]")).toContainText("Tanah Merah");
  for (const width of [360, 768, 1024, 1100, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
