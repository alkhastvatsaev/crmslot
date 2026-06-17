"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import CrmBrandOAuthButton from "@/features/auth/components/CrmBrandOAuthButton";
import {
  crmEmailLoginTestId,
  type CrmEmailLoginVariant,
} from "@/features/auth/crmEmailLoginVariant";

type Props = {
  variant: CrmEmailLoginVariant;
  disabled?: boolean;
  googleBusy?: boolean;
  appleBusy?: boolean;
  onGoogleSignIn: () => void;
  onAppleSignIn: () => void;
};

export default function CrmStaffOAuthButtons({
  variant,
  disabled = false,
  googleBusy = false,
  appleBusy = false,
  onGoogleSignIn,
  onAppleSignIn,
}: Props) {
  const { t } = useTranslation();
  const oauthDisabled = disabled || googleBusy || appleBusy;

  return (
    <div className="mt-1 flex flex-col gap-2.5" data-testid={crmEmailLoginTestId(variant, "oauth")}>
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
        label={String(t("auth.continue_with_google"))}
        disabled={oauthDisabled}
        busy={googleBusy}
        onClick={onGoogleSignIn}
      />

      <CrmBrandOAuthButton
        variant="apple"
        testId={crmEmailLoginTestId(variant, "apple")}
        label={String(t("auth.continue_with_apple"))}
        disabled={oauthDisabled}
        busy={appleBusy}
        onClick={onAppleSignIn}
      />
    </div>
  );
}
