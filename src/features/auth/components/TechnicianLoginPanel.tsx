"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { auth, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  signInTechnicianWithEmail,
  technicianEmailSignInErrorFeedback,
} from "@/features/auth/technicianEmailSignIn";

export default function TechnicianLoginPanel() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isConfigured || !auth) {
      toast.error(String(t("auth.signin_failed")));
      return;
    }
    if (!email.trim()) {
      toast.error(String(t("auth.email_required")));
      return;
    }
    if (!password.trim()) {
      toast.error(String(t("auth.password_required")));
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
      toast.error(
        String(t(titleKey)),
        descriptionKey ? { description: String(t(descriptionKey)) } : undefined
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="technician-login-panel"
      className="flex h-dvh flex-col items-center justify-center bg-slate-50 px-6"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-center text-lg font-semibold text-slate-900">CRMSLOT Terrain</h1>
        <p className="mt-1 text-center text-[13px] text-slate-600">
          {t("technician_hub.dashboard.list.login_prompt")}
        </p>

        <form className="mt-5 flex flex-col gap-3" onSubmit={handleSubmit}>
          <label htmlFor="technician-login-email" className="sr-only">
            {t("auth.email_label")}
          </label>
          <input
            id="technician-login-email"
            data-testid="technician-login-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={String(t("auth.email_label"))}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[14px] text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          />
          <label htmlFor="technician-login-password" className="sr-only">
            {t("auth.password_label")}
          </label>
          <input
            id="technician-login-password"
            data-testid="technician-login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={String(t("auth.password_label"))}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[14px] text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          />
          <button
            type="submit"
            data-testid="technician-login-submit"
            disabled={busy}
            className="flex h-11 items-center justify-center rounded-xl bg-blue-600 text-[14px] font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : t("auth.sign_in")}
          </button>
        </form>
      </div>
    </div>
  );
}
