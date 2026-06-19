"use client";

import { UserCheck, UserMinus, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { TeamHubStaffFilter } from "@/features/teamHub/teamHubTypes";

type Props = {
  filter: TeamHubStaffFilter;
  onFilterChange: (filter: TeamHubStaffFilter) => void;
  counts: Record<TeamHubStaffFilter, number>;
};

const FILTER_META: {
  id: TeamHubStaffFilter;
  icon: typeof Users;
  testId: string;
}[] = [
  { id: "all", icon: Users, testId: "team-hub-filter-all" },
  { id: "active", icon: UserCheck, testId: "team-hub-filter-active" },
  { id: "inactive", icon: UserMinus, testId: "team-hub-filter-inactive" },
  { id: "technicians", icon: Wrench, testId: "team-hub-filter-technicians" },
];

export default function TeamHubLeftRail({ filter, onFilterChange, counts }: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="team-hub-left-rail"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3"
    >
      <div className="grid grid-cols-2 gap-2">
        {FILTER_META.map(({ id, icon: Icon, testId }) => {
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              data-testid={testId}
              onClick={() => onFilterChange(id)}
              className={cn(
                "flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-[18px] border text-center transition active:scale-[0.97]",
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow-[0_8px_20px_-8px_rgba(15,23,42,0.45)]"
                  : "border-black/[0.06] bg-white/95 text-slate-600 ring-1 ring-black/[0.04] hover:scale-[1.02]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-base font-bold tabular-nums leading-none">{counts[id]}</span>
              <span className="text-[8px] font-semibold uppercase tracking-wide opacity-85">
                {t(`teamHub.filter.${id}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
