"use client";

import { Building2, FileText, History, PenLine, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import HubFilterChips from "@/core/ui/hub/HubFilterChips";
import type {
  CommissionsHubLevelFilter,
  CommissionsHubMode,
} from "@/features/commissionsHub/commissionsHubTypes";

type Props = {
  mode: CommissionsHubMode;
  onModeChange: (mode: CommissionsHubMode) => void;
  levelFilter: CommissionsHubLevelFilter;
  onLevelFilterChange: (filter: CommissionsHubLevelFilter) => void;
  teamCount: number;
  rulesCount: number;
  manualCount: number;
  historyCount: number;
};

const MODE_META: {
  id: CommissionsHubMode;
  icon: typeof Users;
  testId: string;
}[] = [
  { id: "team", icon: Users, testId: "commissions-hub-mode-team" },
  { id: "rules", icon: Building2, testId: "commissions-hub-mode-rules" },
  { id: "manual", icon: PenLine, testId: "commissions-hub-mode-manual" },
  { id: "history", icon: History, testId: "commissions-hub-mode-history" },
];

export default function CommissionsHubLeftRail({
  mode,
  onModeChange,
  levelFilter,
  onLevelFilterChange,
  teamCount,
  rulesCount,
  manualCount,
  historyCount,
}: Props) {
  const { t } = useTranslation();

  const modeCounts: Record<CommissionsHubMode, number> = {
    team: teamCount,
    rules: rulesCount,
    manual: manualCount,
    history: historyCount,
  };

  return (
    <div
      data-testid="commissions-hub-left-rail"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3"
    >
      <div className="grid grid-cols-2 gap-2">
        {MODE_META.map(({ id, icon: Icon, testId }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              data-testid={testId}
              onClick={() => onModeChange(id)}
              className={cn(
                "flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-[18px] border text-center transition active:scale-[0.97]",
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow-[0_8px_20px_-8px_rgba(15,23,42,0.45)]"
                  : "border-black/[0.06] bg-white/95 text-slate-600 ring-1 ring-black/[0.04] hover:scale-[1.02]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-base font-bold tabular-nums leading-none">
                {modeCounts[id]}
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-wide opacity-85">
                {t(`commissionsHub.mode.${id}`)}
              </span>
            </button>
          );
        })}
      </div>

      {mode === "rules" ? (
        <HubFilterChips
          value={levelFilter}
          onChange={(id) => onLevelFilterChange(id as CommissionsHubLevelFilter)}
          ariaLabel={t("commissionsHub.level_filter_aria")}
          options={[
            {
              id: "all",
              label: t("commissionsHub.level.all"),
              testId: "commissions-hub-level-all",
            },
            {
              id: "group",
              label: <Building2 className="h-3.5 w-3.5" aria-hidden />,
              testId: "commissions-hub-level-group",
            },
            {
              id: "technician",
              label: <Users className="h-3.5 w-3.5" aria-hidden />,
              testId: "commissions-hub-level-technician",
            },
            {
              id: "intervention",
              label: <FileText className="h-3.5 w-3.5" aria-hidden />,
              testId: "commissions-hub-level-intervention",
            },
          ]}
        />
      ) : null}
    </div>
  );
}
