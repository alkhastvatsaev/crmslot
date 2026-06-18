"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useTranslation } from "@/core/i18n/I18nContext";
import { HubButton } from "@/core/ui/hub";
import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import {
  applyQuickInvoiceAdjust,
  formatBillingLineEur,
  formatInvoiceTotalEur,
  invoiceTotalCents,
  QUICK_INVOICE_ADJUST_IDS,
  removeBillingLineAt,
  type QuickInvoiceAdjustId,
} from "@/features/interventions/technicianInvoiceQuickAdjust";
import { cn } from "@/lib/utils";
import { TERRAIN_BTN } from "@/features/interventions/terrainMobileChrome";

type DraftBillingResponse = {
  ok?: boolean;
  billingLines?: DraftBillingLine[];
  invoiceAmountCents?: number;
  aiNote?: string;
  error?: string;
};

type IssueInvoiceResponse = {
  ok?: boolean;
  emailSent?: boolean;
  emailError?: string;
  error?: string;
};

type Props = {
  interventionId: string;
  clientEmail?: string | null;
  clientName?: string | null;
  initialLines?: DraftBillingLine[];
  initialAiNote?: string | null;
  onSent?: () => void;
};

const QUICK_CHIP_I18N: Record<QuickInvoiceAdjustId, string> = {
  add_travel: "technician_hub.finish.invoice.chip_add_travel",
  add_labor_30: "technician_hub.finish.invoice.chip_add_labor_30",
  add_labor_1h: "technician_hub.finish.invoice.chip_add_labor_1h",
  discount_10: "technician_hub.finish.invoice.chip_discount_10",
  urgency_10: "technician_hub.finish.invoice.chip_urgency_10",
};

export default function TechnicianFinishInvoiceStep({
  interventionId,
  clientEmail,
  clientName,
  initialLines,
  initialAiNote,
  onSent,
}: Props) {
  const { t } = useTranslation();
  const [lines, setLines] = useState<DraftBillingLine[]>(initialLines ?? []);
  const [loadingDraft, setLoadingDraft] = useState(!initialLines?.length);
  const [sending, setSending] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const loadDraft = useCallback(async () => {
    setLoadingDraft(true);
    try {
      const res = await fetchWithAuth(
        `/api/interventions/${encodeURIComponent(interventionId)}/prepare-draft-billing`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forceRegenerate: true }),
        }
      );
      const data = (await res.json()) as DraftBillingResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Préparation facture impossible");
      }
      setLines(Array.isArray(data.billingLines) ? data.billingLines : []);
    } catch (e) {
      toast.error(String(t("technician_hub.finish.invoice.draft_error")), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoadingDraft(false);
    }
  }, [interventionId, t]);

  useEffect(() => {
    if (initialLines?.length) {
      setLines(initialLines);
      setLoadingDraft(false);
      return;
    }
    void loadDraft();
  }, [initialLines, loadDraft]);

  const totalCents = useMemo(() => invoiceTotalCents(lines), [lines]);
  const recipient = (clientEmail ?? "").trim();
  const hasRecipient = recipient.includes("@");
  const canSend = !loadingDraft && !sending && lines.length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const res = await fetchWithAuth(
        `/api/interventions/${encodeURIComponent(interventionId)}/issue-invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sendEmail: true, billingLines: lines }),
        }
      );
      const data = (await res.json()) as IssueInvoiceResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Envoi facture impossible");
      }
      if (data.emailSent) {
        toast.success(String(t("technician_hub.finish.invoice.sent_ok")), {
          description: hasRecipient
            ? String(t("technician_hub.finish.invoice.sent_ok_desc")).replace(
                "{{email}}",
                recipient
              )
            : undefined,
        });
      } else {
        toast.message(String(t("technician_hub.finish.invoice.sent_no_mail")), {
          description: data.emailError ?? String(t("technician_hub.finish.invoice.no_email")),
        });
      }
      onSent?.();
    } catch (e) {
      toast.error(String(t("technician_hub.finish.invoice.send_error")), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSending(false);
    }
  };

  const applyChip = (adjustId: QuickInvoiceAdjustId) => {
    setLines((prev) => applyQuickInvoiceAdjust(prev, adjustId));
  };

  const removeLine = (index: number) => {
    setLines((prev) => removeBillingLineAt(prev, index));
  };

  if (adjustOpen) {
    return (
      <div
        data-testid="finish-invoice-adjust-panel"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-1 pb-2 pt-1">
          <button
            type="button"
            data-testid="finish-invoice-adjust-back"
            onClick={() => setAdjustOpen(false)}
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
                    onClick={() => removeLine(index)}
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
                onClick={() => applyChip(adjustId)}
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
            onClick={() => void loadDraft()}
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
            onClick={() => void handleSend()}
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
          onClick={() => void handleSend()}
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
          onClick={() => setAdjustOpen(true)}
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
