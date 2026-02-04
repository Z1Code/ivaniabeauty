"use client";
import { useEffect } from "react";
import useLanguageStore from "@/stores/languageStore";

export default function LanguageInitializer() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  useEffect(() => {
    // On first visit (no stored preference), detect browser language
    const stored = localStorage.getItem("ivania-language");
    if (!stored) {
      const browserLang = navigator.language || "en";
      if (browserLang.startsWith("es")) {
        setLanguage("es");
      }
    }
  }, [setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
