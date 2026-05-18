"use client";

import { Building2 } from "lucide-react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";

/** Bascule société active (multi-tenant technicien / admin). */
export default function CompanyWorkspaceSwitcher({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("pwaV2Bundle");
  const workspace = useCompanyWorkspaceOptional();
  const memberships = workspace?.memberships ?? [];

  if (!enabled || !workspace?.isTenantUser || memberships.length < 2) return null;

  return (
    <label
      data-testid="company-workspace-switcher"
      className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm ${className}`}
    >
      <Building2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      <span className="sr-only">{t("workspace_switcher.label")}</span>
      <select
        data-testid="company-workspace-switcher-select"
        value={workspace.activeCompanyId}
        onChange={(e) => workspace.setActiveCompanyId(e.target.value)}
        className="min-w-0 flex-1 truncate bg-transparent font-semibold text-slate-800 outline-none"
      >
        {memberships.map((m) => (
          <option key={m.companyId} value={m.companyId}>
            {m.companyName}
          </option>
        ))}
      </select>
    </label>
  );
}
