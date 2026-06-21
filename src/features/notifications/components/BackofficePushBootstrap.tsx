"use client";

import { useBackofficePushMessaging } from "@/features/notifications/useBackofficePushMessaging";

/**
 * Bootstrap silencieux : enregistre le jeton FCM web pour l'admin connecté.
 * UI explicite (toggle, panel d'état) reste à part — ici on se contente de
 * persister le token quand la permission est déjà accordée.
 */
export default function BackofficePushBootstrap() {
  useBackofficePushMessaging(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
  return null;
}
