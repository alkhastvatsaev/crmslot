"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { useTranslation } from "@/core/i18n/I18nContext";
import { HubSegmentedControl } from "@/core/ui/hub";
import { emailPasswordAuthErrorFeedback } from "@/features/auth/clientPortalEmailPasswordAuth";
import {
  CrmStaffJoinCompanyError,
  registerCrmStaffAccount,
} from "@/features/auth/crmEmailRegister";
import {
  signInTechnicianWithEmail,
  technicianEmailSignInErrorFeedback,
} from "@/features/auth/technicianEmailSignIn";
import {
  crmEmailLoginSubtitleKey,
  crmEmailLoginTestId,
  crmEmailLoginTitleKey,
  type CrmEmailLoginVariant,
} from "@/features/auth/crmEmailLoginVariant";

export type CrmEmailAuthTab = "login" | "register";

type Props = {
  variant: CrmEmailLoginVariant;
};

export default function CrmEmailLoginPanel({ variant }: Props) {
  const { t } = useTranslation();
  const [authTab, setAuthTab] = useState<CrmEmailAuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const panelTestId = crmEmailLoginTestId(variant, "panel");
  const emailTestId = crmEmailLoginTestId(variant, "email");
  const passwordTestId = crmEmailLoginTestId(variant, "password");
  const confirmPasswordTestId = crmEmailLoginTestId(variant, "confirm-password");
  const passwordToggleTestId = crmEmailLoginTestId(variant, "password-toggle");
  const errorTestId = crmEmailLoginTestId(variant, "error");
  const submitTestId = crmEmailLoginTestId(variant, "submit");
  const forgotTestId = crmEmailLoginTestId(variant, "forgot");
  const emailInputId = `${variant}-login-email`;
  const passwordInputId = `${variant}-login-password`;
  const confirmPasswordInputId = `${variant}-login-confirm-password`;
  const logLabel = variant === "technician" ? "TechnicianLoginPanel" : "AdminLoginPanel";

  const authErrorMessage = (e: unknown, mode: "login" | "register") => {
    const feedback =
      mode === "login" ? technicianEmailSignInErrorFeedback(e) : emailPasswordAuthErrorFeedback(e);
    const { titleKey, descriptionKey } = feedback;
    return descriptionKey
      ? `${String(t(titleKey))} — ${String(t(descriptionKey))}`
      : String(t(titleKey));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setInlineError(null);
    if (!isConfigured || !auth) {
      setInlineError(String(t("auth.signin_failed")));
      return;
    }
    if (!email.trim()) {
      setInlineError(String(t("auth.email_required")));
      return;
    }
    if (!password.trim()) {
      setInlineError(String(t("auth.password_required")));
      return;
    }
    if (authTab === "register" && password !== confirmPassword) {
      setInlineError(String(t("auth.password_mismatch")));
      return;
    }

    setBusy(true);
    try {
      if (authTab === "register") {
        await registerCrmStaffAccount({ auth, email, password });
        toast.success(String(t("auth.register_success")));
      } else {
        await signInTechnicianWithEmail({ auth, email, password });
        toast.success(String(t("auth.signin_success")));
      }
    } catch (e) {
      logger.error(`[${logLabel}] ${authTab} failed`, {
        error: e instanceof Error ? e.message : String(e),
      });
      if (e instanceof CrmStaffJoinCompanyError) {
        setInlineError(e.message);
      } else {
        setInlineError(authErrorMessage(e, authTab));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    setInlineError(null);
    if (!isConfigured || !auth) {
      setInlineError(String(t("auth.signin_failed")));
      return;
    }
    if (!email.trim()) {
      setInlineError(String(t("auth.email_required")));
      return;
    }
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success(String(t("auth.reset_email_sent")));
    } catch (e) {
      logger.error(`[${logLabel}] reset failed`, {
        error: e instanceof Error ? e.message : String(e),
      });
      setInlineError(String(t("auth.reset_email_failed")));
    } finally {
      setResetting(false);
    }
  };

  const submitting = busy || resetting;

  return (
    <div
      data-testid={panelTestId}
      className="flex h-dvh flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6"
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-xl backdrop-blur">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/icon-192.png"
            alt="CRMSLOT"
            width={56}
            height={56}
            className="h-14 w-14 rounded-2xl shadow-sm"
            priority
          />
          <div className="text-center">
            <h1 className="text-[17px] font-semibold tracking-tight text-slate-900">
              {t(crmEmailLoginTitleKey(variant))}
            </h1>
            <p className="mt-1 text-[12.5px] leading-snug text-slate-500">
              {t(crmEmailLoginSubtitleKey(variant))}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <HubSegmentedControl
            size="compact"
            ariaLabel={String(t("auth.session"))}
            value={authTab}
            onChange={(id) => {
              setAuthTab(id as CrmEmailAuthTab);
              setInlineError(null);
            }}
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

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
          <label htmlFor={emailInputId} className="sr-only">
            {t("auth.email_label")}
          </label>
          <div className="relative">
            <Mail
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id={emailInputId}
              data-testid={emailTestId}
              type="email"
              inputMode="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={String(t("auth.email_label"))}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-3 text-[14px] text-slate-900 outline-none transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-60"
            />
          </div>

          <label htmlFor={passwordInputId} className="sr-only">
            {t("auth.password_label")}
          </label>
          <div className="relative">
            <Lock
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id={passwordInputId}
              data-testid={passwordTestId}
              type={showPassword ? "text" : "password"}
              autoComplete={authTab === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={String(t("auth.password_label"))}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-12 py-3 text-[14px] text-slate-900 outline-none transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={String(t(showPassword ? "auth.hide_password" : "auth.show_password"))}
              data-testid={passwordToggleTestId}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {authTab === "register" ? (
            <>
              <label htmlFor={confirmPasswordInputId} className="sr-only">
                {t("auth.confirm_password_label")}
              </label>
              <div className="relative">
                <Lock
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id={confirmPasswordInputId}
                  data-testid={confirmPasswordTestId}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={String(t("auth.confirm_password_label"))}
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-3 text-[14px] text-slate-900 outline-none transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-60"
                />
              </div>
            </>
          ) : null}

          {inlineError ? (
            <div
              role="alert"
              data-testid={errorTestId}
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700"
            >
              <AlertCircle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="leading-snug">{inlineError}</span>
            </div>
          ) : null}

          <button
            type="submit"
            data-testid={submitTestId}
            disabled={submitting || (authTab === "register" && !confirmPassword.trim())}
            className="mt-1 flex h-11 items-center justify-center rounded-xl bg-blue-600 text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : authTab === "register" ? (
              t("auth.create_account")
            ) : (
              t("auth.sign_in")
            )}
          </button>

          {authTab === "login" ? (
            <button
              type="button"
              onClick={handleForgot}
              disabled={submitting}
              data-testid={forgotTestId}
              className="mt-1 text-center text-[12.5px] font-medium text-blue-600 underline-offset-2 hover:underline disabled:opacity-60"
            >
              {resetting ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden />
              ) : (
                t("auth.forgot_password")
              )}
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
