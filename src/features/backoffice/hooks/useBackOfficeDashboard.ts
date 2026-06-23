"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useActivityLog } from "@/features/crmHistory/useActivityLog";
import { auth, firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { toast } from "sonner";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import type { Intervention } from "@/features/interventions";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useTechnicians } from "@/features/technicians/hooks";
import {
  applyBackofficeFilters,
  defaultBackofficeViewFilters,
  sortBackofficeRowsDesc,
  uniqueAssignedTechnicianUids,
  type ActivityWindow,
  type BackofficeViewFilters,
} from "@/features/backoffice/backofficeFilters";
import { computeTodayActivitySummary } from "@/features/backoffice/todayActivity";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";

export function useBackOfficeDashboard() {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const { logIntervention } = useActivityLog();
  const [filters, setFilters] = useState<BackofficeViewFilters>(() =>
    defaultBackofficeViewFilters()
  );
  const [companyFilterId, setCompanyFilterId] = useState("");
  const [detail, setDetailState] = useState<Intervention | null>(null);
  const setDetail = useCallback(
    (iv: Intervention | null) => {
      setDetailState(iv);
      if (iv) logIntervention(iv);
    },
    [logIntervention]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (workspace?.activeCompanyId) setCompanyFilterId(workspace.activeCompanyId);
  }, [workspace?.activeCompanyId]);

  const tenantReady = Boolean(workspace?.isTenantUser && companyFilterId.trim());
  const { interventions, loading, error } = useBackOfficeInterventions(
    tenantReady ? companyFilterId : null
  );
  const { technicians } = useTechnicians();

  const summary = useMemo(() => computeTodayActivitySummary(interventions), [interventions]);

  const filteredSorted = useMemo(() => {
    const f = applyBackofficeFilters(interventions, filters);
    return sortBackofficeRowsDesc(f);
  }, [interventions, filters]);

  const techUids = useMemo(() => uniqueAssignedTechnicianUids(interventions), [interventions]);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (!window.confirm(String(t("common.confirm_delete")) || "Confirmer la suppression ?")) return;

    try {
      const row = interventions.find((x) => x.id === id);
      const actorUid = auth?.currentUser?.uid?.trim() || "system";
      if (row) {
        await logCrmInterventionAction({
          kind: "intervention_deleted",
          iv: row,
          actorUid,
          actorRole: "dispatcher",
          note: "Suppression depuis le tableau de bord",
        });
      }
      await deleteDoc(doc(firestore, "interventions", id));
      toast.success(String(t("backoffice.toasts.request_deleted")));
      setDetail(null);
    } catch (e) {
      logger.error("Delete failed:", { error: e instanceof Error ? e.message : String(e) });
      toast.error(String(t("common.error")));
    }
  };

  const handleArchive = async (id: string) => {
    if (!firestore) return;
    try {
      const row = interventions.find((x) => x.id === id);
      const invoicedAt = new Date().toISOString();
      const actorUid = auth?.currentUser?.uid?.trim() || "system";
      await updateDoc(doc(firestore, "interventions", id), {
        status: "invoiced",
        invoicedAt,
      });
      if (row) {
        await logCrmInterventionAction({
          kind: "intervention_invoiced",
          iv: { ...row, status: "invoiced", invoicedAt },
          actorUid,
          actorRole: "dispatcher",
          statusBefore: row.status,
          statusAfter: "invoiced",
          note: "Marqué facturé (tableau de bord)",
        });
      }
      toast.success(String(t("backoffice.toasts.status_updated")));
      setDetail(null);
    } catch (e) {
      logger.error("Archive failed:", { error: e instanceof Error ? e.message : String(e) });
      toast.error(String(t("common.error")));
    }
  };

  const setWindow = useCallback((activityWindow: ActivityWindow) => {
    setFilters((prev) => ({ ...prev, activityWindow }));
  }, []);

  return {
    workspace,
    filters,
    setFilters,
    companyFilterId,
    setCompanyFilterId,
    detail,
    setDetail,
    tenantReady,
    interventions,
    loading,
    error,
    technicians,
    summary,
    filteredSorted,
    techUids,
    handleDelete,
    handleArchive,
    setWindow,
  };
}
