"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { toast } from "sonner";
import { auth, app, firestore, isConfigured } from "@/core/config/firebase";
import {
  type FcmUiStatus,
  handleFcmSyncError,
  isPushServiceWorkerEnabled,
  isWebPushRegistrationAllowed,
  persistFcmToken,
  resolvePushServiceWorkerRegistration,
} from "@/features/notifications/fcmWebPush";
import { usePushTokenResyncOnResume } from "@/features/notifications/hooks/usePushTokenResyncOnResume";
import { isFirebasePublicConfigured } from "@/features/notifications/firebasePublicConfig";
import { parseBackofficeChatNotificationData } from "@/features/notifications/backofficeChatNotificationUrls";
import { dispatchBackofficeChatNotificationIntent } from "@/features/notifications/backofficeChatNotificationIntent";
import { parseBackofficeRequestNotificationData } from "@/features/notifications/backofficeRequestNotificationUrls";
import { dispatchBackofficeRequestNotificationIntent } from "@/features/notifications/backofficeRequestNotificationIntent";

export type BackofficePushApi = {
  status: FcmUiStatus;
  lastError: string | null;
  registerPush: () => Promise<void>;
};

/**
 * Enregistre le jeton FCM `users/{uid}/fcm_tokens/{id}` avec audience `backoffice`
 * pour l'admin/dispatcher connecté à la PWA back-office. Le routage des clics est
 * géré par BackofficeChatNotificationBootstrap (URL `?bmBackofficeChat=...`).
 */
export function useBackofficePushMessaging(
  vapidKey: string | undefined,
  opts?: { enabled?: boolean }
): BackofficePushApi {
  const enabled = opts?.enabled !== false;
  const [status, setStatus] = useState<FcmUiStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const unsubForegroundRef = useRef<(() => void) | undefined>(undefined);

  const attachForegroundListener = useCallback(() => {
    if (!app) return;
    unsubForegroundRef.current?.();
    const messaging = getMessaging(app);
    unsubForegroundRef.current = onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "CRMSLOT";
      const body = payload.notification?.body ?? "";
      const data = (payload.data ?? {}) as Record<string, string | undefined>;
      const chatIntent = parseBackofficeChatNotificationData(data);
      if (chatIntent.kind !== "none") {
        toast.message(title, { description: body });
        dispatchBackofficeChatNotificationIntent(chatIntent);
        return;
      }
      const requestIntent = parseBackofficeRequestNotificationData(data);
      if (requestIntent.kind !== "none") {
        toast.message(title, { description: body });
        dispatchBackofficeRequestNotificationIntent(requestIntent);
        return;
      }
      toast.message(title, { description: body });
    });
  }, []);

  const syncTokenForUser = useCallback(
    async (uid: string): Promise<void> => {
      if (!app || !firestore || !vapidKey?.trim()) return;
      const registration = await resolvePushServiceWorkerRegistration();
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: vapidKey.trim(),
        serviceWorkerRegistration: registration,
      });
      if (!token) throw new Error("Jeton FCM vide");
      await persistFcmToken(uid, token, "backoffice");
      setStatus("registered");
      setLastError(null);
      attachForegroundListener();
    },
    [vapidKey, attachForegroundListener]
  );

  useEffect(() => {
    unsubForegroundRef.current?.();
    unsubForegroundRef.current = undefined;

    if (!enabled || !isConfigured || !app || !firestore || !auth || !isFirebasePublicConfigured()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("unsupported");
      return () => {};
    }

    const firebaseAuth = auth;

    if (!vapidKey?.trim()) {
      setStatus("needs_vapid");
      return () => {};
    }

    let unsubAuth: (() => void) | undefined;

    void isSupported().then((supported) => {
      if (!supported) {
        setStatus("unsupported");
        return;
      }

      unsubAuth = onAuthStateChanged(firebaseAuth, (user) => {
        void (async () => {
          setLastError(null);
          if (!user) {
            setStatus("needs_sign_in");
            return;
          }
          if (typeof Notification === "undefined") {
            setStatus("unsupported");
            return;
          }
          if (Notification.permission === "denied") {
            setStatus("blocked");
            return;
          }
          if (Notification.permission !== "granted") {
            setStatus("idle");
            return;
          }
          if (!isWebPushRegistrationAllowed()) {
            setStatus("unsupported");
            return;
          }
          if (!isPushServiceWorkerEnabled()) {
            setStatus("idle");
            return;
          }
          try {
            setStatus("registering");
            await syncTokenForUser(user.uid);
          } catch (e) {
            handleFcmSyncError(e, setStatus, setLastError, { logTag: "[FCM backoffice]" });
          }
        })();
      });
    });

    return () => {
      unsubAuth?.();
      unsubForegroundRef.current?.();
      unsubForegroundRef.current = undefined;
    };
  }, [enabled, vapidKey, syncTokenForUser]);

  usePushTokenResyncOnResume(() => {
    const uid = auth?.currentUser?.uid;
    if (!uid || typeof Notification === "undefined" || Notification.permission !== "granted")
      return;
    if (!isWebPushRegistrationAllowed()) return;
    void syncTokenForUser(uid).catch(() => null);
  }, enabled);

  const registerPush = useCallback(async () => {
    const uid = auth?.currentUser?.uid;
    if (!uid) {
      setStatus("needs_sign_in");
      return;
    }
    if (!app || !firestore || !vapidKey?.trim()) return;

    try {
      setStatus("registering");
      setLastError(null);
      if (typeof Notification === "undefined") {
        setStatus("unsupported");
        return;
      }
      if (!isWebPushRegistrationAllowed()) {
        setStatus("unsupported");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("blocked");
        return;
      }
      if (permission !== "granted") {
        setStatus("idle");
        return;
      }
      await syncTokenForUser(uid);
    } catch (e) {
      handleFcmSyncError(e, setStatus, setLastError, {
        logTag: "[FCM backoffice]",
        surfaceErrorInUi: true,
      });
    }
  }, [vapidKey, syncTokenForUser]);

  return useMemo(() => ({ status, lastError, registerPush }), [status, lastError, registerPush]);
}
