import type { Language } from "@/stores/languageStore";

export function getLocalizedField<T>(
  field: T | { en: T; es: T },
  language: Language
): T {
  if (field && typeof field === "object" && !Array.isArray(field) && "en" in (field as Record<string, unknown>)) {
    return (field as { en: T; es: T })[language];
  }
  return field as T;
}
