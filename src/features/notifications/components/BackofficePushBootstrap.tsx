"use client";

import { useBackofficeChatPushBootstrap } from "@/features/notifications/hooks/useBackofficeChatPushBootstrap";
import { useBackofficePushMessaging } from "@/features/notifications/useBackofficePushMessaging";

/**
 * Bootstrap silencieux : enregistre le jeton FCM web pour l'admin connecté.
 * Demande la permission une fois (comme terrain) pour recevoir les messages chat client.
 */
export default function BackofficePushBootstrap() {
  useBackofficeChatPushBootstrap();
  useBackofficePushMessaging(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
  return null;
}
