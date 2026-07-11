"use client";

import type { ReactNode } from "react";
import { Building2, Loader2, LogOut, Mail, Pencil, Phone, Save, Trash2, User } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";
import { resolveStaffProfileRoleKey } from "@/features/auth/staffAccountRoleDisplay";
import AccountSubscriptionRow from "@/features/subscriptions/components/AccountSubscriptionRow";
import DashboardLanguageSelector from "@/features/dashboard/components/DashboardLanguageSelector";
import MobileCentralPanelFrame from "@/features/dashboard/components/MobileCentralPanelFrame";
import {
  MOBILE_HUB_PANEL_INNER_CLASS,
  MOBILE_HUB_PANEL_INNER_PADDED_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import {
  dashboardTripleCenterShellClass,
  DASHBOARD_PANEL_SHADOW_HOVER_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import HubButton from "@/core/ui/hub/HubButton";
import HubDetailHeader from "@/core/ui/hub/HubDetailHeader";
import { HUB_RADIUS, HUB_SURFACE, HUB_TYPE } from "@/core/ui/hub";
import { cn } from "@/lib/utils";

type Props = {
  onClose: () => void;
  variant?: "mobile" | "desktop";
};

const accountSectionCardClass = cn(
  "flex flex-col gap-2 rounded-[20px] border border-black/[0.05] bg-white/70 p-2.5",
  "shadow-[0_12px_32px_-24px_rgba(15,23,42,0.18)]"
);

const accountIconRailClass = cn(
  "flex h-9 w-9 shrink-0 items-center justify-center text-slate-500",
  HUB_RADIUS.icon,
  "bg-white/95 shadow-[0_3px_10px_-5px_rgba(15,23,42,0.1)]"
);

const accountFieldRowClass = cn("flex items-center gap-2.5", HUB_SURFACE.fieldRow);

const accountCompactButtonClass =
  "min-h-[36px] rounded-full px-3.5 text-[13px] font-semibold tracking-tight";

const accountInputClass = cn(
  "min-w-0 flex-1 border border-black/[0.06] bg-transparent px-2.5 py-2 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900/15",
  HUB_RADIUS.input
);

function CompactInfoRow({
  icon,
  value,
  testId,
  ariaLabel,
}: {
  icon: ReactNode;
  value: string;
  testId: string;
  ariaLabel: string;
}) {
  return (
    <div className={accountFieldRowClass} aria-label={ariaLabel}>
      <span className={accountIconRailClass}>{icon}</span>
      <p
        data-testid={testId}
        className={cn("min-w-0 flex-1 truncate", HUB_TYPE.body, "text-slate-900")}
      >
        {value.trim() ? value : "—"}
      </p>
    </div>
  );
}

function EditableField({
  icon,
  label,
  testId,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  icon: ReactNode;
  label: string;
  testId: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
  placeholder?: string;
}) {
  return (
    <div className={accountFieldRowClass}>
      <span className={accountIconRailClass}>{icon}</span>
      <input
        id={testId}
        type={type}
        data-testid={testId}
        value={value}
        placeholder={placeholder ?? label}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className={cn(accountInputClass, "w-full")}
      />
    </div>
  );
}

function AccountProfileHero({
  firstName,
  lastName,
  email,
  roleKey,
}: {
  firstName: string;
  lastName: string;
  email: string;
  roleKey: string;
}) {
  const { t } = useTranslation();
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const headline = displayName || email.trim() || "—";
  const initial = (firstName || email || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div className={cn(accountSectionCardClass, "gap-2.5")}>
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center text-base font-bold text-white",
            HUB_RADIUS.icon,
            "bg-slate-900 shadow-[0_6px_16px_-8px_rgba(15,23,42,0.45)]"
          )}
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-[17px] font-semibold leading-tight text-slate-900")}>
            {headline}
          </p>
          {displayName && email.trim() ? (
            <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500">{email}</p>
          ) : null}
          <span
            data-testid="dashboard-account-role-badge"
            className="mt-1.5 inline-flex rounded-md border border-[#CCE3FF] bg-[#E5F1FF] px-1.5 py-px text-[8px] font-extrabold uppercase tracking-widest text-[#007AFF]"
          >
            {t(`profiles.roles.${roleKey}`)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardAccountPanel({ onClose, variant = "mobile" }: Props) {
  const { t } = useTranslation();
  const {
    fields,
    draft,
    editing,
    ready,
    signingOut,
    saving,
    deleting,
    startEditing,
    cancelEditing,
    updateDraft,
    handleSave,
    handleDeleteAccount,
    handleSignOut,
  } = useCrmStaffAccountPanel();
  const isDesktop = variant === "desktop";
  const displayRoleKey = resolveStaffProfileRoleKey(
    editing ? draft.accountRole : fields.accountRole
  );
  const showPhoneRow = Boolean(fields.phone?.trim());
  const showCompanyRow = Boolean(fields.companyName?.trim());

  const body = (
    <div
      data-testid="dashboard-account-panel"
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        isDesktop ? "dashboard-account-panel-inner" : "mobile-account-panel-inner"
      )}
    >
      <HubDetailHeader
        title={t("staff_account.title")}
        onBack={onClose}
        backLabel={String(t("common.close"))}
        backTestId="dashboard-account-close"
        className="shrink-0 border-b-0 px-0 py-2"
      />

      <DashboardLanguageSelector variant={isDesktop ? "desktop" : "mobile"} />

      {!ready ? (
        <div
          data-testid="dashboard-account-loading"
          className="flex flex-1 items-center justify-center py-10"
        >
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            <AccountProfileHero
              firstName={editing ? draft.firstName : fields.firstName}
              lastName={editing ? draft.lastName : fields.lastName}
              email={editing ? draft.email : fields.email}
              roleKey={displayRoleKey}
            />

            {editing ? (
              <div className={accountSectionCardClass}>
                <EditableField
                  icon={<User className="h-4 w-4 opacity-70" aria-hidden />}
                  label={String(t("staff_account.first_name"))}
                  testId="dashboard-account-first-name-input"
                  value={draft.firstName}
                  onChange={(value) => updateDraft({ firstName: value })}
                />
                <EditableField
                  icon={<User className="h-4 w-4 opacity-70" aria-hidden />}
                  label={String(t("staff_account.last_name"))}
                  testId="dashboard-account-last-name-input"
                  value={draft.lastName}
                  onChange={(value) => updateDraft({ lastName: value })}
                />
                <EditableField
                  icon={<Mail className="h-4 w-4 opacity-70" aria-hidden />}
                  label={String(t("staff_account.email"))}
                  testId="dashboard-account-email-input"
                  type="email"
                  value={draft.email}
                  onChange={(value) => updateDraft({ email: value })}
                />
                <EditableField
                  icon={<Phone className="h-4 w-4 opacity-70" aria-hidden />}
                  label={String(t("staff_account.phone"))}
                  testId="dashboard-account-phone-input"
                  type="tel"
                  value={draft.phone}
                  onChange={(value) => updateDraft({ phone: value })}
                />
              </div>
            ) : showPhoneRow || showCompanyRow ? (
              <div className={accountSectionCardClass}>
                {showPhoneRow ? (
                  <CompactInfoRow
                    icon={<Phone className="h-4 w-4 opacity-70" aria-hidden />}
                    value={fields.phone}
                    testId="dashboard-account-phone"
                    ariaLabel={String(t("staff_account.phone"))}
                  />
                ) : null}
                {showCompanyRow ? (
                  <CompactInfoRow
                    icon={<Building2 className="h-4 w-4 opacity-70" aria-hidden />}
                    value={fields.companyName}
                    testId="dashboard-account-company"
                    ariaLabel={String(t("staff_account.company"))}
                  />
                ) : null}
              </div>
            ) : null}

            {!editing && fields.companyId ? (
              <AccountSubscriptionRow companyId={fields.companyId} />
            ) : null}
          </div>

          <div className="account-panel-footer shrink-0">
            {editing ? (
              <>
                <div className="account-panel-footer-row">
                  <HubButton
                    type="button"
                    data-testid="dashboard-account-save"
                    variant="primary"
                    emphasis
                    disabled={saving || deleting}
                    className={accountCompactButtonClass}
                    onClick={() => void handleSave()}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Save className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    )}
                    {t("staff_account.save")}
                  </HubButton>
                  <HubButton
                    type="button"
                    data-testid="dashboard-account-cancel-edit"
                    variant="secondary"
                    disabled={saving || deleting}
                    className={accountCompactButtonClass}
                    onClick={cancelEditing}
                  >
                    {t("staff_account.cancel")}
                  </HubButton>
                </div>
                <button
                  type="button"
                  data-testid="dashboard-account-delete"
                  disabled={saving || deleting}
                  onClick={() => void handleDeleteAccount()}
                  className="mx-auto inline-flex min-h-[32px] items-center justify-center gap-1.5 px-2 text-[12px] font-semibold text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  {t("staff_account.delete_account")}
                </button>
              </>
            ) : (
              <div className="account-panel-footer-row">
                <HubButton
                  type="button"
                  data-testid="dashboard-account-edit"
                  variant="primary"
                  emphasis
                  className={accountCompactButtonClass}
                  onClick={startEditing}
                >
                  <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {t("staff_account.edit")}
                </HubButton>
                <HubButton
                  type="button"
                  data-testid="dashboard-account-signout"
                  variant="secondary"
                  disabled={signingOut || saving || deleting}
                  className={accountCompactButtonClass}
                  onClick={() => void handleSignOut()}
                >
                  {signingOut ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  {t("auth.signout")}
                </HubButton>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <section
        className={cn(
          "dashboard-account-panel",
          dashboardTripleCenterShellClass,
          DASHBOARD_PANEL_SHADOW_HOVER_CLASS,
          "dashboard-account-panel--desktop"
        )}
        data-variant={variant}
        aria-label={String(t("staff_account.title"))}
      >
        {body}
      </section>
    );
  }

  return (
    <MobileCentralPanelFrame
      layoutTestId="dashboard-account-panel-layout"
      testId="dashboard-account-panel-frame"
      sectionClassName={cn("dashboard-account-panel", "mobile-account-panel")}
      innerClassName={cn(MOBILE_HUB_PANEL_INNER_CLASS, MOBILE_HUB_PANEL_INNER_PADDED_CLASS)}
      sectionDataVariant={variant}
      sectionProps={{ "aria-label": String(t("staff_account.title")) }}
    >
      {body}
    </MobileCentralPanelFrame>
  );
}
