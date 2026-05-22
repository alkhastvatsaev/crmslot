"use client";

import { useState } from "react";
import { Database, Loader2, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import CompanyStockPulseBar from "@/features/featureHub/components/CompanyStockPulseBar";
import { seedCompanyStockCatalog } from "@/features/featureHub/seedCompanyStockCatalog";
import { navigateToChatbotWithPrompt } from "@/features/featureHub/companyStockChatbot";
import type { CompanyStockDashboardMetrics } from "@/features/featureHub/companyStockMetrics";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

type Props = {
  companyId: string;
  metrics: CompanyStockDashboardMetrics;
  isPreviewCatalog: boolean;
  onSeeded?: () => void;
};

/** État vide — même langage visuel que l'inventaire actif. */
export default function CompanyStockProWorkspace({
  companyId,
  metrics,
  isPreviewCatalog,
  onSeeded,
}: Props) {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const n = await seedCompanyStockCatalog(companyId);
      toast.success(`${n} ${t("companyStock.seed_success")}`);
      onSeeded?.();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div
      data-testid="company-stock-pro-workspace"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
      style={outfit}
    >
      <CompanyStockPulseBar metrics={metrics} />

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[16px] border border-dashed border-slate-200/90 bg-white px-6 py-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-100/90 bg-teal-50/80 text-teal-700">
          <Package className="h-8 w-8" strokeWidth={1.5} aria-hidden />
        </div>
        <p className="mt-4 max-w-[240px] text-center text-[13px] font-semibold text-slate-800">
          {isPreviewCatalog ? t("companyStock.pro_preview_title") : t("companyStock.pro_empty_title")}
        </p>
        {isPreviewCatalog ? (
          <p
            className="mt-2 max-w-[260px] text-center text-[11px] text-slate-500"
            data-testid="company-stock-preview-banner"
          >
            {t("companyStock.pro_preview_short")}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="company-stock-seed-catalog"
          disabled={seeding}
          onClick={() => void handleSeed()}
          className="flex items-center justify-center gap-2 rounded-[16px] bg-slate-800 py-3.5 text-white shadow-sm hover:bg-slate-700 disabled:opacity-60"
          title={String(t("companyStock.seed_catalog"))}
        >
          {seeding ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Database className="h-4 w-4" aria-hidden />
          )}
          <span className="text-[12px] font-semibold">{t("companyStock.pro_cta_seed")}</span>
        </button>
        <button
          type="button"
          data-testid="company-stock-pro-chatbot"
          onClick={() =>
            navigateToChatbotWithPrompt(
              pager,
              String(t("companyStock.seed_chatbot_prompt")),
              "send",
            )
          }
          className="flex items-center justify-center gap-2 rounded-[16px] border border-slate-200/90 bg-white py-3.5 text-slate-700 hover:bg-slate-50"
          title={String(t("companyStock.seed_chatbot"))}
        >
          <Sparkles className="h-4 w-4 text-slate-500" aria-hidden />
          <span className="text-[12px] font-semibold">{t("companyStock.pro_cta_chat")}</span>
        </button>
      </div>
    </div>
  );
}
