import test from "node:test";
import assert from "node:assert/strict";
import { readDatabaseConfig } from "../../lib/server/database-config.mjs";
import { parseNewsInput } from "../../lib/news-validation.ts";
import { assertOperatorPassword } from "../../lib/server/accounts.mjs";

const env = { DATABASE_HOST: "127.0.0.1", DATABASE_PORT: "3307", DATABASE_NAME: "annur_test", DATABASE_USER: "annur", DATABASE_PASSWORD: "test-password-with-length" };
const draft = { title: "Kegiatan literasi madrasah", slug: "kegiatan-literasi", excerpt: "Kegiatan membaca bersama untuk membangun budaya literasi.", category: "Literasi", image: "classroom.jpg", alt: "Ruang kelas madrasah", blocks: [{ type: "paragraph", text: "Siswa membaca dan berbagi gagasan bersama pendidik." }] };

test("operator password policy rejects empty recovery and invalid types", () => {
  for (const value of ["", undefined, null, 42, "short", "x".repeat(129)]) assert.throws(() => assertOperatorPassword(value));
  assert.doesNotThrow(() => assertOperatorPassword("x".repeat(16)));
});

test("database configuration uses UTC, non-root credentials and bounded pool", () => {
  const config = readDatabaseConfig(env);
  assert.equal(config.port, 3307);
  assert.equal(config.timezone, "Z");
  assert.equal(config.multipleStatements, false);
  assert.ok(config.connectionLimit <= 5);
});

test("invalid or missing database settings fail without exposing secrets", () => {
  for (const change of [{ DATABASE_PASSWORD: "" }, { DATABASE_PASSWORD: "CHANGE_ME" }, { DATABASE_PORT: "3307oops" }, { DATABASE_PORT: "0" }, { DATABASE_NAME: "bad; DROP DATABASE annur" }, { DATABASE_USER: "root" }, { DATABASE_HOST: "https://host" }]) {
    assert.throws(() => readDatabaseConfig({ ...env, ...change }), error => {
      assert.ok(!error.message.includes(env.DATABASE_PASSWORD));
      assert.ok(!error.message.includes("DROP DATABASE"));
      return true;
    });
  }
});

test("test database guard rejects development and production database names", () => {
  assert.doesNotThrow(() => readDatabaseConfig(env, { test: true }));
  assert.throws(() => readDatabaseConfig({ ...env, DATABASE_NAME: "annur" }, { test: true }));
});

test("remote database requires TLS certificate and hostname verification", () => {
  assert.throws(() => readDatabaseConfig({ ...env, DATABASE_HOST: "database.example" }));
  const config = readDatabaseConfig({ ...env, DATABASE_HOST: "database.example", DATABASE_SSL: "required" });
  assert.equal(config.ssl.rejectUnauthorized, true);
  assert.equal(config.ssl.verifyIdentity, true);
});

test("news parser keeps only validated content fields and trims text", () => {
  const result = parseNewsInput({ ...draft, title: ` ${draft.title} `, role: "super_admin", authorId: "other-user", status: "published" });
  assert.deepEqual(result, draft);
});

test("news parser rejects unsafe slugs, arbitrary images, invalid shapes and oversize content", () => {
  for (const change of [null, [], {}, { ...draft, slug: "../../admin" }, { ...draft, slug: "Capital-Letters" }, { ...draft, image: "https://tracker.example/image.jpg" }, { ...draft, image: "../secret" }, { ...draft, title: "a".repeat(181) }, { ...draft, excerpt: "too short" }, { ...draft, blocks: [] }, { ...draft, blocks: [{ type: "html", text: "<script>bad()</script>" }] }, { ...draft, blocks: [{ type: "paragraph", text: "x".repeat(5001) }] }, { ...draft, blocks: Array.from({ length: 41 }, () => ({ type: "paragraph", text: "Isi berita" })) }, { ...draft, blocks: Array.from({ length: 17 }, () => ({ type: "paragraph", text: "x".repeat(5000) })) }]) {
    assert.throws(() => parseNewsInput(change));
  }
});

test("news parser preserves plain text rather than interpreting HTML or deleting content", () => {
  const text = '<script>alert("xss")</script> & kutipan';
  assert.equal(parseNewsInput({ ...draft, blocks: [{ type: "paragraph", text }] }).blocks[0].text, text);
});

test("news parser accepts exact upper limits", () => {
  const result = parseNewsInput({ ...draft, title: "x".repeat(180), excerpt: "x".repeat(400), category: "x".repeat(60), alt: "x".repeat(250), blocks: Array.from({ length: 16 }, () => ({ type: "paragraph", text: "x".repeat(5000) })) });
  assert.equal(result.blocks.length, 16);
});
