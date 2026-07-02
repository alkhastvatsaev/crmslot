import type { User } from "firebase/auth";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { logger } from "@/core/logger";

/** Push FCM staff après création demande — ne bloque pas l'UI (comme le chat portail). */
export async function notifyStaffNewClientRequestClient(params: {
  companyId: string;
  interventionId: string;
  title?: string | null;
  address?: string | null;
  user?: User | null;
}): Promise<void> {
  const companyId = params.companyId.trim();
  const interventionId = params.interventionId.trim();
  if (!companyId || !interventionId) return;

  try {
    const res = await fetchWithAuth(
      "/api/notifications/staff-new-request",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          interventionId,
          title: params.title?.trim() || undefined,
          address: params.address?.trim() || undefined,
        }),
      },
      { user: params.user ?? undefined }
    );
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      logger.warn("[notifyStaffNewClientRequestClient] API error", {
        status: res.status,
        interventionId,
        error: payload.error ?? res.statusText,
      });
      return;
    }
    const payload = (await res.json().catch(() => ({}))) as { notified?: number };
    if ((payload.notified ?? 0) === 0) {
      logger.warn("[notifyStaffNewClientRequestClient] aucun staff notifié", {
        interventionId,
        companyId,
      });
    }
  } catch (err) {
    logger.warn("[notifyStaffNewClientRequestClient] network", {
      interventionId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
