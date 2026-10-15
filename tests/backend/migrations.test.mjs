import test from "node:test";
import assert from "node:assert/strict";
import { verifyMigration } from "../../lib/server/migrations.mjs";

test("completed migration with matching checksum is not reapplied", () => {
  assert.equal(verifyMigration({ checksum: "abc", status: "applied" }, "abc"), false);
  assert.equal(verifyMigration(undefined, "abc"), true);
});

test("changed migration or interrupted DDL fails closed", () => {
  assert.throws(() => verifyMigration({ checksum: "old", status: "applied" }, "new"), /checksum/i);
  assert.throws(() => verifyMigration({ checksum: "abc", status: "started" }, "abc"), /belum selesai/i);
});
