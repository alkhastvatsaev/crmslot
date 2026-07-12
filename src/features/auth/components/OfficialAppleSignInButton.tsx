"use client";

import { useEffect, useRef } from "react";
import type { UserCredential } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import AppleSignInConnectButton from "@/features/auth/components/AppleSignInConnectButton";
import {
  bindAppleWebSignInEvents,
  completeAppleWebSignInFromIdToken,
  prepareAppleWebSignInButton,
} from "@/features/auth/oauth/appleWebSignIn";
import { canUseAppleIdentityButton } from "@/features/auth/oauth/resolveOAuthClientIds";
import styles from "@/features/auth/components/OfficialOAuthSdkButton.module.css";

type Props = {
  /** Fallback popup Firebase (sans Services ID Apple). */
  onAppleSignIn: () => void;
  /** Après credential Firebase (SDK Apple natif). */
  onAppleSignedIn: (cred: UserCredential) => void | Promise<void>;
  onAppleError: (error: unknown) => void;
  disabled?: boolean;
  busy?: boolean;
  ariaLabel?: string;
  dataTestId?: string;
};

/** Bouton Apple rendu par Apple JS SDK — popup système Touch ID. */
export default function OfficialAppleSignInButton({
  onAppleSignIn,
  onAppleSignedIn,
  onAppleError,
  disabled,
  busy,
  ariaLabel,
  dataTestId = "apple-sign-in-btn",
}: Props) {
  const { language } = useTranslation();
  const hostRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef<string | null>(null);
  const useSdk = canUseAppleIdentityButton();

  useEffect(() => {
    if (!useSdk || !hostRef.current || disabled) return;
    let cleanupButton: (() => void) | undefined;
    let cancelled = false;

    void prepareAppleWebSignInButton(hostRef.current, language)
      .then((session) => {
        if (cancelled) {
          session.cleanup();
          return;
        }
        nonceRef.current = session.rawNonce;
        cleanupButton = session.cleanup;
      })
      .catch((error) => onAppleError(error));

    const cleanupEvents = bindAppleWebSignInEvents({
      onSuccess: (idToken) => {
        if (!auth || !nonceRef.current) {
          onAppleError(new Error("firebase_auth_unavailable"));
          return;
        }
        void completeAppleWebSignInFromIdToken(auth, idToken, nonceRef.current)
          .then((cred) => onAppleSignedIn(cred))
          .catch((error) => onAppleError(error));
      },
      onFailure: (error) => onAppleError(error),
    });

    return () => {
      cancelled = true;
      cleanupEvents?.();
      cleanupButton?.();
      nonceRef.current = null;
    };
  }, [disabled, language, onAppleError, onAppleSignedIn, useSdk]);

  if (!useSdk) {
    return (
      <AppleSignInConnectButton
        onClick={onAppleSignIn}
        disabled={disabled}
        busy={busy}
        ariaLabel={ariaLabel}
        dataTestId={dataTestId}
      />
    );
  }

  return (
    <div
      className={styles.host}
      data-testid={dataTestId}
      data-oauth-sdk="apple"
      aria-busy={busy}
      aria-disabled={disabled}
    >
      <div
        ref={hostRef}
        className={`${styles.appleMount}${disabled ? ` ${styles.disabled}` : ""}`}
      />
      {busy ? (
        <span className={styles.busyOverlayDark} aria-hidden>
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </span>
      ) : null}
    </div>
  );
}
