import { getCapacitorPlatform, isCapacitorNative } from "./capacitorRuntime";
import { logger } from "@/core/logger";
import { ensureAndroidPushChannels } from "./ensureAndroidPushChannels";

export type NativeFcmRegistration = {
  token: string;
  platform: "ios" | "android";
};

export async function fetchNativeFcmToken(): Promise<NativeFcmRegistration | null> {
  if (!isCapacitorNative()) return null;
  const platform = getCapacitorPlatform();
  if (platform !== "ios" && platform !== "android") return null;

  const { PushNotifications } = await import("@capacitor/push-notifications");
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== "granted") {
    const req = await PushNotifications.requestPermissions();
    if (req.receive !== "granted") return null;
  }

  await ensureAndroidPushChannels();
  await PushNotifications.register();

  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
  try {
    if (platform === "ios") {
      await FirebaseMessaging.requestPermissions();
    }
    const { token } = await FirebaseMessaging.getToken();
    if (!token) return null;
    return { token, platform };
  } catch (err) {
    logger.warn("[push] getToken failed", {
      platform,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function onNativeFcmTokenRefresh(
  handler: (reg: NativeFcmRegistration) => void | Promise<void>
): Promise<() => Promise<void>> {
  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
  const platform = getCapacitorPlatform();
  const safePlatform: "ios" | "android" = platform === "android" ? "android" : "ios";
  const sub = await FirebaseMessaging.addListener("tokenReceived", ({ token }) => {
    if (token) void handler({ token, platform: safePlatform });
  });
  return () => sub.remove();
}
