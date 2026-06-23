"use client";

import { useDashboardPageSelector } from "@/features/dashboard";
import { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  resolveTechnicianProfileFirstName,
  technicianFirstNameTextClass,
} from "@/features/interventions/technicianMobileProfileLabel";
import { cn } from "@/lib/utils";

/** Profil technicien connecté — dock bas (remplace Galaxy temporairement). */
export default function TechnicianMobileProfileChip() {
  const { t } = useTranslation();
  const pageSelector = useDashboardPageSelector();
  const { fields, ready } = useCrmStaffAccountPanel();
  const accountOpen = pageSelector.view === "account";

  const firstName = resolveTechnicianProfileFirstName(
    fields.firstName,
    fields.email,
    String(t("technician_hub.dashboard.detail.not_provided"))
  );
  const firstNameClass = technicianFirstNameTextClass(firstName);

  return (
    <button
      type="button"
      data-testid="technician-mobile-profile-chip"
      className={cn(
        "mobile-header-chip mobile-header-chip--interactive mobile-profile-chip",
        "technician-mobile-profile-chip h-full w-full flex-row items-center justify-center gap-2 px-3"
      )}
      aria-label={String(t("staff_account.title"))}
      aria-expanded={accountOpen}
      disabled={!ready}
      onClick={() => pageSelector.toggleAccount()}
    >
      <div className="flex min-w-0 max-w-full items-center justify-center gap-2">
        <span
          data-testid="technician-profile-first-name"
          className={cn(
            "min-w-0 max-w-[9.5rem] truncate font-semibold tracking-wide text-slate-800",
            firstNameClass
          )}
        >
          {firstName}
        </span>
        <span
          data-testid="technician-profile-role"
          className="shrink-0 rounded-md border border-[#CCE3FF] bg-[#E5F1FF] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-[#007AFF]"
        >
          {t("profiles.roles.technician")}
        </span>
      </div>
    </button>
  );
}
