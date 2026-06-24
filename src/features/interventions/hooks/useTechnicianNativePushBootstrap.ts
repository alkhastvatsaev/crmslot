"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/core/config/firebase";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { fetchNativeFcmToken } from "@/core/native/nativeFcmToken";
import { persistFcmToken } from "@/features/notifications/fcmWebPush";
import { logger } from "@/core/logger";

/**
 * APK / IPA : enregistre le jeton FCM natif (`ios` / `android`) avec audience `technician`
 * quand le technicien ouvre `/m/technician` (le bootstrap racine tague souvent `backoffice`).
 */
export function useTechnicianNativePushBootstrap(enabled = true): void {
  useEffect(() => {
    if (!enabled || !isCapacitorNative() || !auth) return;

    const unsub = onAuthStateChanged(auth, (user) => {
      const uid = user?.uid;
      if (!uid) return;
      void (async () => {
        const reg = await fetchNativeFcmToken();
        if (!reg) return;
        try {
          await persistFcmToken(uid, reg.token, "technician", reg.platform);
        } catch (err) {
          logger.warn("[technician-native-push] persist failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })();
    });

    return () => unsub();
  }, [enabled]);
}
