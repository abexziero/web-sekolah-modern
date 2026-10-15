import test from "node:test";
import assert from "node:assert/strict";
import { createConnection } from "mysql2/promise";
import { fileURLToPath } from "node:url";
import { readDatabaseConfig } from "../../lib/server/database-config.mjs";
import { runMigrations } from "../../lib/server/migrations.mjs";

test("MariaDB migrations and composite revision ownership", async () => {
  const config = readDatabaseConfig({ ...process.env, DATABASE_NAME: "annur_test", DATABASE_PORT: "3308" }, { test: true });
  const { connectionLimit, ...options } = config;
  const connection = await createConnection({ ...options, multipleStatements: true });
  try {
    await runMigrations(connection, fileURLToPath(new URL("../../migrations", import.meta.url)));
    assert.equal(await runMigrations(connection, fileURLToPath(new URL("../../migrations", import.meta.url))), 0);
    const [tables] = await connection.query("SHOW TABLES");
    assert.ok(tables.length >= 4);
    await connection.query("SET time_zone = '+08:00'");
    await connection.beginTransaction();
    await connection.execute("INSERT INTO `user` (id, name, email, emailVerified, role, active) VALUES ('fixture', 'Migration fixture', 'migration-fixture@example.test', true, 'editor', true)");
    await connection.execute("INSERT INTO articles (id, slug, author_id) VALUES (?, ?, ?), (?, ?, ?)", ["test-article-1", "migration-fixture-1", "fixture", "test-article-2", "migration-fixture-2", "fixture"]);
    await connection.execute("INSERT INTO article_revisions (id, article_id, revision_number, title, excerpt, category, image, image_alt, blocks, saved_by) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)", ["test-revision-1", "test-article-1", "Fixture title", "Fixture excerpt", "Fixture", "school.jpg", "Fixture", "[]", "fixture"]);
    await assert.rejects(connection.execute("UPDATE articles SET published_revision_id = ? WHERE id = ?", ["test-revision-1", "test-article-2"]));
    await connection.execute("UPDATE articles SET published_revision_id = ? WHERE id = ?", ["test-revision-1", "test-article-1"]);
    const [[{ drift }]] = await connection.execute("SELECT ABS(TIMESTAMPDIFF(SECOND, created_at, UTC_TIMESTAMP(3))) AS drift FROM articles WHERE id = ?", ["test-article-1"]);
    assert.ok(Number(drift) < 3, "Timestamps must stay UTC even when the database session uses Asia/Makassar offset");
  } finally {
    await connection.rollback();
    await connection.end();
  }
});
