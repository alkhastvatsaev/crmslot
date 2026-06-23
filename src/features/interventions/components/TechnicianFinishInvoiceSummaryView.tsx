"use client";

import { Loader2, Mail, Pencil } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { HubButton } from "@/core/ui/hub";
import { formatInvoiceTotalEur } from "@/features/interventions/technicianInvoiceQuickAdjust";
import { cn } from "@/lib/utils";
import { TERRAIN_BTN } from "@/features/interventions/terrainMobileChrome";

type Props = {
  totalCents: number;
  loadingDraft: boolean;
  sending: boolean;
  canSend: boolean;
  clientName?: string | null;
  recipient: string;
  hasRecipient: boolean;
  initialAiNote?: string | null;
  onSend: () => void;
  onAdjustOpen: () => void;
};

export default function TechnicianFinishInvoiceSummaryView({
  totalCents,
  loadingDraft,
  sending,
  canSend,
  clientName,
  recipient,
  hasRecipient,
  initialAiNote,
  onSend,
  onAdjustOpen,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="finish-job-step-invoice"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-2 py-4 text-center">
        <div className="w-full max-w-sm rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/80 to-white px-5 py-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">
            {String(t("technician_hub.finish.invoice.ready_badge"))}
          </p>
          {loadingDraft ? (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              {String(t("technician_hub.finish.invoice.preparing"))}
            </div>
          ) : (
            <p
              data-testid="finish-invoice-total"
              className="mt-3 text-4xl font-black tabular-nums text-slate-900"
            >
              {formatInvoiceTotalEur(totalCents)}
            </p>
          )}
          {clientName ? (
            <p className="mt-2 text-sm font-semibold text-slate-700">{clientName}</p>
          ) : null}
          {hasRecipient ? (
            <p
              data-testid="finish-invoice-recipient"
              className="mt-1 flex items-center justify-center gap-1 text-[12px] text-slate-500"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {recipient}
            </p>
          ) : (
            <p
              data-testid="finish-invoice-no-email"
              className="mt-2 text-[11px] font-medium text-amber-700"
            >
              {String(t("technician_hub.finish.invoice.no_email"))}
            </p>
          )}
          {initialAiNote ? (
            <p className="sr-only" data-testid="finish-invoice-ai-note">
              {initialAiNote}
            </p>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-slate-100 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-3">
        <HubButton
          type="button"
          data-testid="finish-invoice-send"
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
          {String(t("technician_hub.finish.invoice.send_cta"))}
        </HubButton>

        <button
          type="button"
          data-testid="finish-invoice-adjust-open"
          disabled={loadingDraft || sending}
          onClick={onAdjustOpen}
          className={cn(
            "flex w-full items-center justify-center gap-2 border border-slate-200 bg-white py-3 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-40",
            TERRAIN_BTN
          )}
        >
          <Pencil className="h-4 w-4 shrink-0" aria-hidden />
          {String(t("technician_hub.finish.invoice.adjust_cta"))}
        </button>
      </div>
    </div>
  );
}
