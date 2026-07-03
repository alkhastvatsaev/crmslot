"use client";

import { useBackofficeChatPushBootstrap } from "@/features/notifications/hooks/useBackofficeChatPushBootstrap";
import { useStaffPushOnboardingHint } from "@/features/notifications/hooks/useStaffPushOnboardingHint";

/**
 * Bootstrap silencieux : enregistre le jeton FCM web pour l'admin connecté.
 * Demande la permission automatiquement (desktop / Android / PWA) après connexion ou inscription.
 */
export default function BackofficePushBootstrap() {
  useBackofficeChatPushBootstrap();
  useStaffPushOnboardingHint();
  return null;
}
