"use client";

import { useTechnicianPushMessaging } from "@/features/notifications/useTechnicianPushMessaging";
import { useAutoPushPermissionPrompt } from "@/features/notifications/hooks/useAutoPushPermissionPrompt";
import { isWebPushRegistrationAllowed } from "@/features/notifications/webPushRegistrationPolicy";

/** Propose l’activation push une fois à l’ouverture du hub terrain. */
export function useTechnicianAssignmentPushBootstrap(enabled = true): void {
  const webAllowed = enabled && isWebPushRegistrationAllowed();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const { status, registerPush } = useTechnicianPushMessaging(vapidKey, {
    enabled: webAllowed,
  });

  useAutoPushPermissionPrompt(registerPush, status, webAllowed);
}
