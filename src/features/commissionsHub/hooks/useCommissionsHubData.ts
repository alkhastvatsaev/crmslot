"use client";

import { useCallback, useEffect, useState } from "react";
import { auth, firestore } from "@/core/config/firebase";
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
    removeRule,
    saveManualEntry,
  };
}
