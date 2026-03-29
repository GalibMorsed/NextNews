"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  CalendarRange,
  FileText,
  Flame,
  Radio,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getVerifiedAuthUser } from "@/lib/clientAuth";
import { readActivityAnalytics, type ActivityAnalytics } from "@/lib/activityAnalytics";
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

const heatColor = (count: number) =>
  count >= 6
    ? "bg-emerald-700 dark:bg-emerald-500"
    : count >= 3
      ? "bg-emerald-500 dark:bg-emerald-400"
      : count >= 1
        ? "bg-emerald-200 dark:bg-emerald-800/70"
        : "bg-slate-100 dark:bg-slate-800";

export default function MyActivityPage() {
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
  }, []);

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

  const noteCount = filteredNotes.length;
  const articleCount = filteredEvents.filter((event) => event.type === "article_open").length;
  const previousArticleCount = previousEvents.filter((event) => event.type === "article_open").length;

  const noteDelta =
    previousNotes.length > 0 ? Math.round(((noteCount - previousNotes.length) / previousNotes.length) * 100) : noteCount > 0 ? 100 : 0;
  const articleDelta =
    previousArticleCount > 0 ? Math.round(((articleCount - previousArticleCount) / previousArticleCount) * 100) : articleCount > 0 ? 100 : 0;

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
        event.type !== "personalization_suggestion"
      ) {
        return;
      }
      const key = dayKey(event.timestamp);
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
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
      if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
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

  const analystCards = [
    {
      title: "AI summaries",
      description: `${activityAnalytics.aiSummaryCount} AI summary use${activityAnalytics.aiSummaryCount === 1 ? "" : "s"} on articles.`,
      icon: Bot,
    },
    {
      title: "AI suggestions",
      description: `${activityAnalytics.personalizationSuggestionCount} AI suggestion request${activityAnalytics.personalizationSuggestionCount === 1 ? "" : "s"} for personalization.`,
      icon: BrainCircuit,
    },
    {
      title: "Total AI usage",
      description: `${activityAnalytics.aiSummaryCount + activityAnalytics.personalizationSuggestionCount} combined AI use${activityAnalytics.aiSummaryCount + activityAnalytics.personalizationSuggestionCount === 1 ? "" : "s"} in your account.`,
      icon: Sparkles,
    },
  ] as const;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom,_#fafaf9,_#ffffff_28%)] px-4 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="rounded-[32px] border border-stone-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-7 dark:border-slate-700 dark:bg-slate-900/90">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">My Activity</h1>
              <p className="mt-2 text-base text-slate-600 dark:text-slate-300">Your reading insights, notes, history, and AI analyst activity in one place.</p>
              <div className="mt-3 inline-flex rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Selected filter: {selectedRange}
              </div>
              {pageError ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{pageError}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RANGE_OPTIONS.map(({ label }) => (
                <button key={label} type="button" onClick={() => setSelectedRange(label)} className={`rounded-2xl border px-5 py-3 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 ${selectedRange === label ? "border-[var(--primary)] bg-stone-100 text-[var(--primary)]" : "border-stone-200 bg-stone-50 text-slate-700 hover:border-[var(--primary)] hover:text-[var(--primary)]"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Articles read" value={articleCount} delta={articleDelta} subtitle="Counted from how many times you opened articles with Read more in this range." icon={<FileText className="h-5 w-5" />} />
          <MetricCard title="Notes added" value={noteCount} delta={noteDelta} subtitle="Saved notes and highlights from your account." icon={<FileText className="h-5 w-5" />} />
          <MetricCard title="Reading streak" value={streak.current} suffix={streak.current === 1 ? "day" : "days"} subtitle={`Personal best: ${streak.best} day${streak.best === 1 ? "" : "s"}`} icon={<Flame className="h-5 w-5" />} />
          <MetricCard title="Live sessions" value={0} subtitle="No live-session watch tracking has been saved for this account yet." icon={<Radio className="h-5 w-5" />} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Panel title="Daily reading activity" description="A visual trend area for article opens, saved notes, and AI usage over time.">
            <div className="flex h-[280px] items-end gap-4 rounded-[24px] border border-slate-200/80 bg-white px-4 pb-6 pt-8 dark:border-slate-700 dark:bg-slate-950/40">
              {chartBuckets.map((item) => {
                const max = Math.max(...chartBuckets.map((entry) => entry.count), 1);
                const height = Math.max((item.count / max) * 180, item.count > 0 ? 24 : 8);
                return (
                  <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.count}</div>
                    <div className="flex h-[180px] w-full items-end">
                      <div className="w-full rounded-t-2xl bg-[linear-gradient(180deg,_rgba(16,185,129,0.9),_rgba(20,184,166,0.72))]" style={{ height: `${height}px` }} title={`${item.label}: ${item.count}`} />
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Category breakdown" description="Categories are ranked by how often you used them during the selected period.">
            {categoryBreakdown.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 dark:border-slate-700 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-medium capitalize text-slate-800 dark:text-slate-100">{item.category.replaceAll("-", " ")}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{item.count}</div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,_rgba(16,185,129,0.95),_rgba(59,130,246,0.75))]" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyStateText>No category usage found yet. Open articles from category pages with Read more to build this section.</EmptyStateText>
            )}
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Panel title="Reading streak" description="A heatmap-style streak grid for recent reading, note-taking, and AI activity days.">
            <div className="grid grid-cols-6 gap-3 sm:grid-cols-8 lg:grid-cols-10">
              {heatmap.map((day) => (
                <div
                  key={day.key}
                  className={`flex aspect-square items-center justify-center rounded-xl text-[11px] font-medium ${heatColor(day.count)} ${
                    day.count > 0
                      ? "text-emerald-950 dark:text-emerald-50"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                  title={`${day.key}: ${day.count}`}
                >
                  {day.key.slice(-2)}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Top sources" description="Sources are ranked from article opens, saved notes, and AI summary usage combined.">
            {sourceCounts.length > 0 ? (
              <div className="space-y-4">
                {sourceCounts.map(([source, count]) => {
                  const max = sourceCounts[0]?.[1] ?? 1;
                  return (
                    <div key={source} className="grid grid-cols-[minmax(0,1fr)_2fr_auto] items-center gap-3">
                      <div className="truncate text-base text-slate-800 dark:text-slate-100">{source}</div>
                      <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-[linear-gradient(90deg,_rgba(16,185,129,0.95),_rgba(59,130,246,0.75))]" style={{ width: `${Math.max((count / max) * 100, 10)}%` }} />
                      </div>
                      <div className="text-base text-slate-600 dark:text-slate-300">{count}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyStateText>No source activity yet. Open articles, save notes, or use AI summaries to build this list.</EmptyStateText>
            )}
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <Panel title="AI analysts" description="Your AI usage activity across article summaries and personalization suggestions." icon={<Bot className="h-5 w-5" />}>
            <div className="grid gap-4 lg:grid-cols-3">
              {analystCards.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(240,253,250,0.85))] p-5 dark:border-slate-700 dark:bg-slate-950/40">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Activity summary" description="Quick status blocks for the analytics services behind this page." icon={<TrendingUp className="h-5 w-5" />}>
            <div className="space-y-3">
              <SummaryRow icon={<CalendarRange className="h-4 w-4" />} title="Time filters" detail={`${selectedRange} selected`} />
              <SummaryRow icon={<TrendingUp className="h-4 w-4" />} title="Reading analytics" detail={`${noteCount} note${noteCount === 1 ? "" : "s"} in range`} />
              <SummaryRow icon={<Bot className="h-4 w-4" />} title="AI summaries used" detail={`${activityAnalytics.aiSummaryCount} total`} />
              <SummaryRow icon={<Sparkles className="h-4 w-4" />} title="AI suggestions used" detail={`${activityAnalytics.personalizationSuggestionCount} total`} />
            </div>
          </Panel>
        </section>
      </div>
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
  icon: React.ReactNode;
  delta?: number;
  suffix?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <article className="rounded-[28px] border border-stone-200/70 bg-stone-50/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{title}</p>
          <div className="mt-4 text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
            {suffix ? <span className="ml-2 text-2xl font-medium text-slate-600 dark:text-slate-300">{suffix}</span> : null}
          </div>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--primary)] ring-1 ring-stone-200 dark:bg-slate-800 dark:ring-slate-700">{icon}</span>
      </div>
      {typeof delta === "number" ? (
        <div className={`mt-4 inline-flex items-center gap-2 text-sm ${positive ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
          {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {Math.abs(delta)}% vs last period
        </div>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>
    </article>
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
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-slate-200/80 bg-white/90 p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        {icon ? <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{icon}</span> : null}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/40">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--primary)] shadow-sm dark:bg-slate-800">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{detail}</p>
      </div>
    </div>
  );
}

function EmptyStateText({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white px-4 py-5 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
      {children}
    </div>
  );
}
