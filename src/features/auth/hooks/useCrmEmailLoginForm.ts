"use client";

import { useState } from "react";
import { toast } from "sonner";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { useTranslation } from "@/core/i18n/I18nContext";
import { emailPasswordAuthErrorFeedback } from "@/features/auth/clientPortalEmailPasswordAuth";
import {
  CrmStaffJoinCompanyError,
  registerCrmStaffAccount,
  syncDefaultCompanyMembershipAfterLogin,
} from "@/features/auth/crmEmailRegister";
import {
  persistStaffJoinPayload,
  staffJoinPayloadFromVariant,
} from "@/features/auth/staffJoinPayload";
import {
  signInTechnicianWithEmail,
  technicianEmailSignInErrorFeedback,
} from "@/features/auth/technicianEmailSignIn";
import type { CrmEmailAuthTab, CrmEmailLoginVariant } from "@/features/auth/crmEmailLoginVariant";
import { useCrmStaffOAuth } from "@/features/auth/hooks/useCrmStaffOAuth";

type Args = {
  variant: CrmEmailLoginVariant;
};

export function useCrmEmailLoginForm({ variant }: Args) {
  const { t } = useTranslation();
  const [authTab, setAuthTab] = useState<CrmEmailAuthTab>("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const { googleBusy, appleBusy, oauthBusy, handleGoogleSignIn, handleAppleSignIn } =
    useCrmStaffOAuth({ variant, authTab, onInlineError: setInlineError });

  const logLabel = variant === "technician" ? "TechnicianLoginPanel" : "AdminLoginPanel";
  const showTechnicianProfileFields = variant === "technician" && authTab === "register";
  const submitting = busy || resetting || oauthBusy;

  const authErrorMessage = (e: unknown, mode: "login" | "register") => {
    const feedback =
      mode === "login" ? technicianEmailSignInErrorFeedback(e) : emailPasswordAuthErrorFeedback(e);
    const { titleKey, descriptionKey } = feedback;
    return descriptionKey
      ? `${String(t(titleKey))} — ${String(t(descriptionKey))}`
      : String(t(titleKey));
  };

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
    if (authTab === "register" && password !== confirmPassword) {
      setInlineError(String(t("auth.password_mismatch")));
      return;
    }
    if (showTechnicianProfileFields && !firstName.trim()) {
      setInlineError(String(t("auth.first_name_required")));
      return;
    }
    if (showTechnicianProfileFields && !lastName.trim()) {
      setInlineError(String(t("auth.last_name_required")));
      return;
    }

    const staffJoin = staffJoinPayloadFromVariant(variant, {
      firstName,
      lastName,
      email,
    });
    persistStaffJoinPayload(staffJoin);

    setBusy(true);
    try {
      if (authTab === "register") {
        await registerCrmStaffAccount({ auth, email, password, staffJoin });
        toast.success(String(t("auth.register_success")));
      } else {
        const cred = await signInTechnicianWithEmail({ auth, email, password });
        await syncDefaultCompanyMembershipAfterLogin(cred, staffJoin);
        toast.success(String(t("auth.signin_success")));
      }
    } catch (e) {
      logger.error(`[${logLabel}] ${authTab} failed`, {
        error: e instanceof Error ? e.message : String(e),
      });
      if (e instanceof CrmStaffJoinCompanyError) {
        setInlineError(e.message);
      } else {
        setInlineError(authErrorMessage(e, authTab));
      }
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
      logger.error(`[${logLabel}] reset failed`, {
        error: e instanceof Error ? e.message : String(e),
      });
      setInlineError(String(t("auth.reset_email_failed")));
    } finally {
      setResetting(false);
    }
  };

  const handleAuthTabChange = (id: string) => {
    setAuthTab(id as CrmEmailAuthTab);
    setInlineError(null);
  };

  return {
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
    googleBusy,
    appleBusy,
    handleSubmit,
    handleForgot,
    handleAuthTabChange,
    handleGoogleSignIn,
    handleAppleSignIn,
  };
}
