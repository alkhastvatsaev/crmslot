"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import { useRequestMobileHubRail } from "@/features/dashboard/MobileHubRailContext";
import { CASE_HUB_SLOT_INDEX } from "@/features/caseHub/caseHubConstants";
import CaseHubChoosePanel from "@/features/caseHub/components/CaseHubChoosePanel";
import CaseHubOverviewPanel from "@/features/caseHub/components/CaseHubOverviewPanel";
import CaseHubRightPanel from "@/features/caseHub/components/CaseHubRightPanel";
import {
  countForBucket,
  filterCaseInterventionsByBucket,
  sortCaseInterventionsByUrgency,
} from "@/features/caseHub/caseHubPatronMetrics";
import type { CaseHubBucket } from "@/features/caseHub/caseHubTypes";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import {
  DASHBOARD_DESKTOP_PANEL_GAP_CLASS,
  dashboardTripleSideOpaqueShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useHubPageActive } from "@/features/dashboard/hooks/useHubPageActive";

type Props = { slotIndex?: number };

const sideShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const mainShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Hub dossiers — pipeline patron gauche→droite : 1. Situation · 2. Choisir · 3. Agir. */
export default function CaseHubPage({ slotIndex = CASE_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const pageActive = useHubPageActive(slotIndex);
  const { companyId, phase: companyPhase } = resolveHubCompanyId(workspace);
  const { interventions, loading } = useBackOfficeInterventions(
    pageActive ? companyId || null : null
  );

  const requestMobileHubRail = useRequestMobileHubRail();
  const [bucket, setBucket] = useState<CaseHubBucket>("to_assign");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bucketAutoPicked, setBucketAutoPicked] = useState(false);

  const handleBucketChange = useCallback(
    (next: CaseHubBucket) => {
      setBucket(next);
      requestMobileHubRail("center");
    },
    [requestMobileHubRail]
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      requestMobileHubRail("right");
    },
    [requestMobileHubRail]
  );

  const sorted = useMemo(() => sortCaseInterventionsByUrgency(interventions), [interventions]);
  const bucketCounts = useMemo<Record<CaseHubBucket, number>>(
    () => ({
      to_assign: countForBucket(sorted, "to_assign"),
      in_progress: countForBucket(sorted, "in_progress"),
      waiting: countForBucket(sorted, "waiting"),
      to_invoice: countForBucket(sorted, "to_invoice"),
      invoiced: countForBucket(sorted, "invoiced"),
      paid: countForBucket(sorted, "paid"),
      cancelled: countForBucket(sorted, "cancelled"),
      all: sorted.length,
    }),
    [sorted]
  );
  const filtered = useMemo(() => filterCaseInterventionsByBucket(sorted, bucket), [sorted, bucket]);

  useEffect(() => {
    if (bucketAutoPicked || loading) return;
    const priority: CaseHubBucket[] = [
      "to_assign",
      "waiting",
      "to_invoice",
      "in_progress",
      "invoiced",
      "cancelled",
    ];
    const firstNonEmpty = priority.find((b) => bucketCounts[b] > 0);
    if (firstNonEmpty && firstNonEmpty !== bucket) setBucket(firstNonEmpty);
    setBucketAutoPicked(true);
  }, [bucketAutoPicked, bucket, bucketCounts, loading]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((iv) => iv.id === selectedId)) {
      setSelectedId(filtered[0]!.id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((iv) => iv.id === selectedId) ?? null;

  const gate =
    companyPhase === "loading" ? (
      <div
        data-testid="case-hub-loading"
        className="flex min-h-0 flex-1 items-center justify-center"
        aria-busy="true"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    ) : companyPhase === "missing" ? (
      <div
        data-testid="case-hub-gate"
        className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-[13px] text-amber-800"
      >
        {t("caseHub.company_required")}
      </div>
    ) : null;

  return (
    <AdaptiveTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("caseHub.aria.page")} ${humanPage} — ${t("caseHub.aria.left")}`}
      centerAriaLabel={`${t("caseHub.aria.page")} ${humanPage} — ${t("caseHub.aria.center")}`}
      rightAriaLabel={`${t("caseHub.aria.page")} ${humanPage} — ${t("caseHub.aria.right")}`}
      mobileLeftLabel={String(t("caseHub.mobile.rail_left"))}
      mobileCenterLabel={String(t("caseHub.mobile.rail_center"))}
      mobileRightLabel={String(t("caseHub.mobile.rail_right"))}
      centerPadding={false}
      rightPadding={false}
      mobileInitialRail="left"
      leftShellClassName={dashboardTripleSideOpaqueShellClass}
      left={
        <section className={sideShell} data-testid="case-hub-page">
          {gate}
          {companyId && !gate ? (
            <CaseHubOverviewPanel
              bucket={bucket}
              counts={bucketCounts}
              onBucketChange={handleBucketChange}
            />
          ) : null}
        </section>
      }
      center={
        <section className={mainShell}>
          {gate}
          {companyId && !gate ? (
            <CaseHubChoosePanel
              interventions={filtered}
              loading={loading}
              selectedId={selectedId}
              onSelect={handleSelect}
              bucket={bucket}
            />
          ) : null}
        </section>
      }
      right={
        <section className={mainShell}>
          {companyId && !gate ? (
            <CaseHubRightPanel intervention={selected} peerInterventions={sorted} />
          ) : null}
        </section>
      }
    />
  );
}
