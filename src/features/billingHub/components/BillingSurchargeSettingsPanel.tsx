"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Loader2, Moon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { HubCard } from "@/core/ui/hub";
import type { BillingSurchargeSettings } from "@/features/billing/billingSurchargeSettings";
import { useBillingSurchargeSettings } from "@/features/billingHub/hooks/useBillingSurchargeSettings";

type Props = {
  companyId: string | null;
  isAdmin: boolean;
};

const compactInput =
  "w-full min-w-0 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-[15px] font-semibold tabular-nums text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60";

function numField(value: number): string {
  return Number.isFinite(value) ? String(value) : "";
}

export default function BillingSurchargeSettingsPanel({ companyId, isAdmin }: Props) {
  const { t } = useTranslation();
  const { settings, setSettings, loading, saving, save } = useBillingSurchargeSettings(companyId);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const patch = (partial: Partial<BillingSurchargeSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const previewRate = useMemo(
    () => Math.max(settings.weekendRatePercent, settings.afterHourRatePercent),
    [settings.weekendRatePercent, settings.afterHourRatePercent]
  );

  const previewText = useMemo(() => {
    if (!settings.enabled) return String(t("billingHub.surcharge.preview_off"));
    return String(t("billingHub.surcharge.preview"))
      .replace("{{rate}}", String(previewRate))
      .replace("{{hour}}", String(settings.afterHour));
  }, [settings.enabled, settings.afterHour, previewRate, t]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !isAdmin) return;
    try {
      await save(settings);
      toast.success(String(t("billingHub.surcharge.saved")));
    } catch {
      toast.error(String(t("common.error")));
    }
  };

  if (!companyId) {
    return (
      <p className="px-1 py-8 text-center text-[12px] text-slate-400">
        {t("billingHub.company_required")}
      </p>
    );
  }

  if (loading) {
    return (
      <div
        className="flex flex-1 items-center justify-center py-10"
        data-testid="billing-surcharge-loading"
      >
        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSave(e)}
      data-testid="billing-surcharge-settings-panel"
      className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <Moon className="h-4 w-4 text-slate-600" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-slate-900">{t("billingHub.surcharge.title")}</p>
          <p className="text-[11px] text-slate-500">{t("billingHub.surcharge.subtitle")}</p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            aria-label={String(t("billingHub.surcharge.title"))}
            data-testid="billing-surcharge-enabled"
            disabled={saving}
            onClick={() => patch({ enabled: !settings.enabled })}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition",
              settings.enabled ? "bg-emerald-500" : "bg-slate-300"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
                settings.enabled ? "left-[22px]" : "left-0.5"
              )}
            />
          </button>
        ) : (
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {settings.enabled ? "ON" : "OFF"}
          </span>
        )}
      </div>

      {settings.enabled ? (
        <div className="space-y-2">
          <RuleRow label={String(t("billingHub.surcharge.weekend_row"))}>
            <input
              type="number"
              min={0}
              max={200}
              disabled={!isAdmin}
              value={numField(settings.weekendRatePercent)}
              data-testid="billing-surcharge-weekend-rate"
              onChange={(e) => patch({ weekendRatePercent: Number(e.target.value) })}
              className={cn(compactInput, "max-w-[4.5rem]")}
              aria-label={String(t("billingHub.surcharge.weekend_row"))}
            />
            <span className="text-[13px] font-medium text-slate-500">%</span>
          </RuleRow>

          <RuleRow label={String(t("billingHub.surcharge.after_row"))}>
            <input
              type="number"
              min={0}
              max={23}
              disabled={!isAdmin}
              value={numField(settings.afterHour)}
              data-testid="billing-surcharge-after-hour"
              onChange={(e) => patch({ afterHour: Number(e.target.value) })}
              className={cn(compactInput, "max-w-[3.5rem]")}
              aria-label={String(t("billingHub.surcharge.hour"))}
            />
            <span className="text-[13px] font-medium text-slate-500">h</span>
            <span className="text-slate-300">→</span>
            <input
              type="number"
              min={0}
              max={200}
              disabled={!isAdmin}
              value={numField(settings.afterHourRatePercent)}
              data-testid="billing-surcharge-after-rate"
              onChange={(e) => patch({ afterHourRatePercent: Number(e.target.value) })}
              className={cn(compactInput, "max-w-[4.5rem]")}
              aria-label={String(t("billingHub.surcharge.rate_percent"))}
            />
            <span className="text-[13px] font-medium text-slate-500">%</span>
          </RuleRow>
        </div>
      ) : null}

      <HubCard tone="info" padding="sm" data-testid="billing-surcharge-preview">
        <p className="text-[12px] leading-relaxed text-blue-900/90">{previewText}</p>
      </HubCard>

      {settings.enabled ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/60">
          <button
            type="button"
            data-testid="billing-surcharge-advanced-toggle"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[12px] font-semibold text-slate-600"
          >
            {t("billingHub.surcharge.advanced")}
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 transition", advancedOpen && "rotate-180")}
              aria-hidden
            />
          </button>

          {advancedOpen ? (
            <div className="space-y-2 border-t border-slate-100 px-3 pb-3 pt-2">
              <label className="block text-[11px] font-medium text-slate-500">
                {t("billingHub.surcharge.line_label")}
                <input
                  value={settings.lineLabel}
                  disabled={!isAdmin}
                  data-testid="billing-surcharge-label"
                  onChange={(e) => patch({ lineLabel: e.target.value })}
                  className={cn(compactInput, "mt-1 font-normal")}
                />
              </label>

              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <label className="text-[11px] font-medium text-slate-500">
                  {t("billingHub.surcharge.before_hour_optional")}
                  <input
                    type="number"
                    min={0}
                    max={23}
                    disabled={!isAdmin}
                    value={settings.beforeHour === null ? "" : numField(settings.beforeHour)}
                    data-testid="billing-surcharge-before-hour"
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      patch({ beforeHour: raw === "" ? null : Number(raw) });
                    }}
                    placeholder="—"
                    className={cn(compactInput, "mt-1 font-normal")}
                  />
                </label>
                <span className="pb-2 text-slate-300">→</span>
                <label className="text-[11px] font-medium text-slate-500">
                  {t("billingHub.surcharge.rate_percent")}
                  <input
                    type="number"
                    min={0}
                    max={200}
                    disabled={!isAdmin}
                    value={numField(settings.beforeHourRatePercent)}
                    data-testid="billing-surcharge-before-rate"
                    onChange={(e) => patch({ beforeHourRatePercent: Number(e.target.value) })}
                    className={cn(compactInput, "mt-1 font-normal")}
                  />
                </label>
              </div>

              <label className="block text-[11px] font-medium text-slate-500">
                {t("billingHub.surcharge.apply_to")}
                <select
                  disabled={!isAdmin}
                  value={settings.applyTo}
                  data-testid="billing-surcharge-apply-to"
                  onChange={(e) =>
                    patch({
                      applyTo:
                        e.target.value === "subtotal_excl_travel"
                          ? "subtotal_excl_travel"
                          : "subtotal",
                    })
                  }
                  className={cn(compactInput, "mt-1 font-normal")}
                >
                  <option value="subtotal">{t("billingHub.surcharge.apply_subtotal")}</option>
                  <option value="subtotal_excl_travel">
                    {t("billingHub.surcharge.apply_excl_travel")}
                  </option>
                </select>
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      {isAdmin ? (
        <button
          type="submit"
          disabled={saving}
          data-testid="billing-surcharge-save"
          className="mt-auto rounded-xl bg-slate-900 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
        >
          {t("billingHub.surcharge.save")}
        </button>
      ) : null}
    </form>
  );
}

function RuleRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm">
      <span className="min-w-[7.5rem] flex-1 text-[12px] font-semibold text-slate-700">
        {label}
      </span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}
