"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/core/i18n/I18nContext";
import styles from "@/features/gmail/components/GmailGoogleConnectButton.module.css";

type Props = {
  onClick: () => void;
  disabled?: boolean;
  /** Surcharge accessibilité (ex. portail client). */
  ariaLabel?: string;
  dataTestId?: string;
};

const BRAND_ASSETS = {
  fr: {
    src: "/brand/google-sign-in-light-fr.svg",
    width: 228,
    height: 40,
  },
  en: {
    src: "/brand/google-sign-in-light-en.svg",
    width: 175,
    height: 40,
  },
  nl: {
    src: "/brand/google-sign-in-light-en.svg",
    width: 175,
    height: 40,
  },
  ru: {
    src: "/brand/google-sign-in-light-en.svg",
    width: 175,
    height: 40,
  },
} as const;

/** Délai court pour voir l’animation avant redirection OAuth. */
const PRESS_FEEDBACK_MS = 140;

/** Bouton Google pré-approuvé — connexion boîte Gmail (OAuth serveur, pas Firebase Auth CRM). */
export default function GmailGoogleConnectButton({
  onClick,
  disabled,
  ariaLabel,
  dataTestId = "gmail-hub-connect-btn",
}: Props) {
  const { t, language } = useTranslation();
  const label = ariaLabel ?? String(t("gmail.hub.connect_with_google"));
  const asset = BRAND_ASSETS[language] ?? BRAND_ASSETS.fr;
  const [pressed, setPressed] = useState(false);
  const pendingOAuthRef = useRef(false);

  const releasePress = useCallback(() => {
    if (!pendingOAuthRef.current) setPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled || pendingOAuthRef.current) return;
    pendingOAuthRef.current = true;
    setPressed(true);
    window.setTimeout(() => {
      onClick();
    }, PRESS_FEEDBACK_MS);
  }, [disabled, onClick]);

  return (
    <button
      type="button"
      data-testid={dataTestId}
      disabled={disabled}
      onClick={handleClick}
      onPointerDown={() => {
        if (!disabled) setPressed(true);
      }}
      onPointerUp={releasePress}
      onPointerLeave={releasePress}
      onPointerCancel={releasePress}
      className={`${styles.root}${pressed ? ` ${styles.pressed}` : ""}`}
      aria-label={label}
    >
      <Image
        src={asset.src}
        alt=""
        width={asset.width}
        height={asset.height}
        className={styles.asset}
        priority
        unoptimized
      />
    </button>
  );
}
