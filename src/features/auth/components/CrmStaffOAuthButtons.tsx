"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
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

const socialButtonClass =
  "relative flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-12 text-[14px] font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("h-5 w-5", className)}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("h-5 w-5 fill-slate-900", className)}>
      <path d="M17.05 20.28c-.98.95-2.05 1.88-3.51 1.9-1.46.02-1.93-.86-3.6-.86-1.67 0-2.19.84-3.57.88-1.38.04-2.43-1.41-3.41-2.35C2.45 17.25.73 12.08 2.28 8.3c.77-1.75 2.14-2.86 3.64-2.89 1.43-.03 2.78.96 3.6.96.82 0 2.36-1.18 3.98-1.01.68.03 2.6.28 3.83 2.1-3.3 1.8-2.77 6.48.53 7.92-.65 1.7-1.5 3.38-2.81 4.9ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}

function OAuthProviderButton({
  testId,
  label,
  disabled,
  busy,
  onClick,
  icon,
}: {
  testId: string;
  label: string;
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled || busy}
      onClick={onClick}
      aria-label={label}
      className={socialButtonClass}
    >
      <span className="absolute left-3.5 flex h-5 w-5 items-center justify-center">
        {busy ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" aria-hidden /> : icon}
      </span>
      <span className="truncate">{label}</span>
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
  const googleLabel = String(t("auth.continue_with_google"));
  const appleLabel = String(t("auth.continue_with_apple"));

  return (
    <div className="mt-1 flex flex-col gap-2.5" data-testid={crmEmailLoginTestId(variant, "oauth")}>
      <div className="relative flex w-full items-center py-1" aria-hidden>
        <div className="h-px flex-1 bg-slate-200/90" />
        <span className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {t("auth.or_divider")}
        </span>
        <div className="h-px flex-1 bg-slate-200/90" />
      </div>

      <OAuthProviderButton
        testId={crmEmailLoginTestId(variant, "google")}
        label={googleLabel}
        disabled={oauthDisabled}
        busy={googleBusy}
        onClick={onGoogleSignIn}
        icon={<GoogleMark />}
      />

      <OAuthProviderButton
        testId={crmEmailLoginTestId(variant, "apple")}
        label={appleLabel}
        disabled={oauthDisabled}
        busy={appleBusy}
        onClick={onAppleSignIn}
        icon={<AppleMark />}
      />
    </div>
  );
}
