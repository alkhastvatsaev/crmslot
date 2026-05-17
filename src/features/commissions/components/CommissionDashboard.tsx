"use client";

import { useEffect, useState } from "react";
import { auth, firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCommissionRules } from "../useCommissionRules";
import { createCommissionRule, deleteCommissionRule } from "../commissionFirestore";
import type { CommissionLevel, CommissionValueType } from "../types";

export const CommissionDashboard: React.FC = () => {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.isTenantUser ? workspace.activeCompanyId : null;

  const { rules, loading } = useCommissionRules(companyId);

  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [level, setLevel] = useState<CommissionLevel>("group");
  const [targetId, setTargetId] = useState("");
  const [valueType, setValueType] = useState<CommissionValueType>("percentage");
  const [value, setValue] = useState<number>(0);

  const resetForm = () => {
    setTargetId(companyId ?? "");
    setValue(0);
    setLevel("group");
    setValueType("percentage");
  };

  useEffect(() => {
    if (level === "group" && companyId) setTargetId(companyId);
  }, [level, companyId]);

  const resolvedTargetId =
    level === "group" && companyId ? companyId : targetId.trim();

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !firestore || !resolvedTargetId) return;
    const uid = auth?.currentUser?.uid?.trim() ?? "unknown";
    setSaving(true);
    try {
      await createCommissionRule(firestore, companyId, {
        level,
        targetId: resolvedTargetId,
        valueType,
        value,
        createdByUid: uid,
      });
      setIsAdding(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!firestore) return;
    await deleteCommissionRule(firestore, ruleId);
  };

  const levelLabel = (lvl: CommissionLevel) => t(`commissions.dashboard.level.${lvl}`);

  const targetPlaceholder = () => {
    if (level === "group") return String(t("commissions.dashboard.target_group"));
    if (level === "technician") return String(t("commissions.dashboard.target_technician"));
    return String(t("commissions.dashboard.target_intervention"));
  };

  return (
    <div data-testid="commission-dashboard" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t("commissions.dashboard.title")}</h2>
          <p className="text-sm text-slate-500">{t("commissions.dashboard.subtitle")}</p>
        </div>
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
      </div>

      {isAdding ? (
        <form
          onSubmit={(e) => void handleAddRule(e)}
          data-testid="commission-rule-form"
          className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <h3 className="mb-4 font-semibold text-slate-700">{t("commissions.dashboard.form_title")}</h3>
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
              <input
                type="text"
                required
                readOnly={level === "group"}
                data-testid="commission-target-input"
                value={level === "group" && companyId ? companyId : targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder={targetPlaceholder()}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 read-only:bg-slate-100 read-only:text-slate-600"
              />
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
              {saving ? t("commissions.dashboard.saving") : t("commissions.dashboard.save_rule")}
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
                    <button
                      type="button"
                      data-testid={`commission-delete-${rule.id}`}
                      onClick={() => void handleDelete(rule.id)}
                      className="text-sm font-medium text-red-500 hover:text-red-700"
                    >
                      {t("common.delete")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
