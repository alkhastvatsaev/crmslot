"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, Loader2, Mail, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useTranslation } from "@/core/i18n/I18nContext";
import { HubButton } from "@/core/ui/hub";
import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import {
  applyQuickInvoiceAdjust,
  formatInvoiceTotalEur,
  invoiceTotalCents,
  QUICK_INVOICE_ADJUST_IDS,
  type QuickInvoiceAdjustId,
} from "@/features/interventions/technicianInvoiceQuickAdjust";
import { cn } from "@/lib/utils";

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
  /** Lignes déjà chargées (évite un second appel API). */
  initialLines?: DraftBillingLine[];
  initialAiNote?: string | null;
  onSent?: () => void;
  onSkip?: () => void;
};

const QUICK_LABEL_KEYS: Record<QuickInvoiceAdjustId, string> = {
  add_travel: "technician_hub.finish.invoice.quick_travel",
  add_labor_30: "technician_hub.finish.invoice.quick_labor_30",
  add_labor_1h: "technician_hub.finish.invoice.quick_labor_1h",
  discount_10: "technician_hub.finish.invoice.quick_discount",
  urgency_10: "technician_hub.finish.invoice.quick_urgency",
};

function parsePriceEuros(raw: string): number | null {
  const n = parseFloat(raw.replace(",", ".").trim());
  return isNaN(n) || n < 0 ? null : n;
}

export default function TechnicianFinishInvoiceStep({
  interventionId,
  clientEmail,
  clientName,
  initialLines,
  initialAiNote,
  onSent,
  onSkip,
}: Props) {
  const { t } = useTranslation();
  const [lines, setLines] = useState<DraftBillingLine[]>(initialLines ?? []);
  const [aiNote, setAiNote] = useState(initialAiNote ?? "");
  const [loadingDraft, setLoadingDraft] = useState(!initialLines?.length);
  const [sending, setSending] = useState(false);

  // invoice preview
  const [previewOpen, setPreviewOpen] = useState(false);

  // inline price edit
  const [editingPriceIdx, setEditingPriceIdx] = useState<number | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState("");
  const priceInputRef = useRef<HTMLInputElement>(null);

  // add-line form
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [addLineDesc, setAddLineDesc] = useState("");
  const [addLinePrice, setAddLinePrice] = useState("");
  const descInputRef = useRef<HTMLInputElement>(null);

  const loadDraft = useCallback(async () => {
    setLoadingDraft(true);
    try {
      const res = await fetchWithAuth(
        `/api/interventions/${encodeURIComponent(interventionId)}/prepare-draft-billing`,
        { method: "POST" }
      );
      const data = (await res.json()) as DraftBillingResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Préparation facture impossible");
      }
      setLines(Array.isArray(data.billingLines) ? data.billingLines : []);
      if (typeof data.aiNote === "string") setAiNote(data.aiNote);
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

  const handleQuickAdjust = (id: QuickInvoiceAdjustId) => {
    setLines((prev) => applyQuickInvoiceAdjust(prev, id));
  };

  const handleDeleteLine = (i: number) => {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
    if (editingPriceIdx === i) setEditingPriceIdx(null);
  };

  const startEditPrice = (i: number) => {
    setEditingPriceIdx(i);
    setEditingPriceVal((lines[i].unitPriceCents / 100).toFixed(2));
    setTimeout(() => priceInputRef.current?.select(), 30);
  };

  const confirmEditPrice = () => {
    if (editingPriceIdx === null) return;
    const euros = parsePriceEuros(editingPriceVal);
    if (euros !== null) {
      setLines((prev) =>
        prev.map((l, i) =>
          i === editingPriceIdx ? { ...l, unitPriceCents: Math.round(euros * 100) } : l
        )
      );
    }
    setEditingPriceIdx(null);
  };

  const openAddLine = () => {
    setAddLineOpen(true);
    setTimeout(() => descInputRef.current?.focus(), 30);
  };

  const confirmAddLine = () => {
    const desc = addLineDesc.trim();
    const euros = parsePriceEuros(addLinePrice);
    if (!desc || euros === null) return;
    setLines((prev) => [
      ...prev,
      { description: desc, quantity: 1, unitPriceCents: Math.round(euros * 100), reference: "" },
    ]);
    setAddLineDesc("");
    setAddLinePrice("");
    setAddLineOpen(false);
  };

  const handleSend = async () => {
    if (sending || lines.length === 0) return;
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

  const previewDate = new Date().toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      data-testid="finish-job-step-invoice"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {/* Invoice preview overlay */}
      {previewOpen ? (
        <div
          data-testid="finish-invoice-preview"
          className="absolute inset-0 z-50 flex flex-col bg-slate-100"
        >
          <div className="flex shrink-0 items-center justify-between bg-white px-4 py-3 shadow-sm">
            <p className="text-[13px] font-bold text-slate-900">
              {String(t("technician_hub.finish.invoice.preview_title"))}
            </p>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              aria-label={String(t("common.close"))}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-md">
              <div className="mb-4 border-b border-slate-100 pb-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  MAP BELGIQUE
                </p>
                <p className="mt-1 text-[18px] font-black text-slate-900">
                  {String(t("technician_hub.finish.invoice.preview_heading"))}
                </p>
                <p className="text-[11px] text-slate-500">{previewDate}</p>
              </div>
              {clientName ? (
                <p className="mb-3 text-[12px] font-semibold text-slate-700">
                  {String(t("technician_hub.finish.invoice.preview_to"))} {clientName}
                </p>
              ) : null}
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    <th className="pb-1.5">
                      {String(t("technician_hub.finish.invoice.preview_col_desc"))}
                    </th>
                    <th className="pb-1.5 text-right">
                      {String(t("technician_hub.finish.invoice.preview_col_qty"))}
                    </th>
                    <th className="pb-1.5 text-right">
                      {String(t("technician_hub.finish.invoice.preview_col_price"))}
                    </th>
                    <th className="pb-1.5 text-right">
                      {String(t("technician_hub.finish.invoice.preview_col_total"))}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-1.5 pr-2 font-medium text-slate-700">{line.description}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-500">
                        {line.quantity}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-slate-500">
                        {(line.unitPriceCents / 100).toFixed(2)} €
                      </td>
                      <td className="py-1.5 text-right tabular-nums font-semibold text-slate-800">
                        {((line.unitPriceCents * (line.quantity || 1)) / 100).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3">
                <span className="text-[13px] font-bold text-slate-900">
                  {String(t("technician_hub.finish.invoice.preview_total_label"))}
                </span>
                <span className="text-[15px] font-black tabular-nums text-slate-900">
                  {formatInvoiceTotalEur(totalCents)}
                </span>
              </div>
              {hasRecipient ? (
                <p className="mt-4 flex items-center gap-1 text-[11px] text-slate-400">
                  <Mail className="h-3 w-3" aria-hidden />
                  {String(t("technician_hub.finish.invoice.preview_will_send"))} {recipient}
                </p>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
            <HubButton
              type="button"
              fullWidth
              disabled={loadingDraft || sending || lines.length === 0}
              onClick={() => {
                setPreviewOpen(false);
                void handleSend();
              }}
              className="h-14 rounded-full bg-emerald-600 text-[15px] font-bold text-white hover:bg-emerald-700"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <Mail className="h-5 w-5 shrink-0" aria-hidden />
              )}
              {String(t("technician_hub.finish.invoice.send_cta"))}
            </HubButton>
          </div>
        </div>
      ) : null}
      {/* Scrollable content — never clips the CTA */}
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-3">
        {/* Header */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/80 to-white px-4 py-4 text-center shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">
            {String(t("technician_hub.finish.invoice.ready_badge"))}
          </p>
          {loadingDraft ? (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {String(t("technician_hub.finish.invoice.preparing"))}
            </div>
          ) : (
            <p
              data-testid="finish-invoice-total"
              className="mt-2 text-3xl font-black tabular-nums text-slate-900"
            >
              {formatInvoiceTotalEur(totalCents)}
            </p>
          )}
          {clientName ? (
            <p className="mt-1 text-xs font-medium text-slate-600">{clientName}</p>
          ) : null}
          {hasRecipient ? (
            <p
              data-testid="finish-invoice-recipient"
              className="mt-1 flex items-center justify-center gap-1 text-[11px] text-slate-500"
            >
              <Mail className="h-3 w-3" aria-hidden />
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
        </div>

        {aiNote ? (
          <p
            data-testid="finish-invoice-ai-note"
            className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-600"
          >
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden />
            {aiNote}
          </p>
        ) : null}

        {/* Quick adjust chips */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {String(t("technician_hub.finish.invoice.adjust_hint"))}
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_INVOICE_ADJUST_IDS.map((id) => (
              <button
                key={id}
                type="button"
                data-testid={`finish-invoice-quick-${id}`}
                disabled={loadingDraft || sending}
                onClick={() => handleQuickAdjust(id)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm transition active:scale-95 disabled:opacity-40"
              >
                {String(t(QUICK_LABEL_KEYS[id]))}
              </button>
            ))}
          </div>
        </div>

        {/* Billing lines — editable */}
        <div
          data-testid="finish-invoice-lines"
          className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
        >
          {lines.length === 0 && !loadingDraft ? (
            <p className="py-1 text-center text-[11px] text-slate-400">
              {String(t("technician_hub.finish.invoice.no_lines"))}
            </p>
          ) : null}

          <ul className="space-y-1">
            {lines.map((line, i) => (
              <li key={`${line.description}-${i}`} className="flex items-center gap-1.5">
                <span className="min-w-0 flex-1 truncate text-[11px] text-slate-600">
                  {line.quantity > 1 ? `${line.quantity}× ` : ""}
                  {line.description}
                </span>

                {editingPriceIdx === i ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <input
                      ref={priceInputRef}
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingPriceVal}
                      onChange={(e) => setEditingPriceVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEditPrice();
                        if (e.key === "Escape") setEditingPriceIdx(null);
                      }}
                      className="h-7 w-20 rounded-lg border border-indigo-300 bg-white px-2 text-right text-[12px] font-semibold tabular-nums text-slate-900 outline-none focus:border-indigo-500"
                      aria-label={String(t("technician_hub.finish.invoice.line_edit_price_aria"))}
                    />
                    <button
                      type="button"
                      onClick={confirmEditPrice}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white transition active:scale-95"
                      aria-label={String(
                        t("technician_hub.finish.invoice.line_price_confirm_aria")
                      )}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditPrice(i)}
                    disabled={loadingDraft || sending}
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-700 transition",
                      "hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 disabled:opacity-40"
                    )}
                    aria-label={String(t("technician_hub.finish.invoice.line_edit_price_aria"))}
                  >
                    {formatInvoiceTotalEur(
                      Math.round(line.unitPriceCents) * (line.quantity > 0 ? line.quantity : 1)
                    )}
                  </button>
                )}

                <button
                  type="button"
                  data-testid={`finish-invoice-line-delete-${i}`}
                  onClick={() => handleDeleteLine(i)}
                  disabled={loadingDraft || sending}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 active:scale-95 disabled:opacity-30"
                  aria-label={String(t("technician_hub.finish.invoice.line_delete_aria"))}
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>

          {addLineOpen ? (
            <div className="mt-2 space-y-1.5 border-t border-slate-200/60 pt-2">
              <input
                ref={descInputRef}
                type="text"
                value={addLineDesc}
                onChange={(e) => setAddLineDesc(e.target.value)}
                placeholder={String(t("technician_hub.finish.invoice.add_line_desc_placeholder"))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 outline-none focus:border-indigo-400 placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmAddLine();
                  if (e.key === "Escape") setAddLineOpen(false);
                }}
              />
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={addLinePrice}
                  onChange={(e) => setAddLinePrice(e.target.value)}
                  placeholder={String(
                    t("technician_hub.finish.invoice.add_line_price_placeholder")
                  )}
                  className="w-24 shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-right text-[12px] tabular-nums text-slate-800 outline-none focus:border-indigo-400 placeholder:text-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmAddLine();
                    if (e.key === "Escape") setAddLineOpen(false);
                  }}
                />
                <button
                  type="button"
                  data-testid="finish-invoice-add-line-confirm"
                  onClick={confirmAddLine}
                  disabled={!addLineDesc.trim() || !addLinePrice.trim()}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500 py-1.5 text-[12px] font-semibold text-white transition active:scale-95 disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  {String(t("technician_hub.finish.invoice.add_line_confirm"))}
                </button>
                <button
                  type="button"
                  onClick={() => setAddLineOpen(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition active:scale-95"
                  aria-label="Annuler"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              data-testid="finish-invoice-add-line"
              onClick={openAddLine}
              disabled={loadingDraft || sending}
              className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold text-indigo-500 transition hover:bg-indigo-50 active:scale-95 disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {String(t("technician_hub.finish.invoice.add_line"))}
            </button>
          )}
        </div>
      </div>

      {/* Sticky CTA — toujours visible sans scroll */}
      <div className="shrink-0 border-t border-slate-100 px-1 pb-1 pt-2 space-y-1">
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="finish-invoice-preview-btn"
            disabled={loadingDraft || lines.length === 0}
            onClick={() => setPreviewOpen(true)}
            className="flex h-14 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-30"
            aria-label={String(t("technician_hub.finish.invoice.preview_aria"))}
          >
            <Eye className="h-5 w-5 shrink-0" aria-hidden />
          </button>
          <HubButton
            type="button"
            data-testid="finish-invoice-send"
            fullWidth
            disabled={loadingDraft || sending || lines.length === 0}
            onClick={() => void handleSend()}
            className="h-14 flex-1 rounded-full bg-emerald-600 text-[15px] font-bold text-white hover:bg-emerald-700"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Mail className="h-5 w-5 shrink-0" aria-hidden />
            )}
            {String(t("technician_hub.finish.invoice.send_cta"))}
          </HubButton>
        </div>
        {onSkip ? (
          <button
            type="button"
            data-testid="finish-invoice-skip"
            disabled={sending}
            onClick={onSkip}
            className="w-full py-1.5 text-center text-[11px] font-semibold text-slate-400 hover:text-slate-600"
          >
            {String(t("technician_hub.finish.invoice.skip"))}
          </button>
        ) : null}
      </div>
    </div>
  );
}
