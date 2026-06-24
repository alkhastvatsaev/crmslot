"use client";

import { useCallback, useEffect, useRef } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { logger } from "@/core/logger";
import {
  fetchNativeFcmToken,
  onNativeFcmTokenRefresh,
  type NativeFcmRegistration,
} from "@/core/native/nativeFcmToken";
import { persistFcmToken } from "@/features/notifications/fcmWebPush";
import { usePushTokenResyncOnResume } from "@/features/notifications/hooks/usePushTokenResyncOnResume";

type Audience = "client" | "technician" | "backoffice";

type Args = {
  audience: Audience;
  auth: { onAuthStateChanged: (cb: (user: User | null) => void) => () => void } | null;
};

export function useNativePushRegistration({ audience, auth }: Args): void {
  const currentUidRef = useRef<string | null>(null);

  const resyncToken = useCallback(async () => {
    if (!isCapacitorNative() || !auth) return;
    const uid = currentUidRef.current;
    if (!uid) return;
    const reg = await fetchNativeFcmToken();
    if (!reg) return;
    try {
      await persistFcmToken(uid, reg.token, audience, reg.platform);
    } catch (err) {
      logger.warn("[native-push] resync persist failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [audience, auth]);

  usePushTokenResyncOnResume(resyncToken, Boolean(auth));

  useEffect(() => {
    if (!isCapacitorNative() || !auth) return;

    let cancelled = false;
    let cleanupRefresh: (() => Promise<void>) | null = null;
    let currentUid: string | null = null;

    const register = async (uid: string, reg: NativeFcmRegistration | null) => {
      if (!reg || cancelled) return;
      try {
        await persistFcmToken(uid, reg.token, audience, reg.platform);
      } catch (err) {
        logger.warn("[native-push] persist failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (cancelled) return;
      const uid = user?.uid ?? null;
      if (uid === currentUid) return;
      currentUid = uid;
      currentUidRef.current = uid;
      if (!uid) return;

      (async () => {
        const reg = await fetchNativeFcmToken();
        await register(uid, reg);

        cleanupRefresh = await onNativeFcmTokenRefresh(async (next) => {
          if (currentUid) await register(currentUid, next);
        });
      })().catch((err) => {
        logger.warn("[native-push] register failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    });

    return () => {
      cancelled = true;
      unsubAuth();
      void cleanupRefresh?.();
    };
  }, [audience, auth]);
}
