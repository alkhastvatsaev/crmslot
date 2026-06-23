"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  assignPickerStatusLabelKey,
  formatAssignPickerDistanceKm,
} from "@/features/dispatch/technicianAssignPickerFormat";
import type { Technician } from "@/features/technicians/types";

type Props = {
  technician: Technician;
  distanceKm: number;
  isSelected: boolean;
  isRecommended: boolean;
  eta?: string | null;
  aiReasoning?: string | null;
  aiRevenueImpact?: string | null;
  recommendedLabel: string;
  t: (key: string) => string;
  onSelect: () => void;
};

export default function TechnicianAssignPickerOption({
  technician,
  distanceKm,
  isSelected,
  isRecommended,
  eta,
  aiReasoning,
  aiRevenueImpact,
  recommendedLabel,
  t,
  onSelect,
}: Props) {
  return (
    <li>
      <button
        type="button"
        data-testid={`technician-assign-option-${technician.id}`}
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-3 rounded-[14px] border px-3 py-2.5 text-left transition-colors",
          isSelected
            ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900/20"
            : "border-slate-100 bg-white hover:border-slate-200"
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            isSelected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
          )}
        >
          {technician.initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-900">{technician.name}</span>
            {isRecommended ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                <Sparkles className="h-2.5 w-2.5" />
                {recommendedLabel}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-500">
            <span>{formatAssignPickerDistanceKm(distanceKm)}</span>
            {eta ? <span>· ETA {eta}</span> : null}
            <span>· {String(t(assignPickerStatusLabelKey[technician.status]))}</span>
          </span>
          {isRecommended && (aiReasoning || aiRevenueImpact) ? (
            <div className="mt-2.5 flex items-start gap-2 rounded-[12px] border border-indigo-100/50 bg-indigo-50/80 p-2.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <span className="text-[12px] font-medium leading-snug text-indigo-900">
                {aiReasoning}
                {aiRevenueImpact ? (
                  <span className="ml-1 text-emerald-700">· {aiRevenueImpact}</span>
                ) : null}
              </span>
            </div>
          ) : null}
        </span>
      </button>
    </li>
  );
}
