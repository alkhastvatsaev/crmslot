"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import fr from "./locales/fr.json";
import en from "./locales/en.json";
import nl from "./locales/nl.json";
import ru from "./locales/ru.json";

export type Language = "fr" | "en" | "nl" | "ru";

type Translations = Record<string, unknown>;

export type I18nValue = string | number | boolean | string[];

const dictionaries: Record<Language, Translations> = {
  fr,
  en,
  nl,
  ru,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Chaîne pour JSX, labels, toasts. */
  t: (key: string) => string;
  /** Valeur brute (ex. tableau `calendar.weekdays_initials`). */
  tValue: (key: string) => I18nValue;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function resolveTranslationRaw(dict: Translations, key: string): I18nValue {
  const keys = key.split(".");
  let result: unknown = dict;
  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  if (typeof result === "string" || typeof result === "number" || typeof result === "boolean") {
    return result;
  }
  if (Array.isArray(result) && result.every((item) => typeof item === "string")) {
    return result as string[];
  }
  return key;
}

function resolveTranslation(dict: Translations, key: string): string {
  const raw = resolveTranslationRaw(dict, key);
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  return key;
}

function buildI18nApi(language: Language): Pick<I18nContextType, "t" | "tValue"> {
  const dict = dictionaries[language];
  return {
    t: (key: string) => resolveTranslation(dict, key),
    tValue: (key: string) => resolveTranslationRaw(dict, key),
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    const storedLang = localStorage.getItem("crmslot_lang") as Language;
    if (storedLang && ["fr", "en", "nl", "ru"].includes(storedLang)) {
      setLanguageState(storedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("crmslot_lang", lang);
    }
  };

  const { t, tValue } = buildI18nApi(language);

  if (!isClient) {
    const frApi = buildI18nApi("fr");
    return (
      <I18nContext.Provider value={{ language: "fr", setLanguage, ...frApi }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, tValue }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
