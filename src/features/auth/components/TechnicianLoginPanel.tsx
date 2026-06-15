"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AlertCircle, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  signInTechnicianWithEmail,
  technicianEmailSignInErrorFeedback,
} from "@/features/auth/technicianEmailSignIn";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";

const DEMO_EMAIL = "demo@crmslot.app";
const DEMO_PASSWORD = "Demo1234!";

export default function TechnicianLoginPanel() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const showDemoHint = isCapacitorNative();

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

    setBusy(true);
    try {
      await signInTechnicianWithEmail({ auth, email, password });
      toast.success(String(t("auth.signin_success")));
    } catch (e) {
      logger.error("[TechnicianLoginPanel] sign-in failed", {
        error: e instanceof Error ? e.message : String(e),
      });
      const { titleKey, descriptionKey } = technicianEmailSignInErrorFeedback(e);
      const message = descriptionKey
        ? `${String(t(titleKey))} — ${String(t(descriptionKey))}`
        : String(t(titleKey));
      setInlineError(message);
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
      logger.error("[TechnicianLoginPanel] reset failed", {
        error: e instanceof Error ? e.message : String(e),
      });
      setInlineError(String(t("auth.reset_email_failed")));
    } finally {
      setResetting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setInlineError(null);
  };

  const submitting = busy || resetting;

  return (
    <div
      data-testid="technician-login-panel"
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
              {t("auth.technician_space_title")}
            </h1>
            <p className="mt-1 text-[12.5px] leading-snug text-slate-500">
              {t("auth.technician_space_subtitle")}
            </p>
          </div>
        </div>

        <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
          <label htmlFor="technician-login-email" className="sr-only">
            {t("auth.email_label")}
          </label>
          <div className="relative">
            <Mail
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id="technician-login-email"
              data-testid="technician-login-email"
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

          <label htmlFor="technician-login-password" className="sr-only">
            {t("auth.password_label")}
          </label>
          <div className="relative">
            <Lock
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id="technician-login-password"
              data-testid="technician-login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
              data-testid="technician-login-password-toggle"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {inlineError ? (
            <div
              role="alert"
              data-testid="technician-login-error"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700"
            >
              <AlertCircle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="leading-snug">{inlineError}</span>
            </div>
          ) : null}

          <button
            type="submit"
            data-testid="technician-login-submit"
            disabled={submitting}
            className="mt-1 flex h-11 items-center justify-center rounded-xl bg-blue-600 text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : t("auth.sign_in")}
          </button>

          <button
            type="button"
            onClick={handleForgot}
            disabled={submitting}
            data-testid="technician-login-forgot"
            className="mt-1 text-center text-[12.5px] font-medium text-blue-600 underline-offset-2 hover:underline disabled:opacity-60"
          >
            {resetting ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden />
            ) : (
              t("auth.forgot_password")
            )}
          </button>
        </form>

        {showDemoHint ? (
          <button
            type="button"
            onClick={handleFillDemo}
            disabled={submitting}
            data-testid="technician-login-demo"
            className="mt-5 flex w-full flex-col items-center gap-0.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60"
          >
            <span className="font-semibold uppercase tracking-wide text-[10px] text-slate-500">
              {t("auth.demo_account_label")}
            </span>
            <span className="text-slate-700">{DEMO_EMAIL}</span>
            <span className="text-[10.5px] text-slate-400">{t("auth.demo_account_hint")}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
