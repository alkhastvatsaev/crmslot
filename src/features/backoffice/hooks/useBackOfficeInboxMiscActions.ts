"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { doc, deleteDoc } from "firebase/firestore";
import { auth, firestore } from "@/core/config/firebase";
import { isSyntheticInterventionId } from "@/core/config/syntheticInterventions";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import type { BackOfficeInboxActionsArgs } from "@/features/backoffice/backOfficeInboxActionsTypes";

type Args = Pick<BackOfficeInboxActionsArgs, "interventions" | "setSelectedItemId" | "t">;

export function useBackOfficeInboxMiscActions({ interventions, setSelectedItemId, t }: Args) {
  const handleDownloadQuotePdf = useCallback(
    async (interventionId: string) => {
      try {
        const res = await fetchWithAuth(
          `/api/interventions/${encodeURIComponent(interventionId)}/quote-pdf`
        );
        if (!res.ok) throw new Error("pdf failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `devis-${interventionId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast.error(String(t("common.error")));
      }
    },
    [t]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (isSyntheticInterventionId(id)) {
        toast.success(t("backoffice.toasts.request_deleted"));
        setSelectedItemId(null);
        return;
      }
      if (!firestore) return;
      const row = interventions.find((x) => x.id === id);
      const actorUid = auth?.currentUser?.uid?.trim() || "system";
      try {
        if (row) {
          await logCrmInterventionAction({
            kind: "intervention_deleted",
            iv: row,
            actorUid,
            actorRole: "dispatcher",
            note: "Suppression dossier (back-office / dispatcher)",
          });
        }
        await deleteDoc(doc(firestore, "interventions", id));
        toast.success(t("backoffice.toasts.request_deleted"));
        setSelectedItemId(null);
      } catch {
        toast.error(t("common.error"), { description: t("backoffice.toasts.delete_failed") });
      }
    },
    [interventions, setSelectedItemId, t]
  );

  return { handleDownloadQuotePdf, handleDelete };
}
