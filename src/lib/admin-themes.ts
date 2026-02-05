export type AdminThemeId = "rosa-suave" | "pizarra" | "bosque" | "grafito";

export interface AdminTheme {
  id: AdminThemeId;
  label: string;
  gradient: string;
  accent: string;
  /** Pre-computed darker shade for gradient preview */
  accentDark: string;
}

export const ADMIN_THEMES: AdminTheme[] = [
  {
    id: "rosa-suave",
    label: "Rosa Suave",
    gradient: "bg-gradient-to-b from-[#8B5A6B] to-[#6B3F50]",
    accent: "#8B5A6B",
    accentDark: "#6B3F50",
  },
  {
    id: "pizarra",
    label: "Pizarra",
    gradient: "bg-gradient-to-b from-[#475569] to-[#334155]",
    accent: "#475569",
    accentDark: "#334155",
  },
  {
    id: "bosque",
    label: "Bosque",
    gradient: "bg-gradient-to-b from-[#3D6B5E] to-[#2D4F44]",
    accent: "#3D6B5E",
    accentDark: "#2D4F44",
  },
  {
    id: "grafito",
    label: "Grafito",
    gradient: "bg-gradient-to-b from-[#3F3F46] to-[#27272A]",
    accent: "#3F3F46",
    accentDark: "#27272A",
  },
];

export const DEFAULT_THEME: AdminThemeId = "rosa-suave";

export function getThemeById(id: AdminThemeId): AdminTheme {
  return ADMIN_THEMES.find((t) => t.id === id) ?? ADMIN_THEMES[0];
}
