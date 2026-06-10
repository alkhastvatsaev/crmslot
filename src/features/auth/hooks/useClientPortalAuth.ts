"use client";

import { useEffect, useRef, useState } from "react";
import {
  sendSignInLinkToEmail,
  type MultiFactorResolver,
  type RecaptchaVerifier,
} from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
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
import {
  completePhoneMfa,
  completeTotpMfa,
  createInvisibleRecaptcha,
  mfaHintKind,
  sendPhoneMfaSms,
} from "@/features/auth/clientPortalPasswordMfa";

/** Messages explicites — Firebase renvoie souvent auth/operation-not-allowed ou unauthorized-continue-uri. */
export function magicLinkSendErrorFeedback(
  e: unknown,
  continueOrigin: string
): { title: string; description?: string } {
  const code =
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string"
      ? (e as { code: string }).code
      : "";
  switch (code) {
    case "auth/operation-not-allowed":
      return {
        title: "Connexion par lien non activée",
        description:
          "Firebase Console → Authentication → Méthode de connexion → E-mail : activer « Lien par e-mail (connexion sans mot de passe) ».",
      };
    case "auth/unauthorized-continue-uri":
    case "auth/invalid-continue-uri":
      return {
        title: "Domaine non autorisé pour le lien",
        description: `Ajoutez ce domaine dans Authentication → Paramètres → Domaines autorisés : ${continueOrigin}`,
      };
    case "auth/invalid-email":
      return { title: "Adresse e-mail invalide" };
    case "auth/missing-email":
      return { title: "Saisissez une adresse e-mail" };
    case "auth/too-many-requests":
      return {
        title: "Trop de demandes",
        description: "Réessayez dans quelques minutes.",
      };
    default:
      return {
        title: "Envoi impossible",
        description: code ? code : undefined,
      };
  }
}

export type UseClientPortalAuthOptions = {
  authRailMode: boolean;
};

export function useClientPortalAuth({ authRailMode }: UseClientPortalAuthOptions) {
  const pager = useDashboardPagerOptional();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaHintIndex] = useState(0);
  const [phoneVerificationId, setPhoneVerificationId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const user = auth?.currentUser ?? null;

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

  const goDashboard = async () => {
    if (!user || !auth) return;
    await syncClientPortalProfile(user);
    pager?.setPageIndex(CLIENT_PORTAL_AUTH_SLOT_INDEX);
  };

  const handleGoogleSignIn = async () => {
    if (!auth || googleBusy) return;
    setGoogleBusy(true);
    try {
      const cred = await signInClientPortalWithGoogle(auth);
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

  const sendMagicLink = async () => {
    if (!auth || !email.trim()) {
      toast.error(t("auth.email_required"));
      return;
    }
    setSending(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      if (authRailMode) {
        const demoLink = `${origin}/?demo_login=${encodeURIComponent(email.trim())}`;
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(demoLink);
          } else {
            const textArea = document.createElement("textarea");
            textArea.value = demoLink;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand("copy");
            textArea.remove();
          }
          toast.success("Lien copié dans le presse-papier !", {
            description: "Prêt à être collé pour la démo.",
          });
        } catch (clipboardErr) {
          logger.error("Clipboard error", {
            error: clipboardErr instanceof Error ? clipboardErr.message : String(clipboardErr),
          });
          toast.success("Lien de démo généré : " + demoLink);
        }
      } else {
        await sendSignInLinkToEmail(auth, email.trim(), {
          url: `${origin}/`,
          handleCodeInApp: true,
        });
        window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email.trim());
        toast.success(t("auth.link_sent"), { description: t("auth.check_inbox") });
      }
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

  const getOrCreateInvisibleRecaptcha = (): RecaptchaVerifier => {
    if (!auth) throw new Error("auth");
    if (!recaptchaRef.current) {
      recaptchaRef.current = createInvisibleRecaptcha(auth, "client-portal-recaptcha-container");
    }
    return recaptchaRef.current;
  };

  const handleSendPhoneMfa = async () => {
    if (!auth || !mfaResolver) return;
    setMfaBusy(true);
    try {
      const verifier = getOrCreateInvisibleRecaptcha();
      const vid = await sendPhoneMfaSms(auth, mfaResolver, mfaHintIndex, verifier);
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
    // state
    email,
    setEmail,
    sending,
    googleBusy,
    mfaResolver,
    mfaHintIndex,
    phoneVerificationId,
    mfaCode,
    setMfaCode,
    mfaBusy,
    user,
    // actions
    goDashboard,
    handleGoogleSignIn,
    sendMagicLink,
    handleSendPhoneMfa,
    handleConfirmMfa,
    resetMfaUi,
  };
}
