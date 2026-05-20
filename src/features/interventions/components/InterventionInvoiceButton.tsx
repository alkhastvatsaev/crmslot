"use client";

import { FileText, Loader2 } from "lucide-react";
import {
  hasDownloadableInvoice,
  isAwaitingAutoInvoice,
  isInvoiceChecklistComplete,
} from "@/features/interventions/invoiceEligibility";
import type { Intervention } from "@/features/interventions/types";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  /** Données Firestore live (peut être null le temps du premier snapshot). */
  iv: Intervention | null;
  /** Après envoi du wizard de fin, la checklist est complète côté métier avant le snapshot. */
  optimisticChecklistComplete?: boolean;
  /** Variante visuelle */
  variant?: "finishSuccess" | "detailDrawer";
};

/**
 * Facture PDF générée automatiquement par Cloud Function lorsque la checklist est complète.
 * Bouton désactivé + tooltip tant que photos/signature manquent ; vert lorsque prêt ou téléchargeable.
 */
export default function InterventionInvoiceButton({ iv, optimisticChecklistComplete, variant = "detailDrawer" }: Props) {
  const { t } = useTranslation();
  const checklistReady = optimisticChecklistComplete || isInvoiceChecklistComplete(iv);
  const downloadable = hasDownloadableInvoice(iv);
  const pendingCloud =
    (optimisticChecklistComplete && !iv) ||
    isAwaitingAutoInvoice(iv) ||
    (checklistReady && iv?.status === "done" && !iv?.invoicePdfUrl);

  const wide = variant === "finishSuccess";
  const btnTestId =
    variant === "finishSuccess" ? "finish-job-invoice-btn" : "intervention-invoice-generate-btn";

  if (downloadable && iv?.invoicePdfUrl) {
    return (
      <a
        href={iv.invoicePdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={variant === "finishSuccess" ? "finish-job-invoice-btn" : "intervention-invoice-download"}
        className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] bg-emerald-600 px-4 text-[15px] font-bold text-white shadow-lg transition hover:bg-emerald-700 ${wide ? "w-full max-w-sm" : "w-full"}`}
      >
        <FileText className="h-5 w-5 shrink-0" aria-hidden />
        {t("invoice.download_pdf")}
      </a>
    );
  }

  const disabled = !checklistReady || pendingCloud;
  const showSpinner = pendingCloud && checklistReady;

  const label = !checklistReady
    ? t("invoice.generate")
    : pendingCloud
      ? t("invoice.generating")
      : t("invoice.generate");

  return (
    <button
      type="button"
      data-testid={btnTestId}
      disabled={disabled}
      title={!checklistReady ? t("invoice.complete_checklist_first") : undefined}
      className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] px-4 text-[15px] font-bold shadow-lg transition ${
        checklistReady && !pendingCloud
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : checklistReady && pendingCloud
            ? "cursor-not-allowed bg-emerald-600/85 text-white opacity-95"
            : "cursor-not-allowed bg-slate-200 text-slate-500 opacity-80"
      } ${wide ? "w-full max-w-sm" : "w-full"}`}
    >
      {showSpinner ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden /> : <FileText className="h-5 w-5 shrink-0" aria-hidden />}
      {label}
    </button>
  );
}
