"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import type { CrmEmailAuthTab } from "@/features/auth/crmEmailLoginVariant";
import AppleSignInConnectButton from "@/features/auth/components/AppleSignInConnectButton";
import CrmBrandOAuthButton from "@/features/auth/components/CrmBrandOAuthButton";
import { useIsAppleOAuthClient } from "@/features/auth/hooks/useIsIphoneClient";
import { useCrmStaffOAuth } from "@/features/auth/hooks/useCrmStaffOAuth";
import {
  readPlanIdFromSearchParams,
  savePendingSubscriptionPlan,
} from "@/features/subscriptions/pendingSubscriptionPlan";

function authTabClass(active: boolean): string {
  return cn(
    "whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-semibold leading-none transition sm:px-4",
    active
      ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/80"
      : "text-slate-500 hover:text-slate-700"
  );
}

/** Connexion / inscription + OAuth — barre lisible en haut à droite de /pricing. */
export default function PricingAuthToolbar() {
  const { t } = useTranslation();
  const [authTab, setAuthTab] = useState<CrmEmailAuthTab>("register");
  const [signedIn, setSignedIn] = useState(false);
  const isAppleOAuth = useIsAppleOAuthClient();
  const { googleBusy, appleBusy, handleGoogleSignIn, handleAppleSignIn } = useCrmStaffOAuth({
    variant: "admin",
    authTab,
  });

  useEffect(() => {
    if (!auth) return () => {};
    setSignedIn(Boolean(auth.currentUser));
    return onAuthStateChanged(auth, (user) => setSignedIn(Boolean(user)));
  }, []);

  if (signedIn) {
    return (
      <div className="flex w-full justify-end lg:w-auto" data-testid="pricing-auth-toolbar">
        <Link
          href="/"
          className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          data-testid="pricing-auth-open-app"
        >
          {t("subscription.pricing.open_app")}
        </Link>
      </div>
    );
  }

  const oauthDisabled = googleBusy || appleBusy;
  const isRegister = authTab === "register";

  return (
    <div
      className="flex w-full min-w-0 flex-col items-stretch gap-2.5 lg:w-auto lg:min-w-[min(100%,22rem)] lg:items-end"
      data-testid="pricing-auth-toolbar"
    >
      <div
        role="tablist"
        aria-label={String(t("auth.session"))}
        className="inline-flex w-full max-w-full shrink-0 gap-1 self-end rounded-2xl bg-slate-100/90 p-1 ring-1 ring-inset ring-slate-200/70 sm:w-auto"
      >
        <button
          type="button"
          role="tab"
          aria-selected={authTab === "login"}
          data-testid="pricing-auth-tab-login"
          className={authTabClass(authTab === "login")}
          onClick={() => {
            setAuthTab("login");
            const params = new URLSearchParams(window.location.search);
            const planId = readPlanIdFromSearchParams(params);
            if (planId) savePendingSubscriptionPlan(planId);
          }}
        >
          {t("auth.login_tab")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={authTab === "register"}
          data-testid="pricing-auth-tab-register"
          className={authTabClass(authTab === "register")}
          onClick={() => {
            setAuthTab("register");
            const params = new URLSearchParams(window.location.search);
            const planId = readPlanIdFromSearchParams(params);
            if (planId) savePendingSubscriptionPlan(planId);
          }}
        >
          {t("auth.register_tab")}
        </button>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="w-full min-w-[11.5rem] sm:w-[11.5rem]">
          <CrmBrandOAuthButton
            variant="google"
            testId="pricing-auth-google"
            label={String(
              t(isRegister ? "auth.oauth_google_register" : "auth.continue_with_google")
            )}
            disabled={oauthDisabled}
            busy={googleBusy}
            onClick={handleGoogleSignIn}
          />
        </div>
        {isAppleOAuth === true ? (
          <div className="w-full min-w-[11.5rem] sm:w-[11.5rem]">
            <AppleSignInConnectButton
              testId="pricing-auth-apple"
              ariaLabel={String(
                t(isRegister ? "auth.oauth_apple_register" : "auth.continue_with_apple")
              )}
              disabled={oauthDisabled || appleBusy}
              onClick={handleAppleSignIn}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
