"use client";
import useLanguageStore from "@/stores/languageStore";

export default function LanguageToggle() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <div className="flex items-center rounded-full border border-rosa-light/40 overflow-hidden text-xs font-medium">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 transition-colors duration-200 cursor-pointer ${
          language === "en"
            ? "bg-rosa text-white"
            : "text-foreground/60 hover:text-rosa-dark"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("es")}
        className={`px-2.5 py-1 transition-colors duration-200 cursor-pointer ${
          language === "es"
            ? "bg-rosa text-white"
            : "text-foreground/60 hover:text-rosa-dark"
        }`}
      >
        ES
      </button>
    </div>
  );
}
