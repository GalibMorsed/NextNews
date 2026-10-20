"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  Activity,
  Bot,
  BrainCircuit,
  BookOpenCheck,
  Flame,
  Loader2,
  Lock,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { getVerifiedAuthUser } from "@/lib/clientAuth";
import {
  ACTIVITY_DATA_EVENT,
  DEFAULT_GOAL_TRACKER_STATE,
  GOAL_TRACKER_EVENT,
  readActivityAnalytics,
  readGoalTrackerState,
  saveGoalTrackerState,
  syncGoalTrackerProgress,
  type ActivityAnalytics,
} from "@/lib/activityAnalytics";
import { getUserNotes, type UserNote } from "../services/notesService";
import { getUserPersonalization } from "../services/personalizationService";
import MyActivityAiAnalysts from "./components/MyActivityAiAnalysts";
import MyActivityCategoryBreakdown from "./components/MyActivityCategoryBreakdown";
import MyActivityDailyActivity from "./components/MyActivityDailyActivity";
import MyActivityGoalTracker from "./components/MyActivityGoalTracker";
import MyActivityHeader from "./components/MyActivityHeader";
import MyActivityReadingStreak from "./components/MyActivityReadingStreak";
import MyActivityTopSources from "./components/MyActivityTopSources";
import { MetricCard } from "./components/MyActivityUi";

const RANGE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "3 months", days: 90 },
  { label: "All time", days: null },
] as const;

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

type RangeLabel = (typeof RANGE_OPTIONS)[number]["label"];
const timeOf = (note: UserNote) =>
  new Date(note.created_at || note.article_date || 0).getTime() || 0;

const dayKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfLocalDay = (value: string | number | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const buildEngagementDays = (
  noteList: UserNote[],
  eventList: ActivityAnalytics["events"],
) => {
  const counts = new Map<string, number>();

  noteList.forEach((note) => {
    const key = dayKey(note.created_at || note.article_date);
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  eventList.forEach((event) => {
    if (
      event.type !== "article_open" &&
      event.type !== "ai_summary" &&
      event.type !== "personalization_suggestion" &&
      event.type !== "region_suggestion" &&
      event.type !== "category_visit"
    ) {
      return;
    }
    const key = dayKey(event.timestamp);
    if (!key) return;

    const score =
      event.type === "category_visit"
        ? Math.max(1, Math.round((event.durationMs ?? 0) / 60000))
        : 1;

    counts.set(key, (counts.get(key) ?? 0) + score);
  });

  return counts;
};

export default function MyActivityPage() {
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRange, setSelectedRange] = useState<RangeLabel>("7 days");
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [activityAnalytics, setActivityAnalytics] = useState<ActivityAnalytics>(
    {
      articleReadCount: 0,
      aiSummaryCount: 0,
      personalizationSuggestionCount: 0,
      regionSuggestionCount: 0,
      totalEngagement: 0,
      events: [],
    },
  );

  useEffect(() => {
    let ignore = false;

    const syncAuthState = async () => {
      try {
        const { user } = await getVerifiedAuthUser();
        if (ignore) return;
        setIsAuthenticated(Boolean(user));
      } catch {
        if (ignore) return;
        setIsAuthenticated(false);
      } finally {
        if (!ignore) setIsAuthResolved(true);
      }
    };

    void syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("focus", syncAuthState);

    return () => {
      ignore = true;
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("focus", syncAuthState);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotes([]);
      setPageError(null);
      setActivityAnalytics({
        articleReadCount: 0,
        aiSummaryCount: 0,
        personalizationSuggestionCount: 0,
        regionSuggestionCount: 0,
        totalEngagement: 0,
        events: [],
      });
      return;
    }

    let mounted = true;
    const loadAnalytics = async () => {
      const analytics = await readActivityAnalytics();
      if (!mounted) return;
      setActivityAnalytics(analytics);
    };
    const load = async () => {
      try {
        const { user, error } = await getVerifiedAuthUser();
        if (error || !user)
          throw new Error("Please log in to view your activity.");
        const [notesResult, personalizationResult] = await Promise.all([
          getUserNotes(),
          getUserPersonalization(),
        ]);
        if (!mounted) return;
        if (notesResult.error) throw new Error(notesResult.error.message);
        if (personalizationResult.error) {
          throw new Error(personalizationResult.error.message);
        }
        setNotes(
          (notesResult.data ?? [])
            .slice()
            .sort((a, b) => timeOf(b) - timeOf(a)),
        );
        await loadAnalytics();
      } catch (error) {
        if (!mounted) return;
        setPageError(
          error instanceof Error ? error.message : "Unable to load activity.",
        );
      }
    };
    void load();
    const syncAnalytics = () => {
      void loadAnalytics();
    };
    window.addEventListener("focus", syncAnalytics);
    window.addEventListener(ACTIVITY_DATA_EVENT, syncAnalytics);
    return () => {
      mounted = false;
      window.removeEventListener("focus", syncAnalytics);
      window.removeEventListener(ACTIVITY_DATA_EVENT, syncAnalytics);
    };
  }, [isAuthenticated]);

  const activeRange =
    RANGE_OPTIONS.find((item) => item.label === selectedRange) ??
    RANGE_OPTIONS[1];

  const filteredNotes = useMemo(() => {
    if (activeRange.days === null) return notes;
    const boundary = Date.now() - activeRange.days * 86400000;
    return notes.filter((note) => timeOf(note) >= boundary);
  }, [activeRange.days, notes]);

  const filteredEvents = useMemo(() => {
    if (activeRange.days === null) return activityAnalytics.events;
    const boundary = Date.now() - activeRange.days * 86400000;
    return activityAnalytics.events.filter((event) => {
      const time = new Date(event.timestamp).getTime();
      return !Number.isNaN(time) && time >= boundary;
    });
  }, [activeRange.days, activityAnalytics.events]);

  const previousNotes = useMemo(() => {
    if (activeRange.days === null) return [];
    const end = Date.now() - activeRange.days * 86400000;
    const start = end - activeRange.days * 86400000;
    return notes.filter((note) => {
      const time = timeOf(note);
      return time >= start && time < end;
    });
  }, [activeRange.days, notes]);

  const previousEvents = useMemo(() => {
    if (activeRange.days === null) return [];
    const end = Date.now() - activeRange.days * 86400000;
    const start = end - activeRange.days * 86400000;
    return activityAnalytics.events.filter((event) => {
      const time = new Date(event.timestamp).getTime();
      return !Number.isNaN(time) && time >= start && time < end;
    });
  }, [activeRange.days, activityAnalytics.events]);

  const aiSummaryEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => event.type === "ai_summary")
      .slice()
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [filteredEvents]);

  const mostSummarizedTopics = useMemo(() => {
    const counts = new Map<string, number>();

    aiSummaryEvents.forEach((event) => {
      const topic =
        event.category?.trim() || event.source?.trim() || "Uncategorized";
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    });

    const total = Array.from(counts.values()).reduce(
      (sum, value) => sum + value,
      0,
    );

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([topic, count]) => ({
        topic,
        count,
        percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }));
  }, [aiSummaryEvents]);

  const noteCount = filteredNotes.length;
  const articleCount = filteredEvents.filter(
    (event) => event.type === "article_open",
  ).length;
  const aiSummaryCount = activityAnalytics.aiSummaryCount;
  const aiSuggestionCount = activityAnalytics.personalizationSuggestionCount;
  const aiRegionSuggestionCount = activityAnalytics.regionSuggestionCount;
  const previousArticleCount = previousEvents.filter(
    (event) => event.type === "article_open",
  ).length;
  const previousAiSummaryCount = previousEvents.filter(
    (event) => event.type === "ai_summary",
  ).length;
  const previousAiSuggestionCount = previousEvents.filter(
    (event) => event.type === "personalization_suggestion",
  ).length;
  const previousAiRegionSuggestionCount = previousEvents.filter(
    (event) => event.type === "region_suggestion",
  ).length;

  const noteDelta =
    previousNotes.length > 0
      ? Math.round(
          ((noteCount - previousNotes.length) / previousNotes.length) * 100,
        )
      : noteCount > 0
        ? 100
        : 0;
  const articleDelta =
    previousArticleCount > 0
      ? Math.round(
          ((articleCount - previousArticleCount) / previousArticleCount) * 100,
        )
      : articleCount > 0
        ? 100
        : 0;
  const engagementDays = useMemo(() => {
    return buildEngagementDays(filteredNotes, filteredEvents);
  }, [filteredEvents, filteredNotes]);

  const previousEngagementDays = useMemo(() => {
    return buildEngagementDays(previousNotes, previousEvents);
  }, [previousEvents, previousNotes]);

  const totalEngagement = useMemo(() => {
    return Array.from(engagementDays.values()).reduce(
      (sum, value) => sum + value,
      0,
    );
  }, [engagementDays]);

  const previousTotalEngagement = useMemo(() => {
    return Array.from(previousEngagementDays.values()).reduce(
      (sum, value) => sum + value,
      0,
    );
  }, [previousEngagementDays]);

  const totalEngagementDelta =
    previousTotalEngagement > 0
      ? Math.round(
          ((totalEngagement - previousTotalEngagement) /
            previousTotalEngagement) *
            100,
        )
      : totalEngagement > 0
        ? 100
        : 0;

  const streak = useMemo(() => {
    const days = Array.from(engagementDays.keys()).sort();
    let best = 0;
    let run = 0;
    let previous = 0;
    days.forEach((key) => {
      const current = new Date(`${key}T00:00:00`).getTime();
      run = previous && current - previous === 86400000 ? run + 1 : 1;
      best = Math.max(best, run);
      previous = current;
    });
    let current = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < days.length; i += 1) {
      const idx = days.length - 1 - i;
      const expected = today.getTime() - i * 86400000;
      if (new Date(`${days[idx]}T00:00:00`).getTime() === expected)
        current += 1;
      else break;
    }
    return { current, best };
  }, [engagementDays]);

  const streakDelta = useMemo(() => {
    const days = Array.from(previousEngagementDays.keys()).sort();
    let prevStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < days.length; i += 1) {
      const idx = days.length - 1 - i;
      const expected = today.getTime() - i * 86400000;
      if (new Date(`${days[idx]}T00:00:00`).getTime() === expected)
        prevStreak += 1;
      else break;
    }
    return prevStreak > 0
      ? Math.round(((streak.current - prevStreak) / prevStreak) * 100)
      : streak.current > 0
        ? 100
        : 0;
  }, [previousEngagementDays, streak.current]);

  // Goal Tracker Persistence & Logic
  const [weeklyGoal, setWeeklyGoal] = useState<number>(
    DEFAULT_GOAL_TRACKER_STATE.weeklyGoal,
  );
  const [weeklyStreak, setWeeklyStreak] = useState<number>(
    DEFAULT_GOAL_TRACKER_STATE.weeklyStreak,
  );
  const [lastStreakUpdate, setLastStreakUpdate] = useState<string>(
    DEFAULT_GOAL_TRACKER_STATE.lastStreakUpdate,
  );
  const [lastGoalCompletedAt, setLastGoalCompletedAt] = useState<number>(
    DEFAULT_GOAL_TRACKER_STATE.lastGoalCompletedAt,
  );
  const [lastGoalUpdatedAt, setLastGoalUpdatedAt] = useState<number>(
    DEFAULT_GOAL_TRACKER_STATE.lastGoalUpdatedAt,
  );
  const [isGoalTrackerReady, setIsGoalTrackerReady] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setWeeklyGoal(DEFAULT_GOAL_TRACKER_STATE.weeklyGoal);
      setWeeklyStreak(DEFAULT_GOAL_TRACKER_STATE.weeklyStreak);
      setLastStreakUpdate(DEFAULT_GOAL_TRACKER_STATE.lastStreakUpdate);
      setLastGoalCompletedAt(DEFAULT_GOAL_TRACKER_STATE.lastGoalCompletedAt);
      setLastGoalUpdatedAt(DEFAULT_GOAL_TRACKER_STATE.lastGoalUpdatedAt);
      setIsGoalTrackerReady(false);
      return;
    }

    let mounted = true;
    const loadGoalTracker = async () => {
      const stored = await readGoalTrackerState();
      if (!mounted) return;
      setWeeklyGoal(stored.weeklyGoal);
      setWeeklyStreak(stored.weeklyStreak);
      setLastStreakUpdate(stored.lastStreakUpdate);
      setLastGoalCompletedAt(stored.lastGoalCompletedAt);
      setLastGoalUpdatedAt(stored.lastGoalUpdatedAt);
      setIsGoalTrackerReady(true);
    };

    void loadGoalTracker();
    const syncGoalTracker = () => {
      void loadGoalTracker();
    };
    window.addEventListener(GOAL_TRACKER_EVENT, syncGoalTracker);

    return () => {
      mounted = false;
      window.removeEventListener(GOAL_TRACKER_EVENT, syncGoalTracker);
    };
  }, [isAuthenticated]);

  const saveWeeklyGoal = async (val: number) => {
    const updatedAt = Date.now();
    setLastGoalUpdatedAt(updatedAt);
    setWeeklyGoal(val);
    if (!isAuthenticated) return;
    await saveGoalTrackerState({
      weeklyGoal: val,
      weeklyStreak,
      lastStreakUpdate,
      lastGoalCompletedAt,
      lastGoalUpdatedAt: updatedAt,
    });
    await syncGoalTrackerProgress();
  };

  const currentReadingStreak = streak.current;

  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const mondayTime = monday.getTime();

    const weekEvents = activityAnalytics.events.filter(
      (e) => new Date(e.timestamp).getTime() >= mondayTime,
    );
    const weekNotes = notes.filter((n) => timeOf(n) >= mondayTime);

    const aiUsage = weekEvents.filter((e) =>
      [
        "ai_summary",
        "personalization_suggestion",
        "region_suggestion",
      ].includes(e.type),
    ).length;
    const articles = weekEvents.filter((e) => e.type === "article_open").length;
    const noteCount = weekNotes.length;
    const readingStreak = currentReadingStreak;

    return {
      currentWeekProgress: aiUsage + articles + noteCount + readingStreak,
      weekArticles: articles,
      weekNotes: noteCount,
      weekAi: aiUsage,
      readingStreak,
    };
  }, [activityAnalytics.events, notes, currentReadingStreak]);

  const {
    currentWeekProgress,
    weekArticles,
    weekNotes,
    weekAi,
    readingStreak,
  } = weeklyProgress;

  useEffect(() => {
    if (!isAuthenticated || !isGoalTrackerReady) return;
    void saveGoalTrackerState({
      weeklyGoal,
      weeklyStreak,
      lastStreakUpdate,
      lastGoalCompletedAt,
      lastGoalUpdatedAt,
    });
  }, [
    isAuthenticated,
    isGoalTrackerReady,
    weeklyGoal,
    weeklyStreak,
    lastStreakUpdate,
    lastGoalCompletedAt,
    lastGoalUpdatedAt,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !isGoalTrackerReady) return;
    void syncGoalTrackerProgress();
  }, [currentWeekProgress, isAuthenticated, isGoalTrackerReady, weeklyGoal]);

  const heatmap = useMemo(() => {
    return Array.from({ length: 35 }).map((_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (34 - index));
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
      return { key, count: engagementDays.get(key) ?? 0 };
    });
  }, [engagementDays]);

  const sourceCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredEvents.forEach((event) => {
      if (event.type !== "article_open" && event.type !== "ai_summary") return;
      const source = event.source?.trim();
      if (source) map.set(source, (map.get(source) ?? 0) + 1);
    });
    filteredNotes.forEach((note) => {
      const source = note.source_name.trim();
      if (source) map.set(source, (map.get(source) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filteredEvents, filteredNotes]);

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<string, number>();

    filteredEvents.forEach((event) => {
      const category = event.category?.trim();
      if (!category) return;

      const score =
        event.type === "category_visit"
          ? Math.max(1, Math.round((event.durationMs ?? 0) / 60000))
          : 1;

      counts.set(category, (counts.get(category) ?? 0) + score);
    });

    const total = Array.from(counts.values()).reduce(
      (sum, value) => sum + value,
      0,
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, count]) => ({
        category,
        count,
        percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }));
  }, [filteredEvents]);

  const chartBuckets = useMemo(() => {
    const bucketCount = 4;
    const labels =
      activeRange.days === 7
        ? ["D 1-2", "D 3-4", "D 5-6", "D 7"]
        : activeRange.days === 30
          ? ["Wk 1", "Wk 2", "Wk 3", "Wk 4"]
          : activeRange.days === 90
            ? ["M 1", "M 2", "M 3", "Now"]
            : ["P 1", "P 2", "P 3", "P 4"];

    const engagements = Array.from(engagementDays.entries()).map(
      ([key, count]) => ({
        key,
        count,
        time: startOfLocalDay(`${key}T00:00:00`),
      }),
    );

    if (engagements.length === 0) {
      return labels.map((label) => ({ label, count: 0 }));
    }

    const now = Date.now();
    const oldestEvent = engagements.reduce((min, entry) => {
      return entry.time > 0 ? Math.min(min, entry.time) : min;
    }, now);
    const lookbackDays =
      activeRange.days ??
      Math.max(120, Math.ceil((now - oldestEvent) / 86400000));
    const bucketSize = Math.max(1, Math.ceil(lookbackDays / bucketCount));
    const counts = [0, 0, 0, 0];

    engagements.forEach((entry) => {
      const ageInDays = Math.max(0, Math.floor((now - entry.time) / 86400000));
      const index = Math.min(
        bucketCount - 1,
        Math.floor(ageInDays / bucketSize),
      );
      counts[bucketCount - 1 - index] += entry.count;
    });

    return labels.map((label, index) => ({ label, count: counts[index] }));
  }, [activeRange.days, engagementDays]);

  const totalAiUsage =
    aiSummaryCount + aiSuggestionCount + aiRegionSuggestionCount;
  const previousTotalAiUsage =
    previousAiSummaryCount +
    previousAiSuggestionCount +
    previousAiRegionSuggestionCount;

  const aiUsageDistribution = useMemo(() => {
    const total = totalAiUsage || 1;
    return [
      {
        label: "AI Summary",
        count: aiSummaryCount,
        percent: Math.round((aiSummaryCount / total) * 100),
        color: "from-emerald-500 to-teal-400",
        icon: Sparkles,
      },
      {
        label: "AI Personalization",
        count: aiSuggestionCount,
        percent: Math.round((aiSuggestionCount / total) * 100),
        color: "from-blue-600 to-indigo-500",
        icon: BrainCircuit,
      },
      {
        label: "AI Region Suggestion",
        count: aiRegionSuggestionCount,
        percent: Math.round((aiRegionSuggestionCount / total) * 100),
        color: "from-indigo-600 to-violet-500",
        icon: Bot,
      },
    ];
  }, [
    totalAiUsage,
    aiSummaryCount,
    aiSuggestionCount,
    aiRegionSuggestionCount,
  ]);

  const analystCards = [
    {
      title: "Total AI usage",
      description: `${totalAiUsage} combined AI use${totalAiUsage === 1 ? "" : "s"} in the selected range.`,
      icon: Sparkles,
      delta:
        previousTotalAiUsage > 0
          ? Math.round(
              ((totalAiUsage - previousTotalAiUsage) / previousTotalAiUsage) *
                100,
            )
          : totalAiUsage > 0
            ? 100
            : 0,
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom,_#fafaf9,_#ffffff_28%)] px-4 py-6 sm:px-6 lg:px-8 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(to_bottom,_#020617,_#0f172a_38%,_#020617)]">
      <MotionConfig reducedMotion="user">
      {!isAuthResolved ? (
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-3xl border border-slate-200/80 bg-white/92 p-8 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/88">
            <div className="flex items-center gap-3 text-[var(--muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-sm font-medium">Checking your session...</p>
            </div>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="mx-auto w-full max-w-3xl">
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/92 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/88">
            <div className="border-b border-slate-200/80 bg-slate-50/80 px-8 py-6 dark:border-slate-700/80 dark:bg-slate-800/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                Login Required
              </p>
            </div>
            <div className="mx-auto flex max-w-2xl flex-col items-center px-8 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)] dark:bg-[color:color-mix(in_srgb,var(--primary)_20%,transparent)]">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                My Activity opens after sign in
              </h1>
              <p className="mt-3 text-base leading-7 text-[var(--muted)]">
                This area uses saved session data and personalized analytics, so
                we only show it for logged-in users.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Login / Register
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          className="mx-auto flex min-w-0 max-w-7xl flex-col gap-5"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <MyActivityHeader
            selectedRange={selectedRange}
            rangeOptions={RANGE_OPTIONS}
            onRangeChange={setSelectedRange}
            pageError={pageError}
          />

          <section className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <MetricCard
              title="Articles read"
              value={articleCount}
              delta={articleDelta}
              subtitle="Articles opened in this range."
              icon={<BookOpenCheck className="h-5 w-5" />}
            />
            <MetricCard
              title="Notes added"
              value={noteCount}
              delta={noteDelta}
              subtitle="Your saved notes and highlights."
              icon={<NotebookPen className="h-5 w-5" />}
            />
            <MetricCard
              title="Reading streak"
              value={streak.current}
              suffix={streak.current === 1 ? "day" : "days"}
              delta={streakDelta}
              subtitle={`Personal best: ${streak.best} day${streak.best === 1 ? "" : "s"} in a row.`}
              icon={<Flame className="h-5 w-5" />}
            />
            <MetricCard
              title="Engagement"
              value={totalEngagement}
              suffix="%"
              delta={totalEngagementDelta}
              subtitle="All engagement points."
              icon={<Activity className="h-5 w-5" />}
            />
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-[1.6fr_1fr]">
            <MyActivityDailyActivity chartBuckets={chartBuckets} />
            <MyActivityCategoryBreakdown
              categoryBreakdown={categoryBreakdown}
            />
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-2">
            <MyActivityReadingStreak heatmap={heatmap} />
            <MyActivityTopSources sourceCounts={sourceCounts} />
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-1">
            <MyActivityAiAnalysts
              analystCards={analystCards}
              mostSummarizedTopics={mostSummarizedTopics}
              aiUsageDistribution={aiUsageDistribution}
              totalAiUsage={totalAiUsage}
            />
            <MyActivityGoalTracker
              currentWeekProgress={currentWeekProgress}
              weeklyGoal={weeklyGoal}
              weeklyStreak={weeklyStreak}
              onSetWeeklyGoal={saveWeeklyGoal}
              weekArticles={weekArticles}
              weekNotes={weekNotes}
              weekAi={weekAi}
              readingStreak={readingStreak}
            />
          </section>
        </motion.div>
      )}
      </MotionConfig>
    </main>
  );
}
