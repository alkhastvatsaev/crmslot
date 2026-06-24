"use client";

import type { ReactNode } from "react";
import {
  Building2,
  ChevronDown,
  Loader2,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Save,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";
import type { CompanyRole } from "@/features/company";
import {
  resolveStaffProfileRoleKey,
  STAFF_ACCOUNT_ROLE_OPTIONS,
  staffAccountRoleOptionLabelKey,
} from "@/features/auth/staffAccountRoleDisplay";
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
  "flex flex-col gap-2.5 rounded-[24px] border border-black/[0.05] bg-white/70 p-3",
  "shadow-[0_18px_44px_-28px_rgba(15,23,42,0.2)]"
);

const accountIconRailClass = cn(
  "flex h-10 w-10 shrink-0 items-center justify-center text-slate-500",
  HUB_RADIUS.icon,
  "bg-white/95 shadow-[0_4px_14px_-6px_rgba(15,23,42,0.1)]"
);

const accountFieldRowClass = cn("flex items-center gap-3", HUB_SURFACE.fieldRow);

const accountInputClass = cn(
  "min-w-0 flex-1 border border-black/[0.06] bg-transparent px-3 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900/15",
  HUB_RADIUS.input
);

const accountSelectClass = cn(
  accountInputClass,
  "appearance-none pr-9",
  "bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat"
);

function ReadOnlyField({
  icon,
  label,
  value,
  testId,
  valueNode,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  testId: string;
  valueNode?: ReactNode;
}) {
  return (
    <div className={accountFieldRowClass}>
      <span className={accountIconRailClass}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={HUB_TYPE.eyebrow}>{label}</p>
        {valueNode ?? (
          <p data-testid={testId} className={cn("truncate", HUB_TYPE.body, "text-slate-900")}>
            {value?.trim() ? value : "—"}
          </p>
        )}
      </div>
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
      <div className="min-w-0 flex-1">
        <label className={HUB_TYPE.eyebrow} htmlFor={testId}>
          {label}
        </label>
        <input
          id={testId}
          type={type}
          data-testid={testId}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(accountInputClass, "mt-0.5 w-full")}
        />
      </div>
    </div>
  );
}

function SelectField({
  icon,
  label,
  testId,
  value,
  onChange,
  children,
}: {
  icon: ReactNode;
  label: string;
  testId: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className={accountFieldRowClass}>
      <span className={accountIconRailClass}>{icon}</span>
      <div className="min-w-0 flex-1">
        <label className={HUB_TYPE.eyebrow} htmlFor={testId}>
          {label}
        </label>
        <div className="relative mt-0.5">
          <select
            id={testId}
            data-testid={testId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(accountSelectClass, "w-full")}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
        </div>
      </div>
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
    <div className={cn(accountSectionCardClass, "gap-3")}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center text-lg font-bold text-white",
            HUB_RADIUS.icon,
            "bg-slate-900 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.45)]"
          )}
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate", HUB_TYPE.titleLg)}>{headline}</p>
          {displayName && email.trim() ? (
            <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">{email}</p>
          ) : null}
          <span
            data-testid="dashboard-account-role-badge"
            className="mt-2 inline-flex rounded-md border border-[#CCE3FF] bg-[#E5F1FF] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-[#007AFF]"
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
    memberships,
    editing,
    ready,
    signingOut,
    saving,
    deleting,
    startEditing,
    cancelEditing,
    updateDraft,
    handleCompanyChange,
    handleSave,
    handleDeleteAccount,
    handleSignOut,
  } = useCrmStaffAccountPanel();
  const isDesktop = variant === "desktop";
  const displayRoleKey = resolveStaffProfileRoleKey(editing ? draft.role : fields.roleLabel);
  const roleLabel = String(t(`profiles.roles.${displayRoleKey}`));

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
        className="shrink-0 border-b-0 px-0 py-3"
      />

      {!ready ? (
        <div
          data-testid="dashboard-account-loading"
          className="flex flex-1 items-center justify-center py-10"
        >
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            <AccountProfileHero
              firstName={editing ? draft.firstName : fields.firstName}
              lastName={editing ? draft.lastName : fields.lastName}
              email={editing ? draft.email : fields.email}
              roleKey={displayRoleKey}
            />

            <div className={accountSectionCardClass}>
              <p className={cn("px-1", HUB_TYPE.eyebrow)}>{t("staff_account.subtitle")}</p>

              {editing ? (
                <>
                  <EditableField
                    icon={<User className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.first_name"))}
                    testId="dashboard-account-first-name-input"
                    value={draft.firstName}
                    onChange={(value) => updateDraft({ firstName: value })}
                    placeholder={String(t("staff_account.first_name"))}
                  />
                  <EditableField
                    icon={<User className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.last_name"))}
                    testId="dashboard-account-last-name-input"
                    value={draft.lastName}
                    onChange={(value) => updateDraft({ lastName: value })}
                    placeholder={String(t("staff_account.last_name"))}
                  />
                  <EditableField
                    icon={<Mail className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.email"))}
                    testId="dashboard-account-email-input"
                    type="email"
                    value={draft.email}
                    onChange={(value) => updateDraft({ email: value })}
                    placeholder={String(t("staff_account.email"))}
                  />
                  <EditableField
                    icon={<Phone className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.phone"))}
                    testId="dashboard-account-phone-input"
                    type="tel"
                    value={draft.phone}
                    onChange={(value) => updateDraft({ phone: value })}
                    placeholder={String(t("staff_account.phone"))}
                  />
                  <SelectField
                    icon={<Building2 className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.company"))}
                    testId="dashboard-account-company-select"
                    value={draft.companyId}
                    onChange={handleCompanyChange}
                  >
                    {memberships.length === 0 ? (
                      <option value="">{fields.companyName}</option>
                    ) : (
                      memberships.map((membership) => (
                        <option key={membership.companyId} value={membership.companyId}>
                          {membership.companyName}
                        </option>
                      ))
                    )}
                  </SelectField>
                  <SelectField
                    icon={<Shield className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.role"))}
                    testId="dashboard-account-role-select"
                    value={draft.role}
                    onChange={(value) => updateDraft({ role: value as CompanyRole })}
                  >
                    {STAFF_ACCOUNT_ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {String(t(staffAccountRoleOptionLabelKey(role)))}
                      </option>
                    ))}
                  </SelectField>
                </>
              ) : (
                <>
                  <ReadOnlyField
                    icon={<User className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.first_name"))}
                    value={fields.firstName}
                    testId="dashboard-account-first-name"
                  />
                  <ReadOnlyField
                    icon={<User className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.last_name"))}
                    value={fields.lastName}
                    testId="dashboard-account-last-name"
                  />
                  <ReadOnlyField
                    icon={<Mail className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.email"))}
                    value={fields.email}
                    testId="dashboard-account-email"
                  />
                  <ReadOnlyField
                    icon={<Phone className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.phone"))}
                    value={fields.phone}
                    testId="dashboard-account-phone"
                  />
                  <ReadOnlyField
                    icon={<Building2 className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.company"))}
                    value={fields.companyName}
                    testId="dashboard-account-company"
                  />
                  <ReadOnlyField
                    icon={<Shield className="h-5 w-5 opacity-70" aria-hidden />}
                    label={String(t("staff_account.role"))}
                    testId="dashboard-account-role"
                    valueNode={
                      <span
                        data-testid="dashboard-account-role"
                        className="inline-flex rounded-md border border-[#CCE3FF] bg-[#E5F1FF] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#007AFF]"
                      >
                        {roleLabel}
                      </span>
                    }
                  />
                </>
              )}
            </div>
          </div>

          <div className="account-panel-footer shrink-0">
            {editing ? (
              <>
                <HubButton
                  type="button"
                  data-testid="dashboard-account-save"
                  variant="primary"
                  fullWidth
                  disabled={saving || deleting}
                  onClick={() => void handleSave()}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  {t("staff_account.save")}
                </HubButton>
                <HubButton
                  type="button"
                  data-testid="dashboard-account-delete"
                  variant="dangerOutline"
                  fullWidth
                  disabled={saving || deleting}
                  onClick={() => void handleDeleteAccount()}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  {t("staff_account.delete_account")}
                </HubButton>
                <HubButton
                  type="button"
                  data-testid="dashboard-account-cancel-edit"
                  variant="secondary"
                  fullWidth
                  disabled={saving || deleting}
                  onClick={cancelEditing}
                >
                  {t("staff_account.cancel")}
                </HubButton>
              </>
            ) : (
              <HubButton
                type="button"
                data-testid="dashboard-account-edit"
                variant="primary"
                fullWidth
                onClick={startEditing}
              >
                <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                {t("staff_account.edit")}
              </HubButton>
            )}

            <HubButton
              type="button"
              data-testid="dashboard-account-signout"
              variant="secondary"
              fullWidth
              disabled={signingOut || saving || deleting}
              onClick={() => void handleSignOut()}
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {t("auth.signout")}
            </HubButton>
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
