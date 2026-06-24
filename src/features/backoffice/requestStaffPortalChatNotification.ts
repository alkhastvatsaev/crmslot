import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { logger } from "@/core/logger";

/** Push FCM + file d’attente admin — ne bloque pas l’UI client. */
export async function requestStaffPortalChatNotification(params: {
  companyId: string;
  interventionId?: string | null;
  /** Fil inbox (`__sender__:uid`) pour deep-link admin. */
  chatThreadId?: string | null;
  preview: string;
  clientLabel?: string | null;
  user?: import("firebase/auth").User | null;
}): Promise<void> {
  const companyId = params.companyId.trim();
  if (!companyId) return;

  try {
    const res = await fetchWithAuth(
      "/api/portal-chat/notify-staff",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          interventionId: params.interventionId ?? null,
          chatThreadId: params.chatThreadId ?? params.interventionId ?? null,
          preview: params.preview.slice(0, 500),
          clientLabel: params.clientLabel ?? null,
        }),
      },
      { user: params.user }
    );
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      logger.warn("[requestStaffPortalChatNotification] API error", {
        status: res.status,
        error: payload.error ?? res.statusText,
      });
    }
  } catch (err) {
    logger.warn("[requestStaffPortalChatNotification] network", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
