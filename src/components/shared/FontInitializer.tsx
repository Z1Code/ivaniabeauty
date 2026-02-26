"use client";

import { useEffect } from "react";
import {
  type AdminFontId,
  getFontById,
  FONT_CSS_VAR,
} from "@/lib/admin-fonts";

const FONT_KEY = "admin-heading-font";
const THEME_EVENT = "admin-theme-change";

const loadedFonts = new Set<string>();

function loadGoogleFont(url: string) {
  if (loadedFonts.has(url)) return;
  loadedFonts.add(url);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

function apply(fontId: AdminFontId) {
  const font = getFontById(fontId);
  if (font.googleFontsUrl) {
    loadGoogleFont(font.googleFontsUrl);
  }
  document.documentElement.style.setProperty(FONT_CSS_VAR, font.fallback);
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
