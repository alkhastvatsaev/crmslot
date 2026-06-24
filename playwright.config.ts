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

/** Serveur prod-like : pas de preview dev, pas d’ALLOW_MOBILE build-time. */
const desktopGateProdEnv: Record<string, string> = {
  ...e2ePublicEnv,
  NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW: "true",
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

/** Build + start port 3001 — Next 16 n’autorise qu’un seul `next dev` par repo. */
const desktopGateProdWebServer = {
  command: "bash scripts/dev/e2e-desktop-gate-server.sh",
  url: "http://localhost:3001",
  reuseExistingServer: !process.env.CI,
  timeout: 300_000,
  env: {
    ...desktopGateProdEnv,
    ...process.env,
    NEXT_E2E_GATE_DIST: "1",
  },
};

const gateE2eMode = process.env.PLAYWRIGHT_GATE_E2E === "1";

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
    baseURL: gateE2eMode ? "http://localhost:3001" : "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      testIgnore: [
        /mobile-shell\.spec\.ts/,
        /desktop-only-gate-prod\.spec\.ts/,
        /portal-chat-client-ui\.spec\.ts/,
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
        ...devices["iPhone 13"],
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
        ...devices["iPhone 13"],
        launchOptions: {
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
    {
      name: "desktop-gate-prod",
      testMatch: /desktop-only-gate-prod\.spec\.ts/,
      grepInvert: /@desktop/,
      use: {
        ...devices["iPhone 13"],
        baseURL: "http://localhost:3001",
        launchOptions: {
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
    {
      name: "desktop-gate-prod-chrome",
      testMatch: /desktop-only-gate-prod\.spec\.ts/,
      grep: /@desktop/,
      dependencies: ["desktop-gate-prod"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
        launchOptions: {
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
  ],

  webServer: gateE2eMode ? desktopGateProdWebServer : defaultDevWebServer,
});
