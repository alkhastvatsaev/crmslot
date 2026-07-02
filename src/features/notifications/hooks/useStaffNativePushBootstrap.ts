"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, clientPortalAuth } from "@/core/config/firebase";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { fetchNativeFcmToken, onNativeFcmTokenRefresh } from "@/core/native/nativeFcmToken";
import { persistFcmToken, persistFcmTokenAudiences } from "@/features/notifications/fcmWebPush";
import type { FcmAudience } from "@/features/notifications/fcmWebPush";
import { logger } from "@/core/logger";

type StaffNativeAudience = "backoffice" | "technician";

/** Capacitor : enregistre le jeton natif avec la bonne audience (et staff = admin + terrain). */
export function useStaffNativePushBootstrap(audience: FcmAudience, enabled = true): void {
  useEffect(() => {
    if (!enabled || !isCapacitorNative()) return;

    const useClientAuth = audience === "client";
    const authBinding = useClientAuth ? clientPortalAuth : auth;
    if (!authBinding) return;

    let cancelled = false;
    let cleanupRefresh: (() => Promise<void>) | null = null;
    let currentUid: string | null = null;

    const persist = async (uid: string, token: string, platform: "ios" | "android") => {
      if (audience === "client") {
        await persistFcmToken(uid, token, "client", platform);
        return;
      }
      const staffAudiences: StaffNativeAudience[] =
        audience === "technician" ? ["technician", "backoffice"] : ["backoffice", "technician"];
      await persistFcmTokenAudiences(uid, token, staffAudiences, platform);
    };

    const register = async (uid: string) => {
      const reg = await fetchNativeFcmToken();
      if (!reg || cancelled) return;
      try {
        await persist(uid, reg.token, reg.platform);
      } catch (err) {
        logger.warn("[staff-native-push] persist failed", {
          audience,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };

    const unsub = onAuthStateChanged(authBinding, (user) => {
      const uid = user?.uid ?? null;
      if (!uid || uid === currentUid) return;
      currentUid = uid;

      void (async () => {
        await register(uid);
        cleanupRefresh = await onNativeFcmTokenRefresh(async (next) => {
          if (currentUid) await persist(currentUid, next.token, next.platform);
        });
      })().catch((err) => {
        logger.warn("[staff-native-push] register failed", {
          audience,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    });

    return () => {
      cancelled = true;
      unsub();
      void cleanupRefresh?.();
    };
  }, [audience, enabled]);
}
