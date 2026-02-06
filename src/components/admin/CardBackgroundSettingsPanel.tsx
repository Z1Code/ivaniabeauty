"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Check,
  ImagePlus,
  PaintBucket,
  Save,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import {
  DEFAULT_CARD_BACKGROUND_SETTINGS,
  getBuiltInCardBackgroundPresets,
  resolveCardPresetBackground,
  sanitizeCardBackgroundSettings,
  type CardBackgroundPreset,
  type CardBackgroundSettings,
} from "@/lib/card-background-settings";

interface CardBackgroundSettingsPanelProps {
  value: CardBackgroundSettings;
  saving: boolean;
  onChange: (next: CardBackgroundSettings) => void;
  onSave: () => void;
}

interface ApiGeneratedPresetPayload {
  id?: string;
  label?: string;
  type?: string;
  imageUrl?: string;
  builtIn?: boolean;
  createdAt?: number;
}

interface ApiGenerateResponse {
  success?: boolean;
  imageUrl?: string;
  preset?: ApiGeneratedPresetPayload;
  error?: string;
}

const ASPECT_RATIO_OPTIONS = ["3:4", "1:1", "4:5", "16:9", "4:3"] as const;

function createPresetId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${randomPart}`;
}

function normalizeLabel(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, 40);
}

function getPresetPreviewStyle(preset: CardBackgroundPreset): CSSProperties {
  const resolved = resolveCardPresetBackground(preset);
  if (preset.type === "image" && resolved.backgroundImage) {
    return {
      backgroundImage: resolved.backgroundImage,
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundColor: "#f3f4f6",
    };
  }
  if (resolved.background) {
    return {
      background: resolved.background,
    };
  }
  return {
    background: "#f3f4f6",
  };
}

export default function CardBackgroundSettingsPanel({
  value,
  saving,
  onChange,
  onSave,
}: CardBackgroundSettingsPanelProps) {
  const [colorLabel, setColorLabel] = useState("Color personalizado");
  const [colorValue, setColorValue] = useState("#f4f6f9");
  const [gradientLabel, setGradientLabel] = useState("Gradiente personalizado");
  const [gradientFrom, setGradientFrom] = useState("#ffffff");
  const [gradientTo, setGradientTo] = useState("#e5e7eb");
  const [gradientAngle, setGradientAngle] = useState(180);
  const [aiLabel, setAiLabel] = useState("Fondo IA");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiAspectRatio, setAiAspectRatio] = useState<(typeof ASPECT_RATIO_OPTIONS)[number]>(
    "3:4"
  );
  const [setAiAsDefault, setSetAiAsDefault] = useState(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const presets = value.presets;

  const defaultPreset = useMemo(
    () => presets.find((preset) => preset.id === value.defaultPresetId) || null,
    [presets, value.defaultPresetId]
  );

  const applyChange = (nextValue: CardBackgroundSettings) => {
    onChange(sanitizeCardBackgroundSettings(nextValue));
  };

  const addPreset = (preset: CardBackgroundPreset, setAsDefault = false) => {
    const deduped = value.presets.filter((item) => item.id !== preset.id);
    const nextPresets = [...deduped, preset];
    applyChange({
      ...value,
      presets: nextPresets,
      defaultPresetId: setAsDefault ? preset.id : value.defaultPresetId,
    });
  };

  const addColorPreset = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const label = normalizeLabel(colorLabel, "Color personalizado");
    const preset: CardBackgroundPreset = {
      id: createPresetId("color"),
      label,
      type: "color",
      cssValue: colorValue,
      builtIn: false,
      createdAt: Date.now(),
    };
    addPreset(preset, false);
    setSuccessMessage("Preset de color agregado. Guarda para aplicar globalmente.");
  };

  const addGradientPreset = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const safeAngle = Number.isFinite(gradientAngle) ? gradientAngle : 180;
    const label = normalizeLabel(gradientLabel, "Gradiente personalizado");
    const cssValue = `linear-gradient(${safeAngle}deg, ${gradientFrom} 0%, ${gradientTo} 100%)`;
    const preset: CardBackgroundPreset = {
      id: createPresetId("gradient"),
      label,
      type: "gradient",
      cssValue,
      builtIn: false,
      createdAt: Date.now(),
    };
    addPreset(preset, false);
    setSuccessMessage("Preset de gradiente agregado. Guarda para aplicar globalmente.");
  };

  const removePreset = (presetId: string) => {
    const preset = value.presets.find((item) => item.id === presetId);
    if (!preset || preset.builtIn) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    const nextPresets = value.presets.filter((item) => item.id !== presetId);
    const nextDefaultId = nextPresets.some((item) => item.id === value.defaultPresetId)
      ? value.defaultPresetId
      : (nextPresets[0]?.id ?? DEFAULT_CARD_BACKGROUND_SETTINGS.defaultPresetId);

    applyChange({
      ...value,
      presets: nextPresets,
      defaultPresetId: nextDefaultId,
    });
  };

  const restoreBuiltIns = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const builtIns = getBuiltInCardBackgroundPresets();
    applyChange({
      ...value,
      presets: builtIns,
      defaultPresetId: DEFAULT_CARD_BACKGROUND_SETTINGS.defaultPresetId,
    });
    setSuccessMessage("Presets base restaurados. Guarda para confirmar cambios.");
  };

  const generateWithAi = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGeneratingAi(true);
    try {
      const response = await fetch("/api/admin/card-backgrounds/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: normalizeLabel(aiLabel, "Fondo IA"),
          prompt: aiPrompt.trim() || undefined,
          aspectRatio: aiAspectRatio,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as ApiGenerateResponse;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo generar fondo IA");
      }

      const presetFromApi = payload.preset;
      const imageUrl = presetFromApi?.imageUrl || payload.imageUrl;
      if (!imageUrl) {
        throw new Error("Gemini no devolvio URL de imagen para el fondo.");
      }

      const preset: CardBackgroundPreset = {
        id: presetFromApi?.id || createPresetId("ai"),
        label: normalizeLabel(
          presetFromApi?.label || aiLabel,
          "Fondo IA"
        ),
        type: "image",
        imageUrl,
        builtIn: false,
        createdAt:
          typeof presetFromApi?.createdAt === "number"
            ? presetFromApi.createdAt
            : Date.now(),
      };

      addPreset(preset, setAiAsDefault);
      setSuccessMessage(
        setAiAsDefault
          ? "Fondo IA generado y asignado como predeterminado."
          : "Fondo IA generado y agregado a presets."
      );
    } catch (error) {
      const typed = error as Error;
      setErrorMessage(typed.message || "No se pudo generar el fondo IA.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
          <PaintBucket className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
            Fondos de Cards
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Gestiona fondos globales para las cards de productos IA.
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Activar fondos personalizados
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Si se desactiva, se usa el fondo clasico actual.
            </p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={value.enabled}
              onChange={(event) =>
                applyChange({ ...value, enabled: event.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
          </div>
        </label>

        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Permitir selector por card
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Muestra los puntitos de cambio rapido de fondo en cada card.
            </p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={value.allowPerCardSelector}
              onChange={(event) =>
                applyChange({
                  ...value,
                  allowPerCardSelector: event.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Fondo predeterminado
        </label>
        <select
          value={value.defaultPresetId}
          onChange={(event) =>
            applyChange({
              ...value,
              defaultPresetId: event.target.value,
            })
          }
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-colors"
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Presets disponibles ({presets.length})
          </p>
          <button
            type="button"
            onClick={restoreBuiltIns}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-rosa/40 hover:text-rosa-dark transition-colors cursor-pointer"
          >
            Restaurar base
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {presets.map((preset) => {
            const isDefault = preset.id === value.defaultPresetId;
            return (
              <div
                key={preset.id}
                className={`relative rounded-xl border p-2 ${
                  isDefault
                    ? "border-rosa ring-2 ring-rosa/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div
                  className="h-[72px] rounded-lg border border-gray-200 dark:border-gray-700"
                  style={getPresetPreviewStyle(preset)}
                />
                <div className="mt-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {preset.label}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {preset.type}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      applyChange({
                        ...value,
                        defaultPresetId: preset.id,
                      })
                    }
                    className={`text-[10px] px-2 py-1 rounded-md border cursor-pointer ${
                      isDefault
                        ? "border-emerald-300 text-emerald-600 bg-emerald-50"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-rosa/40"
                    }`}
                  >
                    {isDefault ? "Default" : "Usar"}
                  </button>
                  {!preset.builtIn && (
                    <button
                      type="button"
                      onClick={() => removePreset(preset.id)}
                      className="text-[10px] px-2 py-1 rounded-md border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 inline-block mr-1" />
                      Quitar
                    </button>
                  )}
                </div>
                {isDefault && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Agregar color
          </p>
          <input
            type="text"
            value={colorLabel}
            onChange={(event) => setColorLabel(event.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm mb-2"
            placeholder="Nombre del preset"
          />
          <input
            type="color"
            value={colorValue}
            onChange={(event) => setColorValue(event.target.value)}
            className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mb-3 cursor-pointer"
          />
          <button
            type="button"
            onClick={addColorPreset}
            className="w-full text-sm px-3 py-2 rounded-lg bg-white border border-gray-200 dark:border-gray-700 hover:border-rosa/45 transition-colors cursor-pointer"
          >
            <ImagePlus className="w-4 h-4 inline-block mr-1.5" />
            Agregar color
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Agregar gradiente
          </p>
          <input
            type="text"
            value={gradientLabel}
            onChange={(event) => setGradientLabel(event.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm mb-2"
            placeholder="Nombre del preset"
          />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="color"
              value={gradientFrom}
              onChange={(event) => setGradientFrom(event.target.value)}
              className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer"
            />
            <input
              type="color"
              value={gradientTo}
              onChange={(event) => setGradientTo(event.target.value)}
              className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer"
            />
          </div>
          <input
            type="number"
            min={0}
            max={360}
            value={gradientAngle}
            onChange={(event) => setGradientAngle(Number(event.target.value) || 180)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm mb-3"
            placeholder="Angulo"
          />
          <button
            type="button"
            onClick={addGradientPreset}
            className="w-full text-sm px-3 py-2 rounded-lg bg-white border border-gray-200 dark:border-gray-700 hover:border-rosa/45 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 inline-block mr-1.5" />
            Agregar gradiente
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Generar con Google IA
          </p>
          <input
            type="text"
            value={aiLabel}
            onChange={(event) => setAiLabel(event.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm mb-2"
            placeholder="Nombre del preset IA"
          />
          <select
            value={aiAspectRatio}
            onChange={(event) =>
              setAiAspectRatio(event.target.value as (typeof ASPECT_RATIO_OPTIONS)[number])
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm mb-2"
          >
            {ASPECT_RATIO_OPTIONS.map((ratio) => (
              <option key={ratio} value={ratio}>
                Aspecto {ratio}
              </option>
            ))}
          </select>
          <textarea
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm mb-2 resize-none"
            placeholder="Ej: fondo editorial minimalista, tonos marfil y blush suave, luz de estudio premium."
          />
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mb-3">
            <input
              type="checkbox"
              checked={setAiAsDefault}
              onChange={(event) => setSetAiAsDefault(event.target.checked)}
              className="rounded border-gray-300"
            />
            Usar como fondo predeterminado al generarse
          </label>
          <button
            type="button"
            onClick={generateWithAi}
            disabled={isGeneratingAi}
            className="w-full text-sm px-3 py-2 rounded-lg bg-rosa text-white hover:bg-rosa-dark disabled:opacity-60 transition-colors cursor-pointer"
          >
            <WandSparkles className="w-4 h-4 inline-block mr-1.5" />
            {isGeneratingAi ? "Generando..." : "Generar fondo IA"}
          </button>
        </div>
      </div>

      {(errorMessage || successMessage) && (
        <div
          className={`mb-5 rounded-lg px-3 py-2 text-sm ${
            errorMessage
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {errorMessage || successMessage}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 mb-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Preview rapido del fondo predeterminado
        </p>
        <div className="max-w-[190px]">
          <div
            className="w-full aspect-[3/4] rounded-xl border border-gray-200 dark:border-gray-700"
            style={defaultPreset ? getPresetPreviewStyle(defaultPreset) : undefined}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-rosa text-white rounded-xl hover:bg-rosa-dark transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
