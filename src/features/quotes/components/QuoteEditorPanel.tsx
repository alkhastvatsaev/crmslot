"use client";

import { useState } from "react";
import { Plus, Trash2, Send, Save } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { logCrmCompanyAction } from "@/features/crmHistory/logCrmCompanyAction";
import { createQuote, updateQuote, updateQuoteStatus } from "../quoteFirestore";
import QuoteStatusBadge from "./QuoteStatusBadge";
import type { Quote, QuoteLine } from "../types";

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

type Props = {
  quote?: Quote;
  interventionId?: string;
  onSaved?: (id: string) => void;
};

export default function QuoteEditorPanel({ quote, interventionId, onSaved }: Props) {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";

  const [lines, setLines] = useState<QuoteLine[]>(
    quote?.lines ?? [{ description: "", quantity: 1, unitPriceCents: 0 }]
  );
  const [notes, setNotes] = useState(quote?.notes ?? "");
  const [validityDays, setValidityDays] = useState(quote?.validityDays ?? 30);
  const [clientName, setClientName] = useState(quote?.clientName ?? "");
  const [clientEmail, setClientEmail] = useState(quote?.clientEmail ?? "");
  const [busy, setBusy] = useState(false);

  const totalHT = lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPriceCents), 0);
  const tva = Math.round(totalHT * 0.06);
  const totalTTC = totalHT + tva;

  const addLine = () =>
    setLines((prev) => [...prev, { description: "", quantity: 1, unitPriceCents: 0 }]);

  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const updateLine = (i: number, patch: Partial<QuoteLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const handleSave = async (andSend = false) => {
    if (!firestore || !companyId) return;
    const validLines = lines.filter((l) => l.description.trim());
    if (validLines.length === 0) {
      toast.error(String(t("quotes.error_no_lines")));
      return;
    }
    setBusy(true);
    try {
      if (quote) {
        await updateQuote(firestore, companyId, quote.id, {
          lines: validLines,
          notes: notes.trim() || null,
          validityDays,
          clientName: clientName.trim() || null,
          clientEmail: clientEmail.trim() || null,
        });
        if (andSend && quote.status !== "sent") {
          await updateQuoteStatus(firestore, companyId, quote.id, "sent");
          await logCrmCompanyAction({
            companyId,
            kind: "quote_status_changed",
            actorUid: workspace?.firebaseUid ?? "system",
            actorRole: "dispatcher",
            statusBefore: quote.status,
            statusAfter: "sent",
            note: notes.trim() || undefined,
            intervention: {
              id: quote.id,
              title: `Devis ${quote.id.substring(0, 8)}`,
              status: "sent",
              clientName: clientName.trim() || undefined,
              clientCompanyName: clientName.trim() || undefined,
              address: "",
            },
          });
        }
        onSaved?.(quote.id);
      } else {
        const id = await createQuote(firestore, companyId, {
          lines: validLines,
          notes: notes.trim() || null,
          validityDays,
          clientName: clientName.trim() || null,
          clientEmail: clientEmail.trim() || null,
          interventionId: interventionId ?? null,
          clientId: null,
          createdByUid: workspace?.firebaseUid ?? null,
        });
        await logCrmCompanyAction({
          companyId,
          kind: "quote_created",
          actorUid: workspace?.firebaseUid ?? "system",
          actorRole: "dispatcher",
          note: notes.trim() || undefined,
          statusAfter: "draft",
          intervention: {
            id: id,
            title: `Devis ${id.substring(0, 8)}`,
            status: "draft",
            clientName: clientName.trim() || undefined,
            clientCompanyName: clientName.trim() || undefined,
            address: "",
          },
        });
        if (andSend) {
          await updateQuoteStatus(firestore, companyId, id, "sent");
          await logCrmCompanyAction({
            companyId,
            kind: "quote_status_changed",
            actorUid: workspace?.firebaseUid ?? "system",
            actorRole: "dispatcher",
            statusBefore: "draft",
            statusAfter: "sent",
            note: notes.trim() || undefined,
            intervention: {
              id: id,
              title: `Devis ${id.substring(0, 8)}`,
              status: "sent",
              clientName: clientName.trim() || undefined,
              clientCompanyName: clientName.trim() || undefined,
              address: "",
            },
          });
        }
        onSaved?.(id);
      }
      toast.success(andSend ? String(t("quotes.toast_sent")) : String(t("quotes.toast_saved")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="quote-editor-panel"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{t("quotes.editor_title")}</h3>
        {quote && <QuoteStatusBadge status={quote.status} />}
      </div>

      {/* Client info */}
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          data-testid="quote-client-name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder={String(t("quotes.client_name"))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          data-testid="quote-client-email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder={String(t("quotes.client_email"))}
          type="email"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      {/* Lines */}
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_60px_80px_32px] gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
          <span>{t("quotes.col_description")}</span>
          <span className="text-right">{t("quotes.col_qty")}</span>
          <span className="text-right">{t("quotes.col_price")}</span>
          <span />
        </div>
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-[1fr_60px_80px_32px] gap-1 items-center">
            <input
              data-testid={`quote-line-desc-${i}`}
              value={line.description}
              onChange={(e) => updateLine(i, { description: e.target.value })}
              placeholder={String(t("quotes.line_placeholder"))}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
            <input
              data-testid={`quote-line-qty-${i}`}
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) => updateLine(i, { quantity: Math.max(1, Number(e.target.value)) })}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right"
            />
            <input
              data-testid={`quote-line-price-${i}`}
              type="number"
              min={0}
              step={0.01}
              value={(line.unitPriceCents / 100).toFixed(2)}
              onChange={(e) =>
                updateLine(i, { unitPriceCents: Math.round(Number(e.target.value) * 100) })
              }
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right"
            />
            <button
              type="button"
              onClick={() => removeLine(i)}
              disabled={lines.length === 1}
              data-testid={`quote-line-remove-${i}`}
              className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addLine}
          data-testid="quote-add-line"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("quotes.add_line")}
        </button>
      </div>

      {/* Totals */}
      <div className="rounded-lg bg-slate-50 px-3 py-2 space-y-1 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>{t("quotes.total_ht")}</span>
          <span>{formatEur(totalHT)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>{t("quotes.tva_6")}</span>
          <span>{formatEur(tva)}</span>
        </div>
        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1">
          <span>{t("quotes.total_ttc")}</span>
          <span>{formatEur(totalTTC)}</span>
        </div>
      </div>

      {/* Validity + notes */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t("quotes.validity_days")}
          </label>
          <input
            data-testid="quote-validity"
            type="number"
            min={1}
            value={validityDays}
            onChange={(e) => setValidityDays(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t("quotes.notes")}
          </label>
          <textarea
            data-testid="quote-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          data-testid="quote-save"
          disabled={busy}
          onClick={() => void handleSave(false)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {t("quotes.save")}
        </button>
        <button
          type="button"
          data-testid="quote-send"
          disabled={busy}
          onClick={() => void handleSave(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {t("quotes.send")}
        </button>
      </div>
    </div>
  );
}
