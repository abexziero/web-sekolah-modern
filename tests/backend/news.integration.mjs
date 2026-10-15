import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createDatabasePool } from "../../lib/server/database-config.mjs";
import { createSchoolAuth } from "../../lib/server/auth-core.mjs";
import { createNewsService } from "../../lib/server/news-core.mjs";
import { operatorFixture } from "./helpers.mjs";

test("news ownership, review, immutable publication, conflicts, archive and restore on MariaDB", async () => {
  const env = { ...process.env, DATABASE_NAME: "annur_test", DATABASE_PORT: "3308", BETTER_AUTH_URL: "http://127.0.0.1:3000", AUTH_TRUSTED_IP_HEADER: "x-test-client-ip" };
  const pool = createDatabasePool(env, { test: true });
  const auth = createSchoolAuth(pool, env);
  const news = createNewsService(pool, auth);
  const fixtures = [];
  const articleIds = [];
  try {
    const admin = await operatorFixture(auth, pool, env, "super_admin"); fixtures.push(admin);
    const editor = await operatorFixture(auth, pool, env, "editor"); fixtures.push(editor);
    const other = await operatorFixture(auth, pool, env, "editor"); fixtures.push(other);
    const input = { title: "Kegiatan membaca bersama", slug: `berita-${randomUUID()}`, excerpt: "Siswa membaca dan berbagi gagasan di lingkungan madrasah.", category: "Literasi", image: "classroom.jpg", alt: "Ilustrasi ruang kelas madrasah", blocks: [{ type: "paragraph", text: "Konten awal yang perlu ditinjau." }] };
    await assert.rejects(news.list(new Headers()));
    const id = await news.save(editor.headers, { input }); articleIds.push(id);
    let article = await news.get(editor.headers, id);
    assert.equal(article.history[0].saved_by_name, "Operator pengujian");
    const firstRevision = article.current_revision_id;
    assert.equal(await news.publicBySlug(input.slug), null);
    assert.ok(!(await news.list(other.headers)).some(item => item.id === id));
    await assert.rejects(news.get(other.headers, id));
    for (const action of ["publish", "archive", "return"]) await assert.rejects(news.transition(editor.headers, { id, version: article.version, action }));
    await assert.rejects(news.save(other.headers, { id, version: article.version, input }));
    await news.transition(editor.headers, { id, version: article.version, action: "submit" });
    article = await news.get(admin.headers, id);
    await assert.rejects(news.save(editor.headers, { id, version: article.version, input }));
    await news.transition(admin.headers, { id, version: article.version, action: "publish" });
    article = await news.get(editor.headers, id);
    assert.equal((await news.publicBySlug(input.slug)).title, input.title);
    const publicCard = (await news.listPublic()).find(item => item.slug === input.slug);
    assert.ok(!("blocks" in publicCard) && !("author_id" in publicCard), "Public cards should fetch only their safe summary fields");
    const versionBeforeSave = article.version;
    const edited = { ...input, title: "Judul revisi yang belum disetujui" };
    await news.save(editor.headers, { id, version: versionBeforeSave, input: edited });
    await assert.rejects(news.save(editor.headers, { id, version: versionBeforeSave, input }), /berubah/);
    assert.equal((await news.publicBySlug(input.slug)).title, input.title);
    article = await news.get(editor.headers, id);
    await assert.rejects(news.save(editor.headers, { id, version: article.version, input: { ...input, slug: "mengubah-url-terbit" } }), /Slug/);
    await news.transition(editor.headers, { id, version: article.version, action: "submit" });
    article = await news.get(admin.headers, id);
    await news.transition(admin.headers, { id, version: article.version, action: "return" });
    article = await news.get(admin.headers, id);
    await news.restore(admin.headers, { id, version: article.version, revisionId: firstRevision });
    article = await news.get(editor.headers, id);
    assert.equal(article.status, "draft");
    assert.equal(article.title, input.title);
    await news.transition(editor.headers, { id, version: article.version, action: "submit" });
    article = await news.get(admin.headers, id);
    await news.transition(admin.headers, { id, version: article.version, action: "publish" });
    article = await news.get(admin.headers, id);
    await news.transition(admin.headers, { id, version: article.version, action: "archive" });
    assert.equal(await news.publicBySlug(input.slug), null);
    article = await news.get(editor.headers, id);
    await news.save(editor.headers, { id, version: article.version, input: edited });
    assert.equal(await news.publicBySlug(input.slug), null, "Editing an archived article must not republish it");
    await assert.rejects(news.save(admin.headers, { input }), /Slug/);
    const [[{ count }]] = await pool.execute("SELECT COUNT(*) AS count FROM audit_logs WHERE object_id = ?", [id]);
    assert.ok(Number(count) >= 8);
  } finally {
    for (const id of articleIds) {
      await pool.execute("UPDATE articles SET current_revision_id = NULL, published_revision_id = NULL WHERE id = ?", [id]);
      await pool.execute("DELETE FROM article_revisions WHERE article_id = ?", [id]);
      await pool.execute("DELETE FROM articles WHERE id = ?", [id]);
    }
    for (const fixture of fixtures.reverse()) await fixture.cleanup();
    await pool.end();
  }
});
