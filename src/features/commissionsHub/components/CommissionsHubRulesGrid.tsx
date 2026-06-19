"use client";

import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { CommissionRule } from "@/features/commissions/types";
import type { CommissionsHubLevelFilter } from "@/features/commissionsHub/commissionsHubTypes";
import {
  COMMISSION_LEVEL_RING,
  formatCommissionTargetShort,
  formatCommissionValue,
} from "@/features/commissionsHub/commissionsHubFormat";
import { useTechnicians } from "@/features/technicians/hooks";

const GRID_MIN_SLOTS = 9;

type Props = {
  rules: CommissionRule[];
  levelFilter: CommissionsHubLevelFilter;
  loading: boolean;
  selectedRuleId: string | null;
  creating: boolean;
  onSelectRule: (id: string) => void;
  onStartCreate: () => void;
};

function EmptySlot({ index }: { index: number }) {
  return (
    <div
      data-testid={`commissions-hub-empty-slot-${index}`}
      aria-hidden
      className="aspect-square w-full justify-self-center rounded-[24px] border border-black/[0.06] bg-white/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
    />
  );
}

export default function CommissionsHubRulesGrid({
  rules,
  levelFilter,
  loading,
  selectedRuleId,
  creating,
  onSelectRule,
  onStartCreate,
}: Props) {
  const { t } = useTranslation();
  const { technicians } = useTechnicians();

  const rows = levelFilter === "all" ? rules : rules.filter((rule) => rule.level === levelFilter);

  const techName = (uid: string) =>
    technicians.find((tech) => tech.authUid === uid || tech.id === uid)?.name ?? null;

  const trailingEmpty =
    rows.length === 0 ? GRID_MIN_SLOTS - 1 : Math.max(0, GRID_MIN_SLOTS - rows.length - 1);

  if (loading) {
    return (
      <div
        data-testid="commissions-hub-rules-loading"
        className="flex min-h-0 flex-1 items-center justify-center"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div
      data-testid="commissions-hub-rules-grid"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-3 px-3 pb-6 pt-4 content-start [grid-template-columns:repeat(3,minmax(0,1fr))]">
          <button
            type="button"
            data-testid="commissions-hub-add-rule"
            onClick={onStartCreate}
            className={cn(
              "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[24px] border border-dashed border-slate-300 bg-white/70 text-slate-500 transition hover:scale-[1.02] hover:border-slate-400 hover:text-slate-800 active:scale-[0.96]",
              creating && !selectedRuleId && "border-slate-900 ring-2 ring-slate-900/20"
            )}
          >
            <Plus className="h-7 w-7" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              {t("commissionsHub.add")}
            </span>
          </button>

          {rows.map((rule) => {
            const active = selectedRuleId === rule.id;
            const subtitle =
              rule.level === "technician"
                ? (techName(rule.targetId) ?? formatCommissionTargetShort(rule))
                : formatCommissionTargetShort(rule);

            return (
              <button
                key={rule.id}
                type="button"
                data-testid={`commissions-hub-rule-${rule.id}`}
                onClick={() => onSelectRule(rule.id)}
                className={cn(
                  "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[24px] border bg-white/95 p-3 text-center shadow-[0_6px_18px_-4px_rgba(15,23,42,0.1)] transition hover:scale-[1.02] active:scale-[0.96]",
                  active
                    ? "border-slate-900 ring-2 ring-slate-900/20"
                    : cn("border-black/[0.06] ring-1", COMMISSION_LEVEL_RING[rule.level])
                )}
              >
                <span className="text-2xl font-bold tabular-nums text-slate-900">
                  {formatCommissionValue(rule.valueType, rule.value)}
                </span>
                <span className="line-clamp-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {t(`commissions.dashboard.level.${rule.level}`)}
                </span>
                <span className="truncate text-[11px] text-slate-600">{subtitle}</span>
              </button>
            );
          })}

          {Array.from({ length: trailingEmpty }, (_, i) => (
            <EmptySlot key={`empty-${i}`} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
