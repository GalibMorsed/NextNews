"use client";

import { useEffect, useMemo, useState } from "react";
import ArticleCard from "./articleCart";
import { motion } from "framer-motion";
import { ArrowDown, Loader2 } from "lucide-react";

interface Article {
  source?: { id?: string | null; name?: string };
  author?: string | null;
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
  content?: string | null;
}

interface NewsFeedWithLoadMoreProps {
  initialArticles: Article[];
  category?: string;
  country?: string;
  query?: string;
  date?: string;
  pageSize?: number;
  emptyMessage?: string;
}

function formatPublishedDate(date?: string) {
  if (!date) return "Date Not Available";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date Not Available";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NewsFeedWithLoadMore({
  initialArticles,
  category,
  country = "us",
  query,
  date,
  pageSize = 20,
  emptyMessage = "No news available right now.",
}: NewsFeedWithLoadMoreProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(
    (initialArticles?.length ?? 0) >= pageSize,
  );

  useEffect(() => {
    setArticles(initialArticles ?? []);
    setPage(1);
    setHasMore((initialArticles?.length ?? 0) >= pageSize);
    setIsLoadingMore(false);
    setLoadError(null);
  }, [initialArticles, category, country, query, date, pageSize]);

  const existingKeys = useMemo(
    () =>
      new Set(
        articles.map(
          (article, index) =>
            article.url?.trim() ||
            `${article.title?.trim() ?? "untitled"}-${article.publishedAt ?? index}`,
        ),
      ),
    [articles],
  );

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setLoadError(null);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams({
        country,
        page: String(nextPage),
        pageSize: String(pageSize),
      });

      if (category) params.set("category", category);
      if (query) params.set("q", query);
      if (date) params.set("date", date);

      const response = await fetch(`/api/news?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load more news (${response.status})`);
      }

      const data = await response.json();
      const fetchedArticles: Article[] = Array.isArray(data?.articles)
        ? data.articles
        : [];

      const uniqueNewArticles = fetchedArticles.filter((article, index) => {
        const key =
          article.url?.trim() ||
          `${article.title?.trim() ?? "untitled"}-${article.publishedAt ?? index}`;
        return !existingKeys.has(key);
      });

      if (uniqueNewArticles.length > 0) {
        setArticles((prev) => [...prev, ...uniqueNewArticles]);
      }

      if (fetchedArticles.length < pageSize || uniqueNewArticles.length === 0) {
        setHasMore(false);
      }

      setPage(nextPage);
    } catch {
      setLoadError(
        "We couldn't load more news at the moment. Please try again.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (!articles.length) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <section>
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {articles.map((article, index) => (
          <ArticleCard
            key={`${article.url ?? "article"}-${index}`}
            article={{
              source: {
                id: article.source?.id ?? null,
                name: article.source?.name ?? "Unknown Source",
              },
              author: article.author ?? null,
              title: article.title ?? "Untitled article",
              description: article.description ?? "No description available.",
              url: article.url ?? "",
              urlToImage: article.urlToImage ?? null,
              publishedAt: article.publishedAt ?? "",
              content: article.content ?? null,
            }}
            formattedDate={formatPublishedDate(article.publishedAt)}
          />
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        {hasMore ? (
          <motion.button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            whileHover={isLoadingMore ? undefined : { y: -1 }}
            whileTap={isLoadingMore ? undefined : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
            className="group relative inline-flex min-w-44 items-center justify-center gap-2 overflow-hidden rounded-xl border px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            style={{
              backgroundColor: "var(--primary)",
              borderColor: "color-mix(in srgb, var(--primary) 55%, black 10%)",
              boxShadow:
                "0 8px 20px -12px color-mix(in srgb, var(--primary) 70%, transparent)",
            }}
          >
            <span className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10 opacity-90" />
            <span className="absolute inset-x-6 top-0 h-px bg-white/50" />
            <span className="absolute -left-20 top-0 h-full w-16 -skew-x-12 bg-white/25 transition-transform duration-700 group-hover:translate-x-[320px]" />
            <span className="relative flex items-center gap-2">
              {isLoadingMore ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowDown
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-y-0.5"
                />
              )}
              <span>{isLoadingMore ? "Loading..." : "Load More Articles"}</span>
            </span>
          </motion.button>
        ) : (
          <p className="text-sm text-gray-500">
            No more news to load, Feel free to search for other
            topics to find more news. 😶‍🌫️
          </p>
        )}

        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
      </div>
    </section>
  );
}
