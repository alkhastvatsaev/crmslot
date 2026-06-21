"use client";

import { motion } from "framer-motion";
import { useTranslation, type Language } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";

const languages: { code: Language; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "nl", label: "NL" },
  { code: "ru", label: "RU" },
];

type Props = {
  variant?: "desktop" | "mobile";
};

export default function DashboardLanguageSelector({ variant = "desktop" }: Props) {
  const { language, setLanguage, t } = useTranslation();
  const isDesktop = variant === "desktop";

  return (
    <div
      data-testid="dashboard-language-selector"
      className={cn(
        "dashboard-page-selector-language",
        isDesktop
          ? "dashboard-page-selector-language--desktop"
          : "dashboard-page-selector-language--mobile"
      )}
    >
      <div
        className="dashboard-page-selector-language-control"
        role="group"
        aria-label={t("mobile.language_heading")}
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            data-testid={`dashboard-language-${lang.code}`}
            aria-pressed={language === lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "dashboard-page-selector-language-option",
              language === lang.code && "dashboard-page-selector-language-option--active"
            )}
          >
            {language === lang.code ? (
              <motion.span
                layoutId={`dashboard-active-language-${variant}`}
                className="dashboard-page-selector-language-option-bg"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            ) : null}
            <span className="relative z-10 tracking-wide">{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
