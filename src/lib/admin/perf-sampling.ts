const ADMIN_PERF_SAMPLE_SESSION_KEY = "admin_perf_sample_v1";
const ADMIN_PERF_FORCE_SESSION_KEY = "admin_perf_force_v1";
const ADMIN_PERF_SAMPLE_RATE = 0.35;

let cachedSampleDecision: boolean | null = null;

export function isAdminPerfSampledSession(): boolean {
  if (cachedSampleDecision !== null) {
    return cachedSampleDecision;
  }
  if (typeof window === "undefined") return false;

  try {
    const forcedByEnv = process.env.NEXT_PUBLIC_ADMIN_PERF_ALWAYS_ON === "1";
    if (forcedByEnv) {
      cachedSampleDecision = true;
      return true;
    }

    const forcedSessionValue = window.sessionStorage.getItem(
      ADMIN_PERF_FORCE_SESSION_KEY
    );
    if (forcedSessionValue === "1") {
      cachedSampleDecision = true;
      return true;
    }
    if (forcedSessionValue === "0") {
      cachedSampleDecision = false;
      return false;
    }

    // In local/dev we keep this disabled by default to avoid noise while iterating.
    if (process.env.NODE_ENV !== "production") {
      cachedSampleDecision = false;
      return false;
    }

    const cached = window.sessionStorage.getItem(ADMIN_PERF_SAMPLE_SESSION_KEY);
    if (cached === "1") {
      cachedSampleDecision = true;
      return true;
    }
    if (cached === "0") {
      cachedSampleDecision = false;
      return false;
    }

    const sampled = Math.random() < ADMIN_PERF_SAMPLE_RATE;
    window.sessionStorage.setItem(
      ADMIN_PERF_SAMPLE_SESSION_KEY,
      sampled ? "1" : "0"
    );
    cachedSampleDecision = sampled;
    return sampled;
  } catch {
    cachedSampleDecision = false;
    return false;
  }
}
