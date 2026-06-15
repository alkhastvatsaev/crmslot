"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import {
  CAROUSEL_USAGE_STORAGE_KEY,
  carouselUsageRows,
  emptyCarouselUsageSnapshot,
  formatDwellShort,
  loadCarouselUsageSnapshot,
  totalCarouselDwellMs,
  type CarouselPageUsage,
} from "@/features/analytics/carouselUsageStore";

function UsageBar({ row, maxDwell }: { row: CarouselPageUsage; maxDwell: number }) {
  const pct = maxDwell > 0 ? Math.round((row.dwellMs / maxDwell) * 100) : 0;
  return (
    <li
      data-testid={`carousel-usage-row-${row.pageId}`}
      className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-800">{row.pageTitle}</span>
        <span className="tabular-nums text-slate-500">
          {formatDwellShort(row.dwellMs)} · {row.views} vues
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${Math.max(pct, row.views > 0 ? 4 : 0)}%` }}
          data-testid={`carousel-usage-bar-${row.pageId}`}
        />
      </div>
    </li>
  );
}

export default function CarouselUsagePanel() {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("analyticsReports");
  const [rows, setRows] = useState<CarouselPageUsage[]>([]);

  const refresh = useCallback(() => {
    const snapshot = loadCarouselUsageSnapshot();
    setRows(carouselUsageRows(snapshot));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("crmslot-carousel-usage-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("crmslot-carousel-usage-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [enabled, refresh]);

  const maxDwell = useMemo(() => Math.max(...rows.map((r) => r.dwellMs), 1), [rows]);
  const totalDwell = useMemo(() => totalCarouselDwellMs(rows), [rows]);
  const hasData = rows.some((r) => r.views > 0);

  const handleReset = () => {
    const empty = emptyCarouselUsageSnapshot();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CAROUSEL_USAGE_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("crmslot-carousel-usage-updated"));
    }
    setRows(carouselUsageRows(empty));
  };

  if (!enabled) return null;

  return (
    <section
      data-testid="carousel-usage-panel"
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-slate-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t("analytics.carousel_title")}</h3>
            <p className="text-[11px] text-slate-500">{t("analytics.carousel_hint")}</p>
          </div>
        </div>
        {hasData ? (
          <button
            type="button"
            data-testid="carousel-usage-reset"
            onClick={handleReset}
            className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-600"
          >
            {t("analytics.carousel_reset")}
          </button>
        ) : null}
      </div>

      {!hasData ? (
        <p className="text-xs text-slate-500" data-testid="carousel-usage-empty">
          {t("analytics.carousel_empty")}
        </p>
      ) : (
        <>
          <p className="text-[11px] font-medium text-slate-600">
            {String(t("analytics.carousel_total_dwell")).replace(
              "{{duration}}",
              formatDwellShort(totalDwell)
            )}
          </p>
          <ol className="space-y-2">
            {rows.map((row) => (
              <UsageBar key={row.pageId} row={row} maxDwell={maxDwell} />
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
