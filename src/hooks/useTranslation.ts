"use client";
import useLanguageStore from "@/stores/languageStore";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";

const translations: Record<string, typeof en> = { en, es };

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const dict = translations[language] ?? en;

  function t(key: string): string {
    const keys = key.split(".");
    let result: unknown = dict;
    for (const k of keys) {
      if (result && typeof result === "object" && k in result) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    return typeof result === "string" ? result : key;
  }

  return { t, language };
}
