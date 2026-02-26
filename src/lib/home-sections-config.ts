export type HeroEffectIntensity = "soft" | "medium" | "intense";

export interface HomeSectionsSettings {
  showCollections: boolean;
  showFeaturedProduct: boolean;
  showSizeQuiz: boolean;
  showTikTok: boolean;
  showInstagram: boolean;
  heroEffectIntensity: HeroEffectIntensity;
}

export const HOME_SECTIONS_STORAGE_KEY = "ivania_settings_home_sections";
export const HOME_SECTIONS_UPDATED_EVENT = "ivania:home-sections-updated";

export const HERO_EFFECT_INTENSITY_OPTIONS: HeroEffectIntensity[] = [
  "soft",
  "medium",
  "intense",
];

export const DEFAULT_HOME_SECTIONS_SETTINGS: HomeSectionsSettings = {
  showCollections: true,
  showFeaturedProduct: true,
  showSizeQuiz: true,
  showTikTok: true,
  showInstagram: true,
  heroEffectIntensity: "medium",
};

function isHeroEffectIntensity(value: unknown): value is HeroEffectIntensity {
  return (
    typeof value === "string" &&
    HERO_EFFECT_INTENSITY_OPTIONS.includes(value as HeroEffectIntensity)
  );
}

export function sanitizeHomeSectionsSettings(input: unknown): HomeSectionsSettings {
  if (!input || typeof input !== "object") {
    return DEFAULT_HOME_SECTIONS_SETTINGS;
  }

  const candidate = input as Partial<HomeSectionsSettings>;

  return {
    showCollections:
      typeof candidate.showCollections === "boolean"
        ? candidate.showCollections
        : DEFAULT_HOME_SECTIONS_SETTINGS.showCollections,
    showFeaturedProduct:
      typeof candidate.showFeaturedProduct === "boolean"
        ? candidate.showFeaturedProduct
        : DEFAULT_HOME_SECTIONS_SETTINGS.showFeaturedProduct,
    showSizeQuiz:
      typeof candidate.showSizeQuiz === "boolean"
        ? candidate.showSizeQuiz
        : DEFAULT_HOME_SECTIONS_SETTINGS.showSizeQuiz,
    showTikTok:
      typeof candidate.showTikTok === "boolean"
        ? candidate.showTikTok
        : DEFAULT_HOME_SECTIONS_SETTINGS.showTikTok,
    showInstagram:
      typeof candidate.showInstagram === "boolean"
        ? candidate.showInstagram
        : DEFAULT_HOME_SECTIONS_SETTINGS.showInstagram,
    heroEffectIntensity: isHeroEffectIntensity(candidate.heroEffectIntensity)
      ? candidate.heroEffectIntensity
      : DEFAULT_HOME_SECTIONS_SETTINGS.heroEffectIntensity,
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
