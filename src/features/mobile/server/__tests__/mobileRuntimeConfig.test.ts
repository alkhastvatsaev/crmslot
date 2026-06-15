import { buildMobileRuntimeConfig } from "@/features/mobile/server/mobileRuntimeConfig";

describe("buildMobileRuntimeConfig", () => {
  it("expose une config publique sans secrets", () => {
    const cfg = buildMobileRuntimeConfig({
      NODE_ENV: "development",
      NEXT_PUBLIC_ALLOW_MOBILE: "true",
      NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED: "false",
      NEXT_PUBLIC_APP_GIT_SHA: "abc123",
    });

    expect(cfg.mobileAccessAllowed).toBe(true);
    expect(cfg.forceMobileQueryKey).toBe("forceMobile");
    expect(cfg.pwaServiceWorkerEnabled).toBe(false);
    expect(cfg.gitSha).toBe("abc123");
    // Carrousel actuel : carte + matériel + crm + facturation + gmail + assistant = 6 pages.
    // Régression: si on retombe sous 6, c'est qu'un hub a sauté du registre.
    expect(cfg.hubPageCount).toBeGreaterThanOrEqual(6);
    expect(cfg.nodeEnv).toBe("development");
  });

  it("mobileAccessAllowed false par défaut", () => {
    const cfg = buildMobileRuntimeConfig({
      NODE_ENV: "production",
    });
    expect(cfg.mobileAccessAllowed).toBe(false);
    expect(cfg.nodeEnv).toBe("production");
  });
});
