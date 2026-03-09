"use client";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import NewsFeedWithLoadMore from "@/app/components/newsFeedWithLoadMore";

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

export default function CategoryContent({
  category,
  initialArticles,
  pageSize = 20,
}: CategoryContentProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const params = new URLSearchParams({
        country: "us",
        category,
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
        "Could not refresh this category right now. Please try again.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className="relative">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold capitalize tracking-tighter text-slate-900">
          {category}
        </h1>
      </div>

      {/* ✨ NEW: Animated Loading Content Directly Under H1 ✨ */}
      {isRefreshing && (
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white px-6 py-4 shadow-sm backdrop-blur-xl transition-all">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100">
            <Loader2 size={22} className="animate-spin text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-violet-700">
              Refreshing latest stories...
            </p>
            <p className="text-xs text-violet-600/80">
              Pulling fresh news just for you
            </p>
          </div>

          {/* Bouncing dots animation */}
          <div className="flex gap-1.5">
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      )}

      {/* Premium Floating Refresh Button (unchanged – still 🔥) */}
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="fixed bottom-8 right-6 z-50 group flex h-14 items-center overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-75 md:right-8"
        aria-label={isRefreshing ? "Refreshing news feed" : "Refresh news feed"}
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

      {/* Main Content */}
      {isRefreshing ? (
        <RefreshSkeleton />
      ) : (
        <NewsFeedWithLoadMore
          key={refreshKey}
          initialArticles={articles}
          category={category}
          country="us"
          pageSize={pageSize}
          emptyMessage="No articles found for this category."
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
