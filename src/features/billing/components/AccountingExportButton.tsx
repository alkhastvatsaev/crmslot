"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { downloadAccountingCsv } from "../exportAccountingCsv";
import type { Intervention } from "@/features/interventions/types";

interface Props {
  interventions: Intervention[];
  /** YYYY-MM format for filename e.g. "2024-03" */
  periodLabel?: string;
}

export default function AccountingExportButton({ interventions, periodLabel }: Props) {
  const [loading, setLoading] = useState(false);

  const billed = interventions.filter((iv) => (iv.billingLines?.length ?? 0) > 0);

  const handleExport = () => {
    if (billed.length === 0) {
      toast.error("Aucune intervention avec lignes de facturation.");
      return;
    }
    setLoading(true);
    try {
      const filename = periodLabel
        ? `export-comptable-${periodLabel}.csv`
        : "export-comptable.csv";
      downloadAccountingCsv(billed, filename);
      toast.success(`${billed.length} intervention(s) exportée(s)`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading || billed.length === 0}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
    >
      <Download className="h-4 w-4" />
      Export comptable CSV
      {billed.length > 0 && (
        <span className="rounded-full bg-slate-100 px-1.5 text-xs font-bold text-slate-500">
          {billed.length}
        </span>
      )}
    </button>
  );
}
