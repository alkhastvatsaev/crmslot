import { DASHBOARD_CAROUSEL_PAGE_COUNT } from "@/features/dashboard/dashboardCarouselRegistry";
import { resolveMobileAccessAllowed } from "@/core/config/resolveMobileAccessAllowed";

export type MobileRuntimeConfig = {
  /** Build autorisé sur téléphone (env staging/prod). */
  mobileAccessAllowed: boolean;
  /** Query dev/staging : `?forceMobile=1` */
  forceMobileQueryKey: "forceMobile";
  /** Service worker PWA actif côté client. */
  pwaServiceWorkerEnabled: boolean;
  /** SHA git injecté au build (Vercel / local). */
  gitSha: string | null;
  /** Nombre de hubs carrousel (aligné desktop). */
  hubPageCount: number;
  /** Environnement Node (sans secrets). */
  nodeEnv: "development" | "production" | "test";
};

/** Config publique mobile/PWA — aucun secret. */
export function buildMobileRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env
): MobileRuntimeConfig {
  const allowMobile = resolveMobileAccessAllowed(env);

  const nodeEnv = env.NODE_ENV;
  const normalizedEnv = nodeEnv === "production" || nodeEnv === "test" ? nodeEnv : "development";

  return {
    mobileAccessAllowed: allowMobile,
    forceMobileQueryKey: "forceMobile",
    pwaServiceWorkerEnabled: env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED === "true",
    gitSha: env.NEXT_PUBLIC_APP_GIT_SHA?.trim() || null,
    hubPageCount: DASHBOARD_CAROUSEL_PAGE_COUNT,
    nodeEnv: normalizedEnv,
  };
}

/** Alias build-time pour le client bundle (tree-shake identique à mobileAccess.ts). */
export function isMobileAccessAllowedAtBuild(): boolean {
  return resolveMobileAccessAllowed();
}
