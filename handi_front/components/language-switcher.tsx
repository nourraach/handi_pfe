"use client";

import { useI18n } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, locales, setLocale, t } = useI18n();

  return (
    <label className="language-switcher">
      <span className="language-switcher-label">{t("common.language")}</span>
      <select
        className="language-switcher-select"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={t("common.language")}
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {t(`common.languages.${item}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
