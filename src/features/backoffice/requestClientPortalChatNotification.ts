import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { logger } from "@/core/logger";

/** Push FCM clients liés à la société — staff vers client. Ne bloque pas l'UI. */
export async function requestClientPortalChatNotification(params: {
  companyId: string;
  interventionId?: string | null;
  preview: string;
  staffLabel?: string | null;
}): Promise<void> {
  const companyId = params.companyId.trim();
  if (!companyId) return;

  try {
    const res = await fetchWithAuth("/api/portal-chat/notify-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        interventionId: params.interventionId ?? null,
        preview: params.preview.slice(0, 500),
        staffLabel: params.staffLabel ?? null,
      }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      logger.warn("[requestClientPortalChatNotification] API error", {
        status: res.status,
        error: payload.error ?? res.statusText,
      });
    }
  } catch (err) {
    logger.warn("[requestClientPortalChatNotification] network", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
