"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import OfficialBrandSignInButton from "@/features/auth/components/OfficialBrandSignInButton";

type Props = {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
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

/** Bouton Sign in with Google (asset officiel) — pleine largeur. */
export default function GoogleSignInConnectButton({
  onClick,
  disabled,
  busy,
  ariaLabel,
  dataTestId = "google-sign-in-btn",
}: Props) {
  const { t, language } = useTranslation();
  const label = ariaLabel ?? String(t("auth.continue_with_google"));
  const asset = BRAND_ASSETS[language] ?? BRAND_ASSETS.fr;

  return (
    <OfficialBrandSignInButton
      src={asset.src}
      width={asset.width}
      height={asset.height}
      ariaLabel={label}
      dataTestId={dataTestId}
      onClick={onClick}
      disabled={disabled}
      busy={busy}
    />
  );
}
