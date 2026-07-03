"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/core/config/firebase";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { fetchNativeFcmToken } from "@/core/native/nativeFcmToken";
import { persistFcmTokenAudiences } from "@/features/notifications/fcmWebPush";
import { purgeWebFcmTokensForUser } from "@/features/notifications/purgeWebFcmTokensClient";
import { logger } from "@/core/logger";

export type TechnicianNativePushStatus =
  | "unsupported"
  | "idle"
  | "denied"
  | "granted"
  | "registering";

async function readNativePermission(): Promise<"granted" | "denied" | "prompt"> {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive === "granted") return "granted";
  if (perm.receive === "denied") return "denied";
  return "prompt";
}

/** Push FCM natif terrain (Capacitor) — permission + persistance Firestore. */
export function useTechnicianNativePushRegistration(enabled = true) {
  const [status, setStatus] = useState<TechnicianNativePushStatus>("unsupported");
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!isCapacitorNative()) {
      setStatus("unsupported");
      return;
    }
    const perm = await readNativePermission();
    setStatus(perm === "granted" ? "granted" : perm === "denied" ? "denied" : "idle");
  }, []);

  const registerPush = useCallback(async () => {
    if (!isCapacitorNative() || !auth) return;
    const uid = auth.currentUser?.uid?.trim();
    if (!uid) return;

    setStatus("registering");
    setLastError(null);
    try {
      const reg = await fetchNativeFcmToken();
      if (!reg) {
        await refreshStatus();
        return;
      }
      await persistFcmTokenAudiences(uid, reg.token, ["technician", "backoffice"], reg.platform);
      await purgeWebFcmTokensForUser(uid);
      setStatus("granted");
    } catch (err) {
      logger.warn("[technician-native-push] register failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      setLastError(err instanceof Error ? err.message : String(err));
      await refreshStatus();
    }
  }, [refreshStatus]);

  useEffect(() => {
    if (!enabled || !isCapacitorNative() || !auth) {
      setStatus("unsupported");
      return;
    }

    void refreshStatus();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setStatus("idle");
        return;
      }
      void refreshStatus();
    });
    return () => unsub();
  }, [enabled, refreshStatus]);

  return { status, lastError, registerPush, refreshStatus };
}
