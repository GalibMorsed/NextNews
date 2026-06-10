"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";

interface Article {
  source?: { id?: string | null; name?: string };
  author?: string | null;
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
}

const MAX_ROUNDUP_ARTICLES = 8;
const MIN_ROUNDUP_ARTICLES = 5;
const ROUNDUP_CACHE_TTL_MS = 2 * 24 * 60 * 60 * 1000;
const ROUNDUP_CACHE_PREFIX = "weekly_roundup_cache";

function normalizeKey(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function buildArticleKey(article: Article) {
  return [normalizeKey(article.url), normalizeKey(article.title)]
    .filter(Boolean)
    .join("|");
}

function isAllowedPathname(pathname: string) {
  return pathname === "/" || pathname.startsWith("/news/indian-tadka");
}

function buildCacheKey({
  category,
  regionId,
  section,
  source,
}: {
  category?: string;
  regionId?: string;
  section: "general" | "indian-tadka";
  source?: string;
}) {
  return [section, category ?? "", regionId ?? "", source ?? ""].join("|");
}

function readCachedArticles(cacheKey: string) {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(cacheKey);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as {
      cachedAt?: number;
      articles?: Article[];
    };

    if (!Array.isArray(parsed.articles) || !Number.isFinite(parsed.cachedAt)) {
      return null;
    }

    return {
      cachedAt: parsed.cachedAt,
      articles: parsed.articles,
    };
  } catch {
    return null;
  }
}

function writeCachedArticles(cacheKey: string, articles: Article[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({ cachedAt: Date.now(), articles }),
    );
  } catch {
    // Ignore storage failures and continue rendering the fetched data.
  }
}

export default function WeeklyRoundup({
  category,
  regionId,
  section = "general",
  source,
  excludeArticles = [],
}: {
  category?: string;
  regionId?: string;
  section?: "general" | "indian-tadka";
  source?: string;
  excludeArticles?: Article[];
}) {
  const pathname = usePathname();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom Slider & Animation States
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const [isHovered, setIsHovered] = useState(false);

  const cacheKey = useMemo(
    () =>
      `${ROUNDUP_CACHE_PREFIX}:${buildCacheKey({
        category,
        regionId,
        section,
        source,
      })}`,
    [category, regionId, section, source],
  );
  const excludedKeys = useMemo(
    () => new Set(excludeArticles.map(buildArticleKey).filter(Boolean)),
    [excludeArticles],
  );

  useEffect(() => {
    if (!pathname || !isAllowedPathname(pathname)) {
      return;
    }

    let mounted = true;
    const params = new URLSearchParams();
    params.set("section", section);
    if (source) params.set("source", source);
    if (category) params.set("category", category);
    if (regionId) params.set("region", regionId);

    const cached = readCachedArticles(cacheKey);
    if (
      cached &&
      Date.now() - (cached.cachedAt ?? 0) < ROUNDUP_CACHE_TTL_MS &&
      cached.articles.length > 0
    ) {
      const nextCachedArticles = cached.articles.filter((article) => {
        const articleKey = buildArticleKey(article);
        if (!articleKey) return true;
        return !excludedKeys.has(articleKey);
      });

      setArticles(nextCachedArticles.slice(0, MAX_ROUNDUP_ARTICLES));
      setError(null);
      return () => {
        mounted = false;
      };
    }

    void (async () => {
      try {
        if (cached?.articles?.length) {
          const staleArticles = cached.articles.filter((article) => {
            const articleKey = buildArticleKey(article);
            if (!articleKey) return true;
            return !excludedKeys.has(articleKey);
          });
          setArticles(staleArticles.slice(0, MAX_ROUNDUP_ARTICLES));
        }

        const res = await fetch(`/api/weekly-roundup?${params.toString()}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          setError(data?.error ?? `status_${res.status}`);
          setArticles([]);
          return;
        }
        const nextArticles = Array.isArray(data) ? data : [];
        const filteredArticles = nextArticles.filter((article) => {
          const articleKey = buildArticleKey(article);
          if (!articleKey) return true;
          return !excludedKeys.has(articleKey);
        });
        const nextArticlesToShow = filteredArticles.slice(
          0,
          MAX_ROUNDUP_ARTICLES,
        );
        setArticles(nextArticlesToShow);
        setError(null);

        if (nextArticlesToShow.length > 0) {
          writeCachedArticles(cacheKey, nextArticlesToShow);
        }
      } catch {
        if (!mounted) return;
        if (cached?.articles?.length) {
          const fallbackArticles = cached.articles.filter((article) => {
            const articleKey = buildArticleKey(article);
            if (!articleKey) return true;
            return !excludedKeys.has(articleKey);
          });
          setArticles(fallbackArticles.slice(0, MAX_ROUNDUP_ARTICLES));
          setError(null);
        } else {
          setError("network_error");
          setArticles([]);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [cacheKey, category, excludedKeys, pathname, regionId, section, source]);

  // Set up intersection observer to trigger staggered entrance animations on scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !articles || articles.length === 0) return;

    // Reset visible indices when articles load/change
    setVisibleIndices(new Set());

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const indexAttr = entry.target.getAttribute("data-index");
          if (indexAttr === null) return;
          const index = parseInt(indexAttr, 10);

          if (entry.isIntersecting) {
            setVisibleIndices((prev) => {
              const next = new Set(prev);
              next.add(index);
              return next;
            });
          }
        });
      },
      {
        root: container,
        threshold: 0.1, // Trigger when 10% of the card is visible inside container viewport
      },
    );

    const cards = container.querySelectorAll(".roundup-card");
    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [articles]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container || !articles || articles.length === 0) return;

    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    if (scrollWidth <= clientWidth) {
      setActiveIndex(0);
      return;
    }

    // Estimate the active card index based on scroll position
    const cardWidth = scrollWidth / articles.length;
    const index = Math.round(scrollLeft / cardWidth);
    const clampedIndex = Math.max(0, Math.min(articles.length - 1, index));

    setActiveIndex(clampedIndex);
  };

  const scrollToCard = (index: number) => {
    const container = scrollRef.current;
    if (!container || !articles) return;

    const cardWidth = container.scrollWidth / articles.length;
    container.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  const scrollPrev = () => {
    const container = scrollRef.current;
    if (!container || !articles) return;

    const cardWidth = container.scrollWidth / articles.length;
    container.scrollTo({
      left: container.scrollLeft - cardWidth,
      behavior: "smooth",
    });
  };

  const scrollNext = () => {
    const container = scrollRef.current;
    if (!container || !articles) return;

    const cardWidth = container.scrollWidth / articles.length;
    container.scrollTo({
      left: container.scrollLeft + cardWidth,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (isHovered || !articles || articles.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % articles.length;
        const container = scrollRef.current;
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

  const roundupCountLabel = `${MIN_ROUNDUP_ARTICLES}-${MAX_ROUNDUP_ARTICLES} biggest stories this week`;
  const isLoading = articles === null;

  if (pathname && !isAllowedPathname(pathname)) {
    return null;
  }

  return (
    <section className="mb-8" id="weekly-roundup">
      {/* Header section with modern badge and app theme match */}
      <div className="mb-4 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 bg-clip-text text-transparent dark:from-white dark:via-indigo-100 dark:to-violet-200">
            Weekly News Roundup
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:text-right">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-100/50 dark:border-blue-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
            {roundupCountLabel}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-5 overflow-x-auto pb-4 pt-2 scrollbar-hide">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[124px] w-[290px] sm:w-[340px] flex-shrink-0 rounded-lg border border-slate-100 bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:border-slate-800/40 dark:bg-slate-900/90"
            >
              <div className="flex h-full items-center gap-3.5">
                <div className="h-[90px] w-[90px] flex-shrink-0 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="flex-1 flex flex-col justify-between h-full py-0.5">
                  <div className="space-y-2">
                    <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3.5 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 backdrop-blur-sm">
          <span>Weekly roundup is temporarily unavailable.</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-lg border border-slate-100 bg-white/60 px-4 py-3.5 text-sm text-slate-600 dark:border-slate-800/30 dark:bg-slate-900/40 backdrop-blur-sm">
          No featured weekly stories right now.
        </div>
      ) : (
        <div 
          className="relative group/carousel"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Scroll Container with scroll-snap and hidden scrollbars */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-5 overflow-x-auto pb-4 pt-2 scrollbar-hide snap-x snap-mandatory pr-10 sm:pr-0"
          >
            {articles.map((a, idx) => {
              const isVisible = visibleIndices.has(idx);
              return (
                <Link
                  key={a.url ?? idx}
                  href={a.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-index={idx}
                  style={{
                    transitionDelay: isVisible ? `${(idx % 4) * 80}ms` : "0ms",
                  }}
                  className={`roundup-card group flex-shrink-0 snap-start h-[124px] w-[290px] sm:w-[340px] rounded-lg border border-slate-100 bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.01),0_8px_16px_rgba(0,0,0,0.01)] transition-all duration-700 ease-out hover:-translate-y-1 dark:border-slate-800/30 dark:bg-slate-900/90 dark:shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-[0_12px_24px_-4px_rgba(59,130,246,0.08),0_4px_12px_rgba(0,0,0,0.02)] dark:hover:shadow-[0_12px_24px_-4px_rgba(59,130,246,0.2),0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-sm ${
                    isVisible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-8 scale-95"
                  }`}
                >
                  <div className="flex h-full items-center gap-3.5">
                    {/* Image Wrapper with zoom effect on hover */}
                    <div className="h-[90px] w-[90px] flex-shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800/60 border border-slate-100/50 dark:border-slate-800/50">
                      {a.urlToImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.urlToImage}
                          alt={a.title ?? ""}
                          onError={(event) => {
                            event.currentTarget.src = "/news1.jpg";
                          }}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src="/news1.jpg"
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      )}
                    </div>

                    {/* Content Section with premium typography & styling */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between h-full py-0.5">
                      <div>
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {a.title}
                        </h3>
                        {a.description && (
                          <p className="mt-1 line-clamp-1 text-xs leading-snug text-slate-500 dark:text-slate-400">
                            {a.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
                        <div className="truncate text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                          {a.publishedAt
                            ? new Date(a.publishedAt).toLocaleDateString(
                                undefined,
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : ""}
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 group/read gap-0.5 hover:text-blue-700 dark:hover:text-blue-300">
                            Read More{" "}
                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/read:translate-x-0.5 group-hover/read:-translate-y-0.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Left Hover Navigation Arrow (fully transparent glassmorphic style) */}
          <button
            onClick={scrollPrev}
            disabled={activeIndex === 0}
            className="absolute -left-4 top-[62px] -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-slate-700 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-300 hover:bg-white/35 hover:text-blue-600 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0 dark:border-white/10 dark:bg-slate-950/20 dark:text-slate-300 dark:hover:bg-slate-950/40 dark:hover:text-blue-400 sm:flex hidden z-10 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Right Hover Navigation Arrow (fully transparent glassmorphic style) */}
          <button
            onClick={scrollNext}
            disabled={activeIndex === articles.length - 1}
            className="absolute -right-4 top-[62px] -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-slate-700 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-300 hover:bg-white/35 hover:text-blue-600 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0 dark:border-white/10 dark:bg-slate-950/20 dark:text-slate-300 dark:hover:bg-slate-950/40 dark:hover:text-blue-400 sm:flex hidden z-10 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Custom Pill Indicators - matching user mockup */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {articles.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToCard(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ease-out cursor-pointer ${
                  activeIndex === idx
                    ? "w-6 bg-blue-600 dark:bg-blue-400"
                    : "w-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
