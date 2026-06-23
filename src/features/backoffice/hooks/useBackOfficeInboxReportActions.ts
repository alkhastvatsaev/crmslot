"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { auth, firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { isBackofficeReportInInboxActiveQueue } from "@/features/backoffice/backofficeReportsInboxArchive";
import type { BackOfficeInboxActionsArgs } from "@/features/backoffice/backOfficeInboxActionsTypes";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";

type Args = Pick<
  BackOfficeInboxActionsArgs,
  "interventions" | "terrainBridge" | "setSelectedItemId" | "setSelectedTerrainLocalId" | "t"
>;

export function useBackOfficeInboxReportActions({
  interventions,
  terrainBridge,
  setSelectedItemId,
  setSelectedTerrainLocalId,
  t,
}: Args) {
  const dismissTerrainReportsForIntervention = useCallback(
    (id: string) => {
      if (!terrainBridge) return;
      terrainBridge.reports
        .filter((r) => r.interventionId === id)
        .forEach((r) => terrainBridge.dismissReport(r.localId));
    },
    [terrainBridge]
  );

  const handleVerify = useCallback(
    async (id: string) => {
      try {
        const row = interventions.find((x) => x.id === id);
        if (!row) return;
        const actorUid = auth?.currentUser?.uid?.trim();
        if (!actorUid) return;
        const res = await fetchWithAuth(
          `/api/interventions/${encodeURIComponent(id)}/validate-report`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sendEmail: true }),
          }
        );
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          emailSent?: boolean;
          emailError?: string;
        };
        if (!res.ok || !data.ok) {
          throw new Error(data.error || t("common.try_again"));
        }
        await logCrmInterventionAction({
          kind: "intervention_report_validated",
          iv: row,
          actorUid,
          actorRole: "dispatcher",
          statusBefore: row.status,
          statusAfter: "invoiced",
          note: data.emailSent
            ? "Validation rapport IVANA — facture PDF + e-mail client"
            : "Validation rapport IVANA — facture PDF",
        });
        if (data.emailError) {
          toast.message(String(t("backoffice.toasts.report_verified")), {
            description: data.emailError,
          });
        } else {
          toast.success(t("backoffice.toasts.report_verified"));
        }
        setSelectedItemId(null);
        dismissTerrainReportsForIntervention(id);
        setSelectedTerrainLocalId(null);
      } catch (e) {
        logger.error("Validation rapport:", { error: e instanceof Error ? e.message : String(e) });
        const code =
          typeof e === "object" && e !== null && "code" in e
            ? String((e as { code?: string }).code)
            : "";
        toast.error(t("common.error"), {
          description:
            code === "permission-denied"
              ? t("backoffice.toasts.permission_denied_verify")
              : e instanceof Error
                ? e.message
                : t("common.try_again"),
        });
      }
    },
    [
      dismissTerrainReportsForIntervention,
      interventions,
      setSelectedItemId,
      setSelectedTerrainLocalId,
      t,
    ]
  );

  const handleArchiveReport = useCallback(
    async (id: string) => {
      if (!firestore) {
        toast.error(t("backoffice.toasts.firestore_unavailable"));
        return;
      }
      const row = interventions.find((x) => x.id === id);
      if (!row || !isBackofficeReportInInboxActiveQueue(row)) return;
      const actorUid = auth?.currentUser?.uid?.trim();
      if (!actorUid) return;
      const archivedAt = new Date().toISOString();
      try {
        await updateDoc(doc(firestore, "interventions", id), {
          backofficeReportsArchivedAt: archivedAt,
          technicianReportAmendedAt: null,
          technicianReportAmendedByUid: null,
        });
        await logCrmInterventionAction({
          kind: "intervention_report_archived",
          iv: row,
          actorUid,
          actorRole: "dispatcher",
          note: "Rapport archivé (inbox IVANA)",
        });
        toast.success(t("backoffice.toasts.report_archived"));
        setSelectedItemId(null);
        setSelectedTerrainLocalId(null);
      } catch (e) {
        logger.error("Archivage rapport:", { error: e instanceof Error ? e.message : String(e) });
        toast.error(t("common.error"), {
          description: e instanceof Error ? e.message : t("common.try_again"),
        });
      }
    },
    [interventions, setSelectedItemId, setSelectedTerrainLocalId, t]
  );

  const handleRejectReport = useCallback(
    async (id: string, reason?: string) => {
      try {
        const row = interventions.find((x) => x.id === id);
        if (!row) return;
        const actorUid = auth?.currentUser?.uid?.trim();
        if (!actorUid) return;
        const res = await fetchWithAuth(
          `/api/interventions/${encodeURIComponent(id)}/reject-report`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: reason?.trim() || undefined }),
          }
        );
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) throw new Error(data.error || t("common.try_again"));
        await logCrmInterventionAction({
          kind: "intervention_report_rejected",
          iv: row,
          actorUid,
          actorRole: "dispatcher",
          statusBefore: row.status,
          statusAfter: "in_progress",
          note: reason ? `Rapport refusé — ${reason}` : "Rapport refusé — renvoyé au technicien",
        });
        toast.success(t("backoffice.toasts.report_rejected"));
        setSelectedItemId(null);
        dismissTerrainReportsForIntervention(id);
        setSelectedTerrainLocalId(null);
      } catch (e) {
        logger.error("Rejet rapport:", { error: e instanceof Error ? e.message : String(e) });
        toast.error(t("common.error"), {
          description: e instanceof Error ? e.message : t("common.try_again"),
        });
      }
    },
    [
      dismissTerrainReportsForIntervention,
      interventions,
      setSelectedItemId,
      setSelectedTerrainLocalId,
      t,
    ]
  );

  return { handleVerify, handleArchiveReport, handleRejectReport };
}
