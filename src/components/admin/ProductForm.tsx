"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  Trash2,
  Plus,
  X,
  Eye,
  RefreshCw,
  Pencil,
} from "lucide-react";
import AdminPageHeader from "./AdminPageHeader";
import AdminBilingualInput from "./AdminBilingualInput";
import AdminImageUpload from "./AdminImageUpload";
import AiMagicGenerateButton from "./AiMagicGenerateButton";
import AiGenerationFullscreenOverlay from "./AiGenerationFullscreenOverlay";
import { cn, getColorHex } from "@/lib/utils";
import type { FitGuideRow, FitGuideStatus, SizeChartMeasurement } from "@/lib/firebase/types";
import { metricToCmText, normalizeSizeList } from "@/lib/fit-guide/utils";

const ALL_COLORS = ["cocoa", "negro", "beige", "brown", "rosado", "pink"];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL", "5XL"];
const CATEGORIES = [
  { value: "fajas", label: "Fajas" },
  { value: "cinturillas", label: "Cinturillas" },
  { value: "tops", label: "Tops & Brassieres" },
  { value: "shorts", label: "Shorts" },
  { value: "cuidado", label: "Cuidado Personal" },
];
const COMPRESSIONS = [
  { value: "suave", label: "Suave" },
  { value: "media", label: "Media" },
  { value: "firme", label: "Firme" },
];
const OCCASIONS = [
  { value: "diario", label: "Diario" },
  { value: "postquirurgico", label: "Post Quirurgico" },
  { value: "postparto", label: "Post Parto" },
  { value: "deporte", label: "Deporte" },
];

interface ProductFormData {
  nameEn: string;
  nameEs: string;
  slug: string;
  sku: string;
  price: string;
  originalPrice: string;
  category: string;
  occasion: string;
  compression: string;
  badgeEn: string;
  badgeEs: string;
  descriptionEn: string;
  descriptionEs: string;
  shortDescriptionEn: string;
  shortDescriptionEs: string;
  featuresEn: string[];
  featuresEs: string[];
  materials: string;
  care: string;
  colors: string[];
  sizes: string[];
  images: string[];
  stockQuantity: string;
  lowStockThreshold: string;
  inStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: string;
  sizeChartImageUrl: string | null;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData> & { id?: string };
  isEditing?: boolean;
}

interface FitGuideApiResponse {
  status: FitGuideStatus;
  warnings: string[];
  confidenceScore: number;
  availableSizes: string[];
  metricKeys: string[];
  rows: FitGuideRow[];
  measurements: SizeChartMeasurement[] | null;
}

interface AiImageGenerationResponse {
  success?: boolean;
  generatedImageUrl?: string;
  modelUsed?: string;
  images?: string[];
  sourceImageUrls?: string[];
  colorReferenceImageUrl?: string | null;
  targetColor?: string | null;
  customPrompt?: string | null;
  specializedBackgroundRemovalConfigured?: boolean;
  backgroundRemovalConfiguration?: {
    configured?: boolean;
    providerOrder?: string[];
    configuredProviders?: string[];
  };
  availableProfiles?: AiImageProfile[];
  profile?: {
    id?: string;
    label?: string;
    description?: string;
  };
  error?: string;
}

interface AiImageProfile {
  id: string;
  label: string;
  description: string;
}

interface AiImageSetupResponse {
  availableProfiles?: AiImageProfile[];
  specializedBackgroundRemovalConfigured?: boolean;
  backgroundRemovalConfiguration?: {
    configured?: boolean;
    providerOrder?: string[];
    configuredProviders?: string[];
  };
}

type EditableFitGuideRow = {
  size: string;
  [metricKey: string]: string | null;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const inputClasses =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all";

function metricValueToText(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value) {
    const metric = value as {
      min_cm?: number | null;
      max_cm?: number | null;
      raw?: string | null;
    };
    if (metric.raw) return metric.raw;
    return metricToCmText({
      min_cm: metric.min_cm ?? null,
      max_cm: metric.max_cm ?? null,
      raw: metric.raw ?? null,
      confidence: null,
    });
  }
  return null;
}

function rowsToEditableRows(
  rows: FitGuideRow[],
  metricKeys: string[]
): EditableFitGuideRow[] {
  return rows.map((row) => {
    const editable: EditableFitGuideRow = {
      size: String(row.size || ""),
    };
    for (const key of metricKeys) {
      editable[key] = metricValueToText((row as Record<string, unknown>)[key]);
    }
    return editable;
  });
}

function metricLabel(metricKey: string): string {
  switch (metricKey) {
    case "waist":
      return "Cintura";
    case "hip":
      return "Cadera";
    case "bust":
      return "Busto";
    case "length":
      return "Largo";
    default:
      return metricKey.replace(/[_-]/g, " ");
  }
}

function cmTextToInchesText(value: string | null): string | null {
  if (!value) return null;
  const values = value.match(/\d+(?:[.,]\d+)?/g) || [];
  if (!values.length) return null;
  const nums = values
    .map((token) => Number.parseFloat(token.replace(",", ".")))
    .filter((num) => Number.isFinite(num));
  if (!nums.length) return null;
  const [first, second] = nums;
  if (second == null) return String(Math.round(first / 2.54));
  const min = Math.min(first, second);
  const max = Math.max(first, second);
  const minIn = Math.round(min / 2.54);
  const maxIn = Math.round(max / 2.54);
  return minIn === maxIn ? String(minIn) : `${minIn}-${maxIn}`;
}

export default function ProductForm({
  initialData,
  isEditing,
}: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fit-guide states
  const [fitGuideRows, setFitGuideRows] = useState<EditableFitGuideRow[]>([]);
  const [fitGuideMetricKeys, setFitGuideMetricKeys] = useState<string[]>([]);
  const [fitGuideStatus, setFitGuideStatus] = useState<FitGuideStatus | null>(null);
  const [fitGuideWarnings, setFitGuideWarnings] = useState<string[]>([]);
  const [fitGuideConfidence, setFitGuideConfidence] = useState<number | null>(null);
  const [fitGuideAvailableSizes, setFitGuideAvailableSizes] = useState<string[]>([]);
  const [showFitGuideEditor, setShowFitGuideEditor] = useState(false);
  const [loadingFitGuide, setLoadingFitGuide] = useState(false);
  const [analyzingFitGuide, setAnalyzingFitGuide] = useState(false);
  const [savingFitGuideDraft, setSavingFitGuideDraft] = useState(false);
  const [confirmingFitGuide, setConfirmingFitGuide] = useState(false);
  const [generatingAiImage, setGeneratingAiImage] = useState(false);
  const [aiSourceImageUrls, setAiSourceImageUrls] = useState<string[]>(
    initialData?.images?.[0] ? [initialData.images[0]] : []
  );
  const [aiColorReferenceImageUrl, setAiColorReferenceImageUrl] = useState("");
  const [uploadingAiColorReferenceImage, setUploadingAiColorReferenceImage] =
    useState(false);
  const [aiColorReferenceError, setAiColorReferenceError] = useState<
    string | null
  >(null);
  const [aiGenerationSummary, setAiGenerationSummary] = useState<string | null>(
    null
  );
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(
    null
  );
  const [aiTargetColor, setAiTargetColor] = useState("");
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [aiPreferredProfileId, setAiPreferredProfileId] = useState("");
  const [aiAvailableProfiles, setAiAvailableProfiles] = useState<AiImageProfile[]>(
    []
  );
  const [aiBgRemovalConfigured, setAiBgRemovalConfigured] = useState(false);
  const [aiBgRemovalConfiguredProviders, setAiBgRemovalConfiguredProviders] =
    useState<string[]>([]);
  const aiColorReferenceInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<ProductFormData>({
    nameEn: initialData?.nameEn || "",
    nameEs: initialData?.nameEs || "",
    slug: initialData?.slug || "",
    sku: initialData?.sku || "",
    price: initialData?.price?.toString() || "",
    originalPrice: initialData?.originalPrice?.toString() || "",
    category: initialData?.category || "fajas",
    occasion: initialData?.occasion || "diario",
    compression: initialData?.compression || "media",
    badgeEn: initialData?.badgeEn || "",
    badgeEs: initialData?.badgeEs || "",
    descriptionEn: initialData?.descriptionEn || "",
    descriptionEs: initialData?.descriptionEs || "",
    shortDescriptionEn: initialData?.shortDescriptionEn || "",
    shortDescriptionEs: initialData?.shortDescriptionEs || "",
    featuresEn: initialData?.featuresEn || [""],
    featuresEs: initialData?.featuresEs || [""],
    materials: initialData?.materials || "",
    care: initialData?.care || "",
    colors: initialData?.colors || [],
    sizes: initialData?.sizes || [],
    images: initialData?.images || [],
    stockQuantity: initialData?.stockQuantity?.toString() || "100",
    lowStockThreshold: initialData?.lowStockThreshold?.toString() || "5",
    inStock: initialData?.inStock !== false,
    isFeatured: initialData?.isFeatured || false,
    isActive: initialData?.isActive !== false,
    sortOrder: initialData?.sortOrder?.toString() || "0",
    sizeChartImageUrl: initialData?.sizeChartImageUrl || null,
  });

  const sizesLockedByFitGuide = fitGuideStatus === "confirmed";
  const normalizedProductSizes = useMemo(
    () => normalizeSizeList(form.sizes),
    [form.sizes]
  );
  const normalizedGuideSizes = useMemo(
    () => normalizeSizeList(fitGuideAvailableSizes),
    [fitGuideAvailableSizes]
  );
  const missingInGuide = useMemo(
    () =>
      normalizedProductSizes.filter(
        (size) => !normalizedGuideSizes.includes(size)
      ),
    [normalizedProductSizes, normalizedGuideSizes]
  );
  const missingInProduct = useMemo(
    () =>
      normalizedGuideSizes.filter(
        (size) => !normalizedProductSizes.includes(size)
      ),
    [normalizedGuideSizes, normalizedProductSizes]
  );

  function updateField<K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K]
  ) {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      // Auto-generate slug from Spanish name
      if (key === "nameEs" && !isEditing) {
        updated.slug = slugify(value as string);
      }
      return updated;
    });
  }

  function toggleArrayItem(
    key: "colors" | "sizes",
    item: string
  ) {
    if (key === "sizes" && sizesLockedByFitGuide) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter((i) => i !== item)
        : [...prev[key], item],
    }));
  }

  function addFeature() {
    setForm((prev) => ({
      ...prev,
      featuresEn: [...prev.featuresEn, ""],
      featuresEs: [...prev.featuresEs, ""],
    }));
  }

  function removeFeature(index: number) {
    setForm((prev) => ({
      ...prev,
      featuresEn: prev.featuresEn.filter((_, i) => i !== index),
      featuresEs: prev.featuresEs.filter((_, i) => i !== index),
    }));
  }

  function updateFeature(
    lang: "En" | "Es",
    index: number,
    value: string
  ) {
    const key = `features${lang}` as "featuresEn" | "featuresEs";
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((f, i) => (i === index ? value : f)),
    }));
  }

  function clearFitGuideLocalState() {
    setFitGuideRows([]);
    setFitGuideMetricKeys([]);
    setFitGuideWarnings([]);
    setFitGuideConfidence(null);
    setFitGuideAvailableSizes([]);
    setFitGuideStatus(null);
  }

  function applyFitGuidePayload(payload: FitGuideApiResponse) {
    const metricKeys = Array.isArray(payload.metricKeys) ? payload.metricKeys : [];
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const editableRows = rowsToEditableRows(rows, metricKeys);

    setFitGuideMetricKeys(metricKeys);
    setFitGuideRows(editableRows);
    setFitGuideStatus(payload.status || null);
    setFitGuideWarnings(payload.warnings || []);
    setFitGuideConfidence(
      typeof payload.confidenceScore === "number"
        ? payload.confidenceScore
        : null
    );
    setFitGuideAvailableSizes(payload.availableSizes || []);
    setShowFitGuideEditor(editableRows.length > 0);
  }

  function buildFitGuideRowsPayload(): Array<Record<string, string | null>> {
    return fitGuideRows.map((row) => {
      const next: Record<string, string | null> = {
        size: row.size || "",
      };
      for (const key of fitGuideMetricKeys) {
        next[key] = row[key] || null;
      }
      return next;
    });
  }

  const loadFitGuide = useCallback(async () => {
    if (!initialData?.id) return;
    setLoadingFitGuide(true);
    try {
      const res = await fetch(`/api/products/${initialData.id}/size-chart`);
      const data = (await res.json()) as FitGuideApiResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "No se pudo cargar fit guide");
      }
      applyFitGuidePayload(data);
      if (data.status === "confirmed" && Array.isArray(data.availableSizes)) {
        setForm((prev) => ({
          ...prev,
          sizes: normalizeSizeList(data.availableSizes),
        }));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar fit guide"
      );
    } finally {
      setLoadingFitGuide(false);
    }
  }, [initialData?.id]);

  async function analyzeFitGuide() {
    if (!initialData?.id || !form.sizeChartImageUrl) return;
    setAnalyzingFitGuide(true);
    try {
      const res = await fetch(`/api/products/${initialData.id}/size-chart`, {
        method: "POST",
      });
      const data = (await res.json()) as FitGuideApiResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "No se pudo analizar la imagen");
      }
      applyFitGuidePayload(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al analizar fit guide"
      );
    } finally {
      setAnalyzingFitGuide(false);
    }
  }

  async function saveFitGuideDraft() {
    if (!initialData?.id || !fitGuideRows.length) return;
    setSavingFitGuideDraft(true);
    try {
      const res = await fetch(`/api/products/${initialData.id}/size-chart`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: buildFitGuideRowsPayload() }),
      });
      const data = (await res.json()) as FitGuideApiResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar el borrador");
      }
      applyFitGuidePayload(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar borrador"
      );
    } finally {
      setSavingFitGuideDraft(false);
    }
  }

  async function confirmFitGuide() {
    if (!initialData?.id || !fitGuideRows.length) return;
    setConfirmingFitGuide(true);
    try {
      const res = await fetch(`/api/products/${initialData.id}/size-chart`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: buildFitGuideRowsPayload() }),
      });
      const data = (await res.json()) as
        | (FitGuideApiResponse & { syncedSizes?: string[]; error?: string })
        | { error?: string };
      if (!res.ok) {
        throw new Error(("error" in data && data.error) || "No se pudo confirmar");
      }
      applyFitGuidePayload(data as FitGuideApiResponse);
      const synced =
        "syncedSizes" in data && Array.isArray(data.syncedSizes)
          ? normalizeSizeList(data.syncedSizes)
          : normalizeSizeList(
              (data as FitGuideApiResponse).availableSizes || []
            );
      setForm((prev) => ({ ...prev, sizes: synced }));
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al confirmar fit guide"
      );
    } finally {
      setConfirmingFitGuide(false);
    }
  }

  async function clearFitGuideCache() {
    if (!initialData?.id) return;
    if (!confirm("Limpiar fit guide y cachear nuevamente?")) return;
    setLoadingFitGuide(true);
    try {
      await fetch(`/api/products/${initialData.id}/size-chart`, {
        method: "DELETE",
      });
      clearFitGuideLocalState();
      setShowFitGuideEditor(false);
      setError("");
    } catch {
      setError("Error al limpiar fit guide");
    } finally {
      setLoadingFitGuide(false);
    }
  }

  function updateFitGuideCell(index: number, key: string, value: string) {
    setFitGuideRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value || null } : row
      )
    );
  }

  useEffect(() => {
    if (!isEditing || !initialData?.id) return;
    void loadFitGuide();
  }, [initialData?.id, isEditing, loadFitGuide]);

  useEffect(() => {
    if (!form.images.length) {
      setAiSourceImageUrls([]);
      return;
    }
    setAiSourceImageUrls((prev) => {
      const filtered = prev.filter((url) => form.images.includes(url));
      if (filtered.length) return filtered;
      return [form.images[0]];
    });
  }, [form.images]);

  useEffect(() => {
    if (!isEditing || !initialData?.id) return;

    const controller = new AbortController();
    const loadProfiles = async () => {
      try {
        const res = await fetch(`/api/admin/products/${initialData.id}/ai-image`, {
          method: "GET",
          signal: controller.signal,
        });
        const data = (await res.json()) as AiImageSetupResponse;
        if (!res.ok) return;
        if (Array.isArray(data.availableProfiles)) {
          setAiAvailableProfiles(data.availableProfiles);
        }
        const bgConfig = data.backgroundRemovalConfiguration;
        if (typeof data.specializedBackgroundRemovalConfigured === "boolean") {
          setAiBgRemovalConfigured(data.specializedBackgroundRemovalConfigured);
        } else if (typeof bgConfig?.configured === "boolean") {
          setAiBgRemovalConfigured(bgConfig.configured);
        }
        if (Array.isArray(bgConfig?.configuredProviders)) {
          setAiBgRemovalConfiguredProviders(bgConfig.configuredProviders);
        }
      } catch {
        // Ignore. Generation endpoint will still return profiles on success.
      }
    };

    void loadProfiles();
    return () => controller.abort();
  }, [initialData?.id, isEditing]);

  function toggleAiSourceImage(url: string) {
    setAiSourceImageUrls((prev) =>
      prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]
    );
  }

  function selectAllAiSourceImages() {
    setAiSourceImageUrls(form.images);
  }

  function clearAiSourceImages() {
    setAiSourceImageUrls([]);
  }

  function resetAiAdjustments() {
    setAiCustomPrompt("");
    setAiPreferredProfileId("");
    setAiTargetColor("");
    setAiColorReferenceImageUrl("");
    setAiColorReferenceError(null);
  }

  async function handleAiColorReferenceUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAiColorReferenceError("El archivo debe ser una imagen.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAiColorReferenceError("La imagen de color no puede superar 5MB.");
      e.target.value = "";
      return;
    }

    setUploadingAiColorReferenceImage(true);
    setAiColorReferenceError(null);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as {
        urls?: string[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir la referencia de color.");
      }
      const uploadedUrl =
        Array.isArray(data.urls) && data.urls.length ? data.urls[0] : null;
      if (!uploadedUrl) {
        throw new Error("No se recibio URL para la referencia de color.");
      }
      setAiColorReferenceImageUrl(uploadedUrl);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al subir referencia de color";
      setAiColorReferenceError(message);
    } finally {
      setUploadingAiColorReferenceImage(false);
      e.target.value = "";
    }
  }

  async function generateAiProductImage() {
    if (!initialData?.id) return;
    if (!aiSourceImageUrls.length) {
      setAiGenerationError(
        "Selecciona al menos una imagen base para generar la foto profesional."
      );
      setError(
        "Selecciona al menos una imagen base para generar la foto profesional."
      );
      return;
    }

    setGeneratingAiImage(true);
    setAiGenerationSummary(null);
    setAiGenerationError(null);
    setError("");

    try {
      const res = await fetch(`/api/admin/products/${initialData.id}/ai-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImageUrl: aiSourceImageUrls[0],
          sourceImageUrls: aiSourceImageUrls,
          colorReferenceImageUrl: aiColorReferenceImageUrl || undefined,
          preferredProfileId: aiPreferredProfileId || undefined,
          targetColor: aiTargetColor.trim() || undefined,
          customPrompt: aiCustomPrompt || undefined,
          placeFirst: true,
          maxImages: 8,
        }),
      });

      const data = (await res.json()) as AiImageGenerationResponse;
      if (!res.ok) {
        throw new Error(data.error || "No se pudo generar la imagen con IA");
      }

      if (Array.isArray(data.availableProfiles) && data.availableProfiles.length) {
        setAiAvailableProfiles(data.availableProfiles);
      }
      const bgConfig = data.backgroundRemovalConfiguration;
      if (typeof data.specializedBackgroundRemovalConfigured === "boolean") {
        setAiBgRemovalConfigured(data.specializedBackgroundRemovalConfigured);
      } else if (typeof bgConfig?.configured === "boolean") {
        setAiBgRemovalConfigured(bgConfig.configured);
      }
      if (Array.isArray(bgConfig?.configuredProviders)) {
        setAiBgRemovalConfiguredProviders(bgConfig.configuredProviders);
      }
      if (data.colorReferenceImageUrl !== undefined) {
        setAiColorReferenceImageUrl(data.colorReferenceImageUrl || "");
      }
      if (Array.isArray(data.images)) {
        updateField("images", data.images);
      } else if (data.generatedImageUrl) {
        updateField("images", [
          data.generatedImageUrl,
          ...form.images.filter((img) => img !== data.generatedImageUrl),
        ]);
      }

      const profileLabel = data.profile?.label || "Modelo aleatoria";
      const modelUsed = data.modelUsed ? ` (${data.modelUsed})` : "";
      const colorNote = data.targetColor ? ` | Color: ${data.targetColor}` : "";
      const sourceNote = ` | Ref: ${aiSourceImageUrls.length}`;
      const bgConfigured =
        typeof data.specializedBackgroundRemovalConfigured === "boolean"
          ? data.specializedBackgroundRemovalConfigured
          : Boolean(bgConfig?.configured);
      const configuredProviders = Array.isArray(bgConfig?.configuredProviders)
        ? bgConfig.configuredProviders
        : [];
      const bgNote = bgConfigured
        ? ` | Fondo pro: ${configuredProviders.join(", ") || "activo"}`
        : " | Fondo pro: fallback local";
      const colorRefNote = data.colorReferenceImageUrl
        ? " | Color por imagen"
        : "";
      setAiGenerationSummary(
        `${profileLabel}${modelUsed}${sourceNote}${bgNote}${colorNote}${colorRefNote}`
      );
      setAiGenerationError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al generar imagen con IA";
      setAiGenerationError(message);
      setError(message);
    } finally {
      setGeneratingAiImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const cleanedSizeChartImageUrl = form.sizeChartImageUrl || null;
      const sanitizedGalleryImages = form.images.filter(
        (image) => image && image !== cleanedSizeChartImageUrl
      );

      const payload = {
        ...form,
        images: sanitizedGalleryImages,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice
          ? parseFloat(form.originalPrice)
          : null,
        stockQuantity: parseInt(form.stockQuantity),
        lowStockThreshold: parseInt(form.lowStockThreshold),
        sortOrder: parseInt(form.sortOrder),
        featuresEn: form.featuresEn.filter((f) => f.trim()),
        featuresEs: form.featuresEs.filter((f) => f.trim()),
        badgeEn: form.badgeEn || null,
        badgeEs: form.badgeEs || null,
        sku: form.sku || null,
        sizeChartImageUrl: cleanedSizeChartImageUrl,
      };

      const url = isEditing
        ? `/api/admin/products/${initialData?.id}`
        : "/api/admin/products";

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al guardar el producto"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Desactivar este producto?")) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/products/${initialData?.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Error al eliminar el producto");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <AiGenerationFullscreenOverlay open={generatingAiImage} />
      <AdminPageHeader
        title={isEditing ? "Editar Producto" : "Nuevo Producto"}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Productos", href: "/admin/products" },
          { label: isEditing ? "Editar" : "Nuevo" },
        ]}
        action={
          <div className="flex items-center gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Informacion Basica
            </h3>
            <AdminBilingualInput
              label="Nombre del producto"
              valueEn={form.nameEn}
              valueEs={form.nameEs}
              onChangeEn={(v) => updateField("nameEn", v)}
              onChangeEs={(v) => updateField("nameEs", v)}
              placeholder="Nombre"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug <span className="text-rosa">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => updateField("sku", e.target.value)}
                  placeholder="Ej: FAJA-001"
                  className={inputClasses}
                />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Precios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio (USD) <span className="text-rosa">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio original (tachado)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) =>
                    updateField("originalPrice", e.target.value)
                  }
                  placeholder="Dejar vacio si no hay descuento"
                  className={inputClasses}
                />
              </div>
            </div>
            {form.price && form.originalPrice && (
              <p className="text-sm text-emerald-600 font-medium">
                Descuento:{" "}
                {Math.round(
                  (1 - parseFloat(form.price) / parseFloat(form.originalPrice)) * 100
                )}
                %
              </p>
            )}
          </section>

          {/* Description */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Descripcion</h3>
            <AdminBilingualInput
              label="Descripcion corta"
              valueEn={form.shortDescriptionEn}
              valueEs={form.shortDescriptionEs}
              onChangeEn={(v) => updateField("shortDescriptionEn", v)}
              onChangeEs={(v) => updateField("shortDescriptionEs", v)}
              placeholder="Breve descripcion"
              textarea
              rows={2}
            />
            <AdminBilingualInput
              label="Descripcion completa"
              valueEn={form.descriptionEn}
              valueEs={form.descriptionEs}
              onChangeEn={(v) => updateField("descriptionEn", v)}
              onChangeEs={(v) => updateField("descriptionEs", v)}
              placeholder="Descripcion detallada"
              textarea
              rows={4}
            />
          </section>

          {/* Features */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Caracteristicas
              </h3>
              <button
                type="button"
                onClick={addFeature}
                className="flex items-center gap-1 text-sm text-rosa hover:text-rosa-dark transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            {form.featuresEs.map((_, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      ES
                    </span>
                    <input
                      type="text"
                      value={form.featuresEs[index] || ""}
                      onChange={(e) =>
                        updateFeature("Es", index, e.target.value)
                      }
                      placeholder={`Caracteristica ${index + 1}`}
                      className={inputClasses + " mt-1"}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      EN
                    </span>
                    <input
                      type="text"
                      value={form.featuresEn[index] || ""}
                      onChange={(e) =>
                        updateFeature("En", index, e.target.value)
                      }
                      placeholder={`Feature ${index + 1}`}
                      className={inputClasses + " mt-1"}
                    />
                  </div>
                </div>
                {form.featuresEs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="mt-6 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </section>

          {/* Materials & Care */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Materiales y Cuidado
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Materiales
              </label>
              <textarea
                value={form.materials}
                onChange={(e) => updateField("materials", e.target.value)}
                rows={2}
                className={inputClasses + " resize-none"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instrucciones de cuidado
              </label>
              <textarea
                value={form.care}
                onChange={(e) => updateField("care", e.target.value)}
                rows={2}
                className={inputClasses + " resize-none"}
              />
            </div>
          </section>

          {/* Images */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-colors duration-300">
            <AdminImageUpload
              images={form.images}
              onImagesChange={(imgs) => updateField("images", imgs)}
            />
            {isEditing && initialData?.id && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Generador IA de portada
                  </h4>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-rosa/10 text-rosa dark:bg-rosa/20 dark:text-rosa-light font-medium">
                    Fondo transparente
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Genera una foto comercial con una modelo aleatoria (10 perfiles) usando la prenda de la imagen base.
                </p>

                {form.images.length > 0 ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Imagenes base para IA (puedes elegir varias)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {form.images.map((img, idx) => {
                          const selected = aiSourceImageUrls.includes(img);
                          return (
                            <button
                              key={`${img}-${idx}`}
                              type="button"
                              onClick={() => toggleAiSourceImage(img)}
                              className={cn(
                                "relative rounded-lg border-2 overflow-hidden aspect-square cursor-pointer transition-all",
                                selected
                                  ? "border-rosa ring-2 ring-rosa/30"
                                  : "border-gray-200 dark:border-gray-700 hover:border-rosa/50"
                              )}
                              title={`Imagen ${idx + 1}`}
                            >
                              <img
                                src={img}
                                alt={`Referencia IA ${idx + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/60 text-white">
                                {idx + 1}
                              </span>
                              <span
                                className={cn(
                                  "absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full",
                                  selected
                                    ? "bg-rosa text-white"
                                    : "bg-white/80 text-gray-600"
                                )}
                              >
                                {selected ? "OK" : "Off"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={selectAllAiSourceImages}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          Seleccionar todas
                        </button>
                        <button
                          type="button"
                          onClick={clearAiSourceImages}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          Limpiar
                        </button>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {aiSourceImageUrls.length} seleccionada(s)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                          Perfil de modelo
                        </label>
                        <select
                          value={aiPreferredProfileId}
                          onChange={(e) => setAiPreferredProfileId(e.target.value)}
                          className={inputClasses + " text-xs"}
                        >
                          <option value="">Aleatorio (10 modelos)</option>
                          {aiAvailableProfiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                          Color objetivo de prenda
                        </label>
                        <input
                          type="text"
                          list="ai-color-list"
                          value={aiTargetColor}
                          onChange={(e) => setAiTargetColor(e.target.value)}
                          placeholder="Opcional. Dejalo vacio si usaras referencia por imagen."
                          className={inputClasses + " text-xs"}
                        />
                        <datalist id="ai-color-list">
                          {form.colors.map((color) => (
                            <option key={color} value={color} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
                        Imagen de referencia de color (opcional)
                      </label>
                      <select
                        value={aiColorReferenceImageUrl}
                        onChange={(e) => {
                          setAiColorReferenceImageUrl(e.target.value || "");
                          setAiColorReferenceError(null);
                        }}
                        className={inputClasses + " text-xs"}
                      >
                        <option value="">Sin imagen de color</option>
                        {aiColorReferenceImageUrl &&
                          !form.images.includes(aiColorReferenceImageUrl) && (
                            <option value={aiColorReferenceImageUrl}>
                              Imagen subida personalizada
                            </option>
                          )}
                        {form.images.map((img, idx) => (
                          <option key={`${img}-color-${idx}`} value={img}>
                            Usar imagen {idx + 1} como referencia de color
                          </option>
                        ))}
                      </select>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => aiColorReferenceInputRef.current?.click()}
                          disabled={uploadingAiColorReferenceImage}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {uploadingAiColorReferenceImage
                            ? "Subiendo..."
                            : "Subir imagen de color"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAiColorReferenceImageUrl("");
                            setAiColorReferenceError(null);
                          }}
                          disabled={uploadingAiColorReferenceImage}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Quitar referencia
                        </button>
                        <input
                          ref={aiColorReferenceInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAiColorReferenceUpload}
                          className="hidden"
                        />
                      </div>
                      {aiColorReferenceImageUrl && (
                        <div className="flex items-center gap-2">
                          <img
                            src={aiColorReferenceImageUrl}
                            alt="Referencia de color"
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                            loading="lazy"
                          />
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                            Referencia de color activa
                          </p>
                        </div>
                      )}
                      {aiColorReferenceError && (
                        <p className="text-[11px] text-red-600 dark:text-red-400">
                          {aiColorReferenceError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Ajustes extra del prompt (opcional)
                      </label>
                      <textarea
                        value={aiCustomPrompt}
                        onChange={(e) => setAiCustomPrompt(e.target.value)}
                        rows={3}
                        maxLength={1200}
                        placeholder="Ej: Mantener mangas largas, evitar brillos excesivos, pose frontal totalmente recta."
                        className={inputClasses + " resize-y min-h-[88px] text-xs"}
                      />
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        {aiCustomPrompt.length}/1200
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 px-3 py-2">
                      <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        Motor de recorte de fondo:
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {aiBgRemovalConfigured
                          ? `Activo (${aiBgRemovalConfiguredProviders.join(", ") || "proveedor externo"}).`
                          : "No configurado (se usa fallback local de transparencia)."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <AiMagicGenerateButton
                        loading={generatingAiImage}
                        disabled={aiSourceImageUrls.length === 0}
                        onClick={generateAiProductImage}
                        loadingLabel="Generando imagen profesional"
                        idleLabel="Autogenerar imagen profesional"
                      />
                      <button
                        type="button"
                        onClick={resetAiAdjustments}
                        disabled={generatingAiImage}
                        className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Limpiar ajustes
                      </button>
                    </div>
                    {generatingAiImage && (
                      <p className="text-[11px] text-rosa-dark/90 dark:text-rosa-light/90 animate-pulse">
                        Preparando modelo, prenda y acabado comercial. Esto puede tardar unos segundos.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Agrega al menos una imagen para usarla como referencia.
                  </p>
                )}

                {aiGenerationSummary && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Imagen generada correctamente con {aiGenerationSummary}. Se agrego como primera imagen del producto.
                  </p>
                )}
                {aiGenerationError && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {aiGenerationError}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Fit Guide Image */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Fit Guide (IA)
              </h3>
              {form.sizeChartImageUrl && (
                <button
                  type="button"
                  onClick={() => updateField("sizeChartImageUrl", null)}
                  className="text-xs text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Quitar seleccion
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Analiza la tabla para extraer medidas en cm y pulgadas (sin decimales). Las tallas se sincronizan solo al confirmar.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              La imagen seleccionada para fit guide se excluye automaticamente de la galeria visible del producto.
            </p>

            {/* Thumbnails from product images */}
            {form.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seleccionar de imagenes del producto
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {form.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => updateField("sizeChartImageUrl", img)}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                        form.sizeChartImageUrl === img
                          ? "border-rosa ring-2 ring-rosa ring-offset-2 dark:ring-offset-gray-900"
                          : "border-gray-200 dark:border-gray-700 hover:border-rosa-light"
                      )}
                    >
                      <img
                        src={img}
                        alt={`Imagen ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.png";
                        }}
                      />
                      {form.sizeChartImageUrl === img && (
                        <div className="absolute inset-0 bg-rosa/20 flex items-center justify-center">
                          <div className="px-2 py-1 rounded bg-rosa text-white text-xs font-semibold">
                            OK
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Separator */}
            {form.images.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase">o</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
            )}

            {/* Manual URL input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL externa
              </label>
              <input
                type="url"
                value={form.sizeChartImageUrl || ""}
                onChange={(e) =>
                  updateField("sizeChartImageUrl", e.target.value || null)
                }
                placeholder="https://ivaniabeauty.shop/cdn/shop/files/..."
                className={inputClasses}
              />
            </div>

            {/* Preview */}
            {form.sizeChartImageUrl && !form.images.includes(form.sizeChartImageUrl) && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Vista previa (URL externa):</p>
                <img
                  src={form.sizeChartImageUrl}
                  alt="Tabla de tallas"
                  className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            {fitGuideStatus && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                <span
                  className={cn(
                    "px-2 py-1 rounded-full font-semibold",
                    fitGuideStatus === "confirmed" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                    fitGuideStatus === "draft" && "bg-rosa/15 text-rosa-dark dark:bg-rosa/20 dark:text-rosa-light",
                    fitGuideStatus === "stale" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                    fitGuideStatus === "failed" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  )}
                >
                  {fitGuideStatus}
                </span>
                {fitGuideConfidence != null && (
                  <span className="text-gray-500 dark:text-gray-400">
                    Confianza: {Math.round(fitGuideConfidence * 100)}%
                  </span>
                )}
              </div>
            )}

            {fitGuideWarnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
                  Advertencias Fit Guide
                </p>
                <ul className="text-xs text-amber-700/90 dark:text-amber-300/90 space-y-1">
                  {fitGuideWarnings.map((warning, idx) => (
                    <li key={idx}>- {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {isEditing && form.sizeChartImageUrl && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={analyzeFitGuide}
                    disabled={analyzingFitGuide || loadingFitGuide}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rosa/10 text-rosa hover:bg-rosa/20 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
                  >
                    {analyzingFitGuide ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    Analizar con IA
                  </button>

                  {fitGuideRows.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={saveFitGuideDraft}
                        disabled={savingFitGuideDraft}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
                      >
                        {savingFitGuideDraft ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Guardar borrador
                      </button>

                      <button
                        type="button"
                        onClick={confirmFitGuide}
                        disabled={confirmingFitGuide}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rosa text-white hover:bg-rosa-dark transition-colors text-sm font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {confirmingFitGuide ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Pencil className="w-4 h-4" />
                        )}
                        Confirmar y sincronizar tallas
                      </button>
                    </>
                  )}

                  {(fitGuideStatus || fitGuideRows.length > 0) && (
                    <button
                      type="button"
                      onClick={clearFitGuideCache}
                      disabled={loadingFitGuide}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm cursor-pointer disabled:opacity-50"
                      title="Limpiar cache de fit guide"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Fit Guide Editor */}
          {showFitGuideEditor && fitGuideRows.length > 0 && (
            <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  Editor de Fit Guide
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFitGuideEditor(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Edita valores en centimetros. La vista en pulgadas se calcula automaticamente con redondeo entero.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Imagen original:</p>
                  <img
                    src={form.sizeChartImageUrl || ""}
                    alt="Tabla de tallas original"
                    className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="py-2 px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Talla
                        </th>
                        {fitGuideMetricKeys.map((metricKey) => (
                          <th
                            key={metricKey}
                            className="py-2 px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-400"
                          >
                            {metricLabel(metricKey)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fitGuideRows.map((row, idx) => (
                        <tr key={`${row.size}-${idx}`} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-1.5 px-1">
                            <input
                              type="text"
                              value={row.size || ""}
                              onChange={(e) => updateFitGuideCell(idx, "size", e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                            />
                          </td>
                          {fitGuideMetricKeys.map((metricKey) => (
                            <td key={metricKey} className="py-1.5 px-1 min-w-[130px]">
                              <input
                                type="text"
                                value={row[metricKey] || ""}
                                onChange={(e) =>
                                  updateFitGuideCell(idx, metricKey, e.target.value)
                                }
                                placeholder="ej: 58-62"
                                className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                              />
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                in: {cmTextToInchesText(row[metricKey]) || "-"}
                              </p>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categorization */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Categorizacion
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={inputClasses + " cursor-pointer"}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ocasion
              </label>
              <select
                value={form.occasion}
                onChange={(e) => updateField("occasion", e.target.value)}
                className={inputClasses + " cursor-pointer"}
              >
                {OCCASIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Compresion
              </label>
              <select
                value={form.compression}
                onChange={(e) => updateField("compression", e.target.value)}
                className={inputClasses + " cursor-pointer"}
              >
                {COMPRESSIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <AdminBilingualInput
              label="Badge / Etiqueta"
              valueEn={form.badgeEn}
              valueEs={form.badgeEs}
              onChangeEn={(v) => updateField("badgeEn", v)}
              onChangeEs={(v) => updateField("badgeEs", v)}
              placeholder="Ej: Bestseller, Nuevo, Oferta"
            />
          </section>

          {/* Colors */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Colores</h3>
            <div className="flex flex-wrap gap-2.5">
              {ALL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleArrayItem("colors", color)}
                  className={cn(
                    "w-9 h-9 rounded-full border-2 transition-all cursor-pointer",
                    form.colors.includes(color)
                      ? "ring-2 ring-rosa ring-offset-2 dark:ring-offset-gray-900 border-rosa scale-110"
                      : "border-gray-200 dark:border-gray-700 hover:scale-110"
                  )}
                  style={{ backgroundColor: getColorHex(color) }}
                  title={color}
                />
              ))}
            </div>
            {form.colors.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Seleccionados: {form.colors.join(", ")}
              </p>
            )}
          </section>

          {/* Sizes */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Tallas</h3>
              {sizesLockedByFitGuide && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                  Controlado por fit guide
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ALL_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleArrayItem("sizes", size)}
                  disabled={sizesLockedByFitGuide}
                  className={cn(
                    "py-2 rounded-lg text-sm font-medium transition-all cursor-pointer text-center",
                    form.sizes.includes(size)
                      ? "bg-rosa text-white ring-2 ring-rosa shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
                    sizesLockedByFitGuide && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
            {missingInGuide.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Tallas fuera del fit guide: {missingInGuide.join(", ")}
              </p>
            )}
            {missingInProduct.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Tallas detectadas aun no sincronizadas: {missingInProduct.join(", ")}
              </p>
            )}
          </section>

          {/* Inventory */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Inventario</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock
              </label>
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) =>
                  updateField("stockQuantity", e.target.value)
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Umbral stock bajo
              </label>
              <input
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={(e) =>
                  updateField("lowStockThreshold", e.target.value)
                }
                className={inputClasses}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => updateField("inStock", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-rosa focus:ring-rosa"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">En stock</span>
            </label>
          </section>

          {/* Display Options */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Opciones de display
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField("isActive", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-rosa focus:ring-rosa"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Producto activo (visible en tienda)
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  updateField("isFeatured", e.target.checked)
                }
                className="w-4 h-4 rounded border-gray-300 text-rosa focus:ring-rosa"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Producto destacado
              </span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Orden
              </label>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => updateField("sortOrder", e.target.value)}
                className={inputClasses}
              />
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
