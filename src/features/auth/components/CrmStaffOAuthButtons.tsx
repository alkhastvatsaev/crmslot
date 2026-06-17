"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import GmailGoogleConnectButton from "@/features/gmail/components/GmailGoogleConnectButton";
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

function AppleSignInButton({
  disabled,
  busy,
  onClick,
  testId,
  label,
}: {
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void;
  testId: string;
  label: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled || busy}
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-black px-4 text-[14px] font-semibold text-white shadow-sm transition hover:bg-neutral-900 active:scale-[0.99] disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M17.05 20.28c-.98.95-2.05 1.88-3.51 1.9-1.46.02-1.93-.86-3.6-.86-1.67 0-2.19.84-3.57.88-1.38.04-2.43-1.41-3.41-2.35C2.45 17.25.73 12.08 2.28 8.3c.77-1.75 2.14-2.86 3.64-2.89 1.43-.03 2.78.96 3.6.96.82 0 2.36-1.18 3.98-1.01.68.03 2.6.28 3.83 2.1-3.3 1.8-2.77 6.48.53 7.92-.65 1.7-1.5 3.38-2.81 4.9ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}

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
    <div className="flex flex-col gap-3" data-testid={crmEmailLoginTestId(variant, "oauth")}>
      <div className="relative flex w-full items-center py-0.5" aria-hidden>
        <div className="h-px flex-1 bg-slate-200" />
        <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {t("auth.or_divider")}
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="flex w-full justify-center">
        <GmailGoogleConnectButton
          dataTestId={crmEmailLoginTestId(variant, "google")}
          ariaLabel={String(t("auth.continue_with_google"))}
          disabled={oauthDisabled}
          onClick={onGoogleSignIn}
        />
      </div>

      <AppleSignInButton
        testId={crmEmailLoginTestId(variant, "apple")}
        label={String(t("auth.continue_with_apple"))}
        disabled={oauthDisabled}
        busy={appleBusy}
        onClick={onAppleSignIn}
      />
    </div>
  );
}
