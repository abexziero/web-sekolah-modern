import {randomUUID} from "node:crypto";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import nextEnv from "@next/env";
import { readDatabaseConfig } from "../lib/server/database-config.mjs";

nextEnv.loadEnvConfig(process.cwd());
const mode = process.argv[2];
assert.ok(["preview", "dashboard"].includes(mode), "Pilih mode tes preview atau dashboard.");
const port = mode === "preview" ? 3100 : 3101;
const url = `http://127.0.0.1:${port}`;
const env = { ...process.env, ANNUR_TEST_RUN_ID:randomUUID(), NODE_ENV: "production", ANNUR_EXTERNAL_TEST_SERVER: "1", ANNUR_TEST_BASE_URL: url, BETTER_AUTH_URL: url, SITE_URL:url, SITE_INDEXABLE:mode==="dashboard"?"true":"false",
  ...(mode === "preview" ? { DATABASE_NAME: "", DATABASE_USER: "", DATABASE_PASSWORD: "" } : { DATABASE_NAME: "annur_test", DATABASE_PORT: "3308" }) };
if (mode === "dashboard") readDatabaseConfig(env, { test: true });
let server;
let tests;
async function run(file, args) {
  const child = spawn(process.execPath, [file, ...args], { env, stdio: "inherit", windowsHide: true });
  const [code] = await once(child, "exit");
  if (code !== 0) throw new Error(`Perintah tes/build gagal (exit ${code}).`);
}
try {
  let occupied = false;
  try { await fetch(url, { signal: AbortSignal.timeout(500) }); occupied = true; } catch {}
  assert.ok(!occupied, `Port tes ${port} sedang dipakai. Hentikan server tes sebelumnya terlebih dahulu.`);
  if (mode === "dashboard") await run("scripts/migrate.mjs", ["--test"]);
  await run("node_modules/next/dist/bin/next", ["build"]);
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { env, stdio: "inherit", windowsHide: true });
  let ready = false;
  for (let i = 0; i < 200 && server.exitCode === null; i++) {
    try { const response = await fetch(`${url}${mode === "dashboard" ? "/admin/login" : "/"}`, { signal: AbortSignal.timeout(1000) }); if (response.ok) { ready = true; break; } } catch {}
    await delay(200);
  }
  assert.ok(ready, "Server tes tidak siap; periksa pesan startup.");
  tests = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "--config", mode === "dashboard" ? "playwright.backend.config.ts" : "playwright.config.ts", ...process.argv.slice(3)], { env, stdio: "inherit", windowsHide: true });
  const [code] = await once(tests, "exit");
  process.exitCode = code ?? 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally {
  // Own the actual Next process, avoiding shell/npm descendants left behind on Windows.
  if (server && server.exitCode === null) { const stopped = once(server, "exit"); server.kill(); await stopped; }
  if (tests && tests.exitCode === null) tests.kill();
}
