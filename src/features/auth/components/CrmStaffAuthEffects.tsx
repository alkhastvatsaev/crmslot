"use client";

import { useEffect } from "react";
import { getRedirectResult } from "firebase/auth";
import { toast } from "sonner";
import { auth, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  CrmStaffJoinCompanyError,
  CrmStaffOAuthModeError,
  completeCrmStaffOAuthSession,
} from "@/features/auth/crmEmailRegister";
import { consumeCrmStaffOAuthMode, peekCrmStaffOAuthMode } from "@/features/auth/crmStaffOAuthMode";
import {
  shouldSkipCrmStaffOAuthRedirectHandling,
  clearGmailHubOAuthPending,
} from "@/features/gmail/gmailHubOAuthReturn";
import { readStaffJoinPayload } from "@/features/auth/staffJoinPayload";
import { crmStaffOAuthSignInErrorFeedback } from "@/features/auth/crmStaffOAuthSignIn";
import { markStaffPushOnboardingPending } from "@/features/notifications/staffPushOnboarding";

/** Finalise OAuth redirect (Google / Apple) pour l'auth CRM staff. */
export default function CrmStaffAuthEffects() {
  const { t } = useTranslation();

  useEffect(() => {
    if (!auth || !isConfigured || typeof window === "undefined") return;

    void (async () => {
      if (shouldSkipCrmStaffOAuthRedirectHandling()) {
        clearGmailHubOAuthPending();
        return;
      }

      const pendingMode = peekCrmStaffOAuthMode();
      try {
        const result = await getRedirectResult(auth);
        if (!result?.user) {
          if (pendingMode) consumeCrmStaffOAuthMode();
          return;
        }
        if (!pendingMode) {
          logger.warn("[CrmStaffAuthEffects] redirect sans mode CRM — ignoré (OAuth Gmail ?)");
          return;
        }
        const mode = consumeCrmStaffOAuthMode();
        const staffJoin = readStaffJoinPayload();
        const outcome = await completeCrmStaffOAuthSession(result, mode, auth, staffJoin);
        if (outcome === "register") {
          markStaffPushOnboardingPending();
        }
        const providerId = result.providerId?.includes("apple") ? "apple" : "google";
        toast.success(
          String(
            outcome === "register"
              ? t("auth.register_success")
              : t(
                  providerId === "apple"
                    ? "auth.apple_signin_success"
                    : "auth.google_signin_success"
                )
          )
        );
      } catch (e) {
        if (pendingMode) consumeCrmStaffOAuthMode();
        logger.warn("[CrmStaffAuthEffects] getRedirectResult", {
          error: e instanceof Error ? e.message : String(e),
        });
        if (e instanceof CrmStaffOAuthModeError) {
          toast.error(
            String(
              t(
                e.code === "account_not_found"
                  ? "auth.oauth_account_not_found"
                  : "auth.oauth_account_already_exists"
              )
            )
          );
          return;
        }
        if (e instanceof CrmStaffJoinCompanyError) {
          toast.error(e.message);
          return;
        }
        const provider =
          e !== null &&
          typeof e === "object" &&
          "customData" in e &&
          (e as { customData?: { providerId?: string } }).customData?.providerId?.includes("apple")
            ? "apple"
            : "google";
        const { titleKey, descriptionKey } = crmStaffOAuthSignInErrorFeedback(provider, e);
        toast.error(String(t(titleKey)), {
          description: descriptionKey ? String(t(descriptionKey)) : undefined,
        });
      }
    })();
  }, [t]);

  return null;
}
