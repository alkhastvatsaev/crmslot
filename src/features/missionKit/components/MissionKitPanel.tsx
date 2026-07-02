"use client";

import { AlertTriangle, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { MissionKit, MissionKitItem, MissionKitItemStatus } from "@/features/missionKit/types";

type Props = {
  kit: MissionKit;
  loading?: boolean;
  className?: string;
  interactive?: boolean;
  checkedItemIds?: string[];
  onToggleItem?: (itemId: string) => void;
  showMissingWarning?: boolean;
  onOrderItem?: (item: MissionKitItem) => void;
  orderingItemId?: string | null;
  orderedItemIds?: string[];
};

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

const STATUS_STYLES: Record<MissionKitItemStatus, string> = {
  in_vehicle: "bg-emerald-100 text-emerald-800 ring-emerald-200/80",
  in_warehouse: "bg-sky-100 text-sky-800 ring-sky-200/80",
  missing: "bg-amber-100 text-amber-900 ring-amber-200/80",
  unknown: "bg-slate-100 text-slate-600 ring-slate-200/80",
};

function statusLabelKey(status: MissionKitItemStatus): string {
  return `technician_hub.mission_kit.status_${status}`;
}

function MissionKitRow({
  item,
  t,
  interactive,
  checked,
  onToggle,
  onOrder,
  ordering,
  ordered,
}: {
  item: MissionKitItem;
  t: (key: string) => string;
  interactive: boolean;
  checked: boolean;
  onToggle?: (itemId: string) => void;
  onOrder?: (item: MissionKitItem) => void;
  ordering?: boolean;
  ordered?: boolean;
}) {
  return (
    <li
      data-testid={`mission-kit-item-${item.id}`}
      className={cn(
        "flex items-start gap-3 rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-inset ring-slate-200/70",
        interactive && checked && "ring-emerald-300/80"
      )}
    >
      {interactive ? (
        <label className="mt-0.5 flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            data-testid={`mission-kit-check-${item.id}`}
            checked={checked}
            onChange={() => onToggle?.(item.id)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            aria-label={String(t("technician_hub.mission_kit.checklist_label"))}
          />
        </label>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug text-slate-900">{item.label}</p>
        {item.reference ? (
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">{item.reference}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {onOrder && (item.status === "missing" || item.status === "in_warehouse") ? (
          <button
            type="button"
            data-testid={`mission-kit-order-${item.id}`}
            disabled={ordering || ordered}
            onClick={() => onOrder(item)}
            className={cn(
              "rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition",
              ordered
                ? "bg-slate-100 text-slate-500"
                : "bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-60"
            )}
          >
            {ordered
              ? String(t("technician_hub.mission_kit.ordered"))
              : ordering
                ? "…"
                : String(t("technician_hub.mission_kit.order"))}
          </button>
        ) : null}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
            STATUS_STYLES[item.status]
          )}
        >
          {String(t(statusLabelKey(item.status)))}
        </span>
        {item.quantity > 1 ? (
          <span className="text-[10px] font-semibold text-slate-500">
            {interpolate(String(t("technician_hub.mission_kit.qty")), { count: item.quantity })}
          </span>
        ) : null}
      </div>
    </li>
  );
}

export default function MissionKitPanel({
  kit,
  loading = false,
  className,
  interactive = false,
  checkedItemIds = [],
  onToggleItem,
  showMissingWarning = false,
  onOrderItem,
  orderingItemId = null,
  orderedItemIds = [],
}: Props) {
  const { t } = useTranslation();
  const missingCount = kit.items.filter((item) => item.status === "missing").length;
  const checkedCount = kit.items.filter((item) => checkedItemIds.includes(item.id)).length;

  return (
    <section
      data-testid="mission-kit-panel"
      className={cn(
        "shrink-0 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3 ring-1 ring-inset ring-white/60",
        className
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-700" aria-hidden />
          <h2 className="text-[13px] font-bold text-slate-900">
            {String(t("technician_hub.mission_kit.title"))}
          </h2>
        </div>
        {interactive && kit.items.length > 0 ? (
          <span className="text-[11px] font-semibold text-slate-500">
            {interpolate(String(t("technician_hub.mission_kit.progress")), {
              checked: checkedCount,
              total: kit.items.length,
            })}
          </span>
        ) : null}
      </div>

      {showMissingWarning && missingCount > 0 ? (
        <div
          data-testid="mission-kit-missing-warning"
          className="mb-2.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold leading-snug text-amber-950"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {interpolate(String(t("technician_hub.mission_kit.warning_missing")), {
              count: missingCount,
            })}
          </span>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {String(t("technician_hub.mission_kit.loading"))}
        </div>
      ) : kit.items.length === 0 ? (
        <p className="py-2 text-center text-[12px] font-medium text-slate-500">
          {String(t("technician_hub.mission_kit.empty"))}
        </p>
      ) : (
        <ul className="space-y-2">
          {kit.items.map((item) => (
            <MissionKitRow
              key={item.id}
              item={item}
              t={t}
              interactive={interactive}
              checked={checkedItemIds.includes(item.id)}
              onToggle={onToggleItem}
              onOrder={onOrderItem}
              ordering={orderingItemId === item.id}
              ordered={orderedItemIds.includes(item.id)}
            />
          ))}
        </ul>
      )}

      {kit.historicalHint ? (
        <p className="mt-2.5 border-t border-slate-200/70 pt-2 text-[11px] font-medium leading-snug text-slate-600">
          <span className="font-bold text-slate-700">
            {String(t("technician_hub.mission_kit.hint"))}:{" "}
          </span>
          {kit.historicalHint}
        </p>
      ) : null}
    </section>
  );
}
