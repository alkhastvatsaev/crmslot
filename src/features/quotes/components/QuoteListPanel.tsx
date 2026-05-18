"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { subscribeQuotes, updateQuoteStatus } from "../quoteFirestore";
import QuoteStatusBadge from "./QuoteStatusBadge";
import QuoteEditorPanel from "./QuoteEditorPanel";
import type { Quote } from "../types";

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function QuoteListPanel({ interventionId }: { interventionId?: string }) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("quotesEnabled");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (!enabled || !firestore || !companyId) return;
    return subscribeQuotes(firestore, companyId, setQuotes);
  }, [enabled, companyId]);

  const filteredQuotes = interventionId
    ? quotes.filter((q) => q.interventionId === interventionId)
    : quotes;

  const handleRespond = async (quote: Quote, accept: boolean) => {
    if (!firestore) return;
    try {
      await updateQuoteStatus(firestore, companyId, quote.id, accept ? "accepted" : "declined");
      toast.success(accept ? String(t("quotes.toast_accepted")) : String(t("quotes.toast_declined")));
    } catch {
      toast.error(String(t("common.error")));
    }
  };

  if (!enabled) return null;

  return (
    <section data-testid="quote-list-panel" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">{t("quotes.panel_title")}</h3>
        </div>
        <button
          type="button"
          data-testid="quote-new"
          onClick={() => { setSelectedQuote(null); setShowEditor((v) => !v); }}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("quotes.new")}
        </button>
      </div>

      {showEditor && !selectedQuote && (
        <QuoteEditorPanel
          interventionId={interventionId}
          onSaved={() => setShowEditor(false)}
        />
      )}

      {filteredQuotes.length === 0 && !showEditor ? (
        <p className="text-sm text-slate-400">{t("quotes.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {filteredQuotes.map((q) => (
            <li
              key={q.id}
              data-testid={`quote-row-${q.id}`}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2"
            >
              {selectedQuote?.id === q.id ? (
                <QuoteEditorPanel
                  quote={q}
                  interventionId={interventionId}
                  onSaved={() => setSelectedQuote(null)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {q.clientName ?? t("quotes.unknown_client")}
                      </span>
                      <QuoteStatusBadge status={q.status} />
                    </div>
                    <span className="text-sm font-bold text-blue-700">{formatEur(q.totalCents)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{formatDate(q.createdAt)}</span>
                    <span>{q.lines.length} {t("quotes.lines_count")}</span>
                  </div>
                  <div className="flex gap-2">
                    {q.status === "draft" || q.status === "sent" ? (
                      <>
                        <button
                          type="button"
                          data-testid={`quote-edit-${q.id}`}
                          onClick={() => setSelectedQuote(q)}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          {t("quotes.edit")}
                        </button>
                        {q.status === "sent" && (
                          <>
                            <button
                              type="button"
                              data-testid={`quote-accept-${q.id}`}
                              onClick={() => void handleRespond(q, true)}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                            >
                              <CheckCircle className="h-3 w-3" />
                              {t("quotes.accept")}
                            </button>
                            <button
                              type="button"
                              data-testid={`quote-decline-${q.id}`}
                              onClick={() => void handleRespond(q, false)}
                              className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"
                            >
                              <XCircle className="h-3 w-3" />
                              {t("quotes.decline")}
                            </button>
                          </>
                        )}
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
