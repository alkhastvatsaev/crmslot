"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import GoogleSignInConnectButton from "@/features/auth/components/GoogleSignInConnectButton";
import { mountGoogleIdentityButton } from "@/features/auth/oauth/mountGoogleIdentityButton";
import { canUseGoogleIdentityButton } from "@/features/auth/oauth/resolveOAuthClientIds";
import styles from "@/features/auth/components/OfficialOAuthSdkButton.module.css";

type Props = {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  ariaLabel?: string;
  dataTestId?: string;
};

/** Bouton Google rendu par Google Identity Services (officiel) ou fallback SVG. */
export default function OfficialGoogleSignInButton({
  onClick,
  disabled,
  busy,
  ariaLabel,
  dataTestId = "google-sign-in-btn",
}: Props) {
  const { language } = useTranslation();
  const hostRef = useRef<HTMLDivElement>(null);
  const useSdk = canUseGoogleIdentityButton();

  useEffect(() => {
    if (!useSdk || !hostRef.current || disabled) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void mountGoogleIdentityButton(hostRef.current, {
      locale: language,
      width: hostRef.current.offsetWidth || 320,
      onClick,
    })
      .then((dispose) => {
        if (cancelled) dispose();
        else cleanup = dispose;
      })
      .catch(() => {
        /* fallback SVG géré par le rendu conditionnel */
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [disabled, language, onClick, useSdk]);

  if (!useSdk) {
    return (
      <GoogleSignInConnectButton
        onClick={onClick}
        disabled={disabled}
        busy={busy}
        ariaLabel={ariaLabel}
        dataTestId={dataTestId}
      />
    );
  }

  return (
    <div className={styles.host} data-testid={dataTestId} data-oauth-sdk="google" aria-busy={busy}>
      <div ref={hostRef} className={styles.googleMount} />
      {busy ? (
        <span className={styles.busyOverlay} aria-hidden>
          <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
        </span>
      ) : null}
    </div>
  );
}
