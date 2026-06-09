"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowUpRight, Flame, Radio, ChevronLeft, ChevronRight } from "lucide-react";

interface BreakingArticle {
  source?: { id?: string | null; name?: string };
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
  category?: string | null;
}

interface BreakingNewsTickerProps {
  category?: string;
  country?: string;
  region?: string;
  label?: string;
  subLabel?: string;
  className?: string;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_PREFIX = "breaking_news_ticker";
const MARQUEE_CYCLES = ["primary", "repeat"] as const;

function buildCacheKey({
  category,
  country,
  region,
}: BreakingNewsTickerProps) {
  return [CACHE_PREFIX, category ?? "", country ?? "", region ?? ""].join(":");
}

function formatSource(article: BreakingArticle) {
  return article.source?.name?.trim() || "NextNews";
}

function formatPublishedTime(value?: string) {
  if (!value) return "Live now";

  const publishedTime = new Date(value).getTime();
  if (!Number.isFinite(publishedTime)) return "Live now";

  const diffMs = Math.max(0, Date.now() - publishedTime);
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
}

function buildBreakingArticleKey(article: BreakingArticle) {
  return (
    [
      article.url?.trim(),
      article.title?.trim(),
      article.publishedAt?.trim(),
      article.source?.name?.trim(),
    ]
      .filter(Boolean)
      .join("|") || "breaking-update"
  );
}

function readCachedArticles(cacheKey: string) {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(cacheKey);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as {
      cachedAt?: number;
      articles?: BreakingArticle[];
    };

    if (!Number.isFinite(parsed.cachedAt) || !Array.isArray(parsed.articles)) {
      return null;
    }

    if (Date.now() - (parsed.cachedAt ?? 0) > CACHE_TTL_MS) return null;
    return parsed.articles;
  } catch {
    return null;
  }
}

function writeCachedArticles(cacheKey: string, articles: BreakingArticle[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({ cachedAt: Date.now(), articles }),
    );
  } catch {
    // Local storage is only a speed boost for the ticker.
  }
}

export default function BreakingNewsTicker({
  category,
  country = "in",
  region,
  label = "Breaking News",
  subLabel = "",
  className = "",
}: BreakingNewsTickerProps) {
  const [articles, setArticles] = useState<BreakingArticle[] | null>(null);
  const cacheKey = useMemo(
    () => buildCacheKey({ category, country, region }),
    [category, country, region],
  );

  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const [activeDesktopIndex, setActiveDesktopIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered || !articles || articles.length === 0) return;

    const interval = setInterval(() => {
      setActiveDesktopIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % articles.length;
        const container = desktopScrollRef.current;
        if (container) {
          const cardWidth = container.scrollWidth / articles.length;
          container.scrollTo({
            left: nextIndex * cardWidth,
            behavior: "smooth",
          });
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered, articles]);

  const handleDesktopScroll = () => {
    const container = desktopScrollRef.current;
    if (!container || !articles || articles.length === 0) return;

    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    if (scrollWidth <= clientWidth) {
      setActiveDesktopIndex(0);
      return;
    }

    const cardWidth = scrollWidth / articles.length;
    const index = Math.round(scrollLeft / cardWidth);
    const clampedIndex = Math.max(0, Math.min(articles.length - 1, index));

    setActiveDesktopIndex(clampedIndex);
  };

  const scrollToDesktopCard = (index: number) => {
    const container = desktopScrollRef.current;
    if (!container || !articles) return;

    const cardWidth = container.scrollWidth / articles.length;
    container.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
    setActiveDesktopIndex(index);
  };

  const scrollPrev = () => {
    const container = desktopScrollRef.current;
    if (!container || !articles) return;

    const cardWidth = container.scrollWidth / articles.length;
    container.scrollTo({
      left: container.scrollLeft - cardWidth,
      behavior: "smooth",
    });
  };

  const scrollNext = () => {
    const container = desktopScrollRef.current;
    if (!container || !articles) return;

    const cardWidth = container.scrollWidth / articles.length;
    container.scrollTo({
      left: container.scrollLeft + cardWidth,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    let mounted = true;
    const cachedArticles = readCachedArticles(cacheKey);

    if (cachedArticles?.length) {
      queueMicrotask(() => {
        if (mounted) setArticles(cachedArticles);
      });
    }

    const params = new URLSearchParams({
      country,
    });
    if (category) params.set("category", category);
    if (region) params.set("region", region);

    void (async () => {
      try {
        const response = await fetch(`/api/breaking-news?${params}`, {
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);
        if (!mounted) return;

        const nextArticles: BreakingArticle[] = Array.isArray(data?.articles)
          ? data.articles
          : [];
        setArticles(nextArticles);

        if (nextArticles.length > 0) {
          writeCachedArticles(cacheKey, nextArticles);
        }
      } catch {
        if (!mounted) return;
        setArticles(cachedArticles ?? []);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [cacheKey, category, country, region]);

  if (!articles || articles.length === 0) return null;

  return (
    <section className={className} aria-label="Breaking news ticker">
      <div 
        className="w-full text-left"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tab Header */}
        <div className="inline-flex items-center gap-3 px-4 py-2.5 border border-red-100 dark:border-red-950/50 bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-200 rounded-t-xl border-b-0 translate-y-[1px] relative z-10">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm">
            <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-red-200/80" />
            <Radio className="relative h-3.5 w-3.5" />
          </span>
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em]">
            • {label}
          </span>
          {subLabel && (
            <span className="ml-1.5 text-[11px] font-semibold text-red-600/60 dark:text-red-200/50 flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {subLabel}
            </span>
          )}
        </div>

        {/* Carousel Wrapper */}
        <div className="relative group/carousel">
          {/* Articles Container Box */}
          <div 
            ref={desktopScrollRef}
            onScroll={handleDesktopScroll}
            className="border border-red-100 dark:border-red-950/50 bg-white dark:bg-slate-950 rounded-b-xl rounded-tr-xl p-4 sm:p-5 flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-5 shadow-[0_18px_42px_-34px_rgba(185,28,28,0.7)]"
          >
            {articles.map((article) => (
              <Link
                key={`${buildBreakingArticleKey(article)}-desktop`}
                href={article.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group/item flex items-stretch gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-red-50/40 dark:hover:bg-red-950/10 hover:border-red-200 dark:hover:border-red-900/40 transition-all duration-300 w-[290px] sm:w-[380px] shrink-0 text-left snap-start animate-fade-in"
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
                  {article.urlToImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.urlToImage}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover/item:scale-105"
                      onError={(event) => {
                        event.currentTarget.src = "/news1.jpg";
                      }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/news1.jpg"
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover/item:scale-105"
                    />
                  )}
                </span>
                <span className="flex flex-col justify-between flex-1 min-w-0">
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      {formatSource(article)}
                    </span>
                    <span className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-slate-100 group-hover/item:text-red-700 dark:group-hover/item:text-red-200 transition-colors">
                      {article.title}
                    </span>
                  </span>
                  <span className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[11px] font-semibold text-red-600/80 dark:text-red-300/80">
                      {formatPublishedTime(article.publishedAt)}
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 group-hover/item:text-red-600 dark:group-hover/item:text-red-400 group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5 transition-all" />
                  </span>
                </span>
              </Link>
            ))}
          </div>

          {/* Left Hover Navigation Arrow (fully transparent glassmorphic style) */}
          <button
            onClick={scrollPrev}
            disabled={activeDesktopIndex === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-md backdrop-blur-md transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0 lg:flex hidden z-10 cursor-pointer opacity-0 group-hover/carousel:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Right Hover Navigation Arrow (fully transparent glassmorphic style) */}
          <button
            onClick={scrollNext}
            disabled={activeDesktopIndex === articles.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-md backdrop-blur-md transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0 lg:flex hidden z-10 cursor-pointer opacity-0 group-hover/carousel:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Custom Pill Indicators */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {articles.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToDesktopCard(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ease-out cursor-pointer ${
                activeDesktopIndex === idx
                  ? "w-6 bg-red-600 dark:bg-red-400"
                  : "w-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
