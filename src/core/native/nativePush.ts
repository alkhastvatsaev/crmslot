import { isCapacitorNative } from "./capacitorRuntime";
import { logger } from "@/core/logger";

export type NativePushToken = { token: string; platform: "ios" | "android" };

export async function registerNativePush(
  onToken: (token: NativePushToken) => void | Promise<void>
): Promise<void> {
  if (!isCapacitorNative()) return;
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== "granted") {
    const req = await PushNotifications.requestPermissions();
    if (req.receive !== "granted") {
      logger.info("[push] permission denied");
      return;
    }
  }
  await PushNotifications.addListener("registration", async (token) => {
    await onToken({ token: token.value, platform: "ios" });
  });
  await PushNotifications.addListener("registrationError", (err) => {
    logger.warn("[push] registration error", { error: err.error });
  });
  await PushNotifications.register();
}
