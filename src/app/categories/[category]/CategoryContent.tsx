"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import NewsFeedWithLoadMore from "@/app/components/newsFeedWithLoadMore";
import { getCategoryDisplayName } from "@/lib/newsCategories";
import { trackCategoryVisit } from "@/lib/activityAnalytics";
import { supabase } from "../../../../lib/superbaseClient";

interface Article {
  source?: { id?: string | null; name?: string };
  author?: string | null;
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
}

interface CategoryContentProps {
  category: string;
  initialArticles: Article[];
  pageSize?: number;
  regionId?: string;
}

function RefreshSkeleton() {
  return (
    <section aria-live="polite" aria-busy="true" className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
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

export default function CategoryContent({
  category,
  initialArticles,
  pageSize = 20,
  regionId,
}: CategoryContentProps) {
  const categoryDisplayName = getCategoryDisplayName(category);
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const activeStartRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const localToken = localStorage.getItem("auth_token");
        if (localToken) {
          if (isMounted) setIsAuthenticated(true);
          return; // skip Supabase call entirely if local token exists
        }

        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setIsAuthenticated(Boolean(data.session?.user));
        }
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
    if (typeof document === "undefined") return;

    const flushActiveTime = () => {
      if (activeStartRef.current === null) return;
      const durationMs = Date.now() - activeStartRef.current;
      activeStartRef.current = null;
      trackCategoryVisit(category, durationMs);
    };

    const resumeActiveTime = () => {
      if (document.visibilityState !== "visible") return;
      if (activeStartRef.current !== null) return;
      activeStartRef.current = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushActiveTime();
      } else {
        resumeActiveTime();
      }
    };

    const handlePageHide = () => {
      flushActiveTime();
    };

    resumeActiveTime();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      flushActiveTime();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [category]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const params = new URLSearchParams({
        category,
        page: "1",
        pageSize: String(pageSize),
      });

      if (regionId) {
        params.set("region", regionId);
      } else {
        params.set("country", "us");
      }

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
        "Could not refresh this category right now. Please try again.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className="relative">
      {/* Header - button stays on the same line even on mobile */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
        <h1 className="text-3xl font-bold capitalize tracking-tighter text-slate-900 dark:text-slate-100 sm:text-4xl">
          {categoryDisplayName}
        </h1>

        {isAuthenticated && (
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
              isRefreshing ? "Refreshing news feed" : "Refresh news feed"
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
        )}
      </div>

      {/* Refreshing status */}
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
                Updating {categoryDisplayName} headlines
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

      {/* Main Content */}
      {isRefreshing ? (
        <RefreshSkeleton />
      ) : (
        <NewsFeedWithLoadMore
          key={refreshKey}
          initialArticles={articles}
          category={category}
          region={regionId}
          country="us"
          pageSize={pageSize}
          emptyMessage="No articles found for this category."
        />
      )}

      {refreshError && (
        <p className="mt-6 text-center text-sm font-medium text-red-600 dark:text-red-400">
          {refreshError}
        </p>
      )}
    </section>
  );
}
