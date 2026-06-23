"use client";

import { useState } from "react";
import { sendSignInLinkToEmail, type User } from "firebase/auth";
import { toast } from "sonner";
import { clientPortalAuth } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { useDashboardPagerOptional } from "@/features/dashboard";
import {
  CLIENT_PORTAL_AUTH_SLOT_INDEX,
  EMAIL_LINK_STORAGE_KEY,
} from "@/features/auth/clientPortalConstants";
import { syncClientPortalProfile } from "@/features/auth/clientPortalProfile";
import {
  ClientPortalGoogleRedirectPending,
  clientPortalGoogleSignInErrorFeedback,
  signInClientPortalWithGoogle,
} from "@/features/auth/clientPortalGoogleSignIn";
import { useTranslation } from "@/core/i18n/I18nContext";
import { emailPasswordAuthErrorFeedback } from "@/features/auth/clientPortalEmailPasswordAuth";
import {
  registerClientPortalAccount,
  signInClientPortalWithVerifiedEmail,
} from "@/features/auth/clientPortalEmailVerification";
import { magicLinkSendErrorFeedback } from "@/features/auth/clientPortalMagicLinkFeedback";
import type { ClientPortalAuthTab } from "@/features/auth/hooks/useClientPortalAuthTypes";

type Args = {
  authRailMode: boolean;
  authTab: ClientPortalAuthTab;
  email: string;
  password: string;
  confirmPassword: string;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  user: User | null;
};

export function useClientPortalAuthSignIn({
  authRailMode,
  authTab,
  email,
  password,
  confirmPassword,
  setPassword,
  setConfirmPassword,
  user,
}: Args) {
  const pager = useDashboardPagerOptional();
  const { t } = useTranslation();
  const [emailAuthBusy, setEmailAuthBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const goDashboard = async () => {
    if (!user || !clientPortalAuth) return;
    await syncClientPortalProfile(user);
    pager?.setPageIndex(CLIENT_PORTAL_AUTH_SLOT_INDEX);
  };

  const handleGoogleSignIn = async () => {
    if (!clientPortalAuth || googleBusy) return;
    setGoogleBusy(true);
    try {
      const cred = await signInClientPortalWithGoogle(clientPortalAuth);
      await syncClientPortalProfile(cred.user);
      if (!authRailMode) {
        pager?.setPageIndex(CLIENT_PORTAL_AUTH_SLOT_INDEX);
      }
      toast.success(String(t("auth.google_signin_success")));
    } catch (e) {
      if (e instanceof ClientPortalGoogleRedirectPending) {
        toast.message(String(t("auth.google_redirect")));
        return;
      }
      logger.error("[ClientPortalAuthPanel] Google sign-in", {
        error: e instanceof Error ? e.message : String(e),
      });
      const { titleKey, descriptionKey } = clientPortalGoogleSignInErrorFeedback(e);
      toast.error(
        String(t(titleKey)),
        descriptionKey ? { description: String(t(descriptionKey)) } : undefined
      );
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleEmailPasswordSubmit = async () => {
    if (!clientPortalAuth || !email.trim()) {
      toast.error(t("auth.email_required"));
      return;
    }
    if (!password.trim()) {
      toast.error(String(t("auth.password_required")));
      return;
    }
    if (authTab === "register" && password !== confirmPassword) {
      toast.error(String(t("auth.password_mismatch")));
      return;
    }

    setEmailAuthBusy(true);
    try {
      if (authTab === "register") {
        await registerClientPortalAccount({
          auth: clientPortalAuth,
          email: email.trim(),
          password,
        });
        toast.success(String(t("auth.verification_email_sent")), {
          description: String(t("auth.verification_email_sent_hint")),
        });
      } else {
        const cred = await signInClientPortalWithVerifiedEmail({
          auth: clientPortalAuth,
          email: email.trim(),
          password,
        });
        await syncClientPortalProfile(cred.user);
        if (!authRailMode) {
          pager?.setPageIndex(CLIENT_PORTAL_AUTH_SLOT_INDEX);
        }
        toast.success(String(t("auth.signin_success")));
      }
      setPassword("");
      setConfirmPassword("");
    } catch (e) {
      logger.error("[ClientPortalAuthPanel] email/password auth", {
        error: e instanceof Error ? e.message : String(e),
      });
      const { titleKey, descriptionKey } = emailPasswordAuthErrorFeedback(e);
      toast.error(
        String(t(titleKey)),
        descriptionKey ? { description: String(t(descriptionKey)) } : undefined
      );
    } finally {
      setEmailAuthBusy(false);
    }
  };

  const sendMagicLink = async () => {
    if (!clientPortalAuth || !email.trim()) {
      toast.error(t("auth.email_required"));
      return;
    }
    setSending(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      await sendSignInLinkToEmail(clientPortalAuth, email.trim(), {
        url: `${origin}/`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email.trim());
      toast.success(t("auth.link_sent"), { description: t("auth.check_inbox") });
    } catch (e) {
      logger.error("[ClientPortalAuthPanel] sendSignInLinkToEmail", {
        error: e instanceof Error ? e.message : String(e),
      });
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { title, description } = magicLinkSendErrorFeedback(e, origin);
      toast.error(title, description ? { description } : undefined);
    } finally {
      setSending(false);
    }
  };

  return {
    emailAuthBusy,
    sending,
    googleBusy,
    goDashboard,
    handleGoogleSignIn,
    handleEmailPasswordSubmit,
    sendMagicLink,
  };
}
