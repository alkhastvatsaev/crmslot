"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import HubButton from "@/core/ui/hub/HubButton";
import HubSegmentedControl from "@/core/ui/hub/HubSegmentedControl";
import CommissionTechnicianSelect from "@/features/commissions/components/CommissionTechnicianSelect";
import type {
  CommissionLevel,
  CommissionRule,
  CommissionValueType,
} from "@/features/commissions/types";
import type { CommissionsHubSelection } from "@/features/commissionsHub/commissionsHubTypes";
import {
  formatRuleShort,
  type PatronTechnicianRow,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";
import {
  COMMISSION_LEVEL_BADGE,
  formatCommissionTargetShort,
  formatCommissionValue,
} from "@/features/commissionsHub/commissionsHubFormat";
import CommissionsHubStepHeader from "@/features/commissionsHub/components/CommissionsHubStepHeader";
import CommissionsHubTechRatesList from "@/features/commissionsHub/components/CommissionsHubTechRatesList";
import { cn } from "@/lib/utils";

function formatEur(cents: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type Props = {
  companyId: string;
  selection: CommissionsHubSelection;
  rules: CommissionRule[];
  technicianRows: PatronTechnicianRow[];
  saving: boolean;
  onSelectionChange: (selection: CommissionsHubSelection) => void;
  onSaveRule: (input: {
    editingRuleId: string | null;
    level: CommissionLevel;
    targetId: string;
    valueType: CommissionValueType;
    value: number;
  }) => Promise<boolean>;
  onDeleteRule: (rule: CommissionRule) => Promise<void>;
  onSaveManual: (input: {
    technicianUid: string;
    amountEuros: number;
    reason: string;
    date: string;
  }) => Promise<boolean>;
};

type LocalMode = "idle" | "edit-rule" | "new-rule" | "bonus";

function defaultRuleValue(rules: CommissionRule[], companyId: string): number {
  const group = rules.find((r) => r.level === "group" && r.targetId === companyId);
  return group?.value ?? 10;
}

export default function CommissionsHubRulesPanel({
  companyId,
  selection,
  rules,
  technicianRows,
  saving,
  onSelectionChange,
  onSaveRule,
  onDeleteRule,
  onSaveManual,
}: Props) {
  const { t } = useTranslation();

  const companyRule = useMemo(
    () => rules.find((r) => r.level === "group" && r.targetId === companyId) ?? null,
    [rules, companyId]
  );
  const interventionRules = useMemo(() => rules.filter((r) => r.level === "intervention"), [rules]);
  const personalRules = useMemo(() => rules.filter((r) => r.level === "technician"), [rules]);

  const selectedRule =
    selection.kind === "rule" ? (rules.find((r) => r.id === selection.id) ?? null) : null;
  const selectedTech =
    selection.kind === "technician"
      ? (technicianRows.find((r) => r.uid === selection.uid) ?? null)
      : null;

  const mode: LocalMode =
    selection.kind === "new-rule"
      ? "new-rule"
      : selection.kind === "rule"
        ? "edit-rule"
        : selection.kind === "manual"
          ? "bonus"
          : "idle";

  // ── Rule form local state ──
  const [level, setLevel] = useState<CommissionLevel>("group");
  const [targetId, setTargetId] = useState(companyId);
  const [valueType, setValueType] = useState<CommissionValueType>("percentage");
  const [value, setValue] = useState(15);

  useEffect(() => {
    if (selection.kind === "new-rule") {
      setLevel(selection.level ?? "group");
      setTargetId(selection.targetId ?? companyId);
      setValueType("percentage");
      setValue(defaultRuleValue(rules, companyId));
      return;
    }
    if (selection.kind === "rule" && selectedRule) {
      setLevel(selectedRule.level);
      setTargetId(selectedRule.targetId);
      setValueType(selectedRule.valueType);
      setValue(selectedRule.value);
    }
  }, [selection, selectedRule, companyId, rules]);

  // ── Bonus form local state ──
  const [bonusTechUid, setBonusTechUid] = useState("");
  const [bonusAmount, setBonusAmount] = useState(50);
  const [bonusReason, setBonusReason] = useState("");

  // ── Inline tech-rule editor state ──
  const [techValueType, setTechValueType] = useState<CommissionValueType>("percentage");
  const [techValue, setTechValue] = useState<number>(10);

  useEffect(() => {
    if (selection.kind !== "technician") return;
    const tech = technicianRows.find((r) => r.uid === selection.uid);
    if (!tech) return;
    if (tech.hasPersonalRule && tech.displayRule) {
      setTechValueType(tech.displayRule.valueType);
      setTechValue(tech.displayRule.value);
    } else {
      setTechValueType("percentage");
      setTechValue(defaultRuleValue(rules, companyId));
    }
  }, [selection, technicianRows, rules, companyId]);

  const handleSaveTechRule = async (
    techUid: string,
    hasPersonal: boolean,
    ruleId: string | null
  ) => {
    await onSaveRule({
      editingRuleId: hasPersonal ? ruleId : null,
      level: "technician",
      targetId: techUid,
      valueType: techValueType,
      value: techValue,
    });
  };

  const handleRemoveTechRule = async (rule: CommissionRule) => {
    await onDeleteRule(rule);
  };

  const techStep = techValueType === "percentage" ? 0.5 : 1;
  const techMin = 0;
  const adjustTechValue = (delta: number) => {
    const next = Math.max(techMin, Math.round((techValue + delta) * 10) / 10);
    setTechValue(next);
  };

  useEffect(() => {
    if (selection.kind === "manual" && selection.technicianUid) {
      setBonusTechUid(selection.technicianUid);
    }
  }, [selection]);

  const handleSaveRule = async () => {
    const ok = await onSaveRule({
      editingRuleId: selection.kind === "rule" ? selection.id : null,
      level,
      targetId,
      valueType,
      value,
    });
    if (ok) onSelectionChange({ kind: "none" });
  };

  const handleSaveBonus = async () => {
    const ok = await onSaveManual({
      technicianUid: bonusTechUid,
      amountEuros: bonusAmount,
      reason: bonusReason,
      date: new Date().toISOString().split("T")[0]!,
    });
    if (ok) {
      setBonusTechUid("");
      setBonusAmount(50);
      setBonusReason("");
      onSelectionChange({ kind: "none" });
    }
  };

  // ── Top form (edit / new rule) ──
  if (mode === "edit-rule" || mode === "new-rule") {
    return (
      <div
        data-testid="commissions-hub-right-rule"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
      >
        <CommissionsHubStepHeader
          step={3}
          verb={t("commissionsHub.steps.rules_verb")}
          caption={
            mode === "edit-rule"
              ? t("commissionsHub.steps.rules_editing")
              : t("commissionsHub.steps.rules_creating")
          }
          tone="rules"
          testId="commissions-hub-step-3"
        />

        <div className="rounded-[24px] border border-violet-100/80 bg-gradient-to-b from-violet-50/70 to-white p-4 text-center">
          <p className="text-3xl font-bold tabular-nums text-slate-900">
            {formatCommissionValue(valueType, value)}
          </p>
          <span
            className={cn(
              "mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              COMMISSION_LEVEL_BADGE[level]
            )}
          >
            {t(`commissions.dashboard.level.${level}`)}
          </span>
        </div>

        <HubSegmentedControl
          value={level}
          onChange={(id) => {
            const next = id as CommissionLevel;
            setLevel(next);
            if (next === "group") setTargetId(companyId);
          }}
          options={[
            {
              id: "group",
              label: t("commissions.dashboard.level.group"),
              testId: "commissions-hub-form-level-group",
            },
            {
              id: "technician",
              label: t("commissions.dashboard.level.technician"),
              testId: "commissions-hub-form-level-tech",
            },
            {
              id: "intervention",
              label: t("commissions.dashboard.level.intervention"),
              testId: "commissions-hub-form-level-iv",
            },
          ]}
        />

        {level === "technician" ? (
          <CommissionTechnicianSelect
            value={targetId}
            onChange={setTargetId}
            testId="commissions-hub-form-target"
          />
        ) : level === "intervention" ? (
          <input
            type="text"
            data-testid="commissions-hub-form-target"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="ID dossier"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
          />
        ) : (
          <input
            type="text"
            readOnly
            data-testid="commissions-hub-form-target"
            value={formatCommissionTargetShort({
              id: "",
              companyId,
              isActive: true,
              level: "group",
              targetId: companyId,
              valueType,
              value,
              createdAt: "",
              updatedAt: "",
              createdByUid: "",
            })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm text-slate-600"
          />
        )}

        <HubSegmentedControl
          value={valueType}
          onChange={(id) => setValueType(id as CommissionValueType)}
          options={[
            { id: "percentage", label: "%", testId: "commissions-hub-form-type-pct" },
            { id: "fixed_amount", label: "€", testId: "commissions-hub-form-type-eur" },
          ]}
        />

        <input
          type="number"
          min={0}
          step={valueType === "percentage" ? 0.5 : 1}
          data-testid="commissions-hub-form-value"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-center text-2xl font-bold tabular-nums"
          aria-label={t("commissions.dashboard.value_label")}
        />

        <div className="mt-auto flex gap-2">
          <HubButton
            variant="secondary"
            data-testid="commissions-hub-cancel-rule"
            onClick={() => onSelectionChange({ kind: "none" })}
          >
            {t("commissionsHub.cancel")}
          </HubButton>
          {selectedRule ? (
            <HubButton
              variant="danger"
              data-testid="commissions-hub-delete-rule"
              disabled={saving}
              onClick={() =>
                void onDeleteRule(selectedRule).then(() => onSelectionChange({ kind: "none" }))
              }
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </HubButton>
          ) : null}
          <HubButton
            data-testid="commissions-hub-save-rule"
            fullWidth
            disabled={saving || (level !== "group" && !targetId.trim())}
            onClick={() => void handleSaveRule()}
          >
            {saving ? "…" : t("commissionsHub.save")}
          </HubButton>
        </div>
      </div>
    );
  }

  // ── Bonus form ──
  if (mode === "bonus") {
    return (
      <div
        data-testid="commissions-hub-right-manual"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
      >
        <CommissionsHubStepHeader
          step={3}
          verb={t("commissionsHub.steps.rules_verb")}
          caption={t("commissionsHub.steps.rules_bonus")}
          tone="rules"
          testId="commissions-hub-step-3"
        />

        <div className="space-y-2 rounded-[20px] border border-amber-200/70 bg-amber-50/70 p-3">
          <CommissionTechnicianSelect
            value={bonusTechUid}
            onChange={setBonusTechUid}
            testId="commissions-hub-manual-tech"
          />
          <input
            type="number"
            min={0}
            step={1}
            data-testid="commissions-hub-manual-amount"
            value={bonusAmount}
            onChange={(e) => setBonusAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-center text-lg font-bold tabular-nums"
            aria-label={t("commissions.dashboard.manual_amount")}
          />
          <input
            type="text"
            data-testid="commissions-hub-manual-reason"
            value={bonusReason}
            onChange={(e) => setBonusReason(e.target.value)}
            placeholder={t("commissions.dashboard.manual_reason_placeholder")}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-auto flex gap-2">
          <HubButton
            variant="secondary"
            data-testid="commissions-hub-cancel-manual"
            onClick={() => onSelectionChange({ kind: "none" })}
          >
            {t("commissionsHub.cancel")}
          </HubButton>
          <HubButton
            data-testid="commissions-hub-manual-save"
            fullWidth
            disabled={saving || !bonusTechUid.trim() || !bonusReason.trim()}
            onClick={() => void handleSaveBonus()}
          >
            {saving ? "…" : t("commissionsHub.save")}
          </HubButton>
        </div>
      </div>
    );
  }

  // ── Idle / tech-focused ──
  const allRules = [...(companyRule ? [companyRule] : []), ...personalRules, ...interventionRules];

  return (
    <div
      data-testid={selectedTech ? "commissions-hub-right-technician" : "commissions-hub-right-idle"}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
    >
      <CommissionsHubStepHeader
        step={3}
        verb={t("commissionsHub.steps.rules_verb")}
        caption={
          selectedTech
            ? t("commissionsHub.steps.rules_focus").replace("{{name}}", selectedTech.name)
            : t("commissionsHub.steps.rules_caption")
        }
        tone="rules"
        testId="commissions-hub-step-3"
      />

      <button
        type="button"
        data-testid="commissions-hub-company-rule-hero"
        onClick={() =>
          companyRule
            ? onSelectionChange({ kind: "rule", id: companyRule.id })
            : onSelectionChange({ kind: "new-rule", level: "group", targetId: companyId })
        }
        className={cn(
          "flex flex-col gap-1 rounded-[24px] border bg-gradient-to-b from-sky-50/80 to-white px-4 py-3 text-left shadow-[0_6px_18px_-6px_rgba(15,23,42,0.1)] transition hover:border-sky-300",
          companyRule ? "border-sky-200" : "border-dashed border-sky-300"
        )}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
          {t("commissionsHub.company_rule.label")}
        </span>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-3xl font-black tabular-nums text-sky-900">
            {companyRule ? formatCommissionValue(companyRule.valueType, companyRule.value) : "—"}
          </span>
          <span className="text-[10px] font-semibold uppercase text-sky-600">
            {companyRule
              ? t("commissionsHub.company_rule.applies_all").replace("{{value}}", "")
              : t("commissionsHub.company_rule.empty")}
          </span>
        </div>
      </button>

      {selectedTech ? (
        <div className="flex flex-col gap-2 rounded-[24px] border border-emerald-200/70 bg-gradient-to-b from-emerald-50/80 to-white p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {selectedTech.initial}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">{selectedTech.name}</span>
                <span className="text-[11px] text-slate-500">
                  {formatEur(selectedTech.monthEarnedCents)} · {selectedTech.missionCount}{" "}
                  {t("commissionsHub.team.missions")}
                </span>
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                selectedTech.hasPersonalRule
                  ? "bg-violet-100 text-violet-800"
                  : "bg-sky-100 text-sky-800"
              )}
            >
              {formatRuleShort(selectedTech.displayRule)}
            </span>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-violet-200/70 bg-white/80 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-700">
                {t("commissionsHub.team.tech_rate_label").replace("{{name}}", selectedTech.name)}
              </span>
              {selectedTech.hasPersonalRule && selectedTech.displayRule ? (
                <button
                  type="button"
                  data-testid="commissions-hub-tech-rule-remove"
                  onClick={() => void handleRemoveTechRule(selectedTech.displayRule!)}
                  disabled={saving}
                  className="text-[10px] font-semibold uppercase tracking-wide text-rose-600 hover:text-rose-700 disabled:opacity-40"
                >
                  {t("commissionsHub.team.tech_rate_reset")}
                </button>
              ) : null}
            </div>
            <HubSegmentedControl
              value={techValueType}
              onChange={(id) => setTechValueType(id as CommissionValueType)}
              options={[
                { id: "percentage", label: "%", testId: "commissions-hub-tech-rate-pct" },
                { id: "fixed_amount", label: "€", testId: "commissions-hub-tech-rate-eur" },
              ]}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="−"
                data-testid="commissions-hub-tech-rate-minus"
                onClick={() => adjustTechValue(-techStep)}
                disabled={saving || techValue <= 0}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-violet-300 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <input
                type="number"
                min={techMin}
                step={techStep}
                data-testid="commissions-hub-tech-rate-value"
                value={techValue}
                onChange={(e) => setTechValue(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-slate-200 px-2 text-center text-xl font-bold tabular-nums focus:border-violet-400 focus:outline-none"
                aria-label={t("commissionsHub.team.tech_rate_value_aria")}
              />
              <button
                type="button"
                aria-label="+"
                data-testid="commissions-hub-tech-rate-plus"
                onClick={() => adjustTechValue(techStep)}
                disabled={saving}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-violet-300 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <HubButton
              fullWidth
              data-testid="commissions-hub-tech-rule"
              disabled={
                saving ||
                (selectedTech.hasPersonalRule &&
                  selectedTech.displayRule?.valueType === techValueType &&
                  selectedTech.displayRule?.value === techValue)
              }
              onClick={() =>
                void handleSaveTechRule(
                  selectedTech.uid,
                  selectedTech.hasPersonalRule,
                  selectedTech.displayRule?.id ?? null
                )
              }
            >
              {saving
                ? "…"
                : selectedTech.hasPersonalRule
                  ? t("commissionsHub.team.tech_rate_update")
                  : t("commissionsHub.team.tech_rate_create")}
            </HubButton>
          </div>
          <HubButton
            variant="secondary"
            fullWidth
            data-testid="commissions-hub-tech-bonus"
            onClick={() => onSelectionChange({ kind: "manual", technicianUid: selectedTech.uid })}
          >
            <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden />
            {t("commissionsHub.team.add_bonus")}
          </HubButton>
        </div>
      ) : null}

      <CommissionsHubTechRatesList
        technicianRows={technicianRows}
        selectedUid={selection.kind === "technician" ? selection.uid : null}
        saving={saving}
        onSelectTech={(uid) => onSelectionChange({ kind: "technician", uid })}
        onSaveRate={(input) =>
          onSaveRule({
            editingRuleId: input.editingRuleId,
            level: "technician",
            targetId: input.technicianUid,
            valueType: input.valueType,
            value: input.value,
          })
        }
        onResetRate={onDeleteRule}
      />

      {interventionRules.length > 0 ? (
        <div
          data-testid="commissions-hub-rules-grid"
          className="flex flex-col gap-2 rounded-[24px] border border-black/[0.06] bg-white/95 p-3 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.06)]"
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {t("commissionsHub.tech_rates.intervention_overrides")}
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              {interventionRules.length}
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {interventionRules.map((rule) => {
              const isActive = selection.kind === "rule" && selection.id === rule.id;
              return (
                <li key={rule.id}>
                  <button
                    type="button"
                    data-testid={`commissions-hub-rule-${rule.id}`}
                    onClick={() => onSelectionChange({ kind: "rule", id: rule.id })}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition",
                      isActive
                        ? "border-slate-900 ring-2 ring-slate-900/15"
                        : "border-black/[0.06] hover:border-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        COMMISSION_LEVEL_BADGE[rule.level]
                      )}
                    >
                      {t(`commissions.dashboard.level.${rule.level}`)}
                    </span>
                    <span className="flex-1 truncate text-[11px] text-slate-600">
                      {formatCommissionTargetShort(rule)}
                    </span>
                    <span className="text-[13px] font-bold tabular-nums text-slate-900">
                      {formatCommissionValue(rule.valueType, rule.value)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="flex gap-2 pt-1">
        <HubButton
          variant="secondary"
          fullWidth
          data-testid="commissions-hub-add-rule"
          onClick={() =>
            onSelectionChange({ kind: "new-rule", level: "intervention", targetId: "" })
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
          {t("commissionsHub.tech_rates.add_override")}
        </HubButton>
        <HubButton
          fullWidth
          data-testid="commissions-hub-add-bonus"
          onClick={() => onSelectionChange({ kind: "manual" })}
        >
          <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden />
          {t("commissionsHub.team.add_bonus")}
        </HubButton>
      </div>
    </div>
  );
}
