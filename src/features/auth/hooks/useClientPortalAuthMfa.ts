"use client";

import { useEffect, useRef, useState } from "react";
import type { MultiFactorResolver, RecaptchaVerifier } from "firebase/auth";
import { toast } from "sonner";
import { clientPortalAuth } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import {
  completePhoneMfa,
  completeTotpMfa,
  createInvisibleRecaptcha,
  mfaHintKind,
  sendPhoneMfaSms,
} from "@/features/auth/clientPortalPasswordMfa";

export function useClientPortalAuthMfa() {
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaHintIndex] = useState(0);
  const [phoneVerificationId, setPhoneVerificationId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const clearRecaptcha = () => {
    try {
      recaptchaRef.current?.clear();
    } catch {
      /* ignore */
    }
    recaptchaRef.current = null;
  };

  const resetMfaUi = () => {
    clearRecaptcha();
    setMfaResolver(null);
    setPhoneVerificationId(null);
    setMfaCode("");
    setMfaBusy(false);
  };

  useEffect(() => () => clearRecaptcha(), []);

  const getOrCreateInvisibleRecaptcha = (): RecaptchaVerifier => {
    if (!clientPortalAuth) throw new Error("clientPortalAuth");
    if (!recaptchaRef.current) {
      recaptchaRef.current = createInvisibleRecaptcha(
        clientPortalAuth,
        "client-portal-recaptcha-container"
      );
    }
    return recaptchaRef.current;
  };

  const handleSendPhoneMfa = async () => {
    if (!clientPortalAuth || !mfaResolver) return;
    setMfaBusy(true);
    try {
      const verifier = getOrCreateInvisibleRecaptcha();
      const vid = await sendPhoneMfaSms(clientPortalAuth, mfaResolver, mfaHintIndex, verifier);
      setPhoneVerificationId(vid);
      toast.success("SMS envoyé");
    } catch (e) {
      logger.error("Envoi SMS impossible", { error: e instanceof Error ? e.message : String(e) });
      toast.error("Envoi SMS impossible (domaine autorisé & reCAPTCHA)");
    } finally {
      setMfaBusy(false);
    }
  };

  const handleConfirmMfa = async () => {
    if (!mfaResolver || !mfaCode.trim()) {
      toast.error("Saisissez le code 2FA");
      return;
    }
    const hint = mfaResolver.hints[mfaHintIndex];
    if (!hint) {
      toast.error("Second facteur inconnu");
      return;
    }
    const kind = mfaHintKind(hint);
    setMfaBusy(true);
    try {
      if (kind === "totp") {
        await completeTotpMfa(mfaResolver, hint.uid, mfaCode);
      } else if (kind === "phone") {
        if (!phoneVerificationId) {
          toast.error("Demandez d'abord le SMS");
          return;
        }
        await completePhoneMfa(mfaResolver, phoneVerificationId, mfaCode);
      } else {
        toast.error("Type de 2FA non pris en charge");
        return;
      }
      toast.success("Connexion réussie");
      resetMfaUi();
    } catch (e) {
      logger.error("Code 2FA incorrect ou expiré", {
        error: e instanceof Error ? e.message : String(e),
      });
      toast.error("Code 2FA incorrect ou expiré");
    } finally {
      setMfaBusy(false);
    }
  };

  return {
    mfaResolver,
    mfaHintIndex,
    phoneVerificationId,
    mfaCode,
    setMfaCode,
    mfaBusy,
    handleSendPhoneMfa,
    handleConfirmMfa,
    resetMfaUi,
  };
}
