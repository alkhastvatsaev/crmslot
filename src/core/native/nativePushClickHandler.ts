import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { logger } from "@/core/logger";
import {
  BM_TECH_CASE_PARAM,
  BM_TECH_REMINDER_PARAM,
} from "@/features/notifications/notificationConstants";

type ActionPerformedEvent = {
  notification?: { data?: Record<string, string | undefined> };
};

/**
 * Capacitor : injecte les paramètres `bmTechCase` / `bmTechReminder` dans l'URL
 * après clic sur une notif native. TechnicianNotificationBootstrap traite ensuite l'intent.
 *
 * Retourne une fonction de désabonnement.
 */
export async function registerNativePushClickHandler(): Promise<() => void> {
  if (!isCapacitorNative()) return () => {};

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const handle = await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (event: ActionPerformedEvent) => {
        const data = event.notification?.data ?? {};
        const caseId = data[BM_TECH_CASE_PARAM]?.trim();
        const reminderId = data[BM_TECH_REMINDER_PARAM]?.trim();
        if (!caseId && !reminderId) return;

        try {
          const url = new URL(window.location.href);
          if (caseId) url.searchParams.set(BM_TECH_CASE_PARAM, caseId);
          if (reminderId) url.searchParams.set(BM_TECH_REMINDER_PARAM, reminderId);
          window.history.replaceState(null, "", url.toString());
          window.dispatchEvent(new PopStateEvent("popstate"));
        } catch (err) {
          logger.warn("[nativePushClickHandler] failed to inject params", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    );
    return () => {
      handle.remove().catch(() => {});
    };
  } catch (err) {
    logger.warn("[nativePushClickHandler] plugin unavailable", {
      error: err instanceof Error ? err.message : String(err),
    });
    return () => {};
  }
}
