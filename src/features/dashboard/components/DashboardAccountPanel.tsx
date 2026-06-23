"use client";

import type { ReactNode } from "react";
import { Loader2, LogOut, Mail, User, Building2, Shield } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";
import MobileCentralPanelFrame from "@/features/dashboard/components/MobileCentralPanelFrame";
import {
  MOBILE_HUB_PANEL_INNER_CLASS,
  MOBILE_HUB_PANEL_INNER_PADDED_CLASS,
  MOBILE_HUB_PANEL_INNER_SCROLL_CLASS,
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

function resolveStaffRoleKey(roleLabel: string | null): string {
  return roleLabel?.trim() || "back_office";
}

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
  const { fields, ready, signingOut, handleSignOut } = useCrmStaffAccountPanel();
  const isDesktop = variant === "desktop";
  const roleKey = resolveStaffRoleKey(fields.roleLabel);
  const roleLabel = String(t(`profiles.roles.${roleKey}`));

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
          <AccountProfileHero
            firstName={fields.firstName}
            lastName={fields.lastName}
            email={fields.email}
            roleKey={roleKey}
          />

          <div className={accountSectionCardClass}>
            <p className={cn("px-1", HUB_TYPE.eyebrow)}>{t("staff_account.subtitle")}</p>
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
          </div>

          <HubButton
            type="button"
            data-testid="dashboard-account-signout"
            variant="secondary"
            fullWidth
            disabled={signingOut}
            className="mt-auto shrink-0"
            onClick={() => void handleSignOut()}
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {t("auth.signout")}
          </HubButton>
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
      innerClassName={cn(
        MOBILE_HUB_PANEL_INNER_CLASS,
        MOBILE_HUB_PANEL_INNER_SCROLL_CLASS,
        MOBILE_HUB_PANEL_INNER_PADDED_CLASS
      )}
      sectionDataVariant={variant}
      sectionProps={{ "aria-label": String(t("staff_account.title")) }}
    >
      {body}
    </MobileCentralPanelFrame>
  );
}
