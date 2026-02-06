export interface HomeSectionsSettings {
  showTikTok: boolean;
  showInstagram: boolean;
}

export const HOME_SECTIONS_STORAGE_KEY = "ivania_settings_home_sections";
export const HOME_SECTIONS_UPDATED_EVENT = "ivania:home-sections-updated";

export const DEFAULT_HOME_SECTIONS_SETTINGS: HomeSectionsSettings = {
  showTikTok: true,
  showInstagram: true,
};

export function sanitizeHomeSectionsSettings(input: unknown): HomeSectionsSettings {
  if (!input || typeof input !== "object") {
    return DEFAULT_HOME_SECTIONS_SETTINGS;
  }

  const candidate = input as Partial<HomeSectionsSettings>;

  return {
    showTikTok:
      typeof candidate.showTikTok === "boolean"
        ? candidate.showTikTok
        : DEFAULT_HOME_SECTIONS_SETTINGS.showTikTok,
    showInstagram:
      typeof candidate.showInstagram === "boolean"
        ? candidate.showInstagram
        : DEFAULT_HOME_SECTIONS_SETTINGS.showInstagram,
  };
}

export function parseHomeSectionsSettings(
  raw: string | null | undefined
): HomeSectionsSettings {
  if (!raw) {
    return DEFAULT_HOME_SECTIONS_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeHomeSectionsSettings(parsed);
  } catch {
    return DEFAULT_HOME_SECTIONS_SETTINGS;
  }
}
