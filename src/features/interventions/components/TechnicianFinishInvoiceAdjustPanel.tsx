"use client";

import { Loader2, Mail, RefreshCw, Trash2, X } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { HubButton } from "@/core/ui/hub";
import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import {
  formatBillingLineEur,
  formatInvoiceTotalEur,
  QUICK_INVOICE_ADJUST_IDS,
  type QuickInvoiceAdjustId,
} from "@/features/interventions/technicianInvoiceQuickAdjust";
import { cn } from "@/lib/utils";
import { TERRAIN_BTN } from "@/features/interventions/terrainMobileChrome";

const QUICK_CHIP_I18N: Record<QuickInvoiceAdjustId, string> = {
  add_travel: "technician_hub.finish.invoice.chip_add_travel",
  add_labor_30: "technician_hub.finish.invoice.chip_add_labor_30",
  add_labor_1h: "technician_hub.finish.invoice.chip_add_labor_1h",
  discount_10: "technician_hub.finish.invoice.chip_discount_10",
  urgency_10: "technician_hub.finish.invoice.chip_urgency_10",
};

type Props = {
  lines: DraftBillingLine[];
  totalCents: number;
  loadingDraft: boolean;
  sending: boolean;
  canSend: boolean;
  onBack: () => void;
  onRemoveLine: (index: number) => void;
  onApplyChip: (adjustId: QuickInvoiceAdjustId) => void;
  onRegenerate: () => void;
  onSend: () => void;
};

export default function TechnicianFinishInvoiceAdjustPanel({
  lines,
  totalCents,
  loadingDraft,
  sending,
  canSend,
  onBack,
  onRemoveLine,
  onApplyChip,
  onRegenerate,
  onSend,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="finish-invoice-adjust-panel"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-1 pb-2 pt-1">
        <button
          type="button"
          data-testid="finish-invoice-adjust-back"
          onClick={onBack}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 text-[13px] font-semibold text-slate-600",
            TERRAIN_BTN
          )}
        >
          <X className="h-4 w-4" aria-hidden />
          {String(t("technician_hub.finish.invoice.adjust_back"))}
        </button>
        <p
          data-testid="finish-invoice-adjust-total"
          className="text-lg font-black tabular-nums text-slate-900"
        >
          {formatInvoiceTotalEur(totalCents)}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
        <p className="mb-2 text-[12px] font-medium text-slate-500">
          {String(t("technician_hub.finish.invoice.adjust_lines_heading"))}
        </p>
        <ul className="space-y-1.5" data-testid="finish-invoice-lines">
          {lines.map((line, index) => {
            const lineTotal =
              Math.round(line.unitPriceCents) * (line.quantity > 0 ? line.quantity : 1);
            return (
              <li
                key={`${index}-${line.description}`}
                data-testid={`finish-invoice-line-${index}`}
                className={cn(
                  "flex items-center gap-2 border border-slate-100 bg-white px-2.5 py-2",
                  TERRAIN_BTN
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-800">
                    {line.description}
                  </p>
                  {line.quantity > 1 ? (
                    <p className="text-[11px] text-slate-500">
                      ×{line.quantity} — {formatBillingLineEur(line.unitPriceCents)}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[13px] font-bold tabular-nums text-slate-700">
                  {formatBillingLineEur(lineTotal)}
                </span>
                <button
                  type="button"
                  data-testid={`finish-invoice-line-remove-${index}`}
                  onClick={() => onRemoveLine(index)}
                  aria-label={String(t("technician_hub.finish.invoice.remove_line_aria"))}
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-rose-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mb-2 mt-4 text-[12px] font-medium text-slate-500">
          {String(t("technician_hub.finish.invoice.adjust_chips_heading"))}
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_INVOICE_ADJUST_IDS.map((adjustId) => (
            <button
              key={adjustId}
              type="button"
              data-testid={`finish-invoice-quick-${adjustId}`}
              disabled={loadingDraft || sending}
              onClick={() => onApplyChip(adjustId)}
              className={cn(
                "border border-indigo-100 bg-indigo-50 px-3 py-2 text-[12px] font-semibold text-indigo-800 transition active:scale-[0.98] disabled:opacity-40",
                TERRAIN_BTN
              )}
            >
              {String(t(QUICK_CHIP_I18N[adjustId]))}
            </button>
          ))}
        </div>

        <button
          type="button"
          data-testid="finish-invoice-regenerate"
          disabled={loadingDraft || sending}
          onClick={() => void onRegenerate()}
          className={cn(
            "mt-3 flex w-full items-center justify-center gap-2 border border-slate-200 bg-slate-50 py-2.5 text-[12px] font-semibold text-slate-700 disabled:opacity-40",
            TERRAIN_BTN
          )}
        >
          {loadingDraft ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden />
          )}
          {String(t("technician_hub.finish.invoice.regenerate_cta"))}
        </button>
      </div>

      <div className="shrink-0 border-t border-slate-100 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-3">
        <HubButton
          type="button"
          data-testid="finish-invoice-adjust-send"
          fullWidth
          disabled={!canSend}
          onClick={() => void onSend()}
          className={cn(
            "h-14 bg-emerald-600 text-[16px] font-bold text-white hover:bg-emerald-700",
            TERRAIN_BTN
          )}
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Mail className="h-5 w-5 shrink-0" aria-hidden />
          )}
          {String(t("technician_hub.finish.invoice.adjust_send_cta"))}
        </HubButton>
      </div>
    </div>
  );
}
