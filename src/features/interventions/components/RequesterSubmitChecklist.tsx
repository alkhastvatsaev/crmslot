"use client";

import { Check, Circle } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { RequesterChecklistItem } from "@/features/interventions/requesterSubmitReadiness";
import { cn } from "@/lib/utils";

type Props = {
  profile: boolean;
  problem: boolean;
  address: boolean;
  onFocusItem: (item: RequesterChecklistItem) => void;
  className?: string;
};

const ITEMS: { key: RequesterChecklistItem; labelKey: string; ready: keyof Props }[] = [
  { key: "profile", labelKey: "requester.ux.checklist_profile", ready: "profile" },
  { key: "problem", labelKey: "requester.ux.checklist_problem", ready: "problem" },
  { key: "address", labelKey: "requester.ux.checklist_address", ready: "address" },
];

export default function RequesterSubmitChecklist({
  profile,
  problem,
  address,
  onFocusItem,
  className,
}: Props) {
  const { t } = useTranslation();
  const readyMap = { profile, problem, address };

  return (
    <div
      data-testid="requester-submit-checklist"
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px]",
        className
      )}
      role="list"
      aria-label={String(t("requester.ux.checklist_aria"))}
    >
      {ITEMS.map((item, index) => {
        const done = readyMap[item.key];
        return (
          <span key={item.key} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <span className="text-slate-300" aria-hidden>
                ·
              </span>
            ) : null}
            <button
              type="button"
              role="listitem"
              data-testid={`requester-checklist-${item.key}`}
              onClick={() => onFocusItem(item.key)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium transition-colors",
                done ? "text-emerald-700 hover:bg-emerald-50" : "text-amber-800 hover:bg-amber-50"
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              ) : (
                <Circle className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              )}
              {String(t(item.labelKey))}
            </button>
          </span>
        );
      })}
    </div>
  );
}
