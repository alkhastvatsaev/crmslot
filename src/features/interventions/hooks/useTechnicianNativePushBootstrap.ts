"use client";

import { useCallback, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/core/config/firebase";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { fetchNativeFcmToken, onNativeFcmTokenRefresh } from "@/core/native/nativeFcmToken";
import { persistFcmTokenAudiences } from "@/features/notifications/fcmWebPush";
import { purgeWebFcmTokensForUser } from "@/features/notifications/purgeWebFcmTokensClient";
import { usePushTokenResyncOnResume } from "@/features/notifications/hooks/usePushTokenResyncOnResume";
import { logger } from "@/core/logger";

/**
 * APK / IPA terrain : jeton FCM natif (`ios` / `android`) avec audiences staff.
 * Complète NativePushBootstrap si le pathname initial n’est pas encore `/m/technician`.
 */
export function useTechnicianNativePushBootstrap(enabled = true): void {
  const registerNative = useCallback(async (uid: string): Promise<void> => {
    const reg = await fetchNativeFcmToken();
    if (!reg) return;
    await persistFcmTokenAudiences(uid, reg.token, ["technician", "backoffice"], reg.platform);
    await purgeWebFcmTokensForUser(uid);
  }, []);

  useEffect(() => {
    if (!enabled || !isCapacitorNative() || !auth) return;

    let cancelled = false;
    let cleanupRefresh: (() => Promise<void>) | null = null;
    let currentUid: string | null = null;

    const unsub = onAuthStateChanged(auth, (user) => {
      const uid = user?.uid ?? null;
      if (!uid || uid === currentUid) return;
      currentUid = uid;

      void (async () => {
        try {
          await registerNative(uid);
          if (cancelled) return;
          cleanupRefresh = await onNativeFcmTokenRefresh(async (next) => {
            if (!currentUid) return;
            await persistFcmTokenAudiences(
              currentUid,
              next.token,
              ["technician", "backoffice"],
              next.platform
            );
          });
        } catch (err) {
          logger.warn("[technician-native-push] register failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })();
    });

    return () => {
      cancelled = true;
      unsub();
      void cleanupRefresh?.();
    };
  }, [enabled, registerNative]);

  usePushTokenResyncOnResume(() => {
    const uid = auth?.currentUser?.uid;
    if (!uid) return;
    void registerNative(uid).catch(() => null);
  }, enabled && isCapacitorNative());
}
