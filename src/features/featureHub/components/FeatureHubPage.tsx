"use client";

import { useMemo } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import CompanyStockAgentPanel from "@/features/featureHub/components/CompanyStockAgentPanel";
import CompanyStockCenterPanel from "@/features/featureHub/components/CompanyStockCenterPanel";
import CompanyStockOrdersRightRail from "@/features/featureHub/components/CompanyStockOrdersRightRail";
import CompanyStockProWorkspace from "@/features/featureHub/components/CompanyStockProWorkspace";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { computeCompanyStockMetrics } from "@/features/featureHub/companyStockMetrics";
import { useCompanyMaterialOrdersRecent } from "@/features/featureHub/hooks/useCompanyMaterialOrdersRecent";
import { useCompanyStockItems } from "@/features/featureHub/hooks/useCompanyStockItems";
import { useCompanySupplierOrdersRecent } from "@/features/featureHub/hooks/useCompanySupplierOrdersRecent";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import {
  DASHBOARD_DESKTOP_PANEL_GAP_CLASS,
  dashboardTripleSideOpaqueShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";

type Props = { slotIndex?: number };

const sideShell = `flex min-h-0 flex-1 flex-col ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const mainShell = `flex min-h-0 flex-1 flex-col scroll-mt-2 overflow-hidden p-4 ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/**
 * Page 7 — Matériel
 * Gauche = agent matériel · Centre = inventaire · Droite = suivi commandes
 */
export default function FeatureHubPage({ slotIndex = FEATURE_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const pager = useDashboardPagerOptional();
  const pageActive = pager == null || pager.pageIndex === slotIndex;
  const { companyId, phase: companyPhase } = resolveHubCompanyId(workspace);

  const { items, loading: stockLoading } = useCompanyStockItems(companyId || null);

  const {
    orders,
    loading: ordersLoading,
    dismissDemoOrder,
  } = useCompanyMaterialOrdersRecent(companyId || null);

  const { orders: supplierOrders, loading: supplierLoading } = useCompanySupplierOrdersRecent(
    companyId || null
  );
  const { interventions, loading: ivLoading } = useBackOfficeInterventions(companyId || null);

  const waitingMaterialJobs = useMemo(
    () => interventions.filter((iv) => iv.status === "waiting_material").length,
    [interventions]
  );

  const metrics = useMemo(
    () => computeCompanyStockMetrics(items, orders, supplierOrders, waitingMaterialJobs),
    [items, orders, supplierOrders, waitingMaterialJobs]
  );

  const loading = stockLoading || ordersLoading || supplierLoading || ivLoading;
  const showInventory = items.length > 0;

  const agentCtx = useMemo(
    () => ({ companyId: companyId || "", items, orders, metrics }),
    [companyId, items, orders, metrics]
  );

  const gate =
    companyPhase === "loading" ? (
      <div
        data-testid="company-stock-loading"
        className="flex min-h-0 flex-1 items-center justify-center px-6"
        aria-busy="true"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    ) : companyPhase === "missing" ? (
      <div
        data-testid="company-stock-gate"
        className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-[13px] text-amber-800"
      >
        {t("companyStock.company_required")}
      </div>
    ) : null;

  return (
    <AdaptiveTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("companyStock.aria.page")} ${humanPage} — ${t("companyStock.aria.left")}`}
      centerAriaLabel={`${t("companyStock.aria.page")} ${humanPage} — ${t("companyStock.aria.center")}`}
      rightAriaLabel={`${t("companyStock.aria.page")} ${humanPage} — ${t("companyStock.aria.right")}`}
      centerPadding={false}
      rightPadding={false}
      leftShellClassName={dashboardTripleSideOpaqueShellClass}
      left={
        <section className={sideShell}>
          <CompanyStockAgentPanel
            ctx={agentCtx}
            loading={loading}
            enabled={Boolean(companyId)}
            pageActive={pageActive}
          />
        </section>
      }
      center={
        <section className={mainShell}>
          {gate ??
            (showInventory ? (
              <CompanyStockCenterPanel
                items={items}
                orders={orders}
                category="all"
                loading={loading}
              />
            ) : companyId ? (
              <CompanyStockProWorkspace
                companyId={companyId}
                metrics={metrics}
                isPreviewCatalog={false}
              />
            ) : null)}
        </section>
      }
      right={
        <section className={sideShell}>
          {companyId ? <CompanyStockOrdersRightRail /> : null}
        </section>
      }
    />
  );
}
