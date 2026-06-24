import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { logger } from "@/core/logger";
import { routePushNotificationClick } from "@/features/notifications/routePushNotificationClick";

type PushReceivedEvent = {
  title?: string;
  body?: string;
  data?: Record<string, string | undefined>;
};

/**
 * Android/iOS : en premier plan le tray système n’affiche pas toujours la notif.
 * Toast + routage intent pour le chat / missions.
 */
export async function registerNativePushForegroundHandler(): Promise<() => void> {
  if (!isCapacitorNative()) return () => {};

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const { toast } = await import("sonner");

    const handle = await PushNotifications.addListener(
      "pushNotificationReceived",
      (event: PushReceivedEvent) => {
        const title = event.title?.trim() || "CRMSLOT";
        const body = event.body?.trim() || "";
        const data = event.data ?? {};
        toast.message(title, { description: body || undefined });
        routePushNotificationClick(data);
      }
    );

    return () => {
      void handle.remove();
    };
  } catch (err) {
    logger.warn("[nativePushForeground] unavailable", {
      error: err instanceof Error ? err.message : String(err),
    });
    return () => {};
  }
}
