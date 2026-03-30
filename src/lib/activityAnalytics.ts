const ACTIVITY_ANALYTICS_PREFIX = "activityAnalytics_";

export type ActivityEventType =
  | "article_open"
  | "ai_summary"
  | "personalization_suggestion"
  | "category_visit";

export type ActivityEvent = {
  type: ActivityEventType;
  timestamp: string;
  source?: string;
  category?: string;
  durationMs?: number;
};

export type ActivityAnalytics = {
  aiSummaryCount: number;
  personalizationSuggestionCount: number;
  events: ActivityEvent[];
};

const DEFAULT_ACTIVITY_ANALYTICS: ActivityAnalytics = {
  aiSummaryCount: 0,
  personalizationSuggestionCount: 0,
  events: [],
};

function resolveAnalyticsKey() {
  if (typeof window === "undefined") return `${ACTIVITY_ANALYTICS_PREFIX}guest`;
  const email = localStorage.getItem("auth_email")?.trim() || "guest";
  return `${ACTIVITY_ANALYTICS_PREFIX}${email}`;
}

export function readActivityAnalytics(): ActivityAnalytics {
  if (typeof window === "undefined") return DEFAULT_ACTIVITY_ANALYTICS;

  try {
    const raw = localStorage.getItem(resolveAnalyticsKey());
    if (!raw) return DEFAULT_ACTIVITY_ANALYTICS;
    const parsed = JSON.parse(raw) as Partial<ActivityAnalytics>;
    return {
      aiSummaryCount: Number(parsed.aiSummaryCount ?? 0),
      personalizationSuggestionCount: Number(
        parsed.personalizationSuggestionCount ?? 0,
      ),
      events: Array.isArray(parsed.events)
        ? (parsed.events as ActivityEvent[])
        : [],
    };
  } catch {
    return DEFAULT_ACTIVITY_ANALYTICS;
  }
}

function writeActivityAnalytics(next: ActivityAnalytics) {
  if (typeof window === "undefined") return;
  localStorage.setItem(resolveAnalyticsKey(), JSON.stringify(next));
}

export function trackActivityEvent(
  type: ActivityEventType,
  details?: { source?: string; category?: string; durationMs?: number },
) {
  const current = readActivityAnalytics();
  const nextEvent: ActivityEvent = {
    type,
    timestamp: new Date().toISOString(),
    source: details?.source?.trim() || undefined,
    category: details?.category?.trim() || undefined,
    durationMs:
      typeof details?.durationMs === "number" && Number.isFinite(details.durationMs)
        ? Math.max(0, Math.round(details.durationMs))
        : undefined,
  };

  writeActivityAnalytics({
    ...current,
    aiSummaryCount:
      type === "ai_summary"
        ? current.aiSummaryCount + 1
        : current.aiSummaryCount,
    personalizationSuggestionCount:
      type === "personalization_suggestion"
        ? current.personalizationSuggestionCount + 1
        : current.personalizationSuggestionCount,
    events: [...current.events, nextEvent].slice(-500),
  });
}

export function incrementAiSummaryUsage(details?: {
  source?: string;
  category?: string;
}) {
  trackActivityEvent("ai_summary", details);
}

export function incrementPersonalizationSuggestionUsage() {
  trackActivityEvent("personalization_suggestion");
}

export function trackCategoryVisit(category: string, durationMs: number) {
  if (!category.trim()) return;
  if (!Number.isFinite(durationMs) || durationMs < 1000) return;
  trackActivityEvent("category_visit", { category, durationMs });
}
