"use client";

import { useBackofficeChatPushBootstrap } from "@/features/notifications/hooks/useBackofficeChatPushBootstrap";

/**
 * Bootstrap silencieux : enregistre le jeton FCM web pour l'admin connecté.
 * Demande la permission une fois (comme terrain) pour recevoir les messages chat client.
 */
export default function BackofficePushBootstrap() {
  useBackofficeChatPushBootstrap();
  return null;
}
