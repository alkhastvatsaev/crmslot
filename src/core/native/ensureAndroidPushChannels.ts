import { getCapacitorPlatform, isCapacitorNative } from "@/core/native/capacitorRuntime";
import { logger } from "@/core/logger";
import { ANDROID_PUSH_CHANNELS } from "@/features/notifications/androidPushChannels";

let channelsReady: Promise<void> | null = null;

/** Crée les canaux Android requis (sinon FCM drop silencieux sur API 26+). */
export function ensureAndroidPushChannels(): Promise<void> {
  if (channelsReady) return channelsReady;

  channelsReady = (async () => {
    if (!isCapacitorNative() || getCapacitorPlatform() !== "android") return;

    const { PushNotifications } = await import("@capacitor/push-notifications");
    for (const channel of ANDROID_PUSH_CHANNELS) {
      try {
        await PushNotifications.createChannel(channel);
      } catch (err) {
        logger.warn("[push] createChannel failed", {
          channelId: channel.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  })();

  return channelsReady;
}
