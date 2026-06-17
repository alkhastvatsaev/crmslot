"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { auth, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  CrmStaffJoinCompanyError,
  completeCrmStaffOAuthSession,
} from "@/features/auth/crmEmailRegister";
import {
  CrmStaffOAuthRedirectPending,
  crmStaffOAuthSignInErrorFeedback,
  signInCrmStaffWithApple,
  signInCrmStaffWithGoogle,
  type CrmStaffOAuthProviderId,
} from "@/features/auth/crmStaffOAuthSignIn";
import type { CrmEmailLoginVariant } from "@/features/auth/crmEmailLoginVariant";

type Options = {
  variant: CrmEmailLoginVariant;
  onInlineError?: (message: string | null) => void;
};

export function useCrmStaffOAuth({ variant, onInlineError }: Options) {
  const { t } = useTranslation();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const logLabel = variant === "technician" ? "TechnicianLoginPanel" : "AdminLoginPanel";

  const oauthBusy = googleBusy || appleBusy;

  const handleOAuth = useCallback(
    async (provider: CrmStaffOAuthProviderId) => {
      onInlineError?.(null);
      if (!isConfigured || !auth) {
        onInlineError?.(String(t("auth.signin_failed")));
        return;
      }

      const setBusy = provider === "google" ? setGoogleBusy : setAppleBusy;
      setBusy(true);
      try {
        const cred =
          provider === "google"
            ? await signInCrmStaffWithGoogle(auth)
            : await signInCrmStaffWithApple(auth);
        await completeCrmStaffOAuthSession(cred);
        toast.success(
          String(
            t(provider === "google" ? "auth.google_signin_success" : "auth.apple_signin_success")
          )
        );
      } catch (e) {
        if (e instanceof CrmStaffOAuthRedirectPending) {
          toast.message(String(t("auth.oauth_redirect")));
          return;
        }
        logger.error(`[${logLabel}] ${provider} oauth failed`, {
          error: e instanceof Error ? e.message : String(e),
        });
        if (e instanceof CrmStaffJoinCompanyError) {
          onInlineError?.(e.message);
          return;
        }
        const { titleKey, descriptionKey } = crmStaffOAuthSignInErrorFeedback(provider, e);
        onInlineError?.(
          descriptionKey
            ? `${String(t(titleKey))} — ${String(t(descriptionKey))}`
            : String(t(titleKey))
        );
      } finally {
        setBusy(false);
      }
    },
    [logLabel, onInlineError, t]
  );

  return {
    googleBusy,
    appleBusy,
    oauthBusy,
    handleGoogleSignIn: () => void handleOAuth("google"),
    handleAppleSignIn: () => void handleOAuth("apple"),
  };
}
