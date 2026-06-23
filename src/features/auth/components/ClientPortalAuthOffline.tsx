"use client";

import { Building2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function ClientPortalAuthOffline() {
  const { t } = useTranslation();

  return (
    <div
      data-testid="client-portal-offline"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-10 opacity-70"
    >
      <Building2 className="h-12 w-12 text-slate-300" aria-hidden />
      <span className="sr-only">{t("auth.firebase_not_configured")}</span>
    </div>
  );
}
