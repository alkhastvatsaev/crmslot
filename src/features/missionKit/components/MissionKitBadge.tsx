"use client";

import { Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { MissionKit } from "@/features/missionKit/types";

type Props = {
  kit: MissionKit;
  loading?: boolean;
  className?: string;
};

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export default function MissionKitBadge({ kit, loading = false, className }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div
        data-testid="mission-kit-badge"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500",
          className
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        {String(t("dispatch.mission_kit.loading"))}
      </div>
    );
  }

  const missing = kit.items.filter((item) => item.status === "missing").length;
  const inVehicle = kit.items.filter((item) => item.status === "in_vehicle").length;
  const total = kit.items.length;

  let tone = "border-emerald-200 bg-emerald-50 text-emerald-800";
  let label = String(t("dispatch.mission_kit.badge_ready"));

  if (missing > 0) {
    tone = "border-amber-200 bg-amber-50 text-amber-900";
    label = interpolate(String(t("dispatch.mission_kit.badge_missing")), { count: missing });
  } else if (kit.completenessScore >= 100 && total > 0) {
    tone = "border-emerald-200 bg-emerald-50 text-emerald-800";
    label = interpolate(String(t("dispatch.mission_kit.badge_complete")), {
      score: kit.completenessScore,
    });
  } else if (total > 0) {
    label = interpolate(String(t("dispatch.mission_kit.badge_items")), { count: total });
    if (inVehicle > 0) {
      tone = "border-sky-200 bg-sky-50 text-sky-900";
    }
  }

  return (
    <div
      data-testid="mission-kit-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tone,
        className
      )}
      title={kit.summary}
    >
      <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
