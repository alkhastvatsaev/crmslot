"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { HubSegmentedControl } from "@/core/ui/hub";
import type { CrmEmailAuthTab } from "@/features/auth/crmEmailLoginVariant";
import CrmBrandOAuthButton from "@/features/auth/components/CrmBrandOAuthButton";
import { useIsAppleOAuthClient } from "@/features/auth/hooks/useIsIphoneClient";
import { useCrmStaffOAuth } from "@/features/auth/hooks/useCrmStaffOAuth";
import {
  readPlanIdFromSearchParams,
  savePendingSubscriptionPlan,
} from "@/features/subscriptions/pendingSubscriptionPlan";

/** Connexion / inscription + OAuth — même pattern que le panneau auth admin. */
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

  if (signedIn) return null;

  const oauthDisabled = googleBusy || appleBusy;
  const isRegister = authTab === "register";

  return (
    <div
      className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2.5"
      data-testid="pricing-auth-toolbar"
    >
      <HubSegmentedControl
        size="compact"
        ariaLabel={String(t("auth.session"))}
        value={authTab}
        onChange={(id) => {
          const tab = id === "login" ? "login" : "register";
          setAuthTab(tab);
          const params = new URLSearchParams(window.location.search);
          const planId = readPlanIdFromSearchParams(params);
          if (planId) savePendingSubscriptionPlan(planId);
        }}
        options={[
          {
            id: "login",
            label: t("auth.login_tab"),
            testId: "pricing-auth-tab-login",
          },
          {
            id: "register",
            label: t("auth.register_tab"),
            testId: "pricing-auth-tab-register",
          },
        ]}
      />

      <div className="flex items-center gap-2">
        <CrmBrandOAuthButton
          variant="google"
          compact
          testId="pricing-auth-google"
          label={String(t(isRegister ? "auth.oauth_google_register" : "auth.continue_with_google"))}
          disabled={oauthDisabled}
          busy={googleBusy}
          onClick={handleGoogleSignIn}
        />
        {isAppleOAuth === true ? (
          <CrmBrandOAuthButton
            variant="apple"
            compact
            testId="pricing-auth-apple"
            label={String(t(isRegister ? "auth.oauth_apple_register" : "auth.continue_with_apple"))}
            disabled={oauthDisabled}
            busy={appleBusy}
            onClick={handleAppleSignIn}
          />
        ) : null}
      </div>
    </div>
  );
}
