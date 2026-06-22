"use client";

import { CloudOff, Lock } from "lucide-react";
import { isConfigured } from "@/core/config/firebase";
import {
  CompanySpaceOfflineGlyph,
  CompanySpacePanelShell,
} from "@/features/company/components/CompanySpacePanelShell";
import CompanySpacePanelContent from "@/features/company/components/CompanySpacePanelContent";
import { useCompanySpacePanelState } from "@/features/company/hooks/useCompanySpacePanelState";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function CompanySpacePanel() {
  const { t } = useTranslation();
  const s = useCompanySpacePanelState();

  if (!isConfigured) {
    return (
      <CompanySpacePanelShell>
        <CompanySpaceOfflineGlyph
          testId="company-panel-offline"
          ariaLabel={t("company.aria.firebase_unconfigured")}
          overlay={CloudOff}
        />
      </CompanySpacePanelShell>
    );
  }

  if (!s.firebaseUid && s.memberships.length === 0) {
    return (
      <CompanySpacePanelShell>
        <CompanySpaceOfflineGlyph
          testId="company-panel-offline"
          ariaLabel={t("company.aria.login_required")}
          overlay={Lock}
        />
      </CompanySpacePanelShell>
    );
  }

  return (
    <CompanySpacePanelShell>
      <CompanySpacePanelContent {...s} />
    </CompanySpacePanelShell>
  );
}
