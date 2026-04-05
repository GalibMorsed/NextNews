"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import NewsFeedWithLoadMore from "./newsFeedWithLoadMore";
import { supabase } from "../../../lib/superbaseClient";
import {
  getUserPersonalization,
  PERSONALIZATION_UPDATED_EVENT,
} from "../services/personalizationService";

interface Article {
  source?: { id?: string | null; name?: string };
  author?: string | null;
  title?: string;
  description?: string | null;
  content?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
}

interface TopHeadlinesContentProps {
  initialArticles: Article[];
  pageSize?: number;
}

const PERSONALIZATION_REMINDER_DISMISS_KEY =
  "top_headlines_personalization_reminder_until";
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const PERSONALIZATION_REQUIRED_TOPICS = 10;
const PERSONALIZATION_REQUIRED_SOURCES = 1;

function RefreshSkeleton() {
  return (
    <section aria-live="polite" aria-busy="true" className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_4px_20px_-2px_rgba(79,70,229,0.08)] dark:border-slate-800 dark:bg-slate-900"
          >
            <div
              className="h-52 w-full animate-pulse bg-slate-200 dark:bg-slate-800"
              style={{ animationDelay: `${index * 80}ms` }}
            />
            <div className="space-y-3 p-5">
              <div
                className="h-4 w-11/12 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
                style={{ animationDelay: `${index * 80}ms` }}
              />
              <div
                className="h-4 w-8/12 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
                style={{ animationDelay: `${index * 80 + 90}ms` }}
              />
              <div
                className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
                style={{ animationDelay: `${index * 80 + 180}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TopHeadlinesContent({
  initialArticles,
  pageSize = 20,
}: TopHeadlinesContentProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showPersonalizationReminder, setShowPersonalizationReminder] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // Use cached local token — no Supabase call needed
        if (localStorage.getItem("auth_token") || localStorage.getItem("auth_email")) {
          if (isMounted) setIsAuthenticated(true);
          return;
        }
        const { data } = await supabase.auth.getSession();
        if (isMounted) setIsAuthenticated(Boolean(data.session?.user));
      } catch {
        // silently ignore AbortError / navigator-lock timeout
      }
    };

    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const syncPersonalizationReminder = async () => {
      if (!isAuthenticated) {
        if (mounted) setShowPersonalizationReminder(false);
        return;
      }

      const dismissedUntilRaw = localStorage.getItem(
        PERSONALIZATION_REMINDER_DISMISS_KEY,
      );
      const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0;
      if (Number.isFinite(dismissedUntil) && dismissedUntil > Date.now()) {
        if (mounted) setShowPersonalizationReminder(false);
        return;
      }

      try {
        const { data, error } = await getUserPersonalization();
        if (!mounted) return;
        if (error) {
          setShowPersonalizationReminder(true);
          return;
        }
        const topicsCount = Array.isArray(data?.favorite_topics)
          ? data.favorite_topics.length
          : 0;
        const sourcesCount = Array.isArray(data?.favorite_sources)
          ? data.favorite_sources.length
          : 0;
        const isCompleted =
          topicsCount >= PERSONALIZATION_REQUIRED_TOPICS &&
          sourcesCount >= PERSONALIZATION_REQUIRED_SOURCES;
        setShowPersonalizationReminder(!isCompleted);
      } catch {
        if (mounted) setShowPersonalizationReminder(true);
      }
    };

    void syncPersonalizationReminder();
    window.addEventListener(
      PERSONALIZATION_UPDATED_EVENT,
      syncPersonalizationReminder,
    );

    return () => {
      mounted = false;
      window.removeEventListener(
        PERSONALIZATION_UPDATED_EVENT,
        syncPersonalizationReminder,
      );
    };
  }, [isAuthenticated]);

  const dismissPersonalizationReminder = () => {
    localStorage.setItem(
      PERSONALIZATION_REMINDER_DISMISS_KEY,
      String(Date.now() + TWO_HOURS_MS),
    );
    setShowPersonalizationReminder(false);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const params = new URLSearchParams({
        country: "us",
        page: "1",
        pageSize: String(pageSize),
      });
      const response = await fetch(`/api/news?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error();

      const data = await response.json();
      const latestArticles: Article[] = Array.isArray(data?.articles)
        ? data.articles
        : [];
      setArticles(latestArticles);
      setRefreshKey((prev) => prev + 1);
    } catch {
      setRefreshError(
        "Could not refresh top headlines right now. Please try again.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className="relative">
      {showPersonalizationReminder && (
        <div className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-4 shadow-xl backdrop-blur-sm dark:border-amber-900/70 dark:bg-amber-950/40 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[360px]">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-amber-600 dark:bg-slate-900 dark:text-amber-300">
              <span aria-hidden="true">!</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Personalize your feed for a better experience
              </p>
              <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/90">
                Select at least 10 topics and 1 source for better headlines.
              </p>
              <Link
                href="/personalization"
                className="mt-3 inline-flex items-center rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
              >
                Complete personalization
              </Link>
            </div>
            <button
              type="button"
              onClick={dismissPersonalizationReminder}
              className="flex h-7 w-7 items-center justify-center rounded-full text-amber-700 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50"
              aria-label="Dismiss personalization reminder"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="mb-8 flex flex-wrap items-center justify-end gap-4 sm:gap-6">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              group inline-flex min-w-[132px] items-center gap-3 whitespace-nowrap rounded-xl border border-slate-300
              bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200
              hover:border-slate-400 hover:bg-slate-50 hover:shadow active:scale-[0.98]
              dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800
              disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400
            `}
            aria-label={
              isRefreshing ? "Refreshing top headlines" : "Refresh top headlines"
            }
          >
            <div
              className={`
                relative flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100
                transition-all duration-200 group-hover:bg-sky-100 dark:bg-slate-800 dark:group-hover:bg-sky-950/70
              `}
            >
              {!isRefreshing && (
                <span className="absolute inset-0 rounded-lg ring-1 ring-sky-200 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:ring-sky-700" />
              )}
              {isRefreshing ? (
                <Loader2
                  size={18}
                  className="animate-spin text-sky-600 dark:text-sky-400"
                />
              ) : (
                <RefreshCw
                  size={18}
                  className="text-slate-700 transition-transform duration-500 group-hover:rotate-180 dark:text-slate-200"
                />
              )}
            </div>

            <span
              className={`
                transition-colors
                ${isRefreshing ? "text-sky-700 dark:text-sky-300" : "group-hover:text-slate-900 dark:group-hover:text-white"}
              `}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>
      )}

      {isRefreshing && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-4 shadow-sm dark:border-sky-900/60 dark:bg-sky-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-slate-900">
              <Loader2
                size={18}
                className="animate-spin text-sky-600 dark:text-sky-400"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">
                Updating top headlines
              </p>
              <p className="text-xs text-sky-800/80 dark:text-sky-300/80">
                Please wait a moment. New stories will appear automatically.
              </p>
            </div>
            <div className="ml-auto hidden items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-slate-900/90 dark:text-sky-300 sm:inline-flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500 dark:bg-sky-400" />
              Live
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sky-100 dark:bg-sky-950/70">
            <div className="h-full w-1/3 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-sky-500 dark:bg-sky-400" />
          </div>
        </div>
      )}

      {isRefreshing ? (
        <RefreshSkeleton />
      ) : (
        <NewsFeedWithLoadMore
          key={refreshKey}
          initialArticles={articles}
          country="us"
          pageSize={pageSize}
          emptyMessage="No news available at the moment. Please check back later."
        />
      )}

      {refreshError && (
        <p className="mt-6 text-center text-sm font-medium text-red-600">
          {refreshError}
        </p>
      )}
    </section>
  );
}
