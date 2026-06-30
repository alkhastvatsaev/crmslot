"use client";

import { useDashboardPageSelector } from "@/features/dashboard/DashboardPageSelectorContext";
import { useMobileDockOnboardingOptional } from "@/features/dashboard/MobileDockOnboardingContext";
import { resolveStaffProfileRoleKey } from "@/features/auth/staffAccountRoleDisplay";
import { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  resolveTechnicianProfileFirstName,
  technicianFirstNameTextClass,
} from "@/features/interventions/technicianMobileProfileLabel";
import {
  dashboardHeaderPanelShellClass,
  DASHBOARD_PANEL_SHADOW_HOVER_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "mobile" | "desktop";
};

/** Profil staff connecté — dock admin (mobile haut · desktop haut droite). */
export default function AdminMobileProfileChip({ variant = "mobile" }: Props) {
  const { t } = useTranslation();
  const pageSelector = useDashboardPageSelector();
  const dockOnboarding = useMobileDockOnboardingOptional();
  const { fields, ready } = useCrmStaffAccountPanel();
  const accountOpen = pageSelector.view === "account";

  const firstName = resolveTechnicianProfileFirstName(
    fields.firstName,
    fields.email,
    String(t("technician_hub.dashboard.detail.not_provided"))
  );
  const firstNameClass = technicianFirstNameTextClass(firstName);
  const roleKey = resolveStaffProfileRoleKey(fields.accountRole);

  const isDesktop = variant === "desktop";

  return (
    <button
      type="button"
      data-testid="admin-mobile-profile-chip"
      className={cn(
        "h-full w-full flex-row items-center justify-center gap-2",
        isDesktop
          ? cn(
              dashboardHeaderPanelShellClass,
              DASHBOARD_PANEL_SHADOW_HOVER_CLASS,
              "cursor-pointer bg-white/70 ease-out hover:scale-[1.01] hover:bg-white/80 active:scale-[0.99] px-4"
            )
          : "mobile-header-chip mobile-header-chip--interactive mobile-profile-chip px-3"
      )}
      aria-label={String(t("staff_account.title"))}
      aria-expanded={accountOpen}
      disabled={!ready}
      onClick={() => {
        dockOnboarding?.dismissHeaderHint();
        pageSelector.toggleAccount();
      }}
    >
      <div className="flex min-w-0 max-w-full items-center justify-center gap-2">
        <span
          data-testid="admin-profile-first-name"
          className={cn(
            "min-w-0 max-w-[9.5rem] truncate font-semibold tracking-wide text-slate-800",
            firstNameClass
          )}
        >
          {firstName}
        </span>
        <span
          data-testid="admin-profile-role"
          className="shrink-0 rounded-md border border-[#CCE3FF] bg-[#E5F1FF] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-[#007AFF]"
        >
          {t(`profiles.roles.${roleKey}`)}
        </span>
      </div>
    </button>
  );
}
