"use client";

import { useTechnicianPushMessaging } from "@/features/notifications/useTechnicianPushMessaging";
import { useAutoPushPermissionPrompt } from "@/features/notifications/hooks/useAutoPushPermissionPrompt";
import { useAutoNativePushPermissionPrompt } from "@/features/notifications/hooks/useAutoNativePushPermissionPrompt";
import { useTechnicianNativePushRegistration } from "@/features/notifications/hooks/useTechnicianNativePushRegistration";
import { isWebPushRegistrationAllowed } from "@/features/notifications/webPushRegistrationPolicy";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { useTechnicianNativePushBootstrap } from "@/features/interventions/hooks/useTechnicianNativePushBootstrap";

/** Propose l’activation push une fois à l’ouverture du hub terrain. */
export function useTechnicianAssignmentPushBootstrap(enabled = true) {
  const native = isCapacitorNative();
  const webAllowed = enabled && !native && isWebPushRegistrationAllowed();
  useTechnicianNativePushBootstrap(enabled);

  const { status: nativeStatus, registerPush: registerNativePush } =
    useTechnicianNativePushRegistration(native && enabled);

  useAutoNativePushPermissionPrompt(registerNativePush, nativeStatus, native && enabled);

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const { status: webStatus, registerPush: registerWebPush } = useTechnicianPushMessaging(
    vapidKey,
    {
      enabled: webAllowed,
    }
  );

  useAutoPushPermissionPrompt(registerWebPush, webStatus, webAllowed);

  return {
    native,
    webAllowed,
    webStatus,
    registerWebPush,
    nativeStatus,
    registerNativePush,
  };
}
