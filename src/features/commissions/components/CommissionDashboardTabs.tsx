"use client";

import type { useCommissionDashboardController } from "@/features/commissions/hooks/useCommissionDashboardController";

type View = ReturnType<typeof useCommissionDashboardController>;

export default function CommissionDashboardTabs({
  activeTab,
  setActiveTab,
  t,
}: Pick<View, "activeTab" | "setActiveTab" | "t">) {
  const tabClass = (tab: View["activeTab"]) =>
    `rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
      activeTab === tab
        ? "bg-white text-slate-800 shadow-sm"
        : "text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="mb-6 flex w-fit gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      <button type="button" onClick={() => setActiveTab("rules")} className={tabClass("rules")}>
        {t("commissions.dashboard.tab_rules")}
      </button>
      <button
        type="button"
        data-testid="commission-tab-manual"
        onClick={() => setActiveTab("manual")}
        className={tabClass("manual")}
      >
        {t("commissions.dashboard.tab_manual")}
      </button>
      <button
        type="button"
        data-testid="commission-tab-history"
        onClick={() => setActiveTab("history")}
        className={tabClass("history")}
      >
        {t("commissions.dashboard.tab_history")}
      </button>
    </div>
  );
}
