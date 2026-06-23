"use client";

import { useEffect, useState } from "react";
import type { Auth, User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { logger } from "@/core/logger";
import { isFirestorePermissionDenied } from "@/core/firestore/firestoreClientErrors";
import { ensurePortalChatProfile } from "@/features/backoffice/ensurePortalChatProfile";

export type PortalChatProfileBootstrapState = {
  ready: boolean;
  errorKey: string | null;
};

/**
 * Crée le doc `client_portal_profiles/{uid}` avant l’écoute Firestore.
 * Les règles chat exigent `clientPortalLinkedToCompany` — sans profil → permission-denied.
 */
export function usePortalChatProfileBootstrap(
  publishAsPortal: boolean,
  chatDb: Firestore | null,
  chatAuth: Auth | null,
  companyIdTrimmed: string,
  user: User | null,
  portalAuthReady: boolean
): PortalChatProfileBootstrapState {
  const [state, setState] = useState<PortalChatProfileBootstrapState>({
    ready: !publishAsPortal,
    errorKey: null,
  });

  useEffect(() => {
    if (!publishAsPortal) {
      setState({ ready: true, errorKey: null });
      return;
    }

    if (!companyIdTrimmed) {
      setState({ ready: false, errorKey: "chat.company_unconfigured" });
      return;
    }

    if (!portalAuthReady || !user || !chatDb || !chatAuth?.currentUser) {
      setState({ ready: false, errorKey: null });
      return;
    }

    let cancelled = false;
    setState({ ready: false, errorKey: null });

    void ensurePortalChatProfile(chatDb, chatAuth.currentUser, companyIdTrimmed)
      .then(() => {
        if (!cancelled) setState({ ready: true, errorKey: null });
      })
      .catch((err) => {
        logger.error("[usePortalChatProfileBootstrap] ensurePortalChatProfile", {
          companyId: companyIdTrimmed,
          uid: chatAuth.currentUser?.uid,
          error: err instanceof Error ? err.message : String(err),
        });
        if (cancelled) return;
        setState({
          ready: false,
          errorKey: isFirestorePermissionDenied(err)
            ? "chat.profile_permission_denied"
            : "chat.profile_sync_failed",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [publishAsPortal, companyIdTrimmed, portalAuthReady, user?.uid, chatDb, chatAuth]);

  return state;
}
