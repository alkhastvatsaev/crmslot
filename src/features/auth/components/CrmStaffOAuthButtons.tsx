"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import type { UserCredential } from "firebase/auth";
import type { CrmEmailAuthTab } from "@/features/auth/crmEmailLoginVariant";
import OfficialAppleSignInButton from "@/features/auth/components/OfficialAppleSignInButton";
import OfficialGoogleSignInButton from "@/features/auth/components/OfficialGoogleSignInButton";
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
  onAppleSignedIn: (cred: UserCredential) => void | Promise<void>;
  onAppleError: (error: unknown) => void;
};

export default function CrmStaffOAuthButtons({
  variant,
  authTab,
  disabled = false,
  googleBusy = false,
  appleBusy = false,
  onGoogleSignIn,
  onAppleSignIn,
  onAppleSignedIn,
  onAppleError,
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

      <OfficialGoogleSignInButton
        dataTestId={crmEmailLoginTestId(variant, "google")}
        ariaLabel={googleLabel}
        disabled={oauthDisabled}
        busy={googleBusy}
        onClick={onGoogleSignIn}
      />

      {showApple ? (
        <OfficialAppleSignInButton
          dataTestId={crmEmailLoginTestId(variant, "apple")}
          ariaLabel={appleLabel}
          disabled={oauthDisabled}
          busy={appleBusy}
          onAppleSignIn={onAppleSignIn}
          onAppleSignedIn={onAppleSignedIn}
          onAppleError={onAppleError}
        />
      ) : null}
    </div>
  );
}
