"use client";

import { useCallback, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, clientPortalAuth } from "@/core/config/firebase";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { fetchNativeFcmToken, onNativeFcmTokenRefresh } from "@/core/native/nativeFcmToken";
import { persistFcmToken, persistFcmTokenAudiences } from "@/features/notifications/fcmWebPush";
import { purgeWebFcmTokensForUser } from "@/features/notifications/purgeWebFcmTokensClient";
import type { FcmAudience } from "@/features/notifications/fcmWebPush";
import { usePushTokenResyncOnResume } from "@/features/notifications/hooks/usePushTokenResyncOnResume";
import { logger } from "@/core/logger";

type StaffNativeAudience = "backoffice" | "technician";

/** Capacitor : enregistre le jeton natif avec la bonne audience (et staff = admin + terrain). */
export function useStaffNativePushBootstrap(audience: FcmAudience, enabled = true): void {
  const currentUidRef = useRef<string | null>(null);

  const registerNative = useCallback(
    async (uid: string): Promise<void> => {
      const reg = await fetchNativeFcmToken();
      if (!reg) return;
      if (audience === "client") {
        await persistFcmToken(uid, reg.token, "client", reg.platform);
        return;
      }
      const staffAudiences: StaffNativeAudience[] =
        audience === "technician" ? ["technician", "backoffice"] : ["backoffice", "technician"];
      await persistFcmTokenAudiences(uid, reg.token, staffAudiences, reg.platform);
      await purgeWebFcmTokensForUser(uid);
    },
    [audience]
  );

  usePushTokenResyncOnResume(() => {
    const uid = currentUidRef.current;
    if (!uid) return;
    void registerNative(uid).catch(() => null);
  }, enabled && isCapacitorNative());

  useEffect(() => {
    if (!enabled || !isCapacitorNative()) return;

    const useClientAuth = audience === "client";
    const authBinding = useClientAuth ? clientPortalAuth : auth;
    if (!authBinding) return;

    let cancelled = false;
    let cleanupRefresh: (() => Promise<void>) | null = null;

    const unsub = onAuthStateChanged(authBinding, (user) => {
      const uid = user?.uid ?? null;
      if (!uid || uid === currentUidRef.current) return;
      currentUidRef.current = uid;

      void (async () => {
        try {
          await registerNative(uid);
          if (cancelled) return;
          cleanupRefresh = await onNativeFcmTokenRefresh(async (next) => {
            const activeUid = currentUidRef.current;
            if (!activeUid) return;
            if (audience === "client") {
              await persistFcmToken(activeUid, next.token, "client", next.platform);
              return;
            }
            const staffAudiences: StaffNativeAudience[] =
              audience === "technician"
                ? ["technician", "backoffice"]
                : ["backoffice", "technician"];
            await persistFcmTokenAudiences(activeUid, next.token, staffAudiences, next.platform);
          });
        } catch (err) {
          logger.warn("[staff-native-push] register failed", {
            audience,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })();
    });

    return () => {
      cancelled = true;
      currentUidRef.current = null;
      unsub();
      void cleanupRefresh?.();
    };
  }, [audience, enabled, registerNative]);
}
