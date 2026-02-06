import type {
  FitGuideMetric,
  FitGuideRow,
  FitGuideStatus,
  SizeChartMeasurement,
} from "@/lib/firebase/types";
import {
  METRIC_ALIASES,
  PREFERRED_METRIC_ORDER,
  SIZE_ALIASES,
  SIZE_ORDER,
} from "./constants";

type UnitKind = "cm" | "in" | "unknown";

interface NormalizeRowsOptions {
  assumedUnit?: UnitKind;
}

export interface FitGuideDisplayValue {
  cm: string | null;
  in: string | null;
}

export interface FitGuideDisplayRow {
  size: string;
  metrics: Record<string, FitGuideDisplayValue | null>;
}

export interface FitGuideNormalizationResult {
  rows: FitGuideRow[];
  availableSizesCanonical: string[];
  warnings: string[];
  confidenceScore: number;
  status: FitGuideStatus;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function sanitizeMetricKey(raw: string): string {
  const normalized = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return METRIC_ALIASES[normalized] || normalized || "metric";
}

function normalizeSizeToken(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, "")
    .replace(/_/g, "/");
}

export function canonicalizeSizeLabel(input: string): string {
  const token = normalizeSizeToken(input);
  if (!token) return "";

  if (token.includes("/")) {
    const parts = token
      .split("/")
      .map((part) => canonicalizeSizeLabel(part))
      .filter(Boolean);
    return [...new Set(parts)].join("/");
  }

  if (SIZE_ALIASES[token]) {
    return SIZE_ALIASES[token];
  }

  return token;
}

function getSizeRank(size: string): number {
  const idx = SIZE_ORDER.indexOf(size as (typeof SIZE_ORDER)[number]);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

export function compareSizes(a: string, b: string): number {
  const rankA = getSizeRank(a);
  const rankB = getSizeRank(b);

  if (rankA === rankB) {
    return a.localeCompare(b);
  }

  return rankA - rankB;
}

export function normalizeSizeList(sizes: string[]): string[] {
  return [...new Set(sizes.map(canonicalizeSizeLabel).filter(Boolean))].sort(compareSizes);
}

export function areSameSizeSet(left: string[], right: string[]): boolean {
  const a = normalizeSizeList(left);
  const b = normalizeSizeList(right);
  if (a.length !== b.length) return false;
  return a.every((value, idx) => value === b[idx]);
}

function parseNumericTokens(raw: string): number[] {
  const values = raw.match(/\d+(?:[.,]\d+)?/g) || [];
  return values
    .map((token) => Number.parseFloat(token.replace(",", ".")))
    .filter((value) => Number.isFinite(value));
}

function maybeConvertToCm(value: number, unit: UnitKind): number {
  if (unit === "in") {
    return value * 2.54;
  }
  return value;
}

export function normalizeMetric(input: unknown, unit: UnitKind = "cm"): FitGuideMetric | null {
  if (input == null) return null;

  if (typeof input === "object" && input) {
    const obj = input as Partial<FitGuideMetric>;
    if (obj.min_cm != null || obj.max_cm != null) {
      const min = obj.min_cm == null ? null : Math.round(Number(obj.min_cm));
      const max = obj.max_cm == null ? null : Math.round(Number(obj.max_cm));
      return {
        min_cm: min,
        max_cm: max,
        raw: obj.raw ?? null,
        confidence:
          obj.confidence == null
            ? null
            : clamp(Number(obj.confidence)),
      };
    }
  }

  if (typeof input !== "string") return null;

  const raw = input.trim();
  if (!raw) return null;

  const values = parseNumericTokens(raw);
  if (!values.length) {
    return {
      min_cm: null,
      max_cm: null,
      raw,
      confidence: 0.2,
    };
  }

  const [first, second] = values;
  const minRaw = second == null ? first : Math.min(first, second);
  const maxRaw = second == null ? first : Math.max(first, second);

  const minCm = Math.round(maybeConvertToCm(minRaw, unit));
  const maxCm = Math.round(maybeConvertToCm(maxRaw, unit));

  return {
    min_cm: minCm,
    max_cm: maxCm,
    raw,
    confidence: values.length ? 0.8 : 0.4,
  };
}

export function metricToCmText(metric: FitGuideMetric | null | undefined): string | null {
  if (!metric) return null;
  if (metric.min_cm == null && metric.max_cm == null) return null;
  const min = metric.min_cm ?? metric.max_cm;
  const max = metric.max_cm ?? metric.min_cm;
  if (min == null || max == null) return null;
  if (min === max) return String(min);
  return `${min}-${max}`;
}

export function metricToInText(metric: FitGuideMetric | null | undefined): string | null {
  if (!metric) return null;
  if (metric.min_cm == null && metric.max_cm == null) return null;
  const minCm = metric.min_cm ?? metric.max_cm;
  const maxCm = metric.max_cm ?? metric.min_cm;
  if (minCm == null || maxCm == null) return null;
  const minIn = Math.round(minCm / 2.54);
  const maxIn = Math.round(maxCm / 2.54);
  if (minIn === maxIn) return String(minIn);
  return `${minIn}-${maxIn}`;
}

export function getRowMetricKeys(rows: FitGuideRow[]): string[] {
  const discovered = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (key === "size") continue;
      const value = row[key];
      if (value && typeof value === "object" && "min_cm" in value) {
        discovered.add(key);
      }
    }
  }

  const known = PREFERRED_METRIC_ORDER.filter((key) => discovered.has(key));
  const extra = [...discovered]
    .filter((key) => !PREFERRED_METRIC_ORDER.includes(key as (typeof PREFERRED_METRIC_ORDER)[number]))
    .sort();
  return [...known, ...extra];
}

export function rowsToDisplayRows(rows: FitGuideRow[]): FitGuideDisplayRow[] {
  const metricKeys = getRowMetricKeys(rows);
  return rows.map((row) => {
    const metrics: Record<string, FitGuideDisplayValue | null> = {};
    for (const key of metricKeys) {
      const metric = row[key] as FitGuideMetric | null | undefined;
      metrics[key] = metric
        ? { cm: metricToCmText(metric), in: metricToInText(metric) }
        : null;
    }
    return {
      size: row.size,
      metrics,
    };
  });
}

export function rowsToLegacyMeasurements(rows: FitGuideRow[]): SizeChartMeasurement[] {
  return rows.map((row) => ({
    size: row.size,
    waist_cm: metricToCmText(row.waist as FitGuideMetric | null | undefined),
    hip_cm: metricToCmText(row.hip as FitGuideMetric | null | undefined),
    bust_cm: metricToCmText(row.bust as FitGuideMetric | null | undefined),
    length_cm: metricToCmText(row.length as FitGuideMetric | null | undefined),
  }));
}

export function measurementsToRows(measurements: SizeChartMeasurement[]): FitGuideRow[] {
  return measurements.map((measurement) => ({
    size: canonicalizeSizeLabel(measurement.size),
    waist: normalizeMetric(measurement.waist_cm),
    hip: normalizeMetric(measurement.hip_cm),
    bust: normalizeMetric(measurement.bust_cm),
    length: normalizeMetric(measurement.length_cm),
  }));
}

function collectMonotonicWarnings(rows: FitGuideRow[], keys: string[]): string[] {
  const warnings: string[] = [];

  for (const key of keys) {
    const values = rows
      .map((row) => {
        const metric = row[key] as FitGuideMetric | null | undefined;
        return metric?.min_cm ?? null;
      })
      .filter((value): value is number => value != null);

    if (values.length < 3) continue;

    let decreases = 0;
    for (let i = 1; i < values.length; i += 1) {
      if (values[i] < values[i - 1]) decreases += 1;
    }

    if (decreases > 0) {
      warnings.push(`Possible non-monotonic values detected for "${key}".`);
    }
  }

  return warnings;
}

function collectSuspiciousScaleWarnings(rows: FitGuideRow[], keys: string[]): string[] {
  const warnings: string[] = [];
  for (const key of keys) {
    const values = rows
      .map((row) => {
        const metric = row[key] as FitGuideMetric | null | undefined;
        return metric?.max_cm ?? metric?.min_cm ?? null;
      })
      .filter((value): value is number => value != null);

    if (!values.length) continue;

    const max = Math.max(...values);
    const min = Math.min(...values);
    if (max <= 30 && min >= 4) {
      warnings.push(`Metric "${key}" looks like non-body sizing or inches-only values.`);
    }
  }
  return warnings;
}

function scoreRows(rows: FitGuideRow[], keys: string[]): number {
  if (!rows.length || !keys.length) return 0;
  const totalSlots = rows.length * keys.length;
  let filled = 0;

  for (const row of rows) {
    for (const key of keys) {
      const metric = row[key] as FitGuideMetric | null | undefined;
      if (metric?.min_cm != null || metric?.max_cm != null) {
        filled += 1;
      }
    }
  }

  return clamp(filled / totalSlots);
}

function mergeRows(rows: FitGuideRow[]): FitGuideRow[] {
  const map = new Map<string, FitGuideRow>();
  for (const row of rows) {
    if (!row.size) continue;
    const existing = map.get(row.size);
    if (!existing) {
      map.set(row.size, row);
      continue;
    }
    const merged: FitGuideRow = { ...existing };
    for (const key of Object.keys(row)) {
      if (key === "size") continue;
      if (!merged[key] && row[key]) {
        merged[key] = row[key];
      }
    }
    map.set(row.size, merged);
  }
  return [...map.values()].sort((a, b) => compareSizes(a.size, b.size));
}

export function normalizeRows(
  rawRows: Array<Record<string, unknown>>,
  options: NormalizeRowsOptions = {}
): FitGuideNormalizationResult {
  const assumedUnit = options.assumedUnit || "cm";
  const normalized: FitGuideRow[] = [];

  for (const rawRow of rawRows) {
    const sizeInput = String(rawRow.size || "").trim();
    const size = canonicalizeSizeLabel(sizeInput);
    if (!size) continue;

    const row: FitGuideRow = { size };
    for (const [key, value] of Object.entries(rawRow)) {
      if (key === "size") continue;
      const metricKey = sanitizeMetricKey(key);
      row[metricKey] = normalizeMetric(value, assumedUnit);
    }
    normalized.push(row);
  }

  const rows = mergeRows(normalized);
  const metricKeys = getRowMetricKeys(rows);
  const availableSizesCanonical = rows.map((row) => row.size);

  const warnings = [
    ...collectMonotonicWarnings(rows, metricKeys),
    ...collectSuspiciousScaleWarnings(rows, metricKeys),
  ];
  if (!rows.length) {
    warnings.push("No valid rows were extracted from the fit guide image.");
  }

  const baseScore = scoreRows(rows, metricKeys);
  const confidencePenalty = clamp(warnings.length * 0.08, 0, 0.4);
  const confidenceScore = clamp(baseScore - confidencePenalty);
  const status: FitGuideStatus =
    !rows.length || baseScore === 0 ? "failed" : "draft";

  return {
    rows,
    availableSizesCanonical,
    warnings,
    confidenceScore,
    status,
  };
}
