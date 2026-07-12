"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import { HubSegmentedControl } from "@/core/ui/hub";
import {
  crmEmailLoginTestId,
  type CrmEmailAuthTab,
  type CrmEmailLoginVariant,
} from "@/features/auth/crmEmailLoginVariant";
import CrmEmailLoginForm from "@/features/auth/components/CrmEmailLoginForm";
import CrmEmailLoginPanelHeader from "@/features/auth/components/CrmEmailLoginPanelHeader";
import CrmStaffOAuthButtons from "@/features/auth/components/CrmStaffOAuthButtons";
import { useCrmEmailLoginForm } from "@/features/auth/hooks/useCrmEmailLoginForm";

export type { CrmEmailAuthTab } from "@/features/auth/crmEmailLoginVariant";

type Props = {
  variant: CrmEmailLoginVariant;
};

export default function CrmEmailLoginPanel({ variant }: Props) {
  const { t } = useTranslation();
  const form = useCrmEmailLoginForm({ variant });
  const panelTestId = crmEmailLoginTestId(variant, "panel");

  return (
    <div
      data-testid={panelTestId}
      className="flex h-dvh flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6"
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-xl backdrop-blur">
        <CrmEmailLoginPanelHeader variant={variant} />

        <div className="mt-5">
          <HubSegmentedControl
            size="compact"
            ariaLabel={String(t("auth.session"))}
            value={form.authTab}
            onChange={form.handleAuthTabChange}
            options={[
              {
                id: "login",
                label: t("auth.login_tab"),
                testId: crmEmailLoginTestId(variant, "tab-login"),
              },
              {
                id: "register",
                label: t("auth.register_tab"),
                testId: crmEmailLoginTestId(variant, "tab-register"),
              },
            ]}
          />
        </div>

        <CrmEmailLoginForm {...form} />

        <CrmStaffOAuthButtons
          variant={variant}
          authTab={form.authTab}
          disabled={form.submitting}
          googleBusy={form.googleBusy}
          appleBusy={form.appleBusy}
          onGoogleSignIn={form.handleGoogleSignIn}
          onAppleSignIn={form.handleAppleSignIn}
          onAppleSignedIn={form.handleAppleSignedIn}
          onAppleError={form.handleAppleError}
        />
      </div>
    </div>
  );
}
