"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { toast } from "sonner";
import { auth, app, firestore, isConfigured } from "@/core/config/firebase";
import { CLIENT_PORTAL_PROFILE_COLLECTION } from "@/features/auth";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { useRequesterHub } from "@/context/RequesterHubContext";
import {
  navigateCompanyHub,
  COMPANY_HUB_ANCHOR_CLIENT_PORTAL,
} from "@/features/company/companyHubNavigation";
import { isFirebasePublicConfigured } from "@/features/notifications/firebasePublicConfig";
import {
  type FcmUiStatus,
  handleFcmSyncError,
  isPushServiceWorkerEnabled,
  isWebPushDeliveryCapable,
  persistFcmToken,
  resolvePushServiceWorkerRegistration,
} from "@/features/notifications/fcmWebPush";
import { usePushTokenResyncOnResume } from "@/features/notifications/hooks/usePushTokenResyncOnResume";
import { scheduleEffectUpdate } from "@/utils/scheduleEffectUpdate";

export type ClientPortalPushApi = {
  status: FcmUiStatus;
  lastError: string | null;
  registerPush: () => Promise<void>;
};

export function useClientPortalPushMessaging(
  vapidKey: string | undefined,
  opts?: { enabled?: boolean }
): ClientPortalPushApi {
  const enabled = opts?.enabled !== false;
  const pager = useDashboardPagerOptional();
  const { setLastSubmittedInterventionId, setPendingTrackingInterventionId, setPortalRightTab } =
    useRequesterHub();

  const [status, setStatus] = useState<FcmUiStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const unsubForegroundRef = useRef<(() => void) | undefined>(undefined);

  const openChatFromPayload = useCallback(
    (interventionId: string | undefined) => {
      if (interventionId?.trim()) {
        const id = interventionId.trim();
        setLastSubmittedInterventionId(id);
        setPendingTrackingInterventionId(id);
      }
      navigateCompanyHub(pager, COMPANY_HUB_ANCHOR_CLIENT_PORTAL);
      setPortalRightTab("chat");
    },
    [pager, setLastSubmittedInterventionId, setPendingTrackingInterventionId, setPortalRightTab]
  );

  const openTrackingFromPayload = useCallback(
    (interventionId: string | undefined) => {
      if (!interventionId?.trim()) return;
      const id = interventionId.trim();
      navigateCompanyHub(pager, COMPANY_HUB_ANCHOR_CLIENT_PORTAL);
      setLastSubmittedInterventionId(id);
      setPendingTrackingInterventionId(id);
      setPortalRightTab("tracking");
    },
    [pager, setLastSubmittedInterventionId, setPendingTrackingInterventionId, setPortalRightTab]
  );

  const attachForegroundListener = useCallback(() => {
    if (!app) return;
    unsubForegroundRef.current?.();
    const messaging = getMessaging(app);
    unsubForegroundRef.current = onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "CRMSLOT";
      const body = payload.notification?.body ?? "";
      toast.message(title, { description: body });
      const pushType = typeof payload.data?.type === "string" ? payload.data.type : "";
      const id =
        typeof payload.data?.interventionId === "string" ? payload.data.interventionId : undefined;
      if (pushType === "portal_chat") {
        openChatFromPayload(id);
      } else if (pushType === "payment_received" || pushType === "status_change") {
        openTrackingFromPayload(id);
      }
    });
  }, [openChatFromPayload, openTrackingFromPayload]);

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
      await persistFcmToken(uid, token, "client");
      setStatus("registered");
      setLastError(null);
      attachForegroundListener();
    },
    [vapidKey, attachForegroundListener]
  );

  useEffect(() => {
    unsubForegroundRef.current?.();
    unsubForegroundRef.current = undefined;

    const db = firestore;
    const firebaseAuth = auth;

    if (
      !enabled ||
      !isConfigured ||
      !app ||
      !db ||
      !firebaseAuth ||
      !isFirebasePublicConfigured()
    ) {
      scheduleEffectUpdate(() => setStatus("unsupported"));
      return () => {};
    }

    if (!vapidKey?.trim()) {
      scheduleEffectUpdate(() => setStatus("needs_vapid"));
      return () => {};
    }

    let unsubAuth: (() => void) | undefined;

    void isSupported().then((supported) => {
      if (!supported) {
        scheduleEffectUpdate(() => setStatus("unsupported"));
        return;
      }

      unsubAuth = onAuthStateChanged(auth!, (user) => {
        void (async () => {
          setLastError(null);
          if (!user) {
            setStatus("needs_sign_in");
            return;
          }

          const profileSnap = await getDoc(
            doc(firestore!, CLIENT_PORTAL_PROFILE_COLLECTION, user.uid)
          ).catch(() => null);
          if (!profileSnap?.exists()) {
            setStatus("not_client");
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

          if (!isWebPushDeliveryCapable()) {
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
            handleFcmSyncError(e, setStatus, setLastError, { logTag: "[FCM client]" });
          }
        })();
      });
    });

    return () => {
      unsubAuth?.();
      unsubForegroundRef.current?.();
    };
  }, [enabled, vapidKey, syncTokenForUser]);

  usePushTokenResyncOnResume(() => {
    const uid = auth?.currentUser?.uid;
    if (!uid || typeof Notification === "undefined" || Notification.permission !== "granted")
      return;
    if (!isWebPushDeliveryCapable()) return;
    void syncTokenForUser(uid).catch(() => null);
  }, enabled);

  const registerPush = useCallback(async () => {
    const uid = auth?.currentUser?.uid;
    if (!uid) {
      setStatus("needs_sign_in");
      return;
    }
    if (!app || !firestore || !vapidKey?.trim()) return;

    const profileSnap = await getDoc(doc(firestore, CLIENT_PORTAL_PROFILE_COLLECTION, uid)).catch(
      () => null
    );
    if (!profileSnap?.exists()) {
      setStatus("not_client");
      return;
    }

    try {
      setStatus("registering");
      setLastError(null);
      if (typeof Notification === "undefined") {
        setStatus("unsupported");
        return;
      }
      if (!isWebPushDeliveryCapable()) {
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
        logTag: "[FCM client]",
        surfaceErrorInUi: true,
      });
    }
  }, [vapidKey, syncTokenForUser]);

  return useMemo(() => ({ status, lastError, registerPush }), [status, lastError, registerPush]);
}
