import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("footer stays painted above pinned section backdrops", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".pin-spacer").first()).toBeAttached();
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  const footer = page.locator(".site-footer");
  await expect(footer).toBeInViewport();
  await expect(footer.locator("[data-reveal]").first()).toHaveCSS("opacity", "1");
  const screenshot = await footer.screenshot();
  const pixel = await sharp(screenshot).extract({ left: 8, top: 8, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
  expect([...pixel]).toEqual([49, 89, 67]);
});

test("section subtitles are masked and photo depth follows scrolling with clean teardown", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await expect(page.locator("#profil .section-description .text-line-mask").first()).toBeAttached();
  const photo = page.locator("#laboratorium .photo-depth");
  await expect(photo).toBeAttached();
  const start = await photo.evaluate(el => el.getBoundingClientRect().top + scrollY - 700);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), start);
  await page.waitForTimeout(800);
  const before = await photo.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42);
  await page.evaluate(y => window.scrollTo({ top: y + 350, behavior: "instant" }), start);
  await expect.poll(() => photo.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42)).toBeLessThan(before - 8);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(photo).toHaveCSS("transform", "none");
  await expect(page.locator(".section-description .text-line-mask")).toHaveCount(0);
  await expect(page.locator("#laboratorium")).toHaveCSS("opacity", "1");
});

test("hero content holds while the next section slides over it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".hero-line").first()).toHaveCSS("transform", "none");
  const before = await page.locator("#hero-heading").evaluate(el => el.getBoundingClientRect().top);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(650);
  const after = await page.locator("#hero-heading").evaluate(el => el.getBoundingClientRect().top);
  expect(Math.abs(after - before)).toBeLessThan(40);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hero .section-scene")).toHaveCSS("position", "relative");
});

test("direct hash navigation lands on contact after initial motion setup", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#kontak", { waitUntil: "networkidle" });
  await expect(page.locator("#kontak")).toBeInViewport();
  await expect(page.locator("#kontak")).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Kontak", exact: true })).toHaveAttribute("aria-current", "location");
  await expect(page).toHaveURL(/#kontak$/);
});

test("live motion preference preserves the reader position after a deep link", async ({ page }) => {
  await page.goto("/#kontak", { waitUntil: "networkidle" });
  await expect(page.locator("#kontak")).toBeInViewport();
  const original = await page.evaluate(() => scrollY);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".pin-spacer").first()).toBeAttached();
  await expect(page.locator("#kontak")).toBeInViewport();
  await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), original)).toBeLessThan(3);
  await expect(page.locator("#kontak")).toBeFocused();
});

test("scroll state updates navbar location and reading progress", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect(nav.getByRole("link", { name: "Beranda", exact: true })).toHaveAttribute("aria-current", "location");
  await page.locator("#fasilitas").scrollIntoViewIfNeeded();
  await expect(nav.getByRole("button", { name: "Fasilitas", exact: true })).toHaveAttribute("data-active", "true");
  await expect.poll(() => page.evaluate(() => Number(getComputedStyle(document.documentElement).getPropertyValue("--scroll-progress")))).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#kontak").scrollIntoViewIfNeeded();
  await expect(nav.getByRole("link", { name: "Kontak", exact: true })).toHaveAttribute("aria-current", "location");
});

test("masked hero text survives responsive reflow and live reduced motion", async ({ page }) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(page.locator(".hero-line-mask").first()).toBeAttached();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(heading).toContainText("Melangkah berkarakter");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hero-line-mask")).toHaveCount(0);
  await expect(heading).toBeVisible();
  expect(await heading.evaluate(el => getComputedStyle(el).opacity)).toBe("1");
});

test("card pointer and keyboard feedback cleans up under reduced motion", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  const card = page.locator("#laboratorium");
  const icon = card.locator(".experience-content > svg");
  await card.hover();
  await expect(icon).not.toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(icon).toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.mouse.move(0, 0);
  await card.getByRole("link").focus();
  await expect(icon).not.toHaveCSS("transform", "none");
});

test("contact strip sits inside the full-screen hero without covering its content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator(".hero .hero-strip")).toBeVisible();
    const geometry = await page.evaluate(() => {
      const hero = document.querySelector(".hero")!.getBoundingClientRect();
      const strip = document.querySelector(".hero-strip")!.getBoundingClientRect();
      const content = document.querySelector(".hero-summary")!.getBoundingClientRect();
      return { height: hero.height, bottomGap: hero.bottom - strip.bottom, contentGap: strip.top - content.bottom, width: document.documentElement.scrollWidth };
    });
    expect(geometry.height).toBeGreaterThanOrEqual(viewport.height);
    expect(Math.abs(geometry.bottomGap)).toBeLessThan(2);
    expect(geometry.contentGap).toBeGreaterThanOrEqual(12);
    expect(geometry.width).toBeLessThanOrEqual(viewport.width);
  }
});

test("incoming section covers the held outgoing section and cleanup restores native layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".pin-spacer").first()).toBeAttached();
  const point = await page.locator("#informasi").evaluate(el => el.getBoundingClientRect().top + scrollY - innerHeight / 2);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), point);
  await expect(page.locator("#profil .section-backdrop")).toHaveCSS("position", "fixed");
  await expect(page.locator("#profil .section-backdrop")).toHaveCSS("background-color", "rgb(234, 243, 236)");
  const before = await page.locator("#profil .section-backdrop").boundingBox();
  await page.evaluate(y => window.scrollTo({ top: y + 80, behavior: "instant" }), point);
  await expect.poll(() => page.locator("#profil .section-backdrop").evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(Math.round(before!.y));
  expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest("section")?.id)).toBe("informasi");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await page.getByRole("link", { name: "Kenali Madrasah", exact: true }).click();
  await expect(page.locator("#profile-heading")).toBeInViewport();
});

test("profile subtarget navigation stays visible during a stacked transition", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".pin-spacer").first()).toBeAttached();
  const point = await page.locator("#profil").evaluate(el => (el as HTMLElement).offsetTop + 500);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), point);
  await page.evaluate(() => { location.hash = "visi-misi"; });
  await expect(page).toHaveURL(/#visi-misi$/);
  await expect.poll(() => page.locator("#visi-misi").evaluate(el => {
    const rect = el.getBoundingClientRect();
    return rect.top >= 88 && rect.top < innerHeight - 44 && document.elementFromPoint(rect.left + 20, rect.top + 20)?.closest("article")?.id === "visi-misi";
  })).toBe(true);
  await page.evaluate(() => { location.hash = "guru"; });
  await expect(page.locator("#teacher-heading")).toBeInViewport();
});

test("gate background keeps full-size geometry during pinning and desktop resize", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".pin-spacer").first()).toBeAttached();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1100, height: 800 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.locator(".hero-image").evaluate(el => {
      const image = el.getBoundingClientRect();
      const hero = document.querySelector(".hero")!.getBoundingClientRect();
      return Math.abs(image.width - hero.width) < 2 && Math.abs(image.height - hero.height) < 2;
    })).toBe(true);
  }
});

test("nested navigation exposes real profile and facility targets and closes with Escape", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navigasi utama" });
  const profile = nav.getByRole("button", { name: "Profil Madrasah", exact: true });
  await profile.focus();
  await page.keyboard.press("Enter");
  await expect(nav.getByRole("link", { name: "Guru & Tenaga Kependidikan", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(profile).toBeFocused();
  await expect(nav.getByRole("link", { name: "Guru & Tenaga Kependidikan", exact: true })).not.toBeVisible();
  await nav.getByRole("button", { name: "Fasilitas", exact: true }).click();
  await nav.getByRole("link", { name: "Laboratorium Komputer", exact: true }).click();
  await expect(page).toHaveURL(/\/fasilitas\/laboratorium$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Laboratorium Komputer");
  await expect(page.locator("header details[open]")).toHaveCount(0);
});

test("gallery opens by keyboard and restores focus after closing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const photo = page.getByRole("link", { name: "Perbesar foto: Ruang kelas", exact: true });
  await photo.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Foto madrasah" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img")).toHaveAttribute("alt", "Ruang kelas MA Annur Samarinda");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(photo).toBeFocused();
  await photo.click();
  await dialog.getByRole("button", { name: "Tutup foto" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(photo).toBeFocused();
});

test("gallery resize survives live reduced motion without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect.poll(() => page.locator(".gallery-item").first().evaluate(el => Math.round(el.getBoundingClientRect().width))).toBe(367);
  await page.setViewportSize({ width: 500, height: 900 });
  const photo = page.locator(".gallery-item").first();
  await expect.poll(() => photo.evaluate(el => Math.round(el.getBoundingClientRect().width))).toBe(460);
  // Switch preference after the resize tween finishes, exercising its cleanup.
  await page.waitForTimeout(700);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect.poll(() => photo.evaluate(el => Math.round(el.getBoundingClientRect().width))).toBe(460);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("reference-style header is transparent on the hero and solid after scrolling", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header).toHaveCSS("position", "fixed");
  await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await page.mouse.wheel(0, 800);
  await expect(header).toHaveCSS("background-color", "rgb(250, 251, 248)");
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Beranda", exact: true }).click();
  await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test("public homepage has usable information without invented achievements", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tumbuh berilmu");
  await expect(page.getByRole("link", { name: "Kenali Madrasah", exact: true })).toHaveAttribute("href", "#profil");
  await expect(page.getByRole("link", { name: "Hubungi Sekolah", exact: true }).first()).toHaveAttribute("href", "#kontak");
  expect(await page.locator('a[href*="ppdb"], a[href*="rdm"], a[href*="localhost"]').count()).toBe(0);
  await expect(page.locator("#prestasi")).toContainText("Konten contoh · Arah pembinaan, bukan daftar juara");
  await page.getByText("Di mana lokasi madrasah?", { exact: true }).click();
  await expect(page.locator("details[open]")).toContainText("Tanah Merah");
  await expect(page.getByRole("heading", { name: "Mari terhubung." })).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile navigation closes, restores focus, and fits narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Menu navigasi" });
  await toggle.click();
  await expect(page.locator("#navigation-menu")).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("button", { name: "Profil Madrasah", exact: true }).click();
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Profil Madrasah", exact: true }).click();
  await expect(page.locator("#navigation-menu")).not.toHaveAttribute("open");
  await expect(page).toHaveURL(/\/profil\/madrasah$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("reduced motion disables smoothing and headings stay readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.locator("html").getAttribute("class") || "").not.toContain("lenis-smooth");
  await page.getByRole("link", { name: "Kenali Madrasah", exact: true }).click();
  await expect(page).toHaveURL(/#profil$/);
  const heading = page.locator("#profil h2");
  await expect(heading).toBeVisible();
  expect(await heading.evaluate(el => getComputedStyle(el).opacity)).toBe("1");
});

test("content remains readable with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.ANNUR_TEST_BASE_URL || "http://127.0.0.1:3000");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const profile = page.locator("#profil h2");
  await profile.scrollIntoViewIfNeeded();
  await expect(profile).toBeVisible();
  expect(await profile.evaluate(el => getComputedStyle(el).opacity)).toBe("1");
  await expect(page.getByRole("banner")).toHaveCSS("background-color", "rgb(250, 251, 248)");
  await page.getByText("Di mana lokasi madrasah?", { exact: true }).click();
  await expect(page.locator("details[open]")).toContainText("Tanah Merah");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole("button", { name: "Menu navigasi" }).click();
  await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeVisible();
  await expect(page.locator("#mobile-navigation")).toHaveCSS("transform", "none");
  await expect(page.locator("#mobile-navigation")).toHaveCSS("clip-path", "none");
  await expect(page.locator("#mobile-navigation")).toHaveCSS("opacity", "1");
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("button", { name: "Profil Madrasah", exact: true }).click();
  await expect(page.locator(".mobile-menu .nav-group[open] .nav-submenu")).toHaveCSS("transform", "none");
  await expect(page.locator(".mobile-menu .nav-group[open] .nav-submenu")).toHaveCSS("opacity", "1");
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Profil Madrasah", exact: true }).click();
  await expect(page).toHaveURL(/\/profil\/madrasah$/);
  await context.close();
});

test("touch devices use natural scrolling and all responsive widths fit", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 360, height: 800 } });
  const page = await context.newPage();
  await page.goto(process.env.ANNUR_TEST_BASE_URL || "http://127.0.0.1:3000");
  expect(await page.locator("html").getAttribute("class") || "").not.toContain("lenis");
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator("#kontak").scrollIntoViewIfNeeded();
  await expect(page.locator("#kontak [data-reveal]").last()).toHaveCSS("opacity", "1");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator("#kontak [data-reveal]").last()).toHaveCSS("opacity", "1");
  await context.close();
});

test("desktop scrolling reveals sections once and keeps them visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.mouse.wheel(0, 750);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await page.locator("#profil").scrollIntoViewIfNeeded();
  const block = page.locator("#profil [data-reveal]").first();
  await expect(block).toHaveCSS("opacity", "1");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(block).toHaveCSS("opacity", "1");
});

test("native hash and keyboard navigation interrupt smooth wheel inertia", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(50);
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Kontak", exact: true }).click();
  await expect(page).toHaveURL(/#kontak$/);
  await expect(page.locator("#kontak")).toBeInViewport();
  await expect(page.locator("#kontak")).toBeFocused();
  await page.evaluate(() => { window.scrollTo({ top: 0, behavior: "instant" }); document.activeElement instanceof HTMLElement && document.activeElement.blur(); });
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(50);
  await page.keyboard.press("Home");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("changing reduced motion cleans up smoothing and split text", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  await expect(page.locator("[data-split] .split-word")).toHaveCount(0);
  const profile = page.locator("#profil [data-reveal]").first();
  await expect(profile).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.getByRole("link", { name: "Kenali Madrasah", exact: true }).click();
  await expect(page.locator("#profil")).toBeInViewport();
});
