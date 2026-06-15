import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { logger } from "@/core/logger";
import {
  dispatchTechnicianNotificationIntent,
  parseTechnicianNotificationData,
} from "@/features/notifications/technicianNotificationIntent";

type ActionPerformedEvent = {
  notification?: { data?: Record<string, string | undefined> };
};

export type PushNotificationsPlugin = {
  addListener: (
    eventName: "pushNotificationActionPerformed",
    handler: (event: ActionPerformedEvent) => void
  ) => Promise<{ remove: () => Promise<void> }>;
};

export type NativePushClickHandlerDeps = {
  isNative: () => boolean;
  loadPlugin: () => Promise<PushNotificationsPlugin>;
  /** Pour test : override le dispatcher. */
  dispatch?: typeof dispatchTechnicianNotificationIntent;
};

const PROD_DEPS: NativePushClickHandlerDeps = {
  isNative: isCapacitorNative,
  loadPlugin: async () => {
    const mod = await import("@capacitor/push-notifications");
    return mod.PushNotifications as unknown as PushNotificationsPlugin;
  },
};

/**
 * Capacitor : dispatch intent DOM après clic notif native.
 * TechnicianNotificationBootstrap écoute l'événement (Next.js ne suit pas replaceState).
 */
export async function registerNativePushClickHandler(
  deps: NativePushClickHandlerDeps = PROD_DEPS
): Promise<() => void> {
  if (!deps.isNative()) return () => {};

  try {
    const plugin = await deps.loadPlugin();
    const dispatch = deps.dispatch ?? dispatchTechnicianNotificationIntent;
    const handle = await plugin.addListener(
      "pushNotificationActionPerformed",
      (event: ActionPerformedEvent) => {
        const intent = parseTechnicianNotificationData(event.notification?.data ?? {});
        if (intent.kind === "none") return;
        dispatch(intent);
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
