"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import type { CrmEmailAuthTab } from "@/features/auth/crmEmailLoginVariant";
import OfficialGoogleSignInButton from "@/features/auth/components/OfficialGoogleSignInButton";
import {
  crmEmailLoginTestId,
  type CrmEmailLoginVariant,
} from "@/features/auth/crmEmailLoginVariant";

type Props = {
  variant: CrmEmailLoginVariant;
  authTab: CrmEmailAuthTab;
  disabled?: boolean;
  googleBusy?: boolean;
  onGoogleSignIn: () => void;
};

/** OAuth staff — Google uniquement (Apple requiert Apple Developer Program). */
export default function CrmStaffOAuthButtons({
  variant,
  authTab,
  disabled = false,
  googleBusy = false,
  onGoogleSignIn,
}: Props) {
  const { t } = useTranslation();
  const oauthDisabled = disabled || googleBusy;
  const isRegister = authTab === "register";

  const googleLabel = String(
    t(isRegister ? "auth.oauth_google_register" : "auth.continue_with_google")
  );

  return (
    <div
      className="mt-1 flex flex-col gap-2.5"
      data-testid={crmEmailLoginTestId(variant, "oauth")}
      data-oauth-mode={authTab}
      data-show-apple="false"
    >
      <div className="relative flex w-full items-center py-1" aria-hidden>
        <div className="h-px flex-1 bg-slate-200/90" />
        <span className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {t("auth.or_divider")}
        </span>
        <div className="h-px flex-1 bg-slate-200/90" />
      </div>

      <OfficialGoogleSignInButton
        dataTestId={crmEmailLoginTestId(variant, "google")}
        ariaLabel={googleLabel}
        disabled={oauthDisabled}
        busy={googleBusy}
        onClick={onGoogleSignIn}
      />
    </div>
  );
}
