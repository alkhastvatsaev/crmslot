"use client";

import { Loader2, Percent } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { BillingSurchargeSettings } from "@/features/billing/billingSurchargeSettings";
import { useBillingSurchargeSettings } from "@/features/billingHub/hooks/useBillingSurchargeSettings";

type Props = {
  companyId: string | null;
  isAdmin: boolean;
};

function numField(value: number): string {
  return Number.isFinite(value) ? String(value) : "";
}

export default function BillingSurchargeSettingsPanel({ companyId, isAdmin }: Props) {
  const { t } = useTranslation();
  const { settings, setSettings, loading, saving, save } = useBillingSurchargeSettings(companyId);

  const patch = (partial: Partial<BillingSurchargeSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

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
      <p className="px-4 py-8 text-center text-[12px] text-slate-400">
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
      <div className="flex items-center gap-2 px-1">
        <Percent className="h-4 w-4 text-slate-500" />
        <p className="text-[12px] leading-snug text-slate-600">{t("billingHub.surcharge.hint")}</p>
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={settings.enabled}
          disabled={!isAdmin}
          data-testid="billing-surcharge-enabled"
          onChange={(e) => patch({ enabled: e.target.checked })}
        />
        <span>{t("billingHub.surcharge.enabled")}</span>
      </label>

      <input
        value={settings.lineLabel}
        disabled={!isAdmin}
        data-testid="billing-surcharge-label"
        onChange={(e) => patch({ lineLabel: e.target.value })}
        placeholder={String(t("billingHub.surcharge.line_label"))}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {t("billingHub.surcharge.weekend")}
        </label>
        <input
          type="number"
          min={0}
          max={200}
          disabled={!isAdmin}
          value={numField(settings.weekendRatePercent)}
          data-testid="billing-surcharge-weekend-rate"
          onChange={(e) => patch({ weekendRatePercent: Number(e.target.value) })}
          placeholder={String(t("billingHub.surcharge.rate_percent"))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <span className="flex items-center text-[12px] text-slate-500">% (sam. / dim.)</span>

        <label className="col-span-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {t("billingHub.surcharge.after_hour")}
        </label>
        <input
          type="number"
          min={0}
          max={23}
          disabled={!isAdmin}
          value={numField(settings.afterHour)}
          data-testid="billing-surcharge-after-hour"
          onChange={(e) => patch({ afterHour: Number(e.target.value) })}
          placeholder={String(t("billingHub.surcharge.hour"))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          max={200}
          disabled={!isAdmin}
          value={numField(settings.afterHourRatePercent)}
          data-testid="billing-surcharge-after-rate"
          onChange={(e) => patch({ afterHourRatePercent: Number(e.target.value) })}
          placeholder={String(t("billingHub.surcharge.rate_percent"))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />

        <label className="col-span-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {t("billingHub.surcharge.before_hour_optional")}
        </label>
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
          placeholder={String(t("billingHub.surcharge.hour_optional"))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          max={200}
          disabled={!isAdmin}
          value={numField(settings.beforeHourRatePercent)}
          data-testid="billing-surcharge-before-rate"
          onChange={(e) => patch({ beforeHourRatePercent: Number(e.target.value) })}
          placeholder={String(t("billingHub.surcharge.rate_percent"))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      <label className="text-[12px] text-slate-600">
        <span className="mb-1 block font-medium">{t("billingHub.surcharge.apply_to")}</span>
        <select
          disabled={!isAdmin}
          value={settings.applyTo}
          data-testid="billing-surcharge-apply-to"
          onChange={(e) =>
            patch({
              applyTo:
                e.target.value === "subtotal_excl_travel" ? "subtotal_excl_travel" : "subtotal",
            })
          }
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="subtotal">{t("billingHub.surcharge.apply_subtotal")}</option>
          <option value="subtotal_excl_travel">
            {t("billingHub.surcharge.apply_excl_travel")}
          </option>
        </select>
      </label>

      {isAdmin ? (
        <button
          type="submit"
          disabled={saving}
          data-testid="billing-surcharge-save"
          className="rounded-lg bg-slate-900 py-2.5 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          {t("billingHub.surcharge.save")}
        </button>
      ) : null}
    </form>
  );
}
