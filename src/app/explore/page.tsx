"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Globe2,
  Loader2,
  Lock,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  EXPLORE_REGIONS,
  type ExploreArticle,
  type ExploreResponse,
  type ExploreRegionId,
} from "@/lib/explore";
import { getNewsImageSrc } from "@/lib/newsImage";
import {
  getUserPersonalization,
  saveUserPersonalization,
} from "../services/personalizationService";
import RegionSelector from "../components/RegionSelector";

type ExploreState = {
  data: ExploreResponse | null;
  loading: boolean;
  error: string | null;
};

const EMPTY_STATE: ExploreState = {
  data: null,
  loading: true,
  error: null,
};

function formatRelativeTime(timestamp: string) {
  const value = Date.parse(timestamp);
  if (Number.isNaN(value)) return "Recently";

  const diffMs = Date.now() - value;
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function StoryImage({
  article,
  className,
}: {
  article: ExploreArticle;
  className?: string;
}) {
  return (
    <img
      src={getNewsImageSrc(article.urlToImage)}
      alt={article.title}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = "/news1.jpg";
      }}
      className={className}
    />
  );
}

function PageSurface({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/80 bg-white/92 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/88 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-6">
      <div>
        {eyebrow && (
          <span className="mb-3 inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<ExploreRegionId>("world");
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [exploreState, setExploreState] = useState<ExploreState>(EMPTY_STATE);
  const [followedSources, setFollowedSources] = useState<string[]>([]);
  const [favoriteTopics, setFavoriteTopics] = useState<string[]>([]);
  const [isSavingSources, setIsSavingSources] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncAuthState = () => {
      const authToken = localStorage.getItem("auth_token")?.trim();
      const authEmail = localStorage.getItem("auth_email")?.trim();
      setIsAuthenticated(Boolean(authToken || authEmail));
      setIsAuthResolved(true);
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
    if (!isAuthenticated) {
      setExploreState({ data: null, loading: false, error: null });
      setFollowedSources([]);
      setFavoriteTopics([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;

    const loadPersonalization = async () => {
      try {
        const { data } = await getUserPersonalization();
        if (ignore) return;
        setFollowedSources(
          Array.isArray(data?.favorite_sources) ? data.favorite_sources : [],
        );
        setFavoriteTopics(
          Array.isArray(data?.favorite_topics) ? data.favorite_topics : [],
        );
      } catch {
        if (ignore) return;
        setFollowedSources([]);
        setFavoriteTopics([]);
      }
    };

    void loadPersonalization();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;

    const fetchExplore = async () => {
      setExploreState((current) => ({
        data: current.data,
        loading: true,
        error: null,
      }));

      try {
        const params = new URLSearchParams({ region: selectedRegion });
        if (appliedQuery.trim()) params.set("q", appliedQuery.trim());

        const response = await fetch(`/api/explore?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ExploreResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Could not load explore feed.");
        }

        if (ignore) return;
        setExploreState({ data: payload, loading: false, error: null });
      } catch (error) {
        if (ignore) return;
        setExploreState({
          data: null,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not load explore feed.",
        });
      }
    };

    void fetchExplore();
    return () => {
      ignore = true;
    };
  }, [appliedQuery, isAuthenticated, selectedRegion]);

  const data = exploreState.data;
  const heroArticle = data?.heroArticle ?? null;
  const sideArticles = data?.sideArticles ?? [];
  const visibleCategories = data?.moreStoryCategories ?? [];
  const visibleTrendingTopics = data?.trendingTopics ?? [];
  const visibleSources = data?.sourceSuggestions ?? [];

  const followSet = useMemo(() => new Set(followedSources), [followedSources]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedQuery(searchInput.trim());
  };

  const handleHeroPromptSearch = () => {
    const prompt = data?.heroSearchPrompt?.trim();
    if (!prompt) return;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(prompt)}`;
    window.open(googleUrl, "_blank", "noopener,noreferrer");
  };

  const handleToggleSource = async (sourceName: string) => {
    const nextSources = followSet.has(sourceName)
      ? followedSources.filter((item) => item !== sourceName)
      : [...followedSources, sourceName];

    setFollowedSources(nextSources);
    setIsSavingSources(sourceName);

    try {
      await saveUserPersonalization({
        favoriteSources: nextSources,
        favoriteTopics,
      });
    } catch {
      setFollowedSources(followedSources);
    } finally {
      setIsSavingSources(null);
    }
  };

  const handleTopicClick = (tag: string) => {
    setSearchInput(tag);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {!isAuthResolved ? (
          <PageSurface className="p-8">
            <div className="flex items-center gap-3 text-[var(--muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-sm font-medium">Checking your session...</p>
            </div>
          </PageSurface>
        ) : !isAuthenticated ? (
          <PageSurface className="overflow-hidden">
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
                Explore opens after sign in
              </h1>
              <p className="mt-3 text-base leading-7 text-[var(--muted)]">
                This area uses saved session data and personalization, so we
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
          </PageSurface>
        ) : (
          <>
            <div className="space-y-6">
              <PageSurface className="overflow-hidden">
                <div className="px-6 py-8 sm:px-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-3xl">
                      <span className="mb-3 inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        Live Explore
                      </span>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                        Explore
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                        Switch regions or search a live topic. Stories,
                        category paths, trends, and suggested sources all
                        update around what is happening now.🧭🗺️
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left sm:text-right dark:border-slate-700/80 dark:bg-slate-800/70">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Viewing
                      </p>
                      <p className="font-medium text-slate-700 dark:text-slate-200">
                        {data?.regionLabel || "Live feed"}
                      </p>
                    </div>
                  </div>
                </div>
              </PageSurface>

              <RegionSelector
                selectedRegion={selectedRegion}
                onRegionSelect={setSelectedRegion}
              />

              <form
                onSubmit={handleSearchSubmit}
                className="mx-auto w-full max-w-4xl px-2"
              >
                <div className="group relative rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[var(--primary)]/10 dark:border-slate-700 dark:bg-slate-900">
                  <Search
                    className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)] transition-colors group-focus-within:text-[var(--primary)]"
                    aria-hidden
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={`Search any topic in ${data?.regionLabel}...`}
                    className="w-full bg-transparent py-5 pl-14 pr-32 text-base text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                  />
                  <button
                    type="submit"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {exploreState.loading ? (
              <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
                <PageSurface className="h-[30rem] animate-pulse bg-slate-100/80 dark:bg-slate-800/70" />
                <div className="grid gap-4">
                  <PageSurface className="h-[14.5rem] animate-pulse bg-slate-100/80 dark:bg-slate-800/70" />
                  <PageSurface className="h-[14.5rem] animate-pulse bg-slate-100/80 dark:bg-slate-800/70" />
                </div>
              </div>
            ) : exploreState.error ? (
              <PageSurface className="p-8">
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-300">
                  <TrendingUp className="h-5 w-5" />
                  <p className="text-sm font-medium">{exploreState.error}</p>
                </div>
              </PageSurface>
            ) : (
              <>
                <section className="space-y-4">
                  <SectionHeading
                    eyebrow="Regional Brief"
                    title={`${data?.regionLabel} Now`}
                    description={
                      data?.regionBrief ||
                      "Explore the latest developments and breaking stories from this region, curated by our AI based on your preferences."
                    }
                  />

                  <div className="flex flex-col gap-6">
                    {heroArticle ? (
                      <PageSurface className="overflow-hidden shadow-md">
                        <div className="relative h-[24rem] sm:h-[28rem] lg:h-[32rem]">
                          <StoryImage
                            article={heroArticle}
                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                          <div className="absolute left-6 right-6 top-6 flex items-center justify-between gap-4">
                            <span className="backdrop-blur-md rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white ring-1 ring-white/30">
                              {data?.regionLabel}
                            </span>
                            <span className="backdrop-blur-md rounded-full bg-black/40 px-4 py-1.5 text-xs font-bold text-white ring-1 ring-white/10">
                              {formatRelativeTime(heroArticle.publishedAt)}
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10">
                            <div className="flex items-center gap-2 text-sm font-bold text-[var(--primary)] uppercase tracking-wider">
                              <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                              {heroArticle.source.name}
                            </div>
                            <h3 className="mt-3 text-3xl font-bold leading-[1.1] text-white sm:text-4xl lg:text-5xl">
                              {heroArticle.title}
                            </h3>
                          </div>
                        </div>

                        <div className="grid gap-8 p-8 sm:p-10 xl:grid-cols-[1fr_0.8fr]">
                          <div className="space-y-6">
                            <p className="text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
                              {heroArticle.description ||
                                "A significant regional development requiring your attention. Read the full analysis or explore deeper search angles below."}
                            </p>

                            <div className="flex flex-wrap gap-4">
                              <a
                                href={heroArticle.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 text-base font-bold text-[var(--foreground)] transition-all hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                              >
                                Open full story
                                <ArrowUpRight className="h-5 w-5" />
                              </a>
                              <a
                                href="#explore-categories"
                                className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-[var(--primary)]/[0.08] px-8 text-base font-bold text-[var(--primary)] transition-all hover:bg-[var(--primary)]/[0.14] hover:-translate-y-0.5 active:translate-y-0 dark:bg-[var(--primary)]/[0.14] dark:hover:bg-[var(--primary)]/[0.2]"
                              >
                                Browse topics
                                <ArrowRight className="h-5 w-5" />
                              </a>
                            </div>
                          </div>

                          <div className="flex flex-col rounded-3xl border border-[var(--primary)]/20 bg-[var(--primary)]/[0.03] p-6 dark:bg-[var(--primary)]/[0.05]">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                                AI Suggested Search Direction
                              </p>
                            </div>
                            <p className="mt-4 text-base font-medium leading-relaxed text-[var(--foreground)]">
                              {data?.heroSearchPrompt ||
                                "How is this event affecting regional stability and what are the long-term economic implications?"}
                            </p>
                            <div className="mt-auto flex flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex -space-x-2">
                                {[1, 2, 3].map((i) => (
                                  <div
                                    key={i}
                                    className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 dark:border-slate-900"
                                  />
                                ))}
                                <div className="flex h-8 items-center pl-4 text-xs font-bold text-[var(--muted)]">
                                  +12 related perspectives
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleHeroPromptSearch}
                                className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-md shadow-[var(--primary)]/20 transition-all hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
                              >
                                Search this angle
                                <Search className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </PageSurface>
                    ) : null}

                    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                      {sideArticles.map((article) => (
                        <PageSurface
                          key={article.url}
                          className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                        >
                          <div className="flex flex-col h-full bg-[var(--card)]">
                            <div className="relative h-52 w-full overflow-hidden">
                              <StoryImage
                                article={article}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                              <div className="absolute bottom-3 left-4">
                                <span className="rounded-lg bg-[var(--primary)]/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                                  {article.source.name}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col flex-1 p-5">
                              <h3 className="text-lg font-bold leading-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                                {article.title}
                              </h3>
                              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">
                                {article.description ||
                                  "Stay updated with this developing story providing more context to the current global landscape."}
                              </p>
                              <div className="mt-auto pt-5">
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:gap-3 transition-all"
                                >
                                  Read story
                                  <ArrowRight className="h-4 w-4" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </PageSurface>
                      ))}
                    </div>
                  </div>
                </section>

                <section id="explore-categories" className="space-y-4">
                  <SectionHeading
                    eyebrow="Category Highlights"
                    title={`More stories from ${data?.regionLabel}`}
                    description="Explore more stories organized into categories, curated by our AI to help you dive deeper into the topics that matter most in this region right now."
                  />

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleCategories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/categories/${category.slug}`}
                      >
                        <PageSurface className="h-full p-6 transition hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)] dark:bg-[color:color-mix(in_srgb,var(--primary)_20%,transparent)]">
                            <Compass className="h-5 w-5" />
                          </div>
                          <h3 className="mt-5 text-2xl font-semibold text-[var(--foreground)]">
                            {category.title}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                            {category.description}
                          </p>
                          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                            Open category
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </PageSurface>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[0.9fr_1.4fr]">
                  <PageSurface className="p-6 sm:p-7">
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm shadow-rose-100/50 dark:bg-rose-950/50 dark:text-rose-200">
                          <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                            Live Stories
                          </h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-rose-700 dark:border-rose-950/40 dark:bg-rose-950/40 dark:text-rose-200">
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                          Trending in {data?.regionLabel}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {visibleTrendingTopics.map((topic, index) => (
                        <button
                          key={`${topic.tag}-${index}`}
                          onClick={() => handleTopicClick(topic.tag)}
                          className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 transition-all hover:bg-white hover:shadow-md hover:border-[var(--primary)]/30 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                                {topic.tag}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                {topic.reason}
                              </p>
                            </div>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200 group-hover:scale-110 transition-transform">
                              <ArrowUpRight className="h-4 w-4" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </PageSurface>

                  <PageSurface className="p-6 sm:p-7">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                          Suggested Voices
                        </h2>
                        <div className="mt-4 h-1.5 w-16 rounded-full bg-[var(--primary)]" />
                      </div>
                      <div className="inline-flex max-w-fit rounded-full border border-slate-200/60 bg-slate-50/80 px-4 py-1.5 text-xs font-bold text-[var(--muted)] shadow-sm dark:border-slate-700/60 dark:bg-slate-800/70">
                        Follow Best sources form {data?.regionLabel}.
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      {visibleSources.map((source, index) => {
                        const isFollowing = followSet.has(source.name);
                        const isSaving = isSavingSources === source.name;

                        return (
                          <div
                            key={`${source.name}-${source.regionHint}-${index}`}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600"
                          >
                            <div className="flex flex-1 items-center gap-4 min-w-0">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--primary)_10%,white)] text-sm font-bold text-[var(--primary)] shadow-inner dark:bg-[color:color-mix(in_srgb,var(--primary)_20%,transparent)]">
                                {source.name.slice(0, 2).toUpperCase()}
                              </div>

                              <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 min-w-0">
                                <div className="min-w-[140px]">
                                  <p className="truncate text-base font-bold text-[var(--foreground)]">
                                    {source.name}
                                  </p>
                                  <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
                                    {source.regionHint}
                                  </p>
                                </div>

                                <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-800" />

                                <p className="flex-1 text-sm leading-relaxed text-[var(--muted)] line-clamp-1">
                                  {source.reason}
                                </p>
                              </div>
                            </div>

                            <div className="flex sm:block justify-end pt-2 sm:pt-0">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleToggleSource(source.name)
                                }
                                disabled={isSaving}
                                className={`inline-flex min-w-[120px] shrink-0 items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${isFollowing
                                  ? "border-[var(--primary)]/30 bg-[var(--primary)]/5 text-[var(--primary)] hover:bg-[var(--primary)]/10"
                                  : "border-slate-200 bg-slate-50 text-[var(--foreground)] hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                                  }`}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isFollowing ? (
                                  "Following"
                                ) : (
                                  "Follow"
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </PageSurface>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
