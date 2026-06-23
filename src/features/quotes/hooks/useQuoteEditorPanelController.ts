"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { logCrmCompanyAction } from "@/features/crmHistory/logCrmCompanyAction";
import { createQuote, updateQuote } from "@/features/quotes/quoteFirestore";
import { computeQuoteTotals } from "@/features/quotes/quoteEditorPanelUtils";
import type { QuoteEditorPanelProps } from "@/features/quotes/quoteEditorPanelTypes";
import type { QuoteLine } from "@/features/quotes/types";

export function useQuoteEditorPanelController({
  quote,
  interventionId,
  onSaved,
}: QuoteEditorPanelProps) {
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

  const { totalHT, tva, totalTTC } = computeQuoteTotals(lines);

  const addLine = () =>
    setLines((prev) => [...prev, { description: "", quantity: 1, unitPriceCents: 0 }]);

  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const updateLine = (i: number, patch: Partial<QuoteLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const sendQuoteEmail = async (quoteId: string, statusBefore: string) => {
    if (!clientEmail.trim()) {
      toast.error(String(t("quotes.error_no_email")));
      return false;
    }
    const res = await fetchWithAuth(
      `/api/companies/${encodeURIComponent(companyId)}/quotes/${encodeURIComponent(quoteId)}/send`,
      { method: "POST" }
    );
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? String(t("quotes.toast_send_email_failed")));
      return false;
    }
    await logCrmCompanyAction({
      companyId,
      kind: "quote_status_changed",
      actorUid: workspace?.firebaseUid ?? "system",
      actorRole: "dispatcher",
      statusBefore,
      statusAfter: "sent",
      note: notes.trim() || undefined,
      intervention: {
        id: quoteId,
        title: `Devis ${quoteId.substring(0, 8)}`,
        status: "sent",
        clientName: clientName.trim() || undefined,
        clientCompanyName: clientName.trim() || undefined,
        address: "",
      },
    });
    return true;
  };

  const handleSave = async (andSend = false) => {
    if (!firestore || !companyId) return;
    const validLines = lines.filter((l) => l.description.trim());
    if (validLines.length === 0) {
      toast.error(String(t("quotes.error_no_lines")));
      return;
    }
    setBusy(true);
    try {
      let quoteId: string;
      let statusBefore: string;

      if (quote) {
        quoteId = quote.id;
        statusBefore = quote.status;
        await updateQuote(firestore, companyId, quote.id, {
          lines: validLines,
          notes: notes.trim() || null,
          validityDays,
          clientName: clientName.trim() || null,
          clientEmail: clientEmail.trim() || null,
        });
      } else {
        statusBefore = "draft";
        quoteId = await createQuote(firestore, companyId, {
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
            id: quoteId,
            title: `Devis ${quoteId.substring(0, 8)}`,
            status: "draft",
            clientName: clientName.trim() || undefined,
            clientCompanyName: clientName.trim() || undefined,
            address: "",
          },
        });
      }

      if (andSend) {
        const sent = await sendQuoteEmail(quoteId, statusBefore);
        if (!sent) return;
        toast.success(String(t("quotes.toast_sent_email")));
      } else {
        toast.success(String(t("quotes.toast_saved")));
      }
      onSaved?.(quoteId);
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  return {
    t,
    quote,
    lines,
    notes,
    setNotes,
    validityDays,
    setValidityDays,
    clientName,
    setClientName,
    clientEmail,
    setClientEmail,
    busy,
    totalHT,
    tva,
    totalTTC,
    addLine,
    removeLine,
    updateLine,
    handleSave,
  };
}
