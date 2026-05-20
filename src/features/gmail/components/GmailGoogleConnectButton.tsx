"use client";

import Image from "next/image";
import { useTranslation } from "@/core/i18n/I18nContext";
import styles from "@/features/gmail/components/GmailGoogleConnectButton.module.css";

type Props = {
  onClick: () => void;
  disabled?: boolean;
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
} as const;

/** Bouton Google pré-approuvé (asset officiel) — clic → OAuth BELGMAP. */
export default function GmailGoogleConnectButton({ onClick, disabled }: Props) {
  const { t, language } = useTranslation();
  const label = String(t("gmail.hub.connect_with_google"));
  const asset = BRAND_ASSETS[language] ?? BRAND_ASSETS.fr;

  return (
    <button
      type="button"
      data-testid="gmail-hub-connect-btn"
      disabled={disabled}
      onClick={onClick}
      className={styles.root}
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
