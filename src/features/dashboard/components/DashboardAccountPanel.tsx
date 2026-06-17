"use client";

import { Loader2, LogOut, Mail, User, Building2, Shield } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";
import MobileCentralPanelFrame from "@/features/dashboard/components/MobileCentralPanelFrame";
import {
  MOBILE_HUB_PANEL_INNER_CLASS,
  MOBILE_HUB_PANEL_INNER_SCROLL_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import {
  dashboardTripleCenterShellClass,
  DASHBOARD_PANEL_SHADOW_HOVER_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import { cn } from "@/lib/utils";

type Props = {
  onClose: () => void;
  variant?: "mobile" | "desktop";
};

function ReadOnlyField({
  icon,
  label,
  value,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white/80 px-3 py-2.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-[0_4px_14px_-6px_rgba(15,23,42,0.1)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p data-testid={testId} className="truncate text-sm font-medium text-slate-900">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function DashboardAccountPanel({ onClose, variant = "mobile" }: Props) {
  const { t } = useTranslation();
  const { fields, ready, signingOut, handleSignOut } = useCrmStaffAccountPanel();
  const isDesktop = variant === "desktop";

  const body = (
    <div
      data-testid="dashboard-account-panel"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3",
        isDesktop ? "dashboard-account-panel-inner" : "mobile-account-panel-inner"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{t("staff_account.title")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t("staff_account.subtitle")}</p>
        </div>
        <button
          type="button"
          data-testid="dashboard-account-close"
          onClick={onClose}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          {t("common.close")}
        </button>
      </div>

      {!ready ? (
        <div
          data-testid="dashboard-account-loading"
          className="flex flex-1 items-center justify-center py-10"
        >
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            <ReadOnlyField
              icon={<User className="h-5 w-5" aria-hidden />}
              label={t("staff_account.first_name")}
              value={fields.firstName}
              testId="dashboard-account-first-name"
            />
            <ReadOnlyField
              icon={<User className="h-5 w-5" aria-hidden />}
              label={t("staff_account.last_name")}
              value={fields.lastName}
              testId="dashboard-account-last-name"
            />
            <ReadOnlyField
              icon={<Mail className="h-5 w-5" aria-hidden />}
              label={t("staff_account.email")}
              value={fields.email}
              testId="dashboard-account-email"
            />
            <ReadOnlyField
              icon={<Building2 className="h-5 w-5" aria-hidden />}
              label={t("staff_account.company")}
              value={fields.companyName}
              testId="dashboard-account-company"
            />
            <ReadOnlyField
              icon={<Shield className="h-5 w-5" aria-hidden />}
              label={t("staff_account.role")}
              value={
                fields.roleLabel === "admin"
                  ? String(t("staff_account.role_admin"))
                  : fields.roleLabel === "collaborateur"
                    ? String(t("staff_account.role_staff"))
                    : "—"
              }
              testId="dashboard-account-role"
            />
          </div>

          <button
            type="button"
            data-testid="dashboard-account-signout"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {t("auth.signout")}
          </button>
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
      innerClassName={`${MOBILE_HUB_PANEL_INNER_CLASS} ${MOBILE_HUB_PANEL_INNER_SCROLL_CLASS}`}
      sectionDataVariant={variant}
      sectionProps={{ "aria-label": String(t("staff_account.title")) }}
    >
      {body}
    </MobileCentralPanelFrame>
  );
}
