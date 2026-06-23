"use client";

import {
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Lock,
  Plus,
  RefreshCw,
  SendHorizontal,
  Ticket,
  UserPlus,
} from "lucide-react";
import {
  navigateCompanyHub,
  COMPANY_HUB_ANCHOR_SMART_FORM,
} from "@/features/company/companyHubNavigation";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { CommissionDashboard } from "@/features/commissions/components/CommissionDashboard";
import ClientsCrmPanel from "@/features/clients/components/ClientsCrmPanel";
import RecurringContractsPanel from "@/features/clients/components/RecurringContractsPanel";
import StockManagementPanel from "@/features/materials/components/StockManagementPanel";
import MultiCompanyOverviewPanel from "@/features/company/components/MultiCompanyOverviewPanel";
import SiteQrCodePanel from "@/features/clients/components/SiteQrCodePanel";
import CompanyCatalogPanel from "@/features/catalog/components/CompanyCatalogPanel";
import CompanyKpiPanel from "@/features/dashboard/components/CompanyKpiPanel";
import {
  COMPANY_SPACE_GLASS_ROW,
  COMPANY_SPACE_ICON_RAIL,
  COMPANY_SPACE_INPUT_CLASS,
  COMPANY_SPACE_SELECT_CLASS,
} from "@/features/company/companySpacePanelChrome";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { useCompanySpacePanelState } from "@/features/company/hooks/useCompanySpacePanelState";

type CompanySpaceState = ReturnType<typeof useCompanySpacePanelState>;

export default function CompanySpacePanelContent(props: CompanySpaceState) {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const crmEnabled = useFeatureFlag("crmContacts");
  const lecotEnabled = useFeatureFlag("lecotProductSearch");

  const {
    memberships,
    activeCompanyId,
    setActiveCompanyId,
    isAdmin,
    companyName,
    setCompanyName,
    invitePhone,
    setInvitePhone,
    inviteDocId,
    setInviteDocId,
    busy,
    claimsPreview,
    invitesCount,
    activeCompanyLabel,
    createCompany,
    submitInvite,
    acceptInvite,
    syncClaims,
  } = props;

  return (
    <>
      {memberships.length > 1 && (
        <div className="shrink-0">
          <MultiCompanyOverviewPanel />
        </div>
      )}
      <div className={`${COMPANY_SPACE_GLASS_ROW} relative`}>
        <span className={COMPANY_SPACE_ICON_RAIL}>
          <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
        </span>
        <select
          data-testid="company-switcher"
          aria-label={t("company.aria.choose_org")}
          className={COMPANY_SPACE_SELECT_CLASS}
          value={activeCompanyId}
          onChange={(e) => setActiveCompanyId(e.target.value)}
          disabled={memberships.length === 0}
        >
          {memberships.length === 0 ? (
            <option value="">—</option>
          ) : (
            memberships.map((m) => (
              <option key={m.companyId} value={m.companyId}>
                {m.companyName}
              </option>
            ))
          )}
        </select>
      </div>

      {pager && memberships.length > 0 && activeCompanyId ? (
        <div className={COMPANY_SPACE_GLASS_ROW}>
          <span className={COMPANY_SPACE_ICON_RAIL}>
            <ClipboardList className="h-5 w-5" aria-hidden />
          </span>
          <button
            type="button"
            data-testid="company-open-intervention-form-btn"
            className="min-w-0 flex-1 rounded-[14px] border border-black/[0.06] bg-white/95 px-3 py-2 text-left text-sm font-bold text-black outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-slate-900/15"
            aria-label={t("company.aria.open_form")}
            onClick={() => navigateCompanyHub(pager, COMPANY_HUB_ANCHOR_SMART_FORM)}
          >
            {t("company.new_request")}
          </button>
        </div>
      ) : null}

      <div className={COMPANY_SPACE_GLASS_ROW}>
        <span className={COMPANY_SPACE_ICON_RAIL}>
          <Plus className="h-5 w-5" aria-hidden />
        </span>
        <input
          data-testid="company-name-input"
          type="text"
          aria-label={t("company.aria.org_name")}
          autoComplete="organization"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className={COMPANY_SPACE_INPUT_CLASS}
        />
        <button
          type="button"
          data-testid="company-create-btn"
          aria-label={t("company.aria.create_org")}
          disabled={busy || !companyName.trim()}
          onClick={() => void createCompany()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-35"
        >
          <Check className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className={COMPANY_SPACE_GLASS_ROW}>
        <span className={COMPANY_SPACE_ICON_RAIL}>
          <Ticket className="h-5 w-5" aria-hidden />
        </span>
        <input
          data-testid="accept-invite-input"
          type="text"
          aria-label={t("company.aria.invite_id")}
          value={inviteDocId}
          onChange={(e) => setInviteDocId(e.target.value)}
          className={COMPANY_SPACE_INPUT_CLASS}
        />
        <button
          type="button"
          data-testid="accept-invite-btn"
          aria-label={t("company.aria.accept_invite")}
          disabled={busy || !inviteDocId.trim()}
          onClick={() => void acceptInvite()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-35"
        >
          <Check className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {isAdmin ? (
        <div className={COMPANY_SPACE_GLASS_ROW}>
          <span className={`relative ${COMPANY_SPACE_ICON_RAIL}`}>
            <UserPlus className="h-5 w-5" aria-hidden />
            {invitesCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold tabular-nums text-white">
                {invitesCount > 9 ? "9+" : invitesCount}
              </span>
            ) : null}
          </span>
          <input
            type="text"
            inputMode="tel"
            data-testid="invite-phone-input"
            aria-label={t("company.aria.invite_contact")}
            autoComplete="tel"
            value={invitePhone}
            onChange={(e) => setInvitePhone(e.target.value)}
            className={COMPANY_SPACE_INPUT_CLASS}
          />
          <button
            type="button"
            data-testid="invite-submit-btn"
            aria-label={t("company.aria.send_invite")}
            disabled={busy || !invitePhone.trim() || !activeCompanyId}
            onClick={() => void submitInvite()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-35"
          >
            <SendHorizontal className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : null}

      {isAdmin ? (
        <>
          <div
            data-testid="company-billing-strip"
            className={`${COMPANY_SPACE_GLASS_ROW} border-amber-200/40 bg-amber-50/50`}
            aria-label={`${t("company.aria.billing_company")} ${activeCompanyLabel}`}
          >
            <span
              className={`${COMPANY_SPACE_ICON_RAIL} border-amber-200/60 bg-white text-amber-900`}
            >
              <CreditCard className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 text-[12px] font-medium text-amber-950/90">
              {t("company.billing_strip")}
            </div>
            <Lock className="h-4 w-4 shrink-0 text-amber-800/50" aria-hidden />
          </div>
          <div data-testid="company-commission-dashboard" className="min-h-0 shrink-0">
            <CommissionDashboard />
          </div>
        </>
      ) : null}

      {activeCompanyId ? (
        <div data-testid="company-kpi-panel-wrap" className="min-h-0 shrink-0">
          <CompanyKpiPanel />
        </div>
      ) : null}

      {activeCompanyId && crmEnabled ? (
        <div data-testid="company-crm-panel" className="min-h-0 shrink-0">
          <ClientsCrmPanel />
        </div>
      ) : null}

      {activeCompanyId ? (
        <div data-testid="company-recurring-contracts-panel" className="min-h-0 shrink-0">
          <RecurringContractsPanel />
        </div>
      ) : null}

      {activeCompanyId ? (
        <div data-testid="company-stock-management-panel" className="min-h-0 shrink-0">
          <StockManagementPanel />
        </div>
      ) : null}

      {activeCompanyId ? (
        <div data-testid="company-site-qr-panel" className="min-h-0 shrink-0">
          <SiteQrCodePanel companyId={activeCompanyId} siteName={activeCompanyLabel} />
        </div>
      ) : null}

      {activeCompanyId && lecotEnabled && isAdmin ? (
        <div data-testid="company-catalog-panel-wrap" className="min-h-0 shrink-0">
          <CompanyCatalogPanel />
        </div>
      ) : null}

      <div className="mt-auto flex shrink-0 justify-end pt-1">
        <button
          type="button"
          data-testid="sync-claims-btn"
          aria-label={t("company.aria.sync_token")}
          disabled={busy || memberships.length === 0}
          onClick={() => void syncClaims()}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] bg-white/95 text-slate-700 shadow-sm transition-colors hover:bg-white disabled:opacity-35"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {claimsPreview ? (
        <pre
          data-testid="claims-preview"
          className="max-h-20 overflow-auto rounded-[12px] border border-white/10 bg-slate-900/92 p-2 font-mono text-[10px] leading-snug text-emerald-100/95 custom-scrollbar"
        >
          {claimsPreview}
        </pre>
      ) : null}
    </>
  );
}
