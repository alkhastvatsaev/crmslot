"use client";

import CommissionTechnicianSelect from "@/features/commissions/components/CommissionTechnicianSelect";
import type { useCommissionDashboardController } from "@/features/commissions/hooks/useCommissionDashboardController";
import type { CommissionLevel, CommissionValueType } from "@/features/commissions/types";

type View = ReturnType<typeof useCommissionDashboardController>;

export default function CommissionDashboardRulesTab({ view }: { view: View }) {
  const {
    t,
    companyId,
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
    levelLabel,
    targetPlaceholder,
    handleSaveRule,
    startEditRule,
    handleDeleteRule,
  } = view;

  return (
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
                <option value="intervention">
                  {t("commissions.dashboard.level.intervention")}
                </option>
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 read-only:bg-slate-100 read-only:text-slate-600 focus:ring-2 focus:ring-blue-500"
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
                <tr
                  key={rule.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-800">
                      {levelLabel(rule.level)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-600">{rule.targetId}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {rule.valueType === "percentage" ? `${rule.value}%` : `${rule.value} €`}
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
                        onClick={() => void handleDeleteRule(rule)}
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
  );
}
