"use client";

import { useEffect, useState } from "react";
import { auth, firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCommissionRules } from "../useCommissionRules";
import {
  createCommissionRule,
  deleteCommissionRule,
  updateCommissionRule,
  createManualCommission,
  subscribeManualCommissions,
  type ManualCommissionEntry,
} from "../commissionFirestore";
import type { CommissionLevel, CommissionRule, CommissionValueType } from "../types";
import CommissionHistoryPanel from "@/features/commissions/components/CommissionHistoryPanel";
import CommissionTechnicianSelect from "@/features/commissions/components/CommissionTechnicianSelect";

type Tab = "rules" | "manual" | "history";

export const CommissionDashboard: React.FC = () => {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.isTenantUser ? workspace.activeCompanyId : null;

  const [activeTab, setActiveTab] = useState<Tab>("rules");

  // ─── Rules tab state ────────────────────────────────────────────────────────
  const { rules, loading } = useCommissionRules(companyId);

  const [isAdding, setIsAdding] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [level, setLevel] = useState<CommissionLevel>("group");
  const [targetId, setTargetId] = useState("");
  const [valueType, setValueType] = useState<CommissionValueType>("percentage");
  const [value, setValue] = useState<number>(0);

  // ─── Manual entry tab state ──────────────────────────────────────────────────
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

  const resetForm = () => {
    setEditingRuleId(null);
    setTargetId(companyId ?? "");
    setValue(0);
    setLevel("group");
    setValueType("percentage");
  };

  const startEditRule = (rule: CommissionRule) => {
    setEditingRuleId(rule.id);
    setIsAdding(true);
    setLevel(rule.level);
    setTargetId(rule.targetId);
    setValueType(rule.valueType);
    setValue(rule.value);
  };

  const resolvedTargetId =
    level === "group" && companyId ? companyId : targetId.trim();

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

  const handleDelete = async (rule: CommissionRule) => {
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

  const levelLabel = (lvl: CommissionLevel) => t(`commissions.dashboard.level.${lvl}`);

  const targetPlaceholder = () => {
    if (level === "group") return String(t("commissions.dashboard.target_group"));
    if (level === "technician") return String(t("commissions.dashboard.target_technician"));
    return String(t("commissions.dashboard.target_intervention"));
  };

  return (
    <div data-testid="commission-dashboard" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t("commissions.dashboard.title")}</h2>
          <p className="text-sm text-slate-500">{t("commissions.dashboard.subtitle")}</p>
        </div>
        {activeTab === "rules" && (
          <button
            type="button"
            data-testid="commission-add-toggle"
            onClick={() => {
              setIsAdding(!isAdding);
              resetForm();
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            {isAdding ? t("common.cancel") : t("commissions.dashboard.add_rule")}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "rules"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t("commissions.dashboard.tab_rules")}
        </button>
        <button
          type="button"
          data-testid="commission-tab-manual"
          onClick={() => setActiveTab("manual")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "manual"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t("commissions.dashboard.tab_manual")}
        </button>
        <button
          type="button"
          data-testid="commission-tab-history"
          onClick={() => setActiveTab("history")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t("commissions.dashboard.tab_history")}
        </button>
      </div>

      {/* ── Tab: Règles auto ── */}
      {activeTab === "rules" && (
        <>
          {isAdding ? (
            <form
              onSubmit={(e) => void handleSaveRule(e)}
              data-testid="commission-rule-form"
              className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <h3 className="mb-4 font-semibold text-slate-700">
                {editingRuleId
                  ? t("commissions.dashboard.form_edit_title")
                  : t("commissions.dashboard.form_title")}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t("commissions.dashboard.level_label")}
                  </label>
                  <select
                    data-testid="commission-level-select"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as CommissionLevel)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="group">{t("commissions.dashboard.level.group")}</option>
                    <option value="technician">{t("commissions.dashboard.level.technician")}</option>
                    <option value="intervention">{t("commissions.dashboard.level.intervention")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t("commissions.dashboard.target_label")}
                  </label>
                  {level === "technician" ? (
                    <CommissionTechnicianSelect
                      value={resolvedTargetId}
                      onChange={setTargetId}
                      testId="commission-target-input"
                    />
                  ) : (
                    <input
                      type="text"
                      required
                      readOnly={level === "group"}
                      data-testid="commission-target-input"
                      value={resolvedTargetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      placeholder={targetPlaceholder()}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 read-only:bg-slate-100 read-only:text-slate-600"
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t("commissions.dashboard.value_type_label")}
                  </label>
                  <select
                    data-testid="commission-value-type-select"
                    value={valueType}
                    onChange={(e) => setValueType(e.target.value as CommissionValueType)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">{t("commissions.dashboard.value_percentage")}</option>
                    <option value="fixed_amount">{t("commissions.dashboard.value_fixed")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t("commissions.dashboard.value_label")}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={valueType === "percentage" ? "0.1" : "1"}
                    data-testid="commission-value-input"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  data-testid="commission-rule-submit"
                  disabled={saving || !companyId}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving
                    ? t("commissions.dashboard.saving")
                    : editingRuleId
                      ? t("commissions.dashboard.update_rule")
                      : t("commissions.dashboard.save_rule")}
                </button>
              </div>
            </form>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    {t("commissions.dashboard.col_level")}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    {t("commissions.dashboard.col_target")}
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    {t("commissions.dashboard.col_value")}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                    {t("commissions.dashboard.col_actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      {t("common.loading")}
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      {t("commissions.dashboard.empty")}
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-800">
                          {levelLabel(rule.level)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-600">{rule.targetId}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">
                        {rule.valueType === "percentage"
                          ? `${rule.value}%`
                          : `${rule.value} €`}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            data-testid={`commission-edit-${rule.id}`}
                            onClick={() => startEditRule(rule)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {t("commissions.dashboard.edit_rule")}
                          </button>
                          <button
                            type="button"
                            data-testid={`commission-delete-${rule.id}`}
                            onClick={() => void handleDelete(rule)}
                            className="text-sm font-medium text-red-500 hover:text-red-700"
                          >
                            {t("common.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Tab: Saisie manuelle ── */}
      {activeTab === "manual" && (
        <>
          <form
            onSubmit={(e) => void handleAddManual(e)}
            data-testid="manual-commission-form"
            className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <h3 className="mb-4 font-semibold text-slate-700">{t("commissions.dashboard.manual_title")}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("commissions.dashboard.manual_tech_uid")}</label>
                <CommissionTechnicianSelect
                  value={manualTechUid}
                  onChange={setManualTechUid}
                  testId="manual-commission-tech-uid"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("commissions.dashboard.manual_amount")}</label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  data-testid="manual-commission-amount"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("commissions.dashboard.manual_reason")}</label>
                <input
                  type="text"
                  required
                  data-testid="manual-commission-reason"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder={String(t("commissions.dashboard.manual_reason_placeholder"))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("commissions.dashboard.manual_date")}</label>
                <input
                  type="date"
                  required
                  data-testid="manual-commission-date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                data-testid="manual-commission-submit"
                disabled={savingManual || !companyId}
                className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {savingManual ? t("commissions.dashboard.manual_saving") : t("commissions.dashboard.manual_save")}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">{t("commissions.dashboard.col_tech")}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">{t("commissions.dashboard.col_amount")}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">{t("commissions.dashboard.col_reason")}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">{t("commissions.dashboard.col_date")}</th>
                </tr>
              </thead>
              <tbody>
                {manualEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      {t("commissions.dashboard.empty")}
                    </td>
                  </tr>
                ) : (
                  manualEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-sm text-slate-600">{entry.technicianUid}</td>
                      <td className="px-4 py-3 text-sm font-medium text-amber-700">{entry.amountEuros.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{entry.reason}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{entry.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "history" && <CommissionHistoryPanel companyId={companyId} />}
    </div>
  );
};
