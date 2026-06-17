"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import OfficialBrandSignInButton from "@/features/auth/components/OfficialBrandSignInButton";

type Props = {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  dataTestId?: string;
};

const BRAND_ASSETS = {
  fr: {
    src: "/brand/apple-sign-in-black-fr.svg",
    width: 228,
    height: 40,
  },
  en: {
    src: "/brand/apple-sign-in-black-en.svg",
    width: 200,
    height: 40,
  },
  nl: {
    src: "/brand/apple-sign-in-black-nl.svg",
    width: 210,
    height: 40,
  },
} as const;

/** Bouton Sign in with Apple (asset conforme HIG) — noir, logo Apple officiel. */
export default function AppleSignInConnectButton({
  onClick,
  disabled,
  ariaLabel,
  dataTestId = "apple-sign-in-btn",
}: Props) {
  const { t, language } = useTranslation();
  const label = ariaLabel ?? String(t("auth.continue_with_apple"));
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
    />
  );
}
