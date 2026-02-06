export const CARD_BACKGROUND_SETTINGS_STORAGE_KEY =
  "ivania_settings_card_backgrounds";
export const CARD_BACKGROUND_SETTINGS_UPDATED_EVENT =
  "ivania:card-background-settings-updated";

export type CardBackgroundPresetType = "gradient" | "color" | "image";

export interface CardBackgroundPreset {
  id: string;
  label: string;
  type: CardBackgroundPresetType;
  cssValue?: string;
  imageUrl?: string;
  builtIn?: boolean;
  createdAt?: number;
}

export interface CardBackgroundSettings {
  enabled: boolean;
  allowPerCardSelector: boolean;
  defaultPresetId: string;
  presets: CardBackgroundPreset[];
}

const BUILT_IN_CARD_PRESETS: CardBackgroundPreset[] = [
  {
    id: "neutral",
    label: "Neutral",
    type: "gradient",
    cssValue: "linear-gradient(180deg, #ffffff 0%, #f4f6f9 100%)",
    builtIn: true,
  },
  {
    id: "warm",
    label: "Warm",
    type: "gradient",
    cssValue: "linear-gradient(180deg, #fff8f0 0%, #ffe9d6 100%)",
    builtIn: true,
  },
  {
    id: "cool",
    label: "Cool",
    type: "gradient",
    cssValue: "linear-gradient(180deg, #f4f9ff 0%, #dfeeff 100%)",
    builtIn: true,
  },
  {
    id: "rose",
    label: "Rose",
    type: "gradient",
    cssValue: "linear-gradient(180deg, #fff4f7 0%, #ffdce8 100%)",
    builtIn: true,
  },
];

export const DEFAULT_CARD_BACKGROUND_SETTINGS: CardBackgroundSettings = {
  enabled: true,
  allowPerCardSelector: true,
  defaultPresetId: "neutral",
  presets: BUILT_IN_CARD_PRESETS,
};

function normalizeLabel(input: string, fallback: string): string {
  const trimmed = input.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, 40);
}

function sanitizePreset(
  input: unknown,
  fallback: CardBackgroundPreset
): CardBackgroundPreset | null {
  if (!input || typeof input !== "object") return null;
  const value = input as CardBackgroundPreset;
  const id = typeof value.id === "string" ? value.id.trim() : "";
  const type =
    value.type === "gradient" || value.type === "color" || value.type === "image"
      ? value.type
      : null;
  if (!id || !type) return null;

  const label = normalizeLabel(
    typeof value.label === "string" ? value.label : "",
    fallback.label
  );
  const createdAt =
    typeof value.createdAt === "number" && Number.isFinite(value.createdAt)
      ? value.createdAt
      : Date.now();

  if (type === "image") {
    const imageUrl =
      typeof value.imageUrl === "string" ? value.imageUrl.trim() : "";
    if (!imageUrl) return null;
    return {
      id,
      label,
      type,
      imageUrl,
      builtIn: Boolean(value.builtIn),
      createdAt,
    };
  }

  const cssValue =
    typeof value.cssValue === "string" ? value.cssValue.trim() : "";
  if (!cssValue) return null;
  return {
    id,
    label,
    type,
    cssValue,
    builtIn: Boolean(value.builtIn),
    createdAt,
  };
}

export function getBuiltInCardBackgroundPresets(): CardBackgroundPreset[] {
  return BUILT_IN_CARD_PRESETS.map((preset) => ({ ...preset }));
}

export function sanitizeCardBackgroundSettings(
  input: unknown
): CardBackgroundSettings {
  const builtIns = getBuiltInCardBackgroundPresets();
  if (!input || typeof input !== "object") {
    return {
      ...DEFAULT_CARD_BACKGROUND_SETTINGS,
      presets: builtIns,
    };
  }

  const value = input as Partial<CardBackgroundSettings>;
  const enabled =
    typeof value.enabled === "boolean"
      ? value.enabled
      : DEFAULT_CARD_BACKGROUND_SETTINGS.enabled;
  const allowPerCardSelector =
    typeof value.allowPerCardSelector === "boolean"
      ? value.allowPerCardSelector
      : DEFAULT_CARD_BACKGROUND_SETTINGS.allowPerCardSelector;

  const sourcePresets = Array.isArray(value.presets) ? value.presets : [];
  const mergedById = new Map<string, CardBackgroundPreset>();

  for (const preset of builtIns) {
    mergedById.set(preset.id, preset);
  }

  for (const source of sourcePresets) {
    const fallback = builtIns[0];
    const parsed = sanitizePreset(source, fallback);
    if (!parsed) continue;
    if (mergedById.has(parsed.id) && mergedById.get(parsed.id)?.builtIn) {
      continue;
    }
    mergedById.set(parsed.id, parsed);
  }

  const presets = Array.from(mergedById.values()).slice(0, 16);
  const requestedDefaultId =
    typeof value.defaultPresetId === "string" ? value.defaultPresetId.trim() : "";
  const defaultPresetId = presets.some((preset) => preset.id === requestedDefaultId)
    ? requestedDefaultId
    : DEFAULT_CARD_BACKGROUND_SETTINGS.defaultPresetId;

  return {
    enabled,
    allowPerCardSelector,
    defaultPresetId,
    presets,
  };
}

export function resolveCardPresetBackground(
  preset: CardBackgroundPreset | null | undefined
): { background?: string; backgroundImage?: string } {
  if (!preset) return {};
  if (preset.type === "image" && preset.imageUrl) {
    return {
      backgroundImage: `url("${preset.imageUrl}")`,
    };
  }
  if ((preset.type === "gradient" || preset.type === "color") && preset.cssValue) {
    return {
      background: preset.cssValue,
    };
  }
  return {};
}

