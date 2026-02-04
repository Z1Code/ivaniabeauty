"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "es";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
    }),
    { name: "ivania-language" }
  )
);

export default useLanguageStore;
