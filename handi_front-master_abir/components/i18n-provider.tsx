"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultLocale, getTranslation, isLocale, localeDirection, locales, type Locale } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  locales: readonly Locale[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "handitalents_locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored && isLocale(stored)) {
      setLocaleState(stored);
      return;
    }

    const browser = typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : "";
    if (isLocale(browser)) {
      setLocaleState(browser);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, locale);
    }

    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection[locale];
    document.body.dir = localeDirection[locale];
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: localeDirection[locale],
      setLocale: (nextLocale) => setLocaleState(nextLocale),
      t: (key, replacements) => getTranslation(locale, key, replacements),
      locales,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }
  return context;
}
