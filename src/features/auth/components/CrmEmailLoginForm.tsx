"use client";

import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { crmEmailLoginTestId } from "@/features/auth/crmEmailLoginVariant";
import type { useCrmEmailLoginForm } from "@/features/auth/hooks/useCrmEmailLoginForm";

type FormState = ReturnType<typeof useCrmEmailLoginForm>;

type Props = Pick<
  FormState,
  | "t"
  | "variant"
  | "authTab"
  | "firstName"
  | "setFirstName"
  | "lastName"
  | "setLastName"
  | "email"
  | "setEmail"
  | "password"
  | "setPassword"
  | "confirmPassword"
  | "setConfirmPassword"
  | "showPassword"
  | "setShowPassword"
  | "busy"
  | "resetting"
  | "inlineError"
  | "showTechnicianProfileFields"
  | "submitting"
  | "handleSubmit"
  | "handleForgot"
>;

export default function CrmEmailLoginForm({
  t,
  variant,
  authTab,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  busy,
  resetting,
  inlineError,
  showTechnicianProfileFields,
  submitting,
  handleSubmit,
  handleForgot,
}: Props) {
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
  const firstNameInputId = `${variant}-login-first-name`;
  const lastNameInputId = `${variant}-login-last-name`;

  return (
    <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      {showTechnicianProfileFields ? (
        <>
          <label htmlFor={firstNameInputId} className="sr-only">
            {t("requester.profile.first_name")}
          </label>
          <input
            id={firstNameInputId}
            data-testid={crmEmailLoginTestId(variant, "first-name")}
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={String(t("requester.profile.first_name"))}
            disabled={submitting}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-[14px] text-slate-900 outline-none transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-60"
          />
          <label htmlFor={lastNameInputId} className="sr-only">
            {t("requester.profile.last_name")}
          </label>
          <input
            id={lastNameInputId}
            data-testid={crmEmailLoginTestId(variant, "last-name")}
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={String(t("requester.profile.last_name"))}
            disabled={submitting}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-[14px] text-slate-900 outline-none transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-60"
          />
        </>
      ) : null}

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
  );
}
