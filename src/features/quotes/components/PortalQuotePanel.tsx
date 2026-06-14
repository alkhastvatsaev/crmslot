"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, FileText, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { PortalQuoteSummary } from "@/features/quotes/portalQuoteSummary";

type Props = {
  portalToken: string;
  quotes: PortalQuoteSummary[];
};

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function PortalQuotePanel({ portalToken, quotes }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!quotes.length) return null;

  const respond = async (quoteId: string, accept: boolean) => {
    setBusyId(quoteId);
    try {
      const path = accept ? "accept" : "decline";
      const res = await fetch(
        `/api/portal/${encodeURIComponent(portalToken)}/quotes/${encodeURIComponent(quoteId)}/${path}`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        invoiceIssued?: boolean;
        invoiceError?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? String(t("common.error")));
      }
      if (accept) {
        toast.success(String(t("portal.toast_quote_accepted")));
        if (data.invoiceIssued) {
          toast.success(String(t("portal.toast_invoice_issued")));
        } else if (data.invoiceError) {
          toast.message(String(t("portal.toast_invoice_pending")), {
            description: data.invoiceError,
          });
        }
      } else {
        toast.success(String(t("portal.toast_quote_declined")));
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(t("common.error")));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      data-testid="portal-quote-panel"
      className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-blue-600" />
        <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">
          {t("portal.quotes_title")}
        </h2>
      </div>
      <p className="text-[13px] text-slate-500">{t("portal.quotes_hint")}</p>

      <ul className="space-y-3">
        {quotes.map((quote) => {
          const expired = quote.effectiveStatus === "expired";
          const accepted = quote.effectiveStatus === "accepted";
          const declined = quote.effectiveStatus === "declined";
          const validUntil = formatDate(quote.expiresAt);
          const busy = busyId === quote.id;

          return (
            <li
              key={quote.id}
              data-testid={`portal-quote-${quote.id}`}
              className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                    {String(t("portal.quotes_ref")).replace(
                      "{{ref}}",
                      quote.id.slice(-8).toUpperCase()
                    )}
                  </p>
                  <p className="text-[18px] font-black text-slate-900">
                    {formatEur(quote.totalTtcCents)}{" "}
                    <span className="text-[12px] font-semibold text-slate-500">
                      {t("portal.quotes_total_ttc")}
                    </span>
                  </p>
                  {validUntil ? (
                    <p className="text-[12px] text-slate-500">
                      {String(t("portal.quotes_valid_until")).replace("{{date}}", validUntil)}
                    </p>
                  ) : null}
                </div>
                {accepted ? (
                  <span
                    data-testid={`portal-quote-status-${quote.id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {t("portal.quotes_accepted")}
                  </span>
                ) : null}
                {declined ? (
                  <span
                    data-testid={`portal-quote-status-${quote.id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {t("portal.quotes_declined")}
                  </span>
                ) : null}
                {expired ? (
                  <span
                    data-testid={`portal-quote-status-${quote.id}`}
                    className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800"
                  >
                    {t("portal.quotes_expired")}
                  </span>
                ) : null}
              </div>

              <ul className="space-y-1 text-[13px] text-slate-700">
                {quote.lines.map((line, idx) => (
                  <li key={idx} className="flex justify-between gap-2">
                    <span className="truncate">
                      {line.quantity}× {line.description}
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatEur(Math.round(line.quantity * line.unitPriceCents))}
                    </span>
                  </li>
                ))}
              </ul>

              {quote.canRespond ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    disabled={busy}
                    data-testid={`portal-quote-accept-${quote.id}`}
                    onClick={() => void respond(quote.id, true)}
                    className="flex-1 min-w-[120px] rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {t("portal.quotes_accept")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    data-testid={`portal-quote-decline-${quote.id}`}
                    onClick={() => void respond(quote.id, false)}
                    className="flex-1 min-w-[120px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {t("portal.quotes_decline")}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
