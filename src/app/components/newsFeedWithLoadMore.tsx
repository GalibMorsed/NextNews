"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, CreditCard, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import ArticleCard from "./articleCart";

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
  region?: string;
  query?: string;
  date?: string;
  pageSize?: number;
  emptyMessage?: string;
}

function formatPublishedDate(date?: string) {
  if (!date) return "Date Not Available";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date Not Available";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function hasLocalAuth() {
  if (typeof window === "undefined") return false;

  const authToken = localStorage.getItem("auth_token")?.trim();
  const authEmail = localStorage.getItem("auth_email")?.trim();

  return Boolean(authToken || authEmail);
}

export default function NewsFeedWithLoadMore({
  initialArticles,
  category,
  country = "us",
  region,
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPlansPopup, setShowPlansPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isBackToTopHovered, setIsBackToTopHovered] = useState(false);
  const [isBackToTopFocused, setIsBackToTopFocused] = useState(false);
  const [showBackToTopHint, setShowBackToTopHint] = useState(false);
  const backToTopHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const router = useRouter();

  useEffect(() => {
    setArticles(initialArticles ?? []);
    setPage(1);
    setHasMore((initialArticles?.length ?? 0) >= pageSize);
    setIsLoadingMore(false);
    setLoadError(null);
  }, [initialArticles, category, country, region, query, date, pageSize]);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 640);
    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      const isAuthenticated = hasLocalAuth();
      setIsLoggedIn(isAuthenticated);

      if (isAuthenticated) {
        setShowPlansPopup(false);
      }
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("focus", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("focus", syncAuthState);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 900);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (backToTopHintTimeoutRef.current) {
        clearTimeout(backToTopHintTimeoutRef.current);
      }
    };
  }, []);

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
        page: String(nextPage),
        pageSize: String(pageSize),
      });

      if (region) {
        params.set("region", region);
      } else {
        params.set("country", country);
      }

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

  const handlePlansClick = () => {
    const isAuthenticated = hasLocalAuth();
    setIsLoggedIn(isAuthenticated);

    if (isAuthenticated) {
      setShowPlansPopup(false);
      router.push("/plans");
      return;
    }

    setShowPlansPopup(true);
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setShowBackToTopHint(true);

    if (backToTopHintTimeoutRef.current) {
      clearTimeout(backToTopHintTimeoutRef.current);
    }

    backToTopHintTimeoutRef.current = setTimeout(() => {
      setShowBackToTopHint(false);
      backToTopHintTimeoutRef.current = null;
    }, 1400);
  };

  const showBackToTopText =
    isBackToTopHovered || isBackToTopFocused || showBackToTopHint;

  const popupVariants = isMobile
    ? {
        initial: { opacity: 0, y: "100%" },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: "100%" },
      }
    : {
        initial: { opacity: 0, y: 20, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.96 },
      };

  if (!articles.length) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <section>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
            category={category}
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-2xl border border-[color:color-mix(in_srgb,var(--primary)_18%,white)] bg-[color:color-mix(in_srgb,var(--primary)_8%,white)] px-5 py-4 text-center shadow-sm dark:border-[color:color-mix(in_srgb,var(--primary)_24%,transparent)] dark:bg-[color:color-mix(in_srgb,var(--primary)_12%,#0f172a)]"
          >
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              You&apos;re all caught up. Explore other topics or view our{" "}
              <button
                type="button"
                onClick={() => void handlePlansClick()}
                className="font-semibold text-[var(--primary)] underline decoration-[color:color-mix(in_srgb,var(--primary)_45%,transparent)] underline-offset-4 transition-colors hover:text-[color:color-mix(in_srgb,var(--primary)_82%,black_10%)]"
              >
                Plans
              </button>{" "}
              for an enhanced experience.
            </p>
          </motion.div>
        )}

        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
      </div>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            onClick={handleBackToTop}
            onMouseEnter={() => setIsBackToTopHovered(true)}
            onMouseLeave={() => setIsBackToTopHovered(false)}
            onFocus={() => setIsBackToTopFocused(true)}
            onBlur={() => setIsBackToTopFocused(false)}
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="fixed bottom-5 right-3 z-30 inline-flex h-12 w-12 items-center justify-center overflow-visible rounded-full border border-white/50 bg-transparent text-slate-950 shadow-[0_12px_26px_-20px_rgba(15,23,42,0.18)] backdrop-blur-[22px] transition-colors hover:border-white/70 dark:border-white/30 dark:bg-transparent dark:text-white dark:shadow-[0_14px_30px_-22px_rgba(0,0,0,0.35)] dark:hover:border-white/42 sm:bottom-6 sm:right-5"
            aria-label="Back to top"
          >
            <span className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.025)_38%,rgba(255,255,255,0.005)_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.018)_38%,rgba(255,255,255,0.004)_100%)]" />
            <span className="absolute inset-[2px] rounded-full border border-white/22 bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,0.26)] dark:border-white/12 dark:bg-white/[0.015] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />
            <span className="absolute left-1/2 top-[6px] h-4 w-[50%] -translate-x-1/2 rounded-full bg-white/20 blur-[6px] dark:bg-white/10" />
            <span className="absolute bottom-[7px] left-1/2 h-5 w-[42%] -translate-x-1/2 rounded-full bg-black/[0.045] blur-[8px] dark:bg-black/[0.18]" />
            <span className="relative flex items-center justify-center">
              <ArrowDown className="h-4 w-4 rotate-180 text-black/85 drop-shadow-[0_1px_1px_rgba(255,255,255,0.45)] sm:h-5 sm:w-5 dark:text-white" />
              <AnimatePresence initial={false}>
                {showBackToTopText && (
                  <motion.span
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute bottom-full mb-2 whitespace-nowrap rounded-full border border-white/45 bg-white/85 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-black/85 shadow-sm backdrop-blur-md dark:border-white/20 dark:bg-slate-900/80 dark:text-white"
                  >
                    To Top
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlansPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setShowPlansPopup(false)}
          >
            <motion.div
              variants={popupVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="plans-popup-title"
            >
              <button
                type="button"
                onClick={() => setShowPlansPopup(false)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close popup"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-4 rounded-full bg-blue-50 p-4 dark:bg-blue-950/40">
                  <CreditCard
                    size={32}
                    className="text-blue-600 dark:text-blue-300"
                  />
                </div>
                <h3
                  id="plans-popup-title"
                  className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100"
                >
                  Register first to check plans
                </h3>
                <p className="mb-6 max-w-xs text-sm text-slate-600 dark:text-slate-300">
                  This functionality is only for registered members. Please log
                  in or register to check plans.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPlansPopup(false)}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Close
                  </button>
                  <Link
                    href="/auth/register"
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
