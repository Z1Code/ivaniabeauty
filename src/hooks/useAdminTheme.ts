"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type AdminThemeId,
  type AdminTheme,
  DEFAULT_THEME,
  getThemeById,
} from "@/lib/admin-themes";
import {
  type AdminFontId,
  DEFAULT_FONT,
  getFontById,
  getFontCSSValue,
  FONT_CSS_VAR,
} from "@/lib/admin-fonts";

const DARK_KEY = "admin-dark-mode";
const THEME_KEY = "admin-theme";
const FONT_KEY = "admin-heading-font";
const THEME_EVENT = "admin-theme-change";

function applyFont(fontId: AdminFontId) {
  const font = getFontById(fontId);
  document.documentElement.style.setProperty(FONT_CSS_VAR, getFontCSSValue(font));
}

export default function useAdminTheme() {
  const [isDark, setIsDark] = useState(false);
  const [themeId, setThemeId] = useState<AdminThemeId>(DEFAULT_THEME);
  const [fontId, setFontId] = useState<AdminFontId>(DEFAULT_FONT);

  // Initialize from localStorage
  useEffect(() => {
    const storedDark = localStorage.getItem(DARK_KEY);
    if (storedDark === "true") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }

    const storedTheme = localStorage.getItem(THEME_KEY) as AdminThemeId | null;
    if (storedTheme) {
      setThemeId(storedTheme);
    }

    const storedFont = localStorage.getItem(FONT_KEY) as AdminFontId | null;
    if (storedFont) {
      setFontId(storedFont);
    }
  }, []);

  // Listen for cross-tab (storage) and same-tab (custom event) changes
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === DARK_KEY) {
        const next = e.newValue === "true";
        setIsDark(next);
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      if (e.key === THEME_KEY && e.newValue) {
        setThemeId(e.newValue as AdminThemeId);
      }
      if (e.key === FONT_KEY && e.newValue) {
        setFontId(e.newValue as AdminFontId);
      }
    }

    function handleCustom(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.dark !== undefined) {
        setIsDark(detail.dark);
        if (detail.dark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      if (detail?.themeId) {
        setThemeId(detail.themeId);
      }
      if (detail?.fontId) {
        setFontId(detail.fontId);
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(THEME_EVENT, handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(THEME_EVENT, handleCustom);
    };
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem(DARK_KEY, String(next));
      window.dispatchEvent(
        new CustomEvent(THEME_EVENT, { detail: { dark: next } })
      );
      return next;
    });
  }, []);

  const setTheme = useCallback((id: AdminThemeId) => {
    setThemeId(id);
    localStorage.setItem(THEME_KEY, id);
    window.dispatchEvent(
      new CustomEvent(THEME_EVENT, { detail: { themeId: id } })
    );
  }, []);

  const setFont = useCallback((id: AdminFontId) => {
    setFontId(id);
    applyFont(id);
    localStorage.setItem(FONT_KEY, id);
    window.dispatchEvent(
      new CustomEvent(THEME_EVENT, { detail: { fontId: id } })
    );
  }, []);

  const theme: AdminTheme = getThemeById(themeId);

  return { isDark, toggleDark, themeId, setTheme, theme, fontId, setFont };
}
