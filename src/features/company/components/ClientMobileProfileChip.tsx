"use client";

import { useClientPortalAccount } from "@/features/auth/hooks/useClientPortalAccount";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";

/** Profil demandeur — dock bas portail client. */
export default function ClientMobileProfileChip() {
  const { t } = useTranslation();
  const { fields } = useClientPortalAccount();

  const firstName =
    fields.firstName?.trim() ||
    fields.email?.split("@")[0]?.trim() ||
    String(t("company_hub.requester.guest"));

  return (
    <div
      data-testid="client-mobile-profile-chip"
      className={cn(
        "mobile-header-chip mobile-profile-chip",
        "h-full w-full flex-row items-center justify-center gap-2 px-3"
      )}
    >
      <span className="min-w-0 max-w-[9.5rem] truncate text-sm font-semibold tracking-wide text-slate-800">
        {firstName}
      </span>
      <span className="shrink-0 rounded-md border border-[#CCE3FF] bg-[#E5F1FF] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-[#007AFF]">
        {t("profiles.roles.client")}
      </span>
    </div>
  );
}
