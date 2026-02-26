export type AdminFontId =
  | "playfair"
  | "cormorant"
  | "lora"
  | "merriweather"
  | "libre-baskerville"
  | "dm-serif"
  | "spectral"
  | "josefin"
  | "raleway"
  | "outfit";

export interface AdminFont {
  id: AdminFontId;
  label: string;
  /** CSS variable name set by next/font/google */
  variable: string;
  /** Fallback font stack */
  fallback: string;
  /** Preview text style hint */
  style: "serif" | "sans";
  /** Google Fonts URL for lazy-loading (omit for fonts already in the root layout) */
  googleFontsUrl?: string;
}

export const ADMIN_FONTS: AdminFont[] = [
  {
    id: "playfair",
    label: "Playfair Display",
    variable: "--font-playfair",
    fallback: "'Playfair Display', serif",
    style: "serif",
  },
  {
    id: "cormorant",
    label: "Cormorant Garamond",
    variable: "--font-cormorant",
    fallback: "'Cormorant Garamond', serif",
    style: "serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap",
  },
  {
    id: "lora",
    label: "Lora",
    variable: "--font-lora",
    fallback: "'Lora', serif",
    style: "serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap",
  },
  {
    id: "merriweather",
    label: "Merriweather",
    variable: "--font-merriweather",
    fallback: "'Merriweather', serif",
    style: "serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap",
  },
  {
    id: "libre-baskerville",
    label: "Libre Baskerville",
    variable: "--font-libre",
    fallback: "'Libre Baskerville', serif",
    style: "serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap",
  },
  {
    id: "dm-serif",
    label: "DM Serif Display",
    variable: "--font-dmserif",
    fallback: "'DM Serif Display', serif",
    style: "serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap",
  },
  {
    id: "spectral",
    label: "Spectral",
    variable: "--font-spectral",
    fallback: "'Spectral', serif",
    style: "serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Spectral:wght@400;600;700&display=swap",
  },
  {
    id: "josefin",
    label: "Josefin Sans",
    variable: "--font-josefin",
    fallback: "'Josefin Sans', sans-serif",
    style: "sans",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&display=swap",
  },
  {
    id: "raleway",
    label: "Raleway",
    variable: "--font-raleway",
    fallback: "'Raleway', sans-serif",
    style: "sans",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap",
  },
  {
    id: "outfit",
    label: "Outfit",
    variable: "--font-outfit",
    fallback: "'Outfit', sans-serif",
    style: "sans",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap",
  },
];

export const DEFAULT_FONT: AdminFontId = "cormorant";

/** CSS custom property that JS overrides to change the heading font globally */
export const FONT_CSS_VAR = "--font-heading";

export function getFontById(id: AdminFontId): AdminFont {
  return ADMIN_FONTS.find((f) => f.id === id) ?? ADMIN_FONTS[0];
}

/** Build the CSS value for the --font-heading override */
export function getFontCSSValue(font: AdminFont): string {
  // Fonts loaded via next/font set CSS variables; lazy-loaded fonts use direct family names
  if (font.googleFontsUrl) {
    return font.fallback;
  }
  return `var(${font.variable}), ${font.fallback}`;
}
