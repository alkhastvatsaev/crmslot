"use client";

import { useCallback } from "react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { firestore } from "@/core/config/firebase";
import {
  logPageNavigation,
  logInterventionViewed,
  logEmailViewed,
  logCustomNavNote,
} from "./logNavigationActivity";

type InterventionMeta = {
  id: string;
  title?: string | null;
  clientName?: string | null;
  address?: string | null;
};

/**
 * Hook centralisé pour logguer toutes les actions de navigation/consultation.
 * Fire-and-forget : les erreurs sont silencieuses pour ne pas bloquer l'UI.
 */
export function useActivityLog() {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId ?? "";
  const uid = workspace?.firebaseUid ?? "";

  const logPage = useCallback(
    (pageIndex: number) => {
      if (!firestore || !companyId || !uid) return;
      void logPageNavigation(firestore, companyId, uid, pageIndex);
    },
    [companyId, uid]
  );

  const logIntervention = useCallback(
    (iv: InterventionMeta) => {
      if (!firestore || !companyId || !uid) return;
      void logInterventionViewed(firestore, companyId, uid, iv);
    },
    [companyId, uid]
  );

  const logEmail = useCallback(
    (subject: string) => {
      if (!firestore || !companyId || !uid) return;
      void logEmailViewed(firestore, companyId, uid, subject);
    },
    [companyId, uid]
  );

  const logNote = useCallback(
    (note: string) => {
      if (!firestore || !companyId || !uid) return;
      void logCustomNavNote(firestore, companyId, uid, note);
    },
    [companyId, uid]
  );

  return { logPage, logIntervention, logEmail, logNote };
}
