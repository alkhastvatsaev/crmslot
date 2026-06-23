"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { logger } from "@/core/logger";
import { isFirestorePermissionDenied } from "@/core/firestore/firestoreClientErrors";
import { requestPortalChatProfileEnsure } from "@/features/backoffice/requestPortalChatProfileEnsure";

export type PortalChatProfileBootstrapState = {
  ready: boolean;
  errorKey: string | null;
};

/**
 * Initialise `client_portal_profiles/{uid}` via API Admin avant l’écoute Firestore.
 * Contourne les refus d’écriture client (règles / App Check) pour les invités anonymes.
 */
export function usePortalChatProfileBootstrap(
  publishAsPortal: boolean,
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

    if (!portalAuthReady || !user) {
      setState({ ready: false, errorKey: null });
      return;
    }

    let cancelled = false;
    setState({ ready: false, errorKey: null });

    void requestPortalChatProfileEnsure(user, companyIdTrimmed)
      .then(() => {
        if (!cancelled) setState({ ready: true, errorKey: null });
      })
      .catch((err) => {
        logger.error("[usePortalChatProfileBootstrap] requestPortalChatProfileEnsure", {
          companyId: companyIdTrimmed,
          uid: user.uid,
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
  }, [publishAsPortal, companyIdTrimmed, portalAuthReady, user?.uid]);

  return state;
}
