import test from "node:test";
import assert from "node:assert/strict";

test("CMS validates types, content, URLs and role-free payloads", async () => {
  const { parseCmsInput } = await import("../../lib/cms-validation.ts");
  const page = { title: "Profil sekolah", description: "Informasi madrasah", image: "school.jpg", alt: "Gerbang sekolah", blocks: [{ type: "paragraph", text: "Madrasah tempat belajar." }], example: true };
  assert.equal(parseCmsInput("page", { ...page, role: "super_admin" }).role, undefined);
  assert.throws(() => parseCmsInput("unknown", page));
  assert.throws(() => parseCmsInput("page", { ...page, title: "a".repeat(181) }));
  assert.throws(() => parseCmsInput("page", { ...page, blocks: [{ type: "paragraph", text: "<script>alert(1)</script>" }] }));
  assert.throws(() => parseCmsInput("settings", { name: "School", whatsapp: "javascript:alert(1)" }));
});
