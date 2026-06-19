"use client";

import { useEffect, useMemo, useState } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import { COMMISSIONS_HUB_SLOT_INDEX } from "@/features/commissionsHub/commissionsHubConstants";
import CommissionsHubTechnicianGrid from "@/features/commissionsHub/components/CommissionsHubTechnicianGrid";
import CommissionsHubRulesGrid from "@/features/commissionsHub/components/CommissionsHubRulesGrid";
import CommissionsHubRightPanel from "@/features/commissionsHub/components/CommissionsHubRightPanel";
import { useCommissionsHubData } from "@/features/commissionsHub/hooks/useCommissionsHubData";
import {
  buildPatronCommissionKpis,
  buildPatronTechnicianRows,
  findCompanyGroupRule,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";
import type { CommissionsHubSelection } from "@/features/commissionsHub/commissionsHubTypes";
import { formatCommissionValue } from "@/features/commissionsHub/commissionsHubFormat";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import { useTechnicians } from "@/features/technicians/hooks";
import {
  DASHBOARD_DESKTOP_PANEL_GAP_CLASS,
  dashboardTripleSideOpaqueShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { PatronHubChipRow, PatronHubGuide } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = { slotIndex?: number };

type CommissionsView = "team" | "rules";

const sideShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const mainShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

function formatEur(cents: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Hub commissions — une info, une liste, un détail. */
export default function CommissionsHubPage({ slotIndex = COMMISSIONS_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const { companyId, phase: companyPhase } = resolveHubCompanyId(workspace);
  const { technicians } = useTechnicians();

  const [view, setView] = useState<CommissionsView>("team");
  const [selection, setSelection] = useState<CommissionsHubSelection>({ kind: "none" });

  const {
    rules,
    interventions,
    manualEntries,
    rulesLoading,
    interventionsLoading,
    manualLoading,
    saving,
    saveRule,
    removeRule,
    saveManualEntry,
  } = useCommissionsHubData(companyId || null);

  const patronKpis = useMemo(
    () => buildPatronCommissionKpis({ interventions, manualEntries, rules }),
    [interventions, manualEntries, rules]
  );

  const technicianRows = useMemo(() => {
    if (!companyId) return [];
    return buildPatronTechnicianRows({
      interventions,
      manualEntries,
      rules,
      companyId,
      technicians,
    });
  }, [companyId, interventions, manualEntries, rules, technicians]);

  const companyGroupRule = useMemo(
    () => (companyId ? findCompanyGroupRule(rules, companyId) : null),
    [rules, companyId]
  );

  useEffect(() => {
    setSelection({ kind: "none" });
  }, [view]);

  const openCompanyRule = () => {
    setView("rules");
    if (companyGroupRule) {
      setSelection({ kind: "rule", id: companyGroupRule.id });
    } else {
      setSelection({ kind: "new-rule" });
    }
  };

  const gate =
    companyPhase === "loading" ? (
      <div
        data-testid="commissions-hub-loading"
        className="flex min-h-0 flex-1 items-center justify-center"
        aria-busy="true"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    ) : companyPhase === "missing" ? (
      <div
        data-testid="commissions-hub-gate"
        className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-[13px] text-amber-800"
      >
        {t("commissionsHub.company_required")}
      </div>
    ) : null;

  const selectedRuleId = selection.kind === "rule" ? selection.id : null;
  const selectedTechUid = selection.kind === "technician" ? selection.uid : null;
  const teamLoading = interventionsLoading || rulesLoading || manualLoading;
  const mode = view === "team" ? "team" : "rules";

  const ruleFooterLabel = companyGroupRule
    ? t("commissionsHub.company_rule.applies_all", {
        value: formatCommissionValue(companyGroupRule.valueType, companyGroupRule.value),
      })
    : t("commissionsHub.company_rule.empty");

  return (
    <AdaptiveTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("commissionsHub.aria.page")} ${humanPage} — ${t("commissionsHub.aria.left")}`}
      centerAriaLabel={`${t("commissionsHub.aria.page")} ${humanPage} — ${t("commissionsHub.aria.center")}`}
      rightAriaLabel={`${t("commissionsHub.aria.page")} ${humanPage} — ${t("commissionsHub.aria.right")}`}
      centerPadding={false}
      rightPadding={false}
      leftShellClassName={dashboardTripleSideOpaqueShellClass}
      left={
        <section className={sideShell} data-testid="commissions-hub-page">
          {gate}
          {companyId && !gate ? (
            <>
              <PatronHubGuide
                value={formatEur(patronKpis.monthTotalCents)}
                label={t("commissionsHub.guide.value_label")}
                hint={t("commissionsHub.guide.hint")}
                valueTestId="commissions-hub-kpi-total"
                rootTestId="commissions-hub-kpi-strip"
                footer={
                  <button
                    type="button"
                    data-testid="commissions-hub-company-rule-hero"
                    onClick={openCompanyRule}
                    className="mx-auto block w-full max-w-[240px] rounded-2xl border border-sky-200/80 bg-sky-50/90 px-3 py-2.5 text-center text-[13px] font-medium text-sky-900 transition hover:bg-sky-50"
                  >
                    {ruleFooterLabel}
                  </button>
                }
              />
              <PatronHubChipRow
                testId="commissions-hub-view-chips"
                value={view}
                onChange={(id) => setView(id as CommissionsView)}
                options={[
                  {
                    id: "team",
                    label: t("commissionsHub.guide.chip_team"),
                    testId: "commissions-hub-mode-team",
                  },
                  {
                    id: "rules",
                    label: t("commissionsHub.guide.chip_rules"),
                    testId: "commissions-hub-mode-rules",
                  },
                ]}
              />
            </>
          ) : null}
        </section>
      }
      center={
        <section className={mainShell}>
          {gate}
          {companyId && !gate ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {view === "team" ? (
                <CommissionsHubTechnicianGrid
                  rows={technicianRows}
                  loading={teamLoading}
                  selectedUid={selectedTechUid}
                  onSelect={(uid) => setSelection({ kind: "technician", uid })}
                />
              ) : (
                <CommissionsHubRulesGrid
                  rules={rules}
                  levelFilter="all"
                  loading={rulesLoading}
                  selectedRuleId={selectedRuleId}
                  creating={selection.kind === "new-rule"}
                  onSelectRule={(id) => setSelection({ kind: "rule", id })}
                  onStartCreate={() => setSelection({ kind: "new-rule" })}
                />
              )}
            </div>
          ) : null}
        </section>
      }
      right={
        <section className={mainShell}>
          {companyId && !gate ? (
            <CommissionsHubRightPanel
              companyId={companyId}
              mode={mode}
              selection={selection}
              rules={rules}
              manualEntries={manualEntries}
              technicianRows={technicianRows}
              saving={saving}
              onSelectionChange={setSelection}
              onModeChange={(m) => setView(m === "team" ? "team" : "rules")}
              onSaveRule={saveRule}
              onDeleteRule={removeRule}
              onSaveManual={saveManualEntry}
            />
          ) : null}
        </section>
      }
    />
  );
}
