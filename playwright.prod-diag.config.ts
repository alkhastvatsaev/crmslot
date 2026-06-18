import { defineConfig, devices } from "@playwright/test";

/** Diagnostic prod — pas de webServer local. */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /prod-diagnostics\.spec\.ts/,
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: "list",
  outputDir: "test-results/diag-playwright",
  use: {
    baseURL: process.env.PLAYWRIGHT_PROD_URL ?? "https://crmslot.vercel.app",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
