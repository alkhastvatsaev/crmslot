"use client";

import Image from "next/image";
import { signOut } from "firebase/auth";
import { Building2, LayoutDashboard, LogOut, Loader2, Lock } from "lucide-react";
import { clientPortalAuth, isConfigured } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { HubSegmentedControl } from "@/core/ui/hub";
import { mfaHintKind } from "@/features/auth/clientPortalPasswordMfa";
import GmailGoogleConnectButton from "@/features/gmail/components/GmailGoogleConnectButton";
import {
  useClientPortalAuth,
  type ClientPortalAuthTab,
} from "@/features/auth/hooks/useClientPortalAuth";
import { useClientPortalSearch } from "@/features/auth/hooks/useClientPortalSearch";
import InterventionTrackingSection from "@/features/auth/components/InterventionTrackingSection";

const LOGO_URL = process.env.NEXT_PUBLIC_CLIENT_PORTAL_LOGO_URL?.trim();

export type ClientPortalAuthPanelProps = {
  /** Rail gauche hub demandeur : connexion uniquement (sans suivi par nom). */
  authRailMode?: boolean;
  /** Onglet contrôlé par le hub demandeur (Connexion / Créer un compte). */
  authTab?: ClientPortalAuthTab;
};

export default function ClientPortalAuthPanel({
  authRailMode = false,
  authTab: authTabProp,
}: ClientPortalAuthPanelProps) {
  const { t } = useTranslation();

  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    authTab,
    setAuthTab,
    emailAuthBusy,
    googleBusy,
    mfaResolver,
    mfaHintIndex,
    phoneVerificationId,
    mfaCode,
    setMfaCode,
    mfaBusy,
    user,
    goDashboard,
    handleGoogleSignIn,
    handleEmailPasswordSubmit,
    handleSendPhoneMfa,
    handleConfirmMfa,
    resetMfaUi,
  } = useClientPortalAuth({ authRailMode, authTab: authTabProp });

  const { searchName, setSearchName, isSearching, searchResult, handleSearch } =
    useClientPortalSearch();

  if (!isConfigured || !clientPortalAuth) {
    return (
      <div
        data-testid="client-portal-offline"
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-10 opacity-70"
      >
        <Building2 className="h-12 w-12 text-slate-300" aria-hidden />
        <span className="sr-only">{t("auth.firebase_not_configured")}</span>
      </div>
    );
  }

  const authFormContent = (
    <div className="flex w-full flex-col gap-3">
      <label htmlFor="client-portal-email-input" className="sr-only">
        {t("auth.email_label")}
      </label>
      <input
        id="client-portal-email-input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={String(t("auth.email_label"))}
        data-testid="client-portal-email"
        autoComplete="email"
        className="w-full rounded-[14px] border border-black/[0.06] bg-white px-4 py-3 text-[14px] font-medium text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 shadow-sm"
      />
      <label htmlFor="client-portal-password-input" className="sr-only">
        {t("auth.password_label")}
      </label>
      <input
        id="client-portal-password-input"
        type="password"
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
        onClick={() => void handleEmailPasswordSubmit()}
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
        <GmailGoogleConnectButton
          dataTestId="client-portal-google-signin"
          ariaLabel={String(t("auth.connect_with_google"))}
          disabled={emailAuthBusy || googleBusy}
          onClick={() => void handleGoogleSignIn()}
        />
      </div>

      <div id="client-portal-recaptcha-container" className="sr-only" aria-hidden />
    </div>
  );

  const mfaPanel =
    mfaResolver && mfaResolver.hints[mfaHintIndex] ? (
      <div
        data-testid="client-portal-mfa-panel"
        className="flex w-full flex-col gap-3 rounded-[18px] border border-indigo-200/80 bg-indigo-50/60 p-4"
      >
        <p className="text-[13px] font-bold text-indigo-950">
          Double authentification (
          {mfaHintKind(mfaResolver.hints[mfaHintIndex]) === "totp" ? "application" : "SMS"})
        </p>
        {mfaHintKind(mfaResolver.hints[mfaHintIndex]) === "phone" && (
          <button
            type="button"
            data-testid="client-portal-mfa-send-sms"
            disabled={mfaBusy || Boolean(phoneVerificationId)}
            onClick={() => void handleSendPhoneMfa()}
            className="rounded-[12px] bg-white px-3 py-2.5 text-[13px] font-bold text-indigo-800 shadow-sm ring-1 ring-indigo-200/80 disabled:opacity-50"
          >
            {phoneVerificationId ? "SMS envoyé" : "Envoyer le code SMS"}
          </button>
        )}
        <label htmlFor="client-portal-mfa-code" className="sr-only">
          Code 2FA
        </label>
        <input
          id="client-portal-mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value)}
          placeholder={
            mfaHintKind(mfaResolver.hints[mfaHintIndex]) === "totp"
              ? "Code à 6 chiffres (authenticator)"
              : "Code SMS"
          }
          data-testid="client-portal-mfa-code"
          className="w-full rounded-[14px] border border-black/[0.06] bg-white px-4 py-3 text-[14px] font-mono font-semibold tracking-widest text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
        />
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="client-portal-mfa-confirm"
            disabled={mfaBusy || !mfaCode.trim()}
            onClick={() => void handleConfirmMfa()}
            className="flex-1 rounded-[12px] bg-indigo-600 py-2.5 text-[13px] font-bold text-white disabled:opacity-45"
          >
            {mfaBusy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Valider 2FA"}
          </button>
          <button
            type="button"
            data-testid="client-portal-mfa-cancel"
            disabled={mfaBusy}
            onClick={() => resetMfaUi()}
            className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2.5 text-[13px] font-bold text-slate-700"
          >
            Annuler
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div
      data-testid="client-portal-container"
      data-auth-rail={authRailMode ? "true" : undefined}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-5 pb-1 w-full",
        authRailMode ? "max-w-none" : "max-w-[440px] mx-auto"
      )}
    >
      {!authRailMode && (
        <>
          <InterventionTrackingSection
            searchName={searchName}
            setSearchName={setSearchName}
            isSearching={isSearching}
            searchResult={searchResult}
            handleSearch={handleSearch}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/[0.06]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-50 px-3 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Portail Complet
              </span>
            </div>
          </div>
        </>
      )}

      {user && !authRailMode ? (
        <div
          data-testid="client-portal-authed"
          className="flex flex-col items-center gap-4 rounded-[24px] border border-black/[0.06] bg-gradient-to-b from-white/95 to-white/82 px-5 py-8 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.16)] backdrop-blur-xl"
        >
          {LOGO_URL ? (
            <Image
              src={LOGO_URL}
              alt=""
              width={200}
              height={56}
              className="h-14 w-auto max-w-[200px] object-contain"
            />
          ) : (
            <Building2 className="h-11 w-11 text-slate-400" aria-hidden />
          )}
          <span className="sr-only">
            {t("auth.session")} {user.email ?? user.uid}
          </span>
          <div className="mt-2 flex w-full flex-wrap justify-center gap-2">
            <button
              type="button"
              data-testid="client-portal-dashboard"
              onClick={() => void goDashboard()}
              className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-[14px] bg-slate-900 px-4 py-3 text-[14px] font-bold text-white shadow-[0_12px_28px_-10px_rgba(15,23,42,0.35)] transition-transform active:scale-95"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
              {t("auth.dashboard")}
            </button>
            <button
              type="button"
              data-testid="client-portal-signout"
              onClick={() => {
                if (clientPortalAuth) void signOut(clientPortalAuth);
              }}
              className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-[14px] border border-black/[0.08] bg-white px-4 py-3 text-[14px] font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              {t("auth.signout")}
            </button>
          </div>
        </div>
      ) : authRailMode ? (
        <div className="flex w-full flex-col gap-4">
          {authFormContent}
          {mfaPanel}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 rounded-[24px] border border-black/[0.06] bg-gradient-to-b from-white/96 via-white/90 to-slate-50/85 px-6 py-8 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="w-full text-center">
            <h3 className="text-[18px] font-extrabold text-slate-800">
              {t("auth.client_space_title")}
            </h3>
          </div>

          <HubSegmentedControl
            value={authTab}
            onChange={(id) => setAuthTab(id as "login" | "register")}
            size="compact"
            className="w-full shrink-0"
            options={[
              {
                id: "login",
                label: t("auth.login_tab"),
                testId: "client-portal-tab-login",
                activeAccent: "slate",
              },
              {
                id: "register",
                label: t("auth.register_tab"),
                testId: "client-portal-tab-register",
                activeAccent: "slate",
              },
            ]}
          />

          {authFormContent}
          {mfaPanel}
        </div>
      )}
    </div>
  );
}
