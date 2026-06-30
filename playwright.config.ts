import { defineConfig, devices } from "@playwright/test";

/** Env public minimal pour démarrer Next en E2E (aligné .github/workflows/e2e.yml). */
const e2ePublicEnv: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "placeholder",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "placeholder.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "placeholder",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "placeholder.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "0",
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:0:web:0",
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "pk.placeholder",
};

const defaultDevWebServer = {
  command: "npm run dev",
  url: "http://localhost:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
  env: {
    ...e2ePublicEnv,
    ...process.env,
  },
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60 * 1000,
  expect: {
    timeout: 30_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    actionTimeout: 0,
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      testIgnore: [
        /mobile-shell\.spec\.ts/,
        /technician-mobile-app\.spec\.ts/,
        /client-mobile-app\.spec\.ts/,
        /portal-chat-client-ui\.spec\.ts/,
        /dashboard-desktop-hubs\.spec\.ts/,
      ],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
    {
      name: "mobile-shell",
      testMatch: /mobile-shell\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        ...(process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE
          ? { storageState: process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE }
          : {}),
        launchOptions: {
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
    {
      name: "technician-app",
      testMatch: /technician-mobile-app\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        ...(process.env.PLAYWRIGHT_TECHNICIAN_STORAGE_STATE
          ? { storageState: process.env.PLAYWRIGHT_TECHNICIAN_STORAGE_STATE }
          : {}),
        launchOptions: {
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
    {
      name: "desktop-hubs",
      testMatch: /dashboard-desktop-hubs\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE,
        launchOptions: {
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
    {
      name: "portal-chat-client",
      testMatch: /portal-chat-client-ui\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
    {
      name: "client-app",
      testMatch: /client-mobile-app\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        launchOptions: {
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
  ],

  webServer: defaultDevWebServer,
});
