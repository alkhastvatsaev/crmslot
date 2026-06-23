"use client";

import { useEffect, useState } from "react";
import { clientPortalAuth } from "@/core/config/firebase";
import { magicLinkSendErrorFeedback } from "@/features/auth/clientPortalMagicLinkFeedback";
import { useClientPortalAuthMfa } from "@/features/auth/hooks/useClientPortalAuthMfa";
import { useClientPortalAuthSignIn } from "@/features/auth/hooks/useClientPortalAuthSignIn";
import type {
  ClientPortalAuthTab,
  UseClientPortalAuthOptions,
} from "@/features/auth/hooks/useClientPortalAuthTypes";

export type { ClientPortalAuthTab, UseClientPortalAuthOptions };
export { magicLinkSendErrorFeedback };

export function useClientPortalAuth({
  authRailMode,
  authTab: authTabProp,
}: UseClientPortalAuthOptions) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authTab, setAuthTab] = useState<ClientPortalAuthTab>("login");
  const user = clientPortalAuth?.currentUser ?? null;

  useEffect(() => {
    if (authTabProp) {
      setAuthTab(authTabProp);
    }
  }, [authTabProp]);

  const signIn = useClientPortalAuthSignIn({
    authRailMode,
    authTab,
    email,
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    user,
  });

  const mfa = useClientPortalAuthMfa();

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    authTab,
    setAuthTab,
    emailAuthBusy: signIn.emailAuthBusy,
    sending: signIn.sending,
    googleBusy: signIn.googleBusy,
    mfaResolver: mfa.mfaResolver,
    mfaHintIndex: mfa.mfaHintIndex,
    phoneVerificationId: mfa.phoneVerificationId,
    mfaCode: mfa.mfaCode,
    setMfaCode: mfa.setMfaCode,
    mfaBusy: mfa.mfaBusy,
    user,
    goDashboard: signIn.goDashboard,
    handleGoogleSignIn: signIn.handleGoogleSignIn,
    handleEmailPasswordSubmit: signIn.handleEmailPasswordSubmit,
    sendMagicLink: signIn.sendMagicLink,
    handleSendPhoneMfa: mfa.handleSendPhoneMfa,
    handleConfirmMfa: mfa.handleConfirmMfa,
    resetMfaUi: mfa.resetMfaUi,
  };
}
