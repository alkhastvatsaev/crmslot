"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import HubButton from "@/core/ui/hub/HubButton";
import HubSegmentedControl from "@/core/ui/hub/HubSegmentedControl";
import CommissionTechnicianSelect from "@/features/commissions/components/CommissionTechnicianSelect";
import type {
  CommissionLevel,
  CommissionRule,
  CommissionValueType,
} from "@/features/commissions/types";
import type { ManualCommissionEntry } from "@/features/commissions/commissionFirestore";
import type {
  CommissionsHubMode,
  CommissionsHubSelection,
} from "@/features/commissionsHub/commissionsHubTypes";
import type { PatronTechnicianRow } from "@/features/commissionsHub/commissionsHubPatronMetrics";
import { formatRuleShort } from "@/features/commissionsHub/commissionsHubPatronMetrics";
import {
  COMMISSION_LEVEL_BADGE,
  formatCommissionTargetShort,
  formatCommissionValue,
} from "@/features/commissionsHub/commissionsHubFormat";
import { useTechnicians } from "@/features/technicians/hooks";
import { cn } from "@/lib/utils";

function formatEur(cents: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function defaultRuleValue(rules: CommissionRule[], companyId: string): number {
  const group = rules.find((r) => r.level === "group" && r.targetId === companyId);
  return group?.value ?? 10;
}

type Props = {
  companyId: string;
  mode: CommissionsHubMode;
  selection: CommissionsHubSelection;
  rules: CommissionRule[];
  manualEntries: ManualCommissionEntry[];
  technicianRows: PatronTechnicianRow[];
  saving: boolean;
  onSelectionChange: (selection: CommissionsHubSelection) => void;
  onModeChange: (mode: CommissionsHubMode) => void;
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

export default function CommissionsHubRightPanel({
  companyId,
  mode,
  selection,
  rules,
  manualEntries,
  technicianRows,
  saving,
  onSelectionChange,
  onModeChange,
  onSaveRule,
  onDeleteRule,
  onSaveManual,
}: Props) {
  const { t } = useTranslation();
  const { technicians } = useTechnicians();

  const selectedRule =
    selection.kind === "rule" ? (rules.find((r) => r.id === selection.id) ?? null) : null;
  const selectedManual =
    selection.kind === "manual" ? (manualEntries.find((e) => e.id === selection.id) ?? null) : null;

  const selectedTech =
    selection.kind === "technician"
      ? (technicianRows.find((r) => r.uid === selection.uid) ?? null)
      : null;

  const editing = selection.kind === "new-rule" || selection.kind === "rule";
  const [level, setLevel] = useState<CommissionLevel>("group");
  const [targetId, setTargetId] = useState(companyId);
  const [valueType, setValueType] = useState<CommissionValueType>("percentage");
  const [value, setValue] = useState(15);
  const [manualTechUid, setManualTechUid] = useState("");
  const [manualAmount, setManualAmount] = useState(50);
  const [manualReason, setManualReason] = useState("");

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

  useEffect(() => {
    if (selection.kind === "technician") {
      setManualTechUid(selection.uid);
    }
  }, [selection]);

  const techName = useMemo(() => {
    const uid = selectedManual?.technicianUid ?? manualTechUid;
    if (!uid) return null;
    return technicians.find((tech) => tech.authUid === uid || tech.id === uid)?.name ?? null;
  }, [technicians, selectedManual, manualTechUid]);

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

  const handleSaveManual = async () => {
    const ok = await onSaveManual({
      technicianUid: manualTechUid,
      amountEuros: manualAmount,
      reason: manualReason,
      date: new Date().toISOString().split("T")[0]!,
    });
    if (ok) {
      setManualTechUid("");
      setManualAmount(50);
      setManualReason("");
    }
  };

  if (mode === "history") {
    return (
      <div
        data-testid="commissions-hub-right-history"
        className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center text-[12px] text-slate-400"
      >
        {t("commissionsHub.history_hint")}
      </div>
    );
  }

  if (mode === "manual") {
    return (
      <div
        data-testid="commissions-hub-right-manual"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {selectedManual ? (
          <div className="rounded-[24px] border border-amber-200/80 bg-amber-50/80 p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-amber-900">
              {selectedManual.amountEuros.toFixed(2)} €
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {techName ?? selectedManual.technicianUid}
            </p>
            <p className="mt-2 text-[12px] text-slate-600">{selectedManual.reason}</p>
          </div>
        ) : null}

        <div className="space-y-2 rounded-[20px] border border-black/[0.06] bg-white/95 p-3">
          <CommissionTechnicianSelect
            value={manualTechUid}
            onChange={setManualTechUid}
            testId="commissions-hub-manual-tech"
          />
          <input
            type="number"
            min={0}
            step={1}
            data-testid="commissions-hub-manual-amount"
            value={manualAmount}
            onChange={(e) => setManualAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-center text-lg font-bold tabular-nums"
            aria-label={t("commissions.dashboard.manual_amount")}
          />
          <input
            type="text"
            data-testid="commissions-hub-manual-reason"
            value={manualReason}
            onChange={(e) => setManualReason(e.target.value)}
            placeholder={t("commissions.dashboard.manual_reason_placeholder")}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <HubButton
            data-testid="commissions-hub-manual-save"
            fullWidth
            disabled={saving || !manualTechUid.trim() || !manualReason.trim()}
            onClick={() => void handleSaveManual()}
          >
            {saving ? "…" : t("commissionsHub.save")}
          </HubButton>
        </div>
      </div>
    );
  }

  if (mode === "team" && selectedTech) {
    return (
      <div
        data-testid="commissions-hub-right-technician"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        <div className="rounded-[24px] border border-emerald-200/70 bg-gradient-to-b from-emerald-50/90 to-white p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/80">
            {t("commissionsHub.team.month_label")}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-900">
            {formatEur(selectedTech.monthEarnedCents)}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{selectedTech.name}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {selectedTech.missionCount} {t("commissionsHub.team.missions")}
            {selectedTech.manualBonusCents > 0
              ? ` · +${formatEur(selectedTech.manualBonusCents)} ${t("commissionsHub.team.bonus")}`
              : ""}
          </p>
          <p className="mt-2 text-[11px] font-medium text-slate-600">
            {t("commissionsHub.team.rule")}{" "}
            <span className={selectedTech.hasPersonalRule ? "text-violet-600" : "text-sky-600"}>
              {formatRuleShort(selectedTech.displayRule)}
              {selectedTech.hasPersonalRule ? ` · ${t("commissionsHub.team.personal")}` : ""}
            </span>
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <HubButton
            data-testid="commissions-hub-tech-bonus"
            variant="secondary"
            fullWidth
            onClick={() => {
              setManualTechUid(selectedTech.uid);
              onModeChange("manual");
              onSelectionChange({ kind: "none" });
            }}
          >
            {t("commissionsHub.team.add_bonus")}
          </HubButton>
          <HubButton
            data-testid="commissions-hub-tech-rule"
            fullWidth
            onClick={() => {
              onModeChange("rules");
              if (selectedTech.hasPersonalRule && selectedTech.displayRule) {
                onSelectionChange({ kind: "rule", id: selectedTech.displayRule.id });
              } else {
                onSelectionChange({
                  kind: "new-rule",
                  level: "technician",
                  targetId: selectedTech.uid,
                });
              }
            }}
          >
            {selectedTech.hasPersonalRule
              ? t("commissionsHub.team.edit_rule")
              : t("commissionsHub.team.set_rule")}
          </HubButton>
        </div>
      </div>
    );
  }

  if (!editing) {
    return (
      <div
        data-testid="commissions-hub-right-idle"
        className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center text-[12px] text-slate-400"
      >
        {mode === "rules" ? t("commissionsHub.pick_or_add_rule") : t("commissionsHub.pick_or_add")}
      </div>
    );
  }

  return (
    <div
      data-testid="commissions-hub-right-rule"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
    >
      <div className="rounded-[24px] border border-black/[0.06] bg-white/95 p-4 text-center">
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
