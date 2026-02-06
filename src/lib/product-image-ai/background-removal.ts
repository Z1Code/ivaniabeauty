import { FieldValue } from "firebase-admin/firestore";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";

export type ProviderId = "removebg" | "clipdrop";
export type ProviderSecretSource = "env" | "firestore" | "none";

interface RemovalInput {
  imageBuffer: Buffer;
  mimeType: string;
}

interface ProviderError {
  status?: number;
  code?: string;
  message: string;
}

interface StoredProviderSecrets {
  removebgApiKey: string | null;
  clipdropApiKey: string | null;
  providerOrder: ProviderId[] | null;
}

interface ResolvedProviderSecrets {
  removebgApiKey: string | null;
  clipdropApiKey: string | null;
  providerOrder: ProviderId[];
  configuredProviders: ProviderId[];
  sources: Record<ProviderId, ProviderSecretSource>;
}

export interface BackgroundRemovalResult {
  imageBuffer: Buffer;
  mimeType: string;
  provider: ProviderId;
}

export interface BackgroundRemovalAttempt {
  provider: ProviderId;
  ok: boolean;
  skipped: boolean;
  durationMs: number;
  status: number | null;
  code: string | null;
  message: string | null;
}

export interface BackgroundRemovalConfiguration {
  configured: boolean;
  providerOrder: ProviderId[];
  configuredProviders: ProviderId[];
}

export interface BackgroundRemovalProviderStatus {
  configured: boolean;
  providerOrder: ProviderId[];
  configuredProviders: ProviderId[];
  providers: Record<
    ProviderId,
    {
      hasEnv: boolean;
      hasFirestore: boolean;
      source: ProviderSecretSource;
    }
  >;
}

export interface BackgroundRemovalDiagnostics {
  configured: boolean;
  providerOrder: ProviderId[];
  configuredProviders: ProviderId[];
  attempts: BackgroundRemovalAttempt[];
  applied: boolean;
  provider: ProviderId | null;
  error: string | null;
}

export interface SpecializedRemovalOutcome {
  result: BackgroundRemovalResult | null;
  diagnostics: BackgroundRemovalDiagnostics;
}

export interface UpdateBackgroundRemovalSecretsInput {
  removebgApiKey?: string | null;
  clipdropApiKey?: string | null;
  providerOrder?: ProviderId[] | string[] | null;
}

const DEFAULT_PROVIDER_ORDER: ProviderId[] = ["removebg", "clipdrop"];
const DEFAULT_TIMEOUT_MS = 20_000;
const SECRETS_COLLECTION = "systemConfig";
const SECRETS_DOC_ID = "aiProviderSecrets";
const CACHE_TTL_MS = 60_000;

let cachedSecrets: { value: StoredProviderSecrets; expiresAt: number } | null = null;

function getTimeoutMs(
  name:
    | "BACKGROUND_REMOVAL_TIMEOUT_MS"
    | "REMOVEBG_TIMEOUT_MS"
    | "CLIPDROP_TIMEOUT_MS"
): number {
  const raw = process.env[name];
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(parsed, 60_000);
}

function parseProviderOrder(items: string[]): ProviderId[] {
  const order: ProviderId[] = [];
  for (const item of items) {
    const normalized = item.trim().toLowerCase();
    if (normalized === "removebg" && !order.includes("removebg")) {
      order.push("removebg");
    }
    if (normalized === "clipdrop" && !order.includes("clipdrop")) {
      order.push("clipdrop");
    }
  }
  return order.length ? order : [...DEFAULT_PROVIDER_ORDER];
}

function pickEnvProviderOrder(): ProviderId[] {
  const raw = process.env.BACKGROUND_REMOVAL_PROVIDER_ORDER;
  if (!raw || !raw.trim()) return [...DEFAULT_PROVIDER_ORDER];
  return parseProviderOrder(raw.split(","));
}

function sanitizeApiKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeStoredProviderOrder(value: unknown): ProviderId[] | null {
  if (!Array.isArray(value)) return null;
  const order = parseProviderOrder(
    value.filter((item): item is string => typeof item === "string")
  );
  return order.length ? order : null;
}

function getRemoveBgApiKeyFromEnv(): string | null {
  return sanitizeApiKey(process.env.REMOVEBG_API_KEY);
}

function getClipdropApiKeyFromEnv(): string | null {
  return sanitizeApiKey(process.env.CLIPDROP_API_KEY);
}

function emptyStoredSecrets(): StoredProviderSecrets {
  return {
    removebgApiKey: null,
    clipdropApiKey: null,
    providerOrder: null,
  };
}

function clearSecretsCache(): void {
  cachedSecrets = null;
}

async function readStoredSecrets(): Promise<StoredProviderSecrets> {
  if (!isFirebaseConfigured()) {
    return emptyStoredSecrets();
  }

  const now = Date.now();
  if (cachedSecrets && cachedSecrets.expiresAt > now) {
    return cachedSecrets.value;
  }

  try {
    const docSnap = await adminDb
      .collection(SECRETS_COLLECTION)
      .doc(SECRETS_DOC_ID)
      .get();
    if (!docSnap.exists) {
      const empty = emptyStoredSecrets();
      cachedSecrets = { value: empty, expiresAt: now + CACHE_TTL_MS };
      return empty;
    }

    const data = docSnap.data() || {};
    const parsed: StoredProviderSecrets = {
      removebgApiKey: sanitizeApiKey(data.removebgApiKey),
      clipdropApiKey: sanitizeApiKey(data.clipdropApiKey),
      providerOrder: sanitizeStoredProviderOrder(data.providerOrder),
    };
    cachedSecrets = { value: parsed, expiresAt: now + CACHE_TTL_MS };
    return parsed;
  } catch {
    return emptyStoredSecrets();
  }
}

async function resolveProviderSecrets(): Promise<ResolvedProviderSecrets> {
  const stored = await readStoredSecrets();

  const removebgEnv = getRemoveBgApiKeyFromEnv();
  const clipdropEnv = getClipdropApiKeyFromEnv();

  const removebg = removebgEnv || stored.removebgApiKey;
  const clipdrop = clipdropEnv || stored.clipdropApiKey;

  const configuredProviders: ProviderId[] = [];
  if (removebg) configuredProviders.push("removebg");
  if (clipdrop) configuredProviders.push("clipdrop");

  const providerOrder = (() => {
    const envRaw = process.env.BACKGROUND_REMOVAL_PROVIDER_ORDER;
    if (envRaw && envRaw.trim()) return pickEnvProviderOrder();
    if (stored.providerOrder?.length) return stored.providerOrder;
    return [...DEFAULT_PROVIDER_ORDER];
  })();

  return {
    removebgApiKey: removebg,
    clipdropApiKey: clipdrop,
    providerOrder,
    configuredProviders,
    sources: {
      removebg: removebgEnv ? "env" : stored.removebgApiKey ? "firestore" : "none",
      clipdrop: clipdropEnv ? "env" : stored.clipdropApiKey ? "firestore" : "none",
    },
  };
}

function normalizeProviderError(error: unknown, fallbackCode: string): ProviderError {
  const typed = error as Error & { status?: number; code?: string };
  return {
    message: String(typed?.message || "unknown provider error"),
    status: typeof typed?.status === "number" ? typed.status : undefined,
    code: typed?.code || fallbackCode,
  };
}

function buildMissingProviderError(provider: ProviderId): ProviderError {
  if (provider === "removebg") {
    return {
      message: "REMOVEBG_API_KEY is not configured",
      code: "MISSING_REMOVEBG_KEY",
      status: 503,
    };
  }
  return {
    message: "CLIPDROP_API_KEY is not configured",
    code: "MISSING_CLIPDROP_KEY",
    status: 503,
  };
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw Object.assign(
        new Error(`Provider request timed out after ${timeoutMs}ms`),
        {
          status: 504,
          code: "PROVIDER_TIMEOUT",
        }
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function removeWithRemoveBg({
  imageBuffer,
  mimeType,
  apiKey,
  timeoutMs,
}: RemovalInput & { apiKey: string; timeoutMs: number }): Promise<BackgroundRemovalResult> {
  const formData = new FormData();
  formData.append("size", "auto");
  formData.append("format", "png");
  formData.append(
    "image_file",
    new Blob([Uint8Array.from(imageBuffer)], { type: mimeType || "image/png" }),
    "input.png"
  );

  const response = await fetchWithTimeout(
    "https://api.remove.bg/v1.0/removebg",
    {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    },
    timeoutMs
  );

  const contentType = response.headers.get("content-type") || "image/png";
  if (!response.ok) {
    const rawText = await response.text().catch(() => "");
    throw Object.assign(
      new Error(
        `remove.bg failed (${response.status})${rawText ? `: ${rawText.slice(0, 280)}` : ""}`
      ),
      { status: response.status, code: "REMOVEBG_FAILED" }
    );
  }

  return {
    imageBuffer: Buffer.from(await response.arrayBuffer()),
    mimeType: contentType.includes("png") ? "image/png" : contentType,
    provider: "removebg",
  };
}

async function removeWithClipdrop({
  imageBuffer,
  mimeType,
  apiKey,
  timeoutMs,
}: RemovalInput & { apiKey: string; timeoutMs: number }): Promise<BackgroundRemovalResult> {
  const formData = new FormData();
  formData.append(
    "image_file",
    new Blob([Uint8Array.from(imageBuffer)], { type: mimeType || "image/png" }),
    "input.png"
  );

  const response = await fetchWithTimeout(
    "https://clipdrop-api.co/remove-background/v1",
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: formData,
    },
    timeoutMs
  );

  const contentType = response.headers.get("content-type") || "image/png";
  if (!response.ok) {
    const rawText = await response.text().catch(() => "");
    throw Object.assign(
      new Error(
        `Clipdrop remove-background failed (${response.status})${rawText ? `: ${rawText.slice(0, 280)}` : ""}`
      ),
      { status: response.status, code: "CLIPDROP_REMOVAL_FAILED" }
    );
  }

  return {
    imageBuffer: Buffer.from(await response.arrayBuffer()),
    mimeType: contentType.includes("png") ? "image/png" : contentType,
    provider: "clipdrop",
  };
}

export function getBackgroundRemovalConfiguration(): BackgroundRemovalConfiguration {
  const providerOrder = pickEnvProviderOrder();
  const configuredProviders: ProviderId[] = [];
  if (getRemoveBgApiKeyFromEnv()) configuredProviders.push("removebg");
  if (getClipdropApiKeyFromEnv()) configuredProviders.push("clipdrop");
  return {
    configured: configuredProviders.length > 0,
    providerOrder,
    configuredProviders,
  };
}

export function isSpecializedBackgroundRemovalConfigured(): boolean {
  return getBackgroundRemovalConfiguration().configured;
}

export async function getBackgroundRemovalConfigurationRuntime(): Promise<BackgroundRemovalConfiguration> {
  const resolved = await resolveProviderSecrets();
  return {
    configured: resolved.configuredProviders.length > 0,
    providerOrder: resolved.providerOrder,
    configuredProviders: resolved.configuredProviders,
  };
}

export async function getBackgroundRemovalProviderStatus(): Promise<BackgroundRemovalProviderStatus> {
  const resolved = await resolveProviderSecrets();
  return {
    configured: resolved.configuredProviders.length > 0,
    providerOrder: resolved.providerOrder,
    configuredProviders: resolved.configuredProviders,
    providers: {
      removebg: {
        hasEnv: resolved.sources.removebg === "env",
        hasFirestore: resolved.sources.removebg === "firestore",
        source: resolved.sources.removebg,
      },
      clipdrop: {
        hasEnv: resolved.sources.clipdrop === "env",
        hasFirestore: resolved.sources.clipdrop === "firestore",
        source: resolved.sources.clipdrop,
      },
    },
  };
}

export async function upsertBackgroundRemovalSecrets(
  input: UpdateBackgroundRemovalSecretsInput
): Promise<BackgroundRemovalProviderStatus> {
  if (!isFirebaseConfigured()) {
    const error = new Error("Firebase is not configured for server-side secret storage");
    (error as Error & { status?: number; code?: string }).status = 503;
    (error as Error & { status?: number; code?: string }).code =
      "FIREBASE_NOT_CONFIGURED";
    throw error;
  }

  const updatePayload: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (Object.prototype.hasOwnProperty.call(input, "removebgApiKey")) {
    updatePayload.removebgApiKey = sanitizeApiKey(input.removebgApiKey) || null;
  }
  if (Object.prototype.hasOwnProperty.call(input, "clipdropApiKey")) {
    updatePayload.clipdropApiKey = sanitizeApiKey(input.clipdropApiKey) || null;
  }
  if (Object.prototype.hasOwnProperty.call(input, "providerOrder")) {
    const order =
      Array.isArray(input.providerOrder) &&
      input.providerOrder.length > 0
        ? parseProviderOrder(
            input.providerOrder.filter(
              (item): item is string => typeof item === "string"
            )
          )
        : null;
    updatePayload.providerOrder = order;
  }

  await adminDb
    .collection(SECRETS_COLLECTION)
    .doc(SECRETS_DOC_ID)
    .set(updatePayload, { merge: true });

  clearSecretsCache();
  return getBackgroundRemovalProviderStatus();
}

export async function removeBackgroundSpecializedWithDiagnostics(
  input: RemovalInput
): Promise<SpecializedRemovalOutcome> {
  const resolved = await resolveProviderSecrets();
  const config: BackgroundRemovalConfiguration = {
    configured: resolved.configuredProviders.length > 0,
    providerOrder: resolved.providerOrder,
    configuredProviders: resolved.configuredProviders,
  };
  const attempts: BackgroundRemovalAttempt[] = [];

  for (const provider of config.providerOrder) {
    const startedAt = Date.now();
    const apiKey =
      provider === "removebg"
        ? resolved.removebgApiKey
        : resolved.clipdropApiKey;

    if (!apiKey) {
      const missing = buildMissingProviderError(provider);
      attempts.push({
        provider,
        ok: false,
        skipped: true,
        durationMs: Date.now() - startedAt,
        status: missing.status || null,
        code: missing.code || null,
        message: missing.message,
      });
      continue;
    }

    try {
      const timeoutMs =
        provider === "removebg"
          ? getTimeoutMs("REMOVEBG_TIMEOUT_MS")
          : getTimeoutMs("CLIPDROP_TIMEOUT_MS");
      const baseTimeoutMs = getTimeoutMs("BACKGROUND_REMOVAL_TIMEOUT_MS");
      const effectiveTimeout = Math.max(timeoutMs, baseTimeoutMs);

      const result =
        provider === "removebg"
          ? await removeWithRemoveBg({
              ...input,
              apiKey,
              timeoutMs: effectiveTimeout,
            })
          : await removeWithClipdrop({
              ...input,
              apiKey,
              timeoutMs: effectiveTimeout,
            });

      attempts.push({
        provider,
        ok: true,
        skipped: false,
        durationMs: Date.now() - startedAt,
        status: 200,
        code: null,
        message: null,
      });

      return {
        result,
        diagnostics: {
          configured: config.configured,
          configuredProviders: config.configuredProviders,
          providerOrder: config.providerOrder,
          attempts,
          applied: true,
          provider,
          error: null,
        },
      };
    } catch (error) {
      const parsed = normalizeProviderError(
        error,
        provider === "removebg" ? "REMOVEBG_FAILED" : "CLIPDROP_REMOVAL_FAILED"
      );
      attempts.push({
        provider,
        ok: false,
        skipped: false,
        durationMs: Date.now() - startedAt,
        status: parsed.status || null,
        code: parsed.code || null,
        message: parsed.message,
      });
    }
  }

  const failures = attempts.filter((item) => !item.ok && !item.skipped);
  const error = failures.length
    ? failures
        .map((item) => `${item.provider}: ${item.message || item.code || "failed"}`)
        .join(" | ")
    : null;

  return {
    result: null,
    diagnostics: {
      configured: config.configured,
      configuredProviders: config.configuredProviders,
      providerOrder: config.providerOrder,
      attempts,
      applied: false,
      provider: null,
      error,
    },
  };
}
