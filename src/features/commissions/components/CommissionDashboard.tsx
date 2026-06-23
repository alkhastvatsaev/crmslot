"use client";

import CommissionDashboardManualTab from "@/features/commissions/components/CommissionDashboardManualTab";
import CommissionDashboardRulesTab from "@/features/commissions/components/CommissionDashboardRulesTab";
import CommissionDashboardTabs from "@/features/commissions/components/CommissionDashboardTabs";
import CommissionHistoryPanel from "@/features/commissions/components/CommissionHistoryPanel";
import { useCommissionDashboardController } from "@/features/commissions/hooks/useCommissionDashboardController";

export const CommissionDashboard: React.FC = () => {
  const view = useCommissionDashboardController();

  return (
    <div
      data-testid="commission-dashboard"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {view.t("commissions.dashboard.title")}
          </h2>
          <p className="text-sm text-slate-500">{view.t("commissions.dashboard.subtitle")}</p>
        </div>
        {view.activeTab === "rules" ? (
          <button
            type="button"
            data-testid="commission-add-toggle"
            onClick={view.toggleAddRule}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            {view.isAdding ? view.t("common.cancel") : view.t("commissions.dashboard.add_rule")}
          </button>
        ) : null}
      </div>

      <CommissionDashboardTabs
        activeTab={view.activeTab}
        setActiveTab={view.setActiveTab}
        t={view.t}
      />

      {view.activeTab === "rules" ? <CommissionDashboardRulesTab view={view} /> : null}
      {view.activeTab === "manual" ? <CommissionDashboardManualTab view={view} /> : null}
      {view.activeTab === "history" ? <CommissionHistoryPanel companyId={view.companyId} /> : null}
    </div>
  );
};
