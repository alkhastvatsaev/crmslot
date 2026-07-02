"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
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
  tokenDocId,
} from "@/features/notifications/fcmWebPush";
import { usePushTokenResyncOnResume } from "@/features/notifications/hooks/usePushTokenResyncOnResume";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { useTechnicianCaseIntent } from "@/context/TechnicianCaseIntentContext";
import { isFirebasePublicConfigured } from "@/features/notifications/firebasePublicConfig";
import {
  navigateTechnicianHub,
  TECHNICIAN_HUB_ANCHOR_MISSIONS,
} from "@/features/interventions/technicianHubNavigation";
import { requestTechnicianAssignmentsResync } from "@/features/interventions/technicianAssignmentSyncEvents";

export type { FcmUiStatus };

/**
 * Enregistre le jeton FCM sous `users/{uid}/fcm_tokens/{id}` et écoute les messages au premier plan.
 */
export function useTechnicianPushMessaging(
  vapidKey: string | undefined,
  opts?: { enabled?: boolean }
) {
  const enabled = opts?.enabled !== false;
  const pager = useDashboardPagerOptional();
  const { setPendingCaseId } = useTechnicianCaseIntent();

  const [status, setStatus] = useState<FcmUiStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);

  const unsubForegroundRef = useRef<(() => void) | undefined>(undefined);

  const openCaseFromPayload = useCallback(
    (interventionId: string | undefined) => {
      if (!interventionId?.trim()) return;
      navigateTechnicianHub(pager, TECHNICIAN_HUB_ANCHOR_MISSIONS);
      setPendingCaseId(interventionId.trim());
    },
    [pager, setPendingCaseId]
  );

  const attachForegroundListener = useCallback(() => {
    if (!app) return;
    unsubForegroundRef.current?.();
    unsubForegroundRef.current = undefined;

    const messaging = getMessaging(app);
    unsubForegroundRef.current = onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "CRMSLOT";
      const body = payload.notification?.body ?? "";
      toast.message(title, { description: body });
      const pushType = typeof payload.data?.type === "string" ? payload.data.type : "";
      const id =
        typeof payload.data?.interventionId === "string" ? payload.data.interventionId : undefined;
      if (pushType === "daily_reminder" || pushType === "appointment_reminder") return;
      if (pushType === "portal_chat") return;
      if (pushType === "assignment" || id?.trim()) {
        requestTechnicianAssignmentsResync();
      }
      if (id?.trim()) openCaseFromPayload(id.trim());
    });
  }, [openCaseFromPayload]);

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

      await persistFcmToken(uid, token, "technician");
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
            handleFcmSyncError(e, setStatus, setLastError, { logTag: "[FCM]" });
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
        logTag: "[FCM]",
        surfaceErrorInUi: true,
      });
    }
  }, [vapidKey, syncTokenForUser]);

  return useMemo(() => ({ status, lastError, registerPush }), [status, lastError, registerPush]);
}

/** Supprime un jeton en base lorsque l’utilisateur révoque les notifications (best-effort). */
export async function deleteStoredFcmToken(uid: string, token: string): Promise<void> {
  if (!firestore) return;
  await deleteDoc(
    doc(firestore, "users", uid, "fcm_tokens", tokenDocId(token, "web", "technician"))
  ).catch(() => null);
}
