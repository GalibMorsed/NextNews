"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  BrainCircuit,
  CalendarRange,
  FileText,
  Flame,
  Loader2,
  Lock,
  Radio,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getVerifiedAuthUser } from "@/lib/clientAuth";
import {
  readActivityAnalytics,
  type ActivityAnalytics,
} from "@/lib/activityAnalytics";
import { getUserNotes, type UserNote } from "../services/notesService";
import {
  getUserPersonalization,
  type UserPersonalization,
} from "../services/personalizationService";

const RANGE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "3 months", days: 90 },
  { label: "All time", days: null },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const softSpring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 24,
};

type RangeLabel = (typeof RANGE_OPTIONS)[number]["label"];
const timeOf = (note: UserNote) =>
  new Date(note.created_at || note.article_date || 0).getTime() || 0;

const formatSummaryTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

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

const heatColor = (count: number) =>
  count >= 6
    ? "bg-emerald-700 dark:bg-emerald-500"
    : count >= 3
      ? "bg-emerald-500 dark:bg-emerald-400"
      : count >= 1
        ? "bg-emerald-200 dark:bg-emerald-800/70"
        : "bg-slate-100 dark:bg-slate-800";

const HEAT_LEGEND = [
  { label: "None", color: "bg-stone-100 dark:bg-slate-200" },
  { label: "1-2 activities", color: "bg-emerald-200 dark:bg-emerald-300" },
  { label: "3-5 activities", color: "bg-emerald-500 dark:bg-emerald-400" },
  { label: "6+ activities", color: "bg-emerald-700 dark:bg-emerald-500" },
] as const;

export default function MyActivityPage() {
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRange, setSelectedRange] = useState<RangeLabel>("7 days");
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [personalization, setPersonalization] =
    useState<UserPersonalization | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [activityAnalytics, setActivityAnalytics] = useState<ActivityAnalytics>({
    aiSummaryCount: 0,
    personalizationSuggestionCount: 0,
    events: [],
  });

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
      setPersonalization(null);
      setPageError(null);
      setActivityAnalytics({
        aiSummaryCount: 0,
        personalizationSuggestionCount: 0,
        events: [],
      });
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        const { user, error } = await getVerifiedAuthUser();
        if (error || !user) throw new Error("Please log in to view your activity.");
        const [notesResult, personalizationResult] = await Promise.all([
          getUserNotes(),
          getUserPersonalization(),
        ]);
        if (!mounted) return;
        if (notesResult.error) throw new Error(notesResult.error.message);
        if (personalizationResult.error) {
          throw new Error(personalizationResult.error.message);
        }
        setNotes((notesResult.data ?? []).slice().sort((a, b) => timeOf(b) - timeOf(a)));
        setPersonalization(personalizationResult.data);
        setActivityAnalytics(readActivityAnalytics());
      } catch (error) {
        if (!mounted) return;
        setPageError(error instanceof Error ? error.message : "Unable to load activity.");
      }
    };
    void load();
    const syncAnalytics = () => setActivityAnalytics(readActivityAnalytics());
    window.addEventListener("focus", syncAnalytics);
    window.addEventListener("storage", syncAnalytics);
    return () => {
      mounted = false;
      window.removeEventListener("focus", syncAnalytics);
      window.removeEventListener("storage", syncAnalytics);
    };
  }, [isAuthenticated]);

  const activeRange = RANGE_OPTIONS.find((item) => item.label === selectedRange) ?? RANGE_OPTIONS[1];

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

  const recentAiSummaries = useMemo(() => {
    return aiSummaryEvents.slice(0, 4).map((event) => ({
      source: event.source?.trim() || "Unknown source",
      topic: event.category?.trim() || "Uncategorized",
      timestamp: event.timestamp,
    }));
  }, [aiSummaryEvents]);

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
      .slice(0, 5)
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
  const aiSummaryCount = aiSummaryEvents.length;
  const aiSuggestionCount = filteredEvents.filter(
    (event) => event.type === "personalization_suggestion",
  ).length;
  const previousArticleCount = previousEvents.filter(
    (event) => event.type === "article_open",
  ).length;
  const previousAiSummaryCount = previousEvents.filter(
    (event) => event.type === "ai_summary",
  ).length;
  const previousAiSuggestionCount = previousEvents.filter(
    (event) => event.type === "personalization_suggestion",
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
    const counts = new Map<string, number>();

    filteredNotes.forEach((note) => {
      const key = dayKey(note.created_at || note.article_date);
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    filteredEvents.forEach((event) => {
      if (
        event.type !== "article_open" &&
        event.type !== "ai_summary" &&
        event.type !== "personalization_suggestion" &&
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
  }, [filteredEvents, filteredNotes]);

  const streak = useMemo(() => {
    const days = Array.from(
      engagementDays.keys(),
    ).sort();
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
      if (new Date(`${days[idx]}T00:00:00`).getTime() === expected) current += 1;
      else break;
    }
    return { current, best };
  }, [engagementDays]);

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

    const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);
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

    const engagements = Array.from(engagementDays.entries()).map(([key, count]) => ({
      key,
      count,
      time: startOfLocalDay(`${key}T00:00:00`),
    }));

    if (engagements.length === 0) {
      return labels.map((label) => ({ label, count: 0 }));
    }

    const now = Date.now();
    const oldestEvent = engagements.reduce((min, entry) => {
      return entry.time > 0 ? Math.min(min, entry.time) : min;
    }, now);
    const lookbackDays = activeRange.days ?? Math.max(120, Math.ceil((now - oldestEvent) / 86400000));
    const bucketSize = Math.max(1, Math.ceil(lookbackDays / bucketCount));
    const counts = [0, 0, 0, 0];

    engagements.forEach((entry) => {
      const ageInDays = Math.max(0, Math.floor((now - entry.time) / 86400000));
      const index = Math.min(bucketCount - 1, Math.floor(ageInDays / bucketSize));
      counts[bucketCount - 1 - index] += entry.count;
    });

    return labels.map((label, index) => ({ label, count: counts[index] }));
  }, [activeRange.days, engagementDays]);

  const totalAiUsage = aiSummaryCount + aiSuggestionCount;
  const previousTotalAiUsage =
    previousAiSummaryCount + previousAiSuggestionCount;

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
  ] as const;

  const personalizationStatus = personalization ? "Available" : "Not set";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom,_#fafaf9,_#ffffff_28%)] px-4 py-6 sm:px-6 lg:px-8 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(to_bottom,_#020617,_#0f172a_38%,_#020617)]">
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
                This area uses saved session data and personalized analytics, so we
                only show it for logged-in users.
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
          <motion.section
            variants={fadeUp}
            transition={softSpring}
            className="rounded-[32px] border border-stone-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-7 dark:border-slate-700/80 dark:bg-slate-900/88 dark:shadow-[0_18px_60px_-28px_rgba(16,185,129,0.28)]"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">My Activity</h1>
                <p className="mt-2 text-base text-slate-600 dark:text-slate-300">Your reading insights, notes, history, and AI analyst activity in one place.🧐</p>
                <div className="mt-3 inline-flex rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Selected filter: {selectedRange}
                </div>
                {pageError ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{pageError}</p> : null}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {RANGE_OPTIONS.map(({ label }) => (
                  <motion.button
                    key={label}
                    type="button"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={softSpring}
                    onClick={() => setSelectedRange(label)}
                    className={`rounded-2xl border px-5 py-3 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300 ${selectedRange === label ? "border-[var(--primary)] bg-stone-100 text-[var(--primary)] dark:border-emerald-500/60 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-stone-200 bg-stone-50 text-slate-700 hover:border-[var(--primary)] hover:text-[var(--primary)]"}`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.section>

          <section className="grid min-w-0 grid-cols-2 gap-4 xl:grid-cols-4">
            <MetricCard
              title="Articles read"
              value={articleCount}
              delta={articleDelta}
              subtitle="How many opened articles with in this range."
              icon={<FileText className="h-5 w-5" />}
            />
            <MetricCard
              title="Notes added"
              value={noteCount}
              delta={noteDelta}
              subtitle="Saved notes and highlights from your account."
              icon={<FileText className="h-5 w-5" />}
            />
            <MetricCard
              title="Reading streak"
              value={streak.current}
              suffix={streak.current === 1 ? "day" : "days"}
              subtitle={`Personal best: ${streak.best} day${streak.best === 1 ? "" : "s"} in a row.`}
              icon={<Flame className="h-5 w-5" />}
            />
            <MetricCard
              title="Live sessions"
              value={0}
              subtitle="No live-session watched yet."
              icon={<Radio className="h-5 w-5" />}
            />
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Panel title="Daily reading activity" description="A visual trend area for usage over time.">
              <div className="flex h-[280px] items-end gap-4 rounded-[24px] border border-slate-200/80 bg-white px-4 pb-6 pt-8 dark:border-slate-700 dark:bg-slate-950/40">
                {chartBuckets.map((item) => {
                  const max = Math.max(...chartBuckets.map((entry) => entry.count), 1);
                  const height = Math.max((item.count / max) * 180, item.count > 0 ? 24 : 8);
                  return (
                    <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.count}</div>
                      <div className="flex h-[180px] w-full items-end">
                        <motion.div
                          initial={{ height: 0, opacity: 0.7 }}
                          animate={{ height: `${height}px`, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 180,
                            damping: 20,
                            delay: 0.12 + chartBuckets.indexOf(item) * 0.08,
                          }}
                          className="relative w-full overflow-hidden rounded-t-2xl bg-[linear-gradient(180deg,_rgba(16,185,129,0.95),_rgba(20,184,166,0.78)_58%,_rgba(59,130,246,0.72))]"
                          title={`${item.label}: ${item.count}`}
                        >
                        <motion.span
                          aria-hidden
                          className="absolute inset-x-[12%] top-2 h-5 rounded-full bg-white/20 blur-sm"
                          animate={{
                            x: ["-6%", "7%", "-4%"],
                            y: [0, 3, 0],
                            scaleX: [1, 1.12, 0.96],
                          }}
                          transition={{
                            duration: 3.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: chartBuckets.indexOf(item) * 0.15,
                          }}
                        />
                        <motion.span
                          aria-hidden
                          className="absolute -bottom-2 left-[18%] h-10 w-[68%] rounded-full bg-emerald-300/30 blur-md dark:bg-emerald-200/20"
                          animate={{
                            x: ["-10%", "8%", "-6%"],
                            scaleX: [0.94, 1.06, 0.98],
                            scaleY: [1, 0.92, 1],
                          }}
                          transition={{
                            duration: 4.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.2 + chartBuckets.indexOf(item) * 0.12,
                          }}
                        />
                        <motion.span
                          aria-hidden
                          className="absolute inset-x-0 top-0 h-[1px] bg-white/50"
                          animate={{ opacity: [0.35, 0.7, 0.35] }}
                          transition={{
                            duration: 2.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: chartBuckets.indexOf(item) * 0.1,
                          }}
                        />
                      </motion.div>
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Category breakdown" description="Categories are ranked by how often you used them during a selected period.">
            {categoryBreakdown.length > 0 ? (
              <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {categoryBreakdown.map((item, idx) => (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{
                      y: -2,
                      borderColor: "rgba(16, 185, 129, 0.4)",
                    }}
                    transition={{ ...softSpring, delay: idx * 0.04 }}
                    className="group relative flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition-colors dark:border-slate-800/50 dark:bg-slate-900/40"
                  >
                    <div className="flex items-center justify-between gap-3 px-0.5">
                      <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-200">
                        {item.category.replaceAll("-", " ")}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
                        {item.percent}%
                      </span>
                    </div>
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ ...softSpring, delay: 0.2 + idx * 0.05 }}
                        className="h-full rounded-full bg-[linear-gradient(90deg,_rgba(16,185,129,0.95),_rgba(59,130,246,0.75))] shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyStateText>No category usage found yet. Open any categories.</EmptyStateText>
            )}
          </Panel>
        </section>

        <section className="grid min-w-0 gap-4 xl:grid-cols-2">
          <Panel title="Reading streak" description="A heatmap-style streak grid for recent reading activity days.">
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 sm:gap-3 lg:grid-cols-10">
                {heatmap.map((day, index) => (
                  <motion.div
                    key={day.key}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...softSpring, delay: index * 0.01 }}
                    whileHover={{ scale: 1.08, y: -1 }}
                    className={`flex aspect-square min-w-0 items-center justify-center rounded-lg text-[10px] font-medium sm:rounded-xl sm:text-[11px] ${heatColor(day.count)} ${
                      day.count > 0
                        ? "text-emerald-950 dark:text-emerald-50"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                    title={`${day.key}: ${day.count}`}
                  >
                    {day.key.slice(-2)}
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-stone-200/80 bg-stone-50/90 px-3 py-3 text-xs sm:gap-x-7 sm:px-4 sm:text-sm dark:border-slate-700/70 dark:bg-slate-950/60">
                {HEAT_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs font-medium text-stone-600 sm:gap-2.5 sm:text-sm dark:text-slate-200">
                    <span className={`h-4 w-4 rounded-[4px] ring-1 ring-black/5 dark:ring-white/10 ${item.color}`} aria-hidden />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Top sources" description="Sources are ranked from usage behavior during the selected period.">
            {sourceCounts.length > 0 ? (
              (() => {
                const total = sourceCounts.reduce(
                  (sum, [, count]) => sum + count,
                  0,
                );

                return (
                  <div className="grid min-w-0 gap-4 sm:gap-x-10 sm:gap-y-6 sm:grid-cols-2">
                    {sourceCounts.map(([source, count], idx) => {
                      const max = sourceCounts[0]?.[1] ?? 1;
                      const percent = Math.max((count / max) * 100, 10);
                      const share =
                        total > 0 ? Math.round((count / total) * 1000) / 10 : 0;

                      return (
                        <motion.div
                          key={source}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{
                            y: -2,
                            borderColor: "rgba(16, 185, 129, 0.4)",
                          }}
                          transition={{ ...softSpring, delay: idx * 0.04 }}
                          className="group relative min-w-0 flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition-colors dark:border-slate-800/50 dark:bg-slate-900/40"
                        >
                          <div className="flex items-center justify-between gap-3 px-0.5">
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {source}
                            </span>
                            <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
                              {share}%
                            </span>
                          </div>
                          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{
                                ...softSpring,
                                delay: 0.2 + idx * 0.05,
                              }}
                              className="h-full rounded-full bg-[linear-gradient(90deg,_rgba(16,185,129,0.95),_rgba(59,130,246,0.75))] shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]"
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              <EmptyStateText>No source activity yet.</EmptyStateText>
            )}
          </Panel>
        </section>

        <section className="grid min-w-0 gap-4 xl:grid-cols-1">
          <Panel
            title="AI analysts"
            description="Your AI usage activity across article summaries and personalized suggestions."
            icon={<Bot className="h-5 w-5" />}
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {analystCards.map(({ title, description, icon: Icon, delta }) => (
                <motion.article
                  key={title}
                  whileHover={{ y: -4, transition: softSpring }}
                  className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(240,253,250,0.85))] p-5 shadow-sm dark:border-slate-700/80 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(10,18,34,0.92))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_10px_30px_-15px_rgba(16,185,129,0.1)]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-1 dark:ring-emerald-700/30">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300/90">
                    {description}
                  </p>
                  {typeof delta === "number" ? (
                    <div
                      className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                        delta >= 0
                          ? "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-rose-200/60 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-950/40 dark:text-rose-300"
                      }`}
                    >
                      {delta >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {Math.abs(delta)}% vs last period
                    </div>
                  ) : null}
                </motion.article>
              ))}

              <motion.div
                whileHover={{ y: -4, transition: softSpring }}
                className="rounded-[24px] border border-slate-200/80 bg-slate-50/90 p-4 shadow-sm sm:p-5 dark:border-slate-700/80 dark:bg-slate-950/40 dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Most summarized topics
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Topics summarized most often.
                    </p>
                  </div>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-emerald-300 dark:ring-slate-700">
                    <BrainCircuit className="h-4 w-4" />
                  </span>
                </div>

                {mostSummarizedTopics.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {mostSummarizedTopics.map((item) => (
                      <div key={item.topic} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0 truncate font-medium capitalize text-slate-800 dark:text-slate-100">
                            {item.topic.replaceAll("-", " ")}
                          </div>
                          <div className="shrink-0 text-slate-500 dark:text-slate-400">
                            {item.count} uses
                          </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percent}%` }}
                            transition={{ ...softSpring, delay: 0.2 }}
                            className="h-full rounded-full bg-[linear-gradient(90deg,_rgba(16,185,129,0.95),_rgba(59,130,246,0.75))]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyStateText>
                    No AI summaries yet. Use the AI summary on an article.
                  </EmptyStateText>
                )}
              </motion.div>

              <motion.div
                whileHover={{ y: -4, transition: softSpring }}
                className="rounded-[24px] border border-slate-200/80 bg-slate-50/90 p-4 shadow-sm sm:p-5 lg:col-span-2 xl:col-span-1 dark:border-slate-700/80 dark:bg-slate-950/40 dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Recent AI summaries
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      The latest summaries in this range.
                    </p>
                  </div>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-emerald-300 dark:ring-slate-700">
                    <Sparkles className="h-4 w-4" />
                  </span>
                </div>

                {recentAiSummaries.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {recentAiSummaries.map((item, idx) => (
                      <motion.div
                        key={`${item.timestamp}-${item.source}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...softSpring, delay: idx * 0.05 }}
                        whileHover={{
                          x: -4,
                          scale: 1.01,
                          transition: { duration: 0.2 },
                        }}
                        className="cursor-default rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-900"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {item.source}
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                              {item.topic}
                            </p>
                          </div>
                          <p className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {formatSummaryTime(item.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyStateText>
                    No AI summary activity yet. Generate one to see the latest items here.
                  </EmptyStateText>
                )}
              </motion.div>
            </div>
          </Panel>

          <Panel
            title="Activity summary"
            description="Quick status blocks for the analytics services behind my activity."
            icon={<TrendingUp className="h-5 w-5" />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryRow
                icon={<CalendarRange className="h-4 w-4" />}
                title="Time filters"
                detail={`${selectedRange} selected`}
              />
              <SummaryRow
                icon={<TrendingUp className="h-4 w-4" />}
                title="Reading analytics"
                detail={`${noteCount} note${noteCount === 1 ? "" : "s"} in range`}
              />
              <SummaryRow
                icon={<Bot className="h-4 w-4" />}
                title="AI summaries used"
                detail={`${aiSummaryCount} in range`}
              />
              <SummaryRow
                icon={<Sparkles className="h-4 w-4" />}
                title="Personalization"
                detail={personalizationStatus}
              />
            </div>
          </Panel>
        </section>
      </motion.div>
    )}
  </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  delta,
  suffix,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  delta?: number;
  suffix?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.article
      variants={fadeUp}
      transition={softSpring}
      whileHover={{ y: -4, transition: softSpring }}
      className="rounded-[26px] border border-stone-200/70 bg-stone-50/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/88 dark:shadow-[0_18px_44px_-30px_rgba(16,185,129,0.2)] sm:rounded-[28px] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:text-xs sm:tracking-[0.22em]">
            {title}
          </p>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:mt-4 sm:text-5xl">
            {value}
            {suffix ? (
              <span className="ml-1.5 text-xl font-medium text-slate-600 dark:text-slate-300 sm:ml-2 sm:text-2xl">
                {suffix}
              </span>
            ) : null}
          </div>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--primary)] ring-1 ring-stone-200 dark:bg-slate-800 dark:ring-slate-700 sm:h-11 sm:w-11">
          {icon}
        </span>
      </div>
      {typeof delta === "number" ? (
        <div
          className={`mt-3 inline-flex items-start gap-1.5 text-xs leading-5 sm:mt-4 sm:items-center sm:gap-2 sm:text-sm ${positive ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}
        >
          {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {Math.abs(delta)}% vs last period
        </div>
      ) : null}
      <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400 sm:text-sm">
        {subtitle}
      </p>
    </motion.article>
  );
}

function Panel({
  title,
  description,
  children,
  icon,
}: {
  title: string;
  description: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <motion.section
      variants={fadeUp}
      transition={softSpring}
      whileHover={{ y: -2, transition: softSpring }}
      className="rounded-[30px] border border-slate-200/80 bg-white/90 p-5 shadow-sm sm:p-6 dark:border-slate-700/80 dark:bg-slate-900/88 dark:shadow-[0_18px_52px_-34px_rgba(16,185,129,0.18)]"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        {icon ? <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{icon}</span> : null}
      </div>
      {children}
    </motion.section>
  );
}

function SummaryRow({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={softSpring}
      whileHover={{ x: 3, transition: softSpring }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-4 dark:border-slate-700/80 dark:bg-slate-950/40"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--primary)] shadow-sm dark:bg-slate-800">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{detail}</p>
      </div>
    </motion.div>
  );
}

function EmptyStateText({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="rounded-[24px] border border-slate-200/80 bg-white px-4 py-5 text-sm leading-6 text-slate-500 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-400"
    >
      {children}
    </motion.div>
  );
}
