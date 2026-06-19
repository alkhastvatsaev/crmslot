"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { CompanyStaffMember } from "@/features/teamHub/types";

type Props = {
  staff: CompanyStaffMember[];
  loading: boolean;
  selectedUid: string | null;
  onSelect: (uid: string) => void;
};

export default function TeamHubStaffGrid({ staff, loading, selectedUid, onSelect }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div
        data-testid="team-hub-staff-loading"
        className="flex min-h-[200px] flex-1 items-center justify-center"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div
        data-testid="team-hub-staff-empty"
        className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-400"
      >
        {t("teamHub.empty")}
      </div>
    );
  }

  return (
    <div
      data-testid="team-hub-staff-grid"
      className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-2"
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {staff.map((member) => {
          const active = selectedUid === member.uid;
          const initial = (member.displayName.trim().charAt(0) || "?").toUpperCase();

          return (
            <button
              key={member.uid}
              type="button"
              data-testid={`team-staff-row-${member.uid}`}
              onClick={() => onSelect(member.uid)}
              className={cn(
                "flex min-h-[108px] flex-col items-center justify-center gap-1 rounded-[22px] border bg-white/95 p-3 text-center shadow-[0_6px_18px_-6px_rgba(15,23,42,0.1)] transition hover:scale-[1.02] active:scale-[0.97]",
                active
                  ? "border-slate-900 ring-2 ring-slate-900/15"
                  : member.active
                    ? "border-emerald-200/80 ring-1 ring-emerald-200/60"
                    : "border-black/[0.06] ring-1 ring-slate-200/80 opacity-90"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                  active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                )}
              >
                {initial}
              </span>
              <span className="line-clamp-2 w-full text-[13px] font-semibold text-slate-800">
                {member.displayName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
