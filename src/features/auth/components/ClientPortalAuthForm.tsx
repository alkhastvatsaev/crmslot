"use client";

import { Lock, Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import CrmBrandOAuthButton from "@/features/auth/components/CrmBrandOAuthButton";
import type { ClientPortalAuthTab } from "@/features/auth/hooks/useClientPortalAuth";

type Props = {
  authTab: ClientPortalAuthTab;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  emailAuthBusy: boolean;
  googleBusy: boolean;
  onEmailPasswordSubmit: () => void | Promise<void>;
  onGoogleSignIn: () => void | Promise<void>;
};

export default function ClientPortalAuthForm({
  authTab,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  emailAuthBusy,
  googleBusy,
  onEmailPasswordSubmit,
  onGoogleSignIn,
}: Props) {
  const { t } = useTranslation();

  return (
    <form
      className="flex w-full min-w-0 flex-col gap-3"
      autoComplete="off"
      onSubmit={(e) => e.preventDefault()}
    >
      <label htmlFor="client-portal-email-input" className="sr-only">
        {t("auth.email_label")}
      </label>
      <input
        id="client-portal-email-input"
        type="email"
        name="client-portal-email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={String(t("auth.email_label"))}
        data-testid="client-portal-email"
        autoComplete="off"
        className="w-full rounded-[14px] border border-black/[0.06] bg-white px-4 py-3 text-[14px] font-medium text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 shadow-sm"
      />
      <label htmlFor="client-portal-password-input" className="sr-only">
        {t("auth.password_label")}
      </label>
      <input
        id="client-portal-password-input"
        type="password"
        name="client-portal-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={String(t("auth.password_label"))}
        data-testid="client-portal-password"
        autoComplete={authTab === "register" ? "new-password" : "current-password"}
        className="w-full rounded-[14px] border border-black/[0.06] bg-white px-4 py-3 text-[14px] font-medium text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 shadow-sm"
      />
      {authTab === "register" ? (
        <>
          <label htmlFor="client-portal-password-confirm" className="sr-only">
            {t("auth.confirm_password_label")}
          </label>
          <input
            id="client-portal-password-confirm"
            type="password"
            name="client-portal-password-confirm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={String(t("auth.confirm_password_label"))}
            data-testid="client-portal-password-confirm"
            autoComplete="new-password"
            className="w-full rounded-[14px] border border-black/[0.06] bg-white px-4 py-3 text-[14px] font-medium text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 shadow-sm"
          />
        </>
      ) : null}
      <button
        type="button"
        data-testid="client-portal-email-submit"
        disabled={
          emailAuthBusy ||
          googleBusy ||
          !email.trim() ||
          !password.trim() ||
          (authTab === "register" && !confirmPassword.trim())
        }
        onClick={() => void onEmailPasswordSubmit()}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-slate-900 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_16px_-6px_rgba(15,23,42,0.35)] disabled:opacity-45 hover:bg-black transition-colors"
      >
        {emailAuthBusy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Lock className="h-4 w-4" aria-hidden />
        )}
        {authTab === "register" ? t("auth.create_account") : t("auth.sign_in")}
      </button>

      <div className="relative flex w-full items-center py-1" aria-hidden>
        <div className="h-px flex-1 bg-black/[0.08]" />
        <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {t("auth.or_divider")}
        </span>
        <div className="h-px flex-1 bg-black/[0.08]" />
      </div>

      <div className="flex w-full justify-center" data-testid="client-portal-google-wrap">
        <CrmBrandOAuthButton
          variant="google"
          testId="client-portal-google-signin"
          label={String(t("auth.connect_with_google"))}
          disabled={emailAuthBusy || googleBusy}
          busy={googleBusy}
          onClick={() => void onGoogleSignIn()}
        />
      </div>

      <div id="client-portal-recaptcha-container" className="sr-only" aria-hidden />
    </form>
  );
}
