/** @jest-environment jsdom */

import { isPwaStandalone } from "@/core/pwa/isPwaStandalone";
import {
  isWebPushRegistrationAllowed,
  shouldAutoPromptForPush,
} from "@/features/notifications/webPushRegistrationPolicy";

jest.mock("@/core/pwa/isPwaStandalone", () => ({
  isPwaStandalone: jest.fn(() => true),
}));

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(() => false),
  getCapacitorPlatform: jest.fn(() => "web"),
}));

describe("webPushRegistrationPolicy", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED = "true";
    Object.defineProperty(window, "Notification", {
      writable: true,
      value: { permission: "default" },
    });
  });

  it("autorise la PWA installée", () => {
    expect(isWebPushRegistrationAllowed()).toBe(true);
    expect(shouldAutoPromptForPush()).toBe(true);
  });

  it("bloque iOS hors écran d’accueil", () => {
    (isPwaStandalone as jest.Mock).mockReturnValue(false);
    Object.defineProperty(navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    });
    expect(isWebPushRegistrationAllowed()).toBe(false);
  });
});
