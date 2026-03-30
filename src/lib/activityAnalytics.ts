const ACTIVITY_ANALYTICS_PREFIX = "activityAnalytics_";

export type ActivityEventType =
  | "article_open"
  | "ai_summary"
  | "personalization_suggestion";

export type ActivityEvent = {
  type: ActivityEventType;
  timestamp: string;
  source?: string;
  category?: string;
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
  details?: { source?: string; category?: string },
) {
  const current = readActivityAnalytics();
  const nextEvent: ActivityEvent = {
    type,
    timestamp: new Date().toISOString(),
    source: details?.source?.trim() || undefined,
    category: details?.category?.trim() || undefined,
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
