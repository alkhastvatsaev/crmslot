"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { auth, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { CrmEmailAuthTab } from "@/features/auth/crmEmailLoginVariant";
import {
  CrmStaffJoinCompanyError,
  CrmStaffOAuthModeError,
  completeCrmStaffOAuthSession,
} from "@/features/auth/crmEmailRegister";
import {
  persistStaffJoinPayload,
  readStaffJoinPayload,
  staffJoinPayloadFromOAuthUser,
  staffJoinPayloadFromVariant,
} from "@/features/auth/staffJoinPayload";
import {
  CrmStaffOAuthRedirectPending,
  crmStaffOAuthSignInErrorFeedback,
  signInCrmStaffWithApple,
  signInCrmStaffWithGoogle,
  type CrmStaffOAuthProviderId,
} from "@/features/auth/crmStaffOAuthSignIn";
import {
  crmStaffOAuthModeFromAuthTab,
  persistCrmStaffOAuthMode,
} from "@/features/auth/crmStaffOAuthMode";
import type { CrmEmailLoginVariant } from "@/features/auth/crmEmailLoginVariant";
import {
  markPendingSubscriptionCheckout,
  readPlanIdFromSearchParams,
  savePendingSubscriptionPlan,
} from "@/features/subscriptions/pendingSubscriptionPlan";

type Options = {
  variant: CrmEmailLoginVariant;
  authTab: CrmEmailAuthTab;
  onInlineError?: (message: string | null) => void;
};

function oauthModeErrorMessage(
  t: (key: string) => string,
  code: CrmStaffOAuthModeError["code"]
): string {
  if (code === "account_not_found") {
    return String(t("auth.oauth_account_not_found"));
  }
  return String(t("auth.oauth_account_already_exists"));
}

export function useCrmStaffOAuth({ variant, authTab, onInlineError }: Options) {
  const { t } = useTranslation();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const logLabel = variant === "technician" ? "TechnicianLoginPanel" : "AdminLoginPanel";
  const oauthMode = crmStaffOAuthModeFromAuthTab(authTab);

  const oauthBusy = googleBusy || appleBusy;

  const handleOAuth = useCallback(
    async (provider: CrmStaffOAuthProviderId) => {
      onInlineError?.(null);
      if (!isConfigured || !auth) {
        onInlineError?.(String(t("auth.signin_failed")));
        return;
      }

      persistCrmStaffOAuthMode(oauthMode);
      const staffJoin = staffJoinPayloadFromVariant(variant);
      persistStaffJoinPayload(staffJoin);
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const planId = readPlanIdFromSearchParams(params);
        if (variant === "admin" && oauthMode === "register") {
          markPendingSubscriptionCheckout();
        } else if (planId) {
          savePendingSubscriptionPlan(planId);
        }
      }
      const setBusy = provider === "google" ? setGoogleBusy : setAppleBusy;
      setBusy(true);
      try {
        const cred =
          provider === "google"
            ? await signInCrmStaffWithGoogle(auth)
            : await signInCrmStaffWithApple(auth);
        const staffJoin = staffJoinPayloadFromOAuthUser(variant, cred.user);
        persistStaffJoinPayload(staffJoin);
        const outcome = await completeCrmStaffOAuthSession(cred, oauthMode, auth, staffJoin);
        toast.success(
          String(
            outcome === "register"
              ? t("auth.register_success")
              : t(
                  provider === "google" ? "auth.google_signin_success" : "auth.apple_signin_success"
                )
          )
        );
      } catch (e) {
        if (e instanceof CrmStaffOAuthRedirectPending) {
          toast.message(String(t("auth.oauth_redirect")));
          return;
        }
        logger.error(`[${logLabel}] ${provider} oauth ${oauthMode} failed`, {
          error: e instanceof Error ? e.message : String(e),
        });
        if (e instanceof CrmStaffOAuthModeError) {
          onInlineError?.(oauthModeErrorMessage(t, e.code));
          return;
        }
        if (e instanceof CrmStaffJoinCompanyError) {
          onInlineError?.(e.message);
          return;
        }
        const { titleKey, descriptionKey } = crmStaffOAuthSignInErrorFeedback(provider, e);
        const message = descriptionKey
          ? `${String(t(titleKey))} — ${String(t(descriptionKey))}`
          : String(t(titleKey));
        onInlineError?.(message);
        toast.error(message);
      } finally {
        setBusy(false);
      }
    },
    [logLabel, oauthMode, onInlineError, t, variant]
  );

  return {
    googleBusy,
    appleBusy,
    oauthBusy,
    handleGoogleSignIn: () => void handleOAuth("google"),
    handleAppleSignIn: () => void handleOAuth("apple"),
  };
}
