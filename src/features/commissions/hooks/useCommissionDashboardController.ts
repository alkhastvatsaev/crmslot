"use client";

import { useEffect, useState } from "react";
import { auth, firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
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
import { useCommissionRules } from "@/features/commissions/useCommissionRules";

export type CommissionDashboardTab = "rules" | "manual" | "history";

export function useCommissionDashboardController() {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.isTenantUser ? workspace.activeCompanyId : null;

  const [activeTab, setActiveTab] = useState<CommissionDashboardTab>("rules");
  const { rules, loading } = useCommissionRules(companyId);

  const [isAdding, setIsAdding] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [level, setLevel] = useState<CommissionLevel>("group");
  const [targetId, setTargetId] = useState("");
  const [valueType, setValueType] = useState<CommissionValueType>("percentage");
  const [value, setValue] = useState<number>(0);

  const [manualEntries, setManualEntries] = useState<ManualCommissionEntry[]>([]);
  const [savingManual, setSavingManual] = useState(false);
  const [manualTechUid, setManualTechUid] = useState("");
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualReason, setManualReason] = useState("");
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!companyId || !firestore) return;
    return subscribeManualCommissions(firestore, companyId, setManualEntries);
  }, [companyId]);

  const resetForm = () => {
    setEditingRuleId(null);
    setTargetId(companyId ?? "");
    setValue(0);
    setLevel("group");
    setValueType("percentage");
  };

  const resolvedTargetId = level === "group" && companyId ? companyId : targetId.trim();

  const levelLabel = (lvl: CommissionLevel) => t(`commissions.dashboard.level.${lvl}`);

  const targetPlaceholder = () => {
    if (level === "group") return String(t("commissions.dashboard.target_group"));
    if (level === "technician") return String(t("commissions.dashboard.target_technician"));
    return String(t("commissions.dashboard.target_intervention"));
  };

  const toggleAddRule = () => {
    setIsAdding(!isAdding);
    resetForm();
  };

  const startEditRule = (rule: CommissionRule) => {
    setEditingRuleId(rule.id);
    setIsAdding(true);
    setLevel(rule.level);
    setTargetId(rule.targetId);
    setValueType(rule.valueType);
    setValue(rule.value);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !firestore || !resolvedTargetId) return;
    const uid = auth?.currentUser?.uid?.trim() ?? "unknown";
    setSaving(true);
    try {
      const payload = {
        level,
        targetId: resolvedTargetId,
        valueType,
        value,
      };
      if (editingRuleId) {
        await updateCommissionRule(firestore, editingRuleId, companyId, payload, uid);
      } else {
        await createCommissionRule(firestore, companyId, {
          ...payload,
          createdByUid: uid,
        });
      }
      setIsAdding(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (rule: CommissionRule) => {
    if (!firestore || !companyId) return;
    const uid = auth?.currentUser?.uid?.trim() ?? "unknown";
    await deleteCommissionRule(firestore, rule.id, companyId, uid, {
      level: rule.level,
      targetId: rule.targetId,
      valueType: rule.valueType,
      value: rule.value,
    });
    if (editingRuleId === rule.id) {
      setIsAdding(false);
      resetForm();
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !firestore || !manualTechUid.trim()) return;
    const uid = auth?.currentUser?.uid?.trim() ?? "unknown";
    setSavingManual(true);
    try {
      await createManualCommission(firestore, companyId, {
        technicianUid: manualTechUid.trim(),
        amountEuros: manualAmount,
        reason: manualReason.trim(),
        date: manualDate,
        createdByUid: uid,
      });
      setManualTechUid("");
      setManualAmount(0);
      setManualReason("");
      setManualDate(new Date().toISOString().split("T")[0]);
    } finally {
      setSavingManual(false);
    }
  };

  return {
    t,
    companyId,
    activeTab,
    setActiveTab,
    rules,
    loading,
    isAdding,
    editingRuleId,
    saving,
    level,
    setLevel,
    targetId,
    setTargetId,
    valueType,
    setValueType,
    value,
    setValue,
    resolvedTargetId,
    manualEntries,
    savingManual,
    manualTechUid,
    setManualTechUid,
    manualAmount,
    setManualAmount,
    manualReason,
    setManualReason,
    manualDate,
    setManualDate,
    levelLabel,
    targetPlaceholder,
    toggleAddRule,
    startEditRule,
    handleSaveRule,
    handleDeleteRule,
    handleAddManual,
  };
}
