/**
 * Lightweight analytics event tracker.
 * Fire-and-forget - never blocks the UI.
 */
export function trackEvent(
  type: string,
  data: Record<string, unknown> = {}
) {
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: type,
        event_data: data,
      }),
    }).catch(() => {});
  } catch {
    // Never throw from analytics
  }
}
