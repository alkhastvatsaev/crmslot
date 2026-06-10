import { fetchWithAuth } from "@/core/api/fetchWithAuth";

export type MobileRuntimeConfigResponse = {
  ok: boolean;
  mobileAccessAllowed: boolean;
  forceMobileQueryKey: "forceMobile";
  pwaServiceWorkerEnabled: boolean;
  gitSha: string | null;
  hubPageCount: number;
  nodeEnv: "development" | "production" | "test";
  timestamp: string;
};

/** Bootstrap client — config mobile publique (sans auth). */
export async function fetchMobileRuntimeConfig(): Promise<MobileRuntimeConfigResponse | null> {
  try {
    const res = await fetch("/api/mobile/config", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as MobileRuntimeConfigResponse;
  } catch {
    return null;
  }
}

/** Config société PWA (auth requise) — commandes matériel / fournisseur. */
export async function fetchCompanyPwaRegistry(companyId: string) {
  const cid = companyId.trim();
  if (!cid) {
    return { ok: false as const, status: 400, message: "companyId requis" };
  }

  const res = await fetchWithAuth(`/api/companies/${encodeURIComponent(cid)}/pwa-registry`);
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    return {
      ok: false as const,
      status: res.status,
      message: payload.error ?? res.statusText,
    };
  }

  return { ok: true as const, data: await res.json() };
}
