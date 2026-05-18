"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  intervention: Intervention;
  className?: string;
};

export default function InterventionPdfButton({ intervention, className }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { buildInterventionReportPdf } = await import(
        "@/features/interventions/buildInterventionReportPdf"
      );
      const bytes = buildInterventionReportPdf(intervention);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-intervention-${intervention.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      data-testid="intervention-pdf-btn"
      disabled={loading}
      onClick={() => void handleDownload()}
      className={
        className ??
        "flex items-center gap-2 rounded-[12px] border border-slate-100 px-3 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
      }
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {String(t("intervention_pdf.download"))}
    </button>
  );
}
