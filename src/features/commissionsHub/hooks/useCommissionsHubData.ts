"use client";

import { useCallback, useEffect, useState } from "react";
import { auth, firestore } from "@/core/config/firebase";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { logger } from "@/core/logger";
import { useCommissionRules } from "@/features/commissions/useCommissionRules";
import {
  createCommissionRule,
  createManualCommission,
  deleteCommissionRule,
  subscribeManualCommissions,
  updateCommissionRule,
  type ManualCommissionEntry,
} from "@/features/commissions/commissionFirestore";
import type {
  CommissionLevel,
  CommissionRule,
  CommissionValueType,
} from "@/features/commissions/types";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";

export function useCommissionsHubData(companyId: string | null) {
  const { rules, loading: rulesLoading } = useCommissionRules(companyId);
  const { interventions, loading: interventionsLoading } = useBackOfficeInterventions(companyId);
  const [manualEntries, setManualEntries] = useState<ManualCommissionEntry[]>([]);
  const [manualLoading, setManualLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId || !firestore) {
      setManualEntries([]);
      setManualLoading(false);
      return;
    }
    setManualLoading(true);
    return subscribeManualCommissions(firestore, companyId, (rows) => {
      setManualEntries(rows);
      setManualLoading(false);
    });
  }, [companyId]);

  const saveTechnicianRate = useCallback(
    async (input: {
      technicianUid: string;
      alternateTargetIds: string[];
      valueType: CommissionValueType;
      value: number;
    }) => {
      if (!companyId) return false;
      const technicianUid = input.technicianUid.trim();
      if (!technicianUid) return false;

      try {
        const res = await fetchWithAuth(
          `/api/companies/${encodeURIComponent(companyId)}/commission-rules/technician`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              technicianUid,
              alternateTargetIds: input.alternateTargetIds,
              valueType: input.valueType,
              value: input.value,
            }),
          }
        );
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
        } | null;
        if (!res.ok || !data?.ok) {
          logger.warn("[useCommissionsHubData] saveTechnicianRate rejected", {
            companyId,
            technicianUid,
            status: res.status,
            error: data?.error ?? res.statusText,
          });
          return false;
        }
        return true;
      } catch (error) {
        logger.warn("[useCommissionsHubData] saveTechnicianRate failed", {
          companyId,
          technicianUid,
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    },
    [companyId]
  );

  const saveRule = useCallback(
    async (input: {
      editingRuleId: string | null;
      level: CommissionLevel;
      targetId: string;
      valueType: CommissionValueType;
      value: number;
    }) => {
      if (!companyId || !firestore) return false;
      const uid = auth?.currentUser?.uid?.trim() ?? "unknown";
      const targetId = input.level === "group" ? companyId : input.targetId.trim();
      if (!targetId) return false;

      setSaving(true);
      try {
        const payload = {
          level: input.level,
          targetId,
          valueType: input.valueType,
          value: input.value,
        };
        if (input.editingRuleId) {
          await updateCommissionRule(firestore, input.editingRuleId, companyId, payload, uid);
        } else {
          await createCommissionRule(firestore, companyId, { ...payload, createdByUid: uid });
        }
        return true;
      } catch (error) {
        logger.warn("[useCommissionsHubData] saveRule failed", {
          companyId,
          level: input.level,
          targetId,
          editingRuleId: input.editingRuleId,
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [companyId]
  );

  const removeRule = useCallback(
    async (rule: CommissionRule) => {
      if (!companyId || !firestore) return;
      const uid = auth?.currentUser?.uid?.trim() ?? "unknown";
      await deleteCommissionRule(firestore, rule.id, companyId, uid, {
        level: rule.level,
        targetId: rule.targetId,
        valueType: rule.valueType,
        value: rule.value,
      });
    },
    [companyId]
  );

  const saveManualEntry = useCallback(
    async (input: { technicianUid: string; amountEuros: number; reason: string; date: string }) => {
      if (!companyId || !firestore || !input.technicianUid.trim()) return false;
      const uid = auth?.currentUser?.uid?.trim() ?? "unknown";
      setSaving(true);
      try {
        await createManualCommission(firestore, companyId, {
          technicianUid: input.technicianUid.trim(),
          amountEuros: input.amountEuros,
          reason: input.reason.trim(),
          date: input.date,
          createdByUid: uid,
        });
        return true;
      } finally {
        setSaving(false);
      }
    },
    [companyId]
  );

  return {
    rules,
    interventions,
    manualEntries,
    rulesLoading,
    interventionsLoading,
    manualLoading,
    saving,
    saveRule,
    saveTechnicianRate,
    removeRule,
    saveManualEntry,
  };
}
