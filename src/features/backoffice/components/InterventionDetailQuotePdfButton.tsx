"use client";

import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  interventionId: string;
  onDownloadQuotePdf: (id: string) => void;
};

export default function InterventionDetailQuotePdfButton({
  interventionId,
  onDownloadQuotePdf,
}: Props) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      data-testid="backoffice-download-quote-pdf"
      onClick={() => onDownloadQuotePdf(interventionId)}
      className="mt-2 w-full rounded-xl border border-slate-200 bg-white py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
    >
      {t("quote_pdf.download")}
    </button>
  );
}
