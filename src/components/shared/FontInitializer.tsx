"use client";

import { useEffect } from "react";
import {
  type AdminFontId,
  getFontById,
  getFontCSSValue,
  FONT_CSS_VAR,
} from "@/lib/admin-fonts";

const FONT_KEY = "admin-heading-font";
const THEME_EVENT = "admin-theme-change";

function apply(fontId: AdminFontId) {
  const font = getFontById(fontId);
  document.documentElement.style.setProperty(FONT_CSS_VAR, getFontCSSValue(font));
}

export default function FontInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem(FONT_KEY) as AdminFontId | null;
    if (saved) apply(saved);

    function onStorage(e: StorageEvent) {
      if (e.key === FONT_KEY && e.newValue) apply(e.newValue as AdminFontId);
    }
    function onTheme(e: Event) {
      const id = (e as CustomEvent).detail?.fontId;
      if (id) apply(id as AdminFontId);
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(THEME_EVENT, onTheme);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(THEME_EVENT, onTheme);
    };
  }, []);

  return null;
}
