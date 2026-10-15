import { defineConfig } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
export default defineConfig({
  testDir: "./tests/backend-browser", workers: 1, fullyParallel: false, timeout: 60000, reporter: "list",
  use: { baseURL: "http://127.0.0.1:3101", channel: "chrome", trace: "off", screenshot: "off", video: "off" },
  webServer: process.env.ANNUR_EXTERNAL_TEST_SERVER ? undefined : { command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3101", url: "http://127.0.0.1:3101/admin/login", reuseExistingServer: false, timeout: 60000, env: { DATABASE_NAME: "annur_test", DATABASE_PORT: "3308", BETTER_AUTH_URL: "http://127.0.0.1:3101" } }
});
