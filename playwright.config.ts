import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/backend/**", "**/backend-browser/**"],
  fullyParallel: true,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: process.env.ANNUR_TEST_BASE_URL || "http://127.0.0.1:3000",
    channel: "chrome",
    trace: "retain-on-failure"
  },
  webServer: process.env.ANNUR_EXTERNAL_TEST_SERVER ? undefined : {
    command: "npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
