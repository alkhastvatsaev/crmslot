"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import type { CrmEmailAuthTab } from "@/features/auth/crmEmailLoginVariant";
import CrmBrandOAuthButton from "@/features/auth/components/CrmBrandOAuthButton";
import { useIsAppleOAuthClient } from "@/features/auth/hooks/useIsIphoneClient";
import {
  crmEmailLoginTestId,
  type CrmEmailLoginVariant,
} from "@/features/auth/crmEmailLoginVariant";

type Props = {
  variant: CrmEmailLoginVariant;
  authTab: CrmEmailAuthTab;
  disabled?: boolean;
  googleBusy?: boolean;
  appleBusy?: boolean;
  onGoogleSignIn: () => void;
  onAppleSignIn: () => void;
};

export default function CrmStaffOAuthButtons({
  variant,
  authTab,
  disabled = false,
  googleBusy = false,
  appleBusy = false,
  onGoogleSignIn,
  onAppleSignIn,
}: Props) {
  const { t } = useTranslation();
  const isAppleOAuth = useIsAppleOAuthClient();
  const oauthDisabled = disabled || googleBusy || appleBusy;
  const showApple = isAppleOAuth === true;
  const isRegister = authTab === "register";

  const googleLabel = String(
    t(isRegister ? "auth.oauth_google_register" : "auth.continue_with_google")
  );
  const appleLabel = String(
    t(isRegister ? "auth.oauth_apple_register" : "auth.continue_with_apple")
  );

  return (
    <div
      className="mt-1 flex flex-col gap-2.5"
      data-testid={crmEmailLoginTestId(variant, "oauth")}
      data-oauth-mode={authTab}
      data-show-apple={showApple ? "true" : "false"}
    >
      <div className="relative flex w-full items-center py-1" aria-hidden>
        <div className="h-px flex-1 bg-slate-200/90" />
        <span className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {t("auth.or_divider")}
        </span>
        <div className="h-px flex-1 bg-slate-200/90" />
      </div>

      <CrmBrandOAuthButton
        variant="google"
        testId={crmEmailLoginTestId(variant, "google")}
        label={googleLabel}
        disabled={oauthDisabled}
        busy={googleBusy}
        onClick={onGoogleSignIn}
      />

      {showApple ? (
        <CrmBrandOAuthButton
          variant="apple"
          testId={crmEmailLoginTestId(variant, "apple")}
          label={appleLabel}
          disabled={oauthDisabled}
          busy={appleBusy}
          onClick={onAppleSignIn}
        />
      ) : null}
    </div>
  );
}
