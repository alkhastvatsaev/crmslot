"use client";

import { useBackofficePushMessaging } from "@/features/notifications/useBackofficePushMessaging";
import { useAutoPushPermissionPrompt } from "@/features/notifications/hooks/useAutoPushPermissionPrompt";
import { isWebPushRegistrationAllowed } from "@/features/notifications/webPushRegistrationPolicy";

/** Propose l’activation push une fois à l’ouverture de l’admin (messages chat client). */
export function useBackofficeChatPushBootstrap(enabled = true): void {
  const webAllowed = enabled && isWebPushRegistrationAllowed();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const { status, registerPush } = useBackofficePushMessaging(vapidKey, {
    enabled: webAllowed,
  });

  useAutoPushPermissionPrompt(registerPush, status, webAllowed);
}
