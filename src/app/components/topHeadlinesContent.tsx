"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import NewsFeedWithLoadMore from "./newsFeedWithLoadMore";
import { supabase } from "../../../lib/superbaseClient";

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

interface TopHeadlinesContentProps {
  initialArticles: Article[];
  pageSize?: number;
}

function RefreshSkeleton() {
  return (
    <section aria-live="polite" aria-busy="true" className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
          >
            <div className="h-52 w-full animate-pulse bg-slate-200" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-8/12 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
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

  useEffect(() => {
    const localToken = localStorage.getItem("auth_token");
    if (localToken) setIsAuthenticated(true);

    supabase.auth.getSession().then(({ data }) => {
      const hasSession = Boolean(data.session?.user);
      setIsAuthenticated(hasSession || Boolean(localStorage.getItem("auth_token")));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      setRefreshError("Could not refresh top headlines right now. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className="relative">
      {isRefreshing && (
        <div
          className="mb-8 flex items-center gap-3 rounded-2xl border bg-gradient-to-r px-6 py-4 shadow-sm backdrop-blur-xl transition-all"
          style={{
            borderColor: "color-mix(in srgb, var(--primary) 25%, white)",
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--primary) 12%, white), white)",
          }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "color-mix(in srgb, var(--primary) 18%, white)",
            }}
          >
            <Loader2
              size={22}
              className="animate-spin"
              style={{ color: "var(--primary)" }}
            />
          </div>
          <div className="flex-1">
            <p
              className="text-sm font-semibold"
              style={{ color: "color-mix(in srgb, var(--primary) 78%, black)" }}
            >
              Refreshing latest stories...
            </p>
            <p
              className="text-xs"
              style={{ color: "color-mix(in srgb, var(--primary) 70%, #475569)" }}
            >
              Pulling fresh top headlines for you
            </p>
          </div>
          <div className="flex gap-1.5">
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full"
              style={{ backgroundColor: "var(--primary)", animationDelay: "0ms" }}
            />
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full"
              style={{ backgroundColor: "var(--primary)", animationDelay: "150ms" }}
            />
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full"
              style={{ backgroundColor: "var(--primary)", animationDelay: "300ms" }}
            />
          </div>
        </div>
      )}

      {isAuthenticated && (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="fixed bottom-8 right-6 z-50 group flex h-14 items-center overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-75 md:right-8"
          aria-label={isRefreshing ? "Refreshing top headlines" : "Refresh top headlines"}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 transition-colors group-hover:bg-violet-100">
            {isRefreshing ? (
              <Loader2 size={24} className="animate-spin text-violet-600" />
            ) : (
              <RefreshCw
                size={24}
                className="text-slate-700 transition-transform duration-700 group-hover:rotate-[420deg]"
              />
            )}
          </div>

          <span
            className={`ml-3 overflow-hidden whitespace-nowrap text-sm font-semibold text-slate-700 transition-all duration-400 ease-out ${
              isRefreshing
                ? "max-w-[125px] text-violet-600"
                : "max-w-0 group-hover:max-w-[95px]"
            }`}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </span>
        </button>
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
