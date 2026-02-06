export type ProviderId = "removebg" | "clipdrop";

interface RemovalInput {
  imageBuffer: Buffer;
  mimeType: string;
}

interface ProviderError {
  status?: number;
  code?: string;
  message: string;
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

const DEFAULT_PROVIDER_ORDER: ProviderId[] = ["removebg", "clipdrop"];
const DEFAULT_TIMEOUT_MS = 20_000;

function getTimeoutMs(name: "BACKGROUND_REMOVAL_TIMEOUT_MS" | "REMOVEBG_TIMEOUT_MS" | "CLIPDROP_TIMEOUT_MS"): number {
  const raw = process.env[name];
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(parsed, 60_000);
}

function pickConfiguredProviderOrder(): ProviderId[] {
  const configured = (
    process.env.BACKGROUND_REMOVAL_PROVIDER_ORDER || DEFAULT_PROVIDER_ORDER.join(",")
  )
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const order: ProviderId[] = [];
  for (const item of configured) {
    if (item === "removebg" && !order.includes("removebg")) {
      order.push("removebg");
    }
    if (item === "clipdrop" && !order.includes("clipdrop")) {
      order.push("clipdrop");
    }
  }
  return order.length ? order : [...DEFAULT_PROVIDER_ORDER];
}

function getRemoveBgApiKey(): string | null {
  const key = process.env.REMOVEBG_API_KEY?.trim();
  return key ? key : null;
}

function getClipdropApiKey(): string | null {
  const key = process.env.CLIPDROP_API_KEY?.trim();
  return key ? key : null;
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
  const inputBytes = Uint8Array.from(imageBuffer);
  formData.append(
    "image_file",
    new Blob([inputBytes], { type: mimeType || "image/png" }),
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

  const outputBuffer = Buffer.from(await response.arrayBuffer());
  return {
    imageBuffer: outputBuffer,
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
  const inputBytes = Uint8Array.from(imageBuffer);
  formData.append(
    "image_file",
    new Blob([inputBytes], { type: mimeType || "image/png" }),
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

  const outputBuffer = Buffer.from(await response.arrayBuffer());
  return {
    imageBuffer: outputBuffer,
    mimeType: contentType.includes("png") ? "image/png" : contentType,
    provider: "clipdrop",
  };
}

export function getBackgroundRemovalConfiguration(): BackgroundRemovalConfiguration {
  const providerOrder = pickConfiguredProviderOrder();
  const configuredProviders: ProviderId[] = [];
  if (getRemoveBgApiKey()) configuredProviders.push("removebg");
  if (getClipdropApiKey()) configuredProviders.push("clipdrop");
  return {
    configured: configuredProviders.length > 0,
    providerOrder,
    configuredProviders,
  };
}

export function isSpecializedBackgroundRemovalConfigured(): boolean {
  return getBackgroundRemovalConfiguration().configured;
}

export async function removeBackgroundSpecializedWithDiagnostics(
  input: RemovalInput
): Promise<SpecializedRemovalOutcome> {
  const config = getBackgroundRemovalConfiguration();
  const attempts: BackgroundRemovalAttempt[] = [];

  for (const provider of config.providerOrder) {
    const startedAt = Date.now();

    if (!config.configuredProviders.includes(provider)) {
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
              apiKey: getRemoveBgApiKey() as string,
              timeoutMs: effectiveTimeout,
            })
          : await removeWithClipdrop({
              ...input,
              apiKey: getClipdropApiKey() as string,
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

export async function removeBackgroundSpecialized(
  input: RemovalInput
): Promise<BackgroundRemovalResult | null> {
  const outcome = await removeBackgroundSpecializedWithDiagnostics(input);
  if (outcome.result) return outcome.result;
  if (outcome.diagnostics.error) {
    throw Object.assign(
      new Error(`Specialized background removal failed. ${outcome.diagnostics.error}`),
      {
        status: 502,
        code: "SPECIALIZED_BG_REMOVAL_FAILED",
      }
    );
  }
  return null;
}
