"use client";

import { useEffect, useRef } from "react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { firestore } from "@/core/config/firebase";
import { logUserSessionStart } from "../logNavigationActivity";

/**
 * Composant invisible. Détecte la connexion utilisateur (transition uid null→non-null)
 * et logue un event user_session_start dans crm_activity.
 */
export default function AuthActivityLogger() {
  const workspace = useCompanyWorkspaceOptional();
  const uid = workspace?.firebaseUid ?? null;
  const companyId = workspace?.activeCompanyId ?? "";
  const prevUidRef = useRef<string | null>(undefined as unknown as null);

  useEffect(() => {
    const prev = prevUidRef.current;
    prevUidRef.current = uid;

    if (uid && !prev && companyId && firestore) {
      void logUserSessionStart(firestore, companyId, uid);
    }
  }, [uid, companyId]);

  return null;
}
