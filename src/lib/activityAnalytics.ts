import { supabase } from "../../lib/superbaseClient";
import { getVerifiedAuthUser } from "@/lib/clientAuth";

export type ActivityEventType =
  | "article_open"
  | "ai_summary"
  | "personalization_suggestion"
  | "region_suggestion"
  | "category_visit";

export type ActivityEvent = {
  type: ActivityEventType;
  timestamp: string;
  source?: string;
  category?: string;
  articleTitle?: string;
  articleUrl?: string;
  articlePublishedAt?: string;
  durationMs?: number;
};

type UserNoteEntry = {
  created_at?: string;
  article_date?: string;
};

export type ActivityAnalytics = {
  articleReadCount: number;
  aiSummaryCount: number;
  personalizationSuggestionCount: number;
  regionSuggestionCount: number;
  totalEngagement: number;
  events: ActivityEvent[];
  freeCooldownCycle?: number;
  freeCooldownEnd?: string | null;
};

export type GoalTrackerState = {
  weeklyGoal: number;
  weeklyStreak: number;
  lastStreakUpdate: string;
  lastGoalCompletedAt: number;
  lastGoalUpdatedAt: number;
};

export type WeeklyGoalProgress = {
  currentWeekProgress: number;
  weekArticles: number;
  weekNotes: number;
  weekAi: number;
  readingStreak: number;
};

export type ActivitySnapshot = {
  activityData: ActivityAnalytics;
  goalTracker: GoalTrackerState;
};

export const ACTIVITY_DATA_EVENT = "activity-data-updated";
export const GOAL_TRACKER_EVENT = "goal-tracker-update";

const MAX_EVENT_HISTORY = 500;

const DEFAULT_ACTIVITY_ANALYTICS: ActivityAnalytics = {
  articleReadCount: 0,
  aiSummaryCount: 0,
  personalizationSuggestionCount: 0,
  regionSuggestionCount: 0,
  totalEngagement: 0,
  events: [],
  freeCooldownCycle: 0,
  freeCooldownEnd: null,
};

export const FREE_PLAN_COOLDOWN_DAYS = 12;
export const MAX_FREE_CAP = 100;

export function calculateFreeLimit(cycle: number): number {
  if (cycle <= 0) return 20;
  if (cycle === 1) return 40;
  if (cycle === 2) return 60;
  if (cycle === 3) return 80;
  const nextLimit = 80 + (cycle - 3) * 40;
  return Math.min(nextLimit, MAX_FREE_CAP);
}

export function calculateWeightedUsage(activity: ActivityAnalytics): number {
  const aiWeighted =
    (activity.aiSummaryCount || 0) * 1 +
    (activity.personalizationSuggestionCount || 0) * 2 +
    (activity.regionSuggestionCount || 0) * 2;

  const otherUsage = activity.articleReadCount || 0;
  const otherEventsCount = (activity.events || [])
    .filter(e => !["ai_summary", "personalization_suggestion", "region_suggestion", "article_open"].includes(e.type))
    .length;

  return aiWeighted + otherUsage + otherEventsCount;
}

export const DEFAULT_GOAL_TRACKER_STATE: GoalTrackerState = {
  weeklyGoal: 5,
  weeklyStreak: 0,
  lastStreakUpdate: "",
  lastGoalCompletedAt: 0,
  lastGoalUpdatedAt: 0,
};

const DEFAULT_WEEKLY_PROGRESS: WeeklyGoalProgress = {
  currentWeekProgress: 0,
  weekArticles: 0,
  weekNotes: 0,
  weekAi: 0,
  readingStreak: 0,
};

const coerceNumber = (value: unknown, fallback: number) => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const coerceString = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const getRecordString = (
  record: Record<string, unknown>,
  keys: string[],
) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

const normalizeActivityEvent = (value: unknown): ActivityEvent | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const timestamp = getRecordString(record, [
    "timestamp",
    "time",
    "created_at",
    "opened_at",
  ]);

  if (!timestamp || Number.isNaN(new Date(timestamp).getTime())) return null;

  const rawType = getRecordString(record, ["type"]);
  const type = (
    rawType &&
    [
      "article_open",
      "ai_summary",
      "personalization_suggestion",
      "region_suggestion",
      "category_visit",
    ].includes(rawType)
      ? rawType
      : "article_open"
  ) as ActivityEventType;

  return {
    type,
    timestamp,
    source: getRecordString(record, ["source", "article_source"]),
    category: getRecordString(record, ["category"]),
    articleTitle: getRecordString(record, ["articleTitle", "article_title"]),
    articleUrl: getRecordString(record, ["articleUrl", "article_url"]),
    articlePublishedAt: getRecordString(record, [
      "articlePublishedAt",
      "article_published_at",
    ]),
    durationMs: coerceNumber(record.durationMs, 0) || undefined,
  };
};

const dayKeyFromValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const noteTimeOf = (note: UserNoteEntry) => {
  const raw = note.created_at || note.article_date || "";
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const computeEventEngagementScore = (event: ActivityEvent) => {
  if (event.type === "category_visit") {
    const minutes = Math.round((event.durationMs ?? 0) / 60000);
    return Math.max(1, minutes);
  }
  return 1;
};

const computeArticleReadCount = (events: ActivityEvent[]) => {
  return events.filter((event) => event.type === "article_open").length;
};

const computeTotalEngagement = (events: ActivityEvent[]) => {
  return events.reduce(
    (sum, event) => sum + computeEventEngagementScore(event),
    0,
  );
};

const buildEngagementDays = (
  notes: UserNoteEntry[],
  events: ActivityEvent[],
) => {
  const counts = new Map<string, number>();

  notes.forEach((note) => {
    const key = dayKeyFromValue(note.created_at || note.article_date || "");
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  events.forEach((event) => {
    if (
      event.type !== "article_open" &&
      event.type !== "ai_summary" &&
      event.type !== "personalization_suggestion" &&
      event.type !== "region_suggestion" &&
      event.type !== "category_visit"
    ) {
      return;
    }
    const key = dayKeyFromValue(event.timestamp);
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + computeEventEngagementScore(event));
  });

  return counts;
};

const computeCurrentReadingStreak = (engagementDays: Map<string, number>) => {
  const days = Array.from(engagementDays.keys()).sort();
  let current = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days.length; i += 1) {
    const idx = days.length - 1 - i;
    const expected = today.getTime() - i * 86400000;
    if (new Date(`${days[idx]}T00:00:00`).getTime() === expected) {
      current += 1;
    } else {
      break;
    }
  }
  return current;
};

const getWeekStartTime = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
};

const computeWeeklyProgress = (
  activityData: ActivityAnalytics,
  notes: UserNoteEntry[],
): WeeklyGoalProgress => {
  const mondayTime = getWeekStartTime();
  const weekEvents = activityData.events.filter((event) => {
    const time = new Date(event.timestamp).getTime();
    return !Number.isNaN(time) && time >= mondayTime;
  });
  const weekNotes = notes.filter((note) => noteTimeOf(note) >= mondayTime);

  const aiUsage = weekEvents.filter((event) =>
    [
      "ai_summary",
      "personalization_suggestion",
      "region_suggestion",
    ].includes(event.type),
  ).length;
  const articles = weekEvents.filter(
    (event) => event.type === "article_open",
  ).length;
  const noteCount = weekNotes.length;
  const engagementDays = buildEngagementDays(notes, activityData.events);
  const readingStreak = computeCurrentReadingStreak(engagementDays);

  return {
    currentWeekProgress: aiUsage + articles + noteCount + readingStreak,
    weekArticles: articles,
    weekNotes: noteCount,
    weekAi: aiUsage,
    readingStreak,
  };
};

const getIsoWeekKey = (date: Date) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${weekNo}`;
};

const normalizeActivityAnalytics = (value: unknown): ActivityAnalytics => {
  if (!value || typeof value !== "object") return DEFAULT_ACTIVITY_ANALYTICS;
  const record = value as Partial<ActivityAnalytics>;
  const rawEvents = Array.isArray(value)
    ? value
    : Array.isArray(record.events)
      ? record.events
      : [];
  const events = rawEvents
    .map((event) => normalizeActivityEvent(event))
    .filter((event): event is ActivityEvent => Boolean(event));
  const computedArticleReads = computeArticleReadCount(events);
  const computedEngagement = computeTotalEngagement(events);
  return {
    articleReadCount: Math.max(
      coerceNumber(record.articleReadCount, computedArticleReads),
      computedArticleReads,
    ),
    aiSummaryCount: coerceNumber(
      record.aiSummaryCount,
      DEFAULT_ACTIVITY_ANALYTICS.aiSummaryCount,
    ),
    personalizationSuggestionCount: coerceNumber(
      record.personalizationSuggestionCount,
      DEFAULT_ACTIVITY_ANALYTICS.personalizationSuggestionCount,
    ),
    regionSuggestionCount: coerceNumber(
      record.regionSuggestionCount,
      DEFAULT_ACTIVITY_ANALYTICS.regionSuggestionCount,
    ),
    totalEngagement: Math.max(
      coerceNumber(record.totalEngagement, computedEngagement),
      computedEngagement,
    ),
    events,
    freeCooldownCycle: coerceNumber(record.freeCooldownCycle, 0),
    freeCooldownEnd: typeof record.freeCooldownEnd === "string" ? record.freeCooldownEnd : null,
  };
};

const normalizeGoalTrackerState = (value: unknown): GoalTrackerState => {
  if (!value || typeof value !== "object") return DEFAULT_GOAL_TRACKER_STATE;
  const record = value as Record<string, unknown>;
  return {
    weeklyGoal: coerceNumber(
      record.weeklyGoal,
      DEFAULT_GOAL_TRACKER_STATE.weeklyGoal,
    ),
    weeklyStreak: coerceNumber(
      record.weeklyStreak,
      DEFAULT_GOAL_TRACKER_STATE.weeklyStreak,
    ),
    lastStreakUpdate: coerceString(
      record.lastStreakUpdate,
      DEFAULT_GOAL_TRACKER_STATE.lastStreakUpdate,
    ),
    lastGoalCompletedAt: coerceNumber(
      record.lastGoalCompletedAt,
      DEFAULT_GOAL_TRACKER_STATE.lastGoalCompletedAt,
    ),
    lastGoalUpdatedAt: coerceNumber(
      record.lastGoalUpdatedAt,
      DEFAULT_GOAL_TRACKER_STATE.lastGoalUpdatedAt,
    ),
  };
};

const isMissingRelationError = (
  error: { code?: string; message?: string } | null,
) => {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (error.message ?? "").toLowerCase().includes("schema cache")
  );
};

const resolveUserEmail = (userEmail: string | null | undefined) => {
  if (userEmail && userEmail.trim()) return userEmail.trim();
  if (typeof window !== "undefined") {
    const localEmail = localStorage.getItem("auth_email");
    if (localEmail && localEmail.trim()) return localEmail.trim();
  }
  return "";
};

const broadcastActivityUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ACTIVITY_DATA_EVENT));
};

const broadcastGoalTrackerUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GOAL_TRACKER_EVENT));
};

const getAuthenticatedUser = async () => {
  const { user, error } = await getVerifiedAuthUser();
  if (error) throw error;
  if (!user) throw new Error("Not logged in");
  return user;
};

const fetchActivityRow = async (userId: string) => {
  return supabase
    .from("user_activities")
    .select("activity_data, goal_tracker")
    .eq("user_id", userId)
    .maybeSingle();
};

const saveActivityRow = async (
  userId: string,
  userEmail: string,
  values: Record<string, unknown>,
) => {
  const { data: existingRow, error: selectError } = await supabase
    .from("user_activities")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) return { error: selectError };

  const payload = {
    ...values,
    user_email: userEmail,
    updated_at: new Date().toISOString(),
  };

  if (existingRow?.user_id) {
    const { error } = await supabase
      .from("user_activities")
      .update(payload)
      .eq("user_id", userId);
    return { error };
  }

  const { error } = await supabase.from("user_activities").insert({
    ...payload,
    user_id: userId,
  });
  return { error };
};

const fetchUserNotes = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_notes")
    .select("notes")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return [] as UserNoteEntry[];
    throw error;
  }

  return Array.isArray(data?.notes) ? (data.notes as UserNoteEntry[]) : [];
};

const normalizeSnapshot = (row: {
  activity_data?: unknown;
  goal_tracker?: unknown;
} | null): ActivitySnapshot => {
  return {
    activityData: normalizeActivityAnalytics(row?.activity_data),
    goalTracker: normalizeGoalTrackerState(row?.goal_tracker),
  };
};

export async function readActivitySnapshot(): Promise<ActivitySnapshot> {
  try {
    const user = await getAuthenticatedUser();
    const { data, error } = await fetchActivityRow(user.id);
    if (error) {
      if (isMissingRelationError(error)) return normalizeSnapshot(null);
      throw error;
    }
    return normalizeSnapshot(data ?? null);
  } catch {
    return normalizeSnapshot(null);
  }
}

export async function readActivityAnalytics(): Promise<ActivityAnalytics> {
  const snapshot = await readActivitySnapshot();
  return snapshot.activityData;
}

export async function readGoalTrackerState(): Promise<GoalTrackerState> {
  const snapshot = await readActivitySnapshot();
  return snapshot.goalTracker;
}

export async function readWeeklyGoalProgress(): Promise<WeeklyGoalProgress> {
  try {
    const user = await getAuthenticatedUser();
    const { data, error } = await fetchActivityRow(user.id);
    if (error && !isMissingRelationError(error)) return DEFAULT_WEEKLY_PROGRESS;
    const activityData = normalizeActivityAnalytics(data?.activity_data);
    const notes = await fetchUserNotes(user.id);
    return computeWeeklyProgress(activityData, notes);
  } catch {
    return DEFAULT_WEEKLY_PROGRESS;
  }
}

export async function saveActivityAnalytics(next: ActivityAnalytics) {
  const user = await getAuthenticatedUser();
  const userEmail = resolveUserEmail(user.email);
  const normalized = normalizeActivityAnalytics(next);

  const { error } = await saveActivityRow(user.id, userEmail, {
    activity_data: normalized,
  });

  if (!error) broadcastActivityUpdated();
  return { data: normalized, error };
}

export async function saveGoalTrackerState(next: GoalTrackerState) {
  const user = await getAuthenticatedUser();
  const userEmail = resolveUserEmail(user.email);
  const normalized = normalizeGoalTrackerState(next);

  const { error } = await saveActivityRow(user.id, userEmail, {
    goal_tracker: normalized,
  });

  if (!error) broadcastGoalTrackerUpdated();
  return { data: normalized, error };
}

export async function syncGoalTrackerProgress() {
  try {
    const user = await getAuthenticatedUser();
    const { data, error } = await fetchActivityRow(user.id);
    if (error) {
      if (!isMissingRelationError(error)) return;
    }

    const activityData = normalizeActivityAnalytics(data?.activity_data);
    const goalTracker = normalizeGoalTrackerState(data?.goal_tracker);
    const notes = await fetchUserNotes(user.id);

    const { currentWeekProgress } = computeWeeklyProgress(
      activityData,
      notes,
    );
    if (currentWeekProgress < goalTracker.weeklyGoal) return;

    const weekKey = getIsoWeekKey(new Date());
    const shouldCountNewWeeklyStreak = goalTracker.lastStreakUpdate !== weekKey;
    const shouldNotifyNewGoalCompletion =
      goalTracker.lastGoalCompletedAt === 0 ||
      goalTracker.lastGoalUpdatedAt > goalTracker.lastGoalCompletedAt;

    if (!shouldCountNewWeeklyStreak && !shouldNotifyNewGoalCompletion) return;

    const completedAt = Date.now();
    const nextGoalTracker: GoalTrackerState = {
      ...goalTracker,
      weeklyStreak: shouldCountNewWeeklyStreak
        ? goalTracker.weeklyStreak + 1
        : goalTracker.weeklyStreak,
      lastStreakUpdate: weekKey,
      lastGoalCompletedAt: completedAt,
    };

    await saveGoalTrackerState(nextGoalTracker);
  } catch {
    // ignore goal sync failures
  }
}

export async function trackActivityEvent(
  type: ActivityEventType,
  details?: {
    source?: string;
    category?: string;
    articleTitle?: string;
    articleUrl?: string;
    articlePublishedAt?: string;
    durationMs?: number;
  },
) {
  try {
    const user = await getAuthenticatedUser();
    const { data, error } = await fetchActivityRow(user.id);
    if (error) {
      if (!isMissingRelationError(error)) return;
    }

    const current = normalizeActivityAnalytics(data?.activity_data);
    const timestamp = new Date().toISOString();
    const nextEvent: ActivityEvent =
      type === "article_open"
        ? {
            type,
            timestamp,
            source: details?.source?.trim() || undefined,
          }
        : {
            type,
            timestamp,
            source: details?.source?.trim() || undefined,
            category: details?.category?.trim() || undefined,
            articleTitle: details?.articleTitle?.trim() || undefined,
            articleUrl: details?.articleUrl?.trim() || undefined,
            articlePublishedAt:
              details?.articlePublishedAt?.trim() || undefined,
            durationMs:
              typeof details?.durationMs === "number" &&
              Number.isFinite(details.durationMs)
                ? Math.max(0, Math.round(details.durationMs))
                : undefined,
          };
    const eventScore = computeEventEngagementScore(nextEvent);

    const nextAnalytics: ActivityAnalytics = {
      ...current,
      articleReadCount:
        type === "article_open"
          ? current.articleReadCount + 1
          : current.articleReadCount,
      aiSummaryCount:
        type === "ai_summary"
          ? current.aiSummaryCount + 1
          : current.aiSummaryCount,
      personalizationSuggestionCount:
        type === "personalization_suggestion"
          ? current.personalizationSuggestionCount + 1
          : current.personalizationSuggestionCount,
      regionSuggestionCount:
        type === "region_suggestion"
          ? current.regionSuggestionCount + 1
          : current.regionSuggestionCount,
      totalEngagement: current.totalEngagement + eventScore,
      events: [...current.events, nextEvent].slice(-MAX_EVENT_HISTORY),
      freeCooldownCycle: current.freeCooldownCycle || 0,
      freeCooldownEnd: current.freeCooldownEnd || null,
    };

    // Manage cooldown and cycle progression
    const weightedUsage = calculateWeightedUsage(nextAnalytics);
    let cycle = nextAnalytics.freeCooldownCycle || 0;
    let cooldownEnd = nextAnalytics.freeCooldownEnd;

    if (cooldownEnd) {
      if (Date.now() >= new Date(cooldownEnd).getTime()) {
        // Cooldown passed
        cycle += 1;
        cooldownEnd = null;
        nextAnalytics.freeCooldownCycle = cycle;
        nextAnalytics.freeCooldownEnd = cooldownEnd;
      }
    }

    const currentLimit = calculateFreeLimit(cycle);
    if (weightedUsage >= currentLimit && !cooldownEnd && weightedUsage < MAX_FREE_CAP) {
      // Just hit limit or limit reached after cooldown
      nextAnalytics.freeCooldownEnd = new Date(Date.now() + FREE_PLAN_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
    }

    await saveActivityAnalytics(nextAnalytics);
    void syncGoalTrackerProgress();
  } catch {
    // ignore tracking failures
  }
}

export async function adjustTotalEngagement(delta: number) {
  if (!Number.isFinite(delta) || delta === 0) return;

  try {
    const user = await getAuthenticatedUser();
    const { data, error } = await fetchActivityRow(user.id);
    if (error) {
      if (!isMissingRelationError(error)) return;
    }

    const current = normalizeActivityAnalytics(data?.activity_data);
    const nextTotal = Math.max(0, current.totalEngagement + delta);
    const userEmail = resolveUserEmail(user.email);
    const { error: saveError } = await saveActivityRow(user.id, userEmail, {
      activity_data: {
        ...current,
        totalEngagement: nextTotal,
      },
    });

    if (!saveError) {
      broadcastActivityUpdated();
      void syncGoalTrackerProgress();
    }
  } catch {
    // ignore adjustment failures
  }
}

export function incrementAiSummaryUsage(details?: {
  source?: string;
  category?: string;
}) {
  void trackActivityEvent("ai_summary", details);
}

export function incrementPersonalizationSuggestionUsage() {
  void trackActivityEvent("personalization_suggestion");
}

export function incrementRegionSuggestionUsage(details?: {
  region?: string;
}) {
  void trackActivityEvent("region_suggestion", { category: details?.region });
}

export function trackCategoryVisit(category: string, durationMs: number) {
  if (!category.trim()) return;
  if (!Number.isFinite(durationMs) || durationMs < 1000) return;
  void trackActivityEvent("category_visit", { category, durationMs });
}
