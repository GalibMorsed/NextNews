"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Compass,
  Globe2,
  Loader2,
  Lock,
  Search,
  Sparkles,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  CATEGORY_ICON_STYLES,
  type ExploreArticle,
  type ExploreResponse,
  type ExploreRegionId,
} from "@/lib/explore";
import { getNewsImageSrc } from "@/lib/newsImage";
import {
  getUserPersonalization,
  saveUserPersonalization,
} from "../services/personalizationService";
import RegionSelector, {
  type AIRegionSuggestion,
} from "./components/RegionSelector";
import ExploreLiveStoriesAndVoices from "./components/ExploreLiveStoriesAndVoices";
import StoryPromoPopup from "./components/StoryPromoPopup";
import CategoryCardStack from "./components/CategoryCardStack";

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
  index = 0,
}: {
  children?: ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className={`rounded-3xl border border-slate-200/80 bg-white/92 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.1)] transition-all duration-300 hover:shadow-[0_10px_25px_-5px_rgba(79,70,229,0.15),0_8px_10px_-6px_rgba(79,70,229,0.1)] dark:border-slate-700/80 dark:bg-slate-900/88 dark:shadow-[0_4px_20px_-2px_rgba(79,70,229,0.05)] dark:hover:shadow-[0_10px_25px_-5px_rgba(79,70,229,0.1)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
  iconBesideEyebrow = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  iconBesideEyebrow?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/50 p-5 shadow-sm transition-transform duration-300 sm:p-6 dark:border-slate-700 dark:from-slate-900 dark:via-indigo-950/20 dark:to-violet-950/20"
    >
      <div className={iconBesideEyebrow ? "" : "flex items-start justify-between gap-4"}>
        <div className={iconBesideEyebrow ? "" : "flex-1"}>
          {iconBesideEyebrow ? (
            <div className="mb-3 flex items-center justify-between gap-3">
              {eyebrow && (
                <span className="inline-flex whitespace-nowrap rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  {eyebrow}
                </span>
              )}
              {Icon ? (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[var(--primary)] shadow-sm ring-1 ring-slate-200/80 backdrop-blur-sm dark:bg-slate-800/80 dark:text-white dark:ring-slate-700/80">
                  <Icon className="h-5 w-5" />
                </div>
              ) : null}
            </div>
          ) : eyebrow ? (
            <span className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {eyebrow}
            </span>
          ) : null}
          <h2 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 sm:text-3xl dark:from-emerald-50 dark:via-indigo-100 dark:to-violet-200">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600 dark:text-slate-400 sm:text-base">
            {description}
          </p>
        </div>
        {!iconBesideEyebrow && Icon ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[var(--primary)] shadow-sm ring-1 ring-slate-200/80 backdrop-blur-sm dark:bg-slate-800/80 dark:text-white dark:ring-slate-700/80">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export default function ExplorePage() {
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRegion, setSelectedRegion] =
    useState<ExploreRegionId>("world");
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [showAllDesktopCategories, setShowAllDesktopCategories] = useState(false);
  const [exploreState, setExploreState] = useState<ExploreState>(EMPTY_STATE);
  const [followedSources, setFollowedSources] = useState<string[]>([]);
  const [favoriteTopics, setFavoriteTopics] = useState<string[]>([]);
  const [isSavingSources, setIsSavingSources] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [promoStoryIndex, setPromoStoryIndex] = useState<number | null>(null);
  const [showStoryPromo, setShowStoryPromo] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const promoRef = useRef<HTMLDivElement | null>(null);
  const [promoStyle, setPromoStyle] = useState<
    { left: number; top: number } | undefined
  >();
  const [promoPlacement, setPromoPlacement] = useState<"above" | "below">(
    "above",
  );
  const [promoArrowLeft, setPromoArrowLeft] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const regionParam = params.get("region") as ExploreRegionId;
      if (regionParam) {
        setSelectedRegion(regionParam);
      }
    }
  }, []);

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

        const params = new URLSearchParams(window.location.search);
        const hasUrlRegion = params.has("region");
        if (!hasUrlRegion && Array.isArray(data?.favorite_regions) && data.favorite_regions.length > 0) {
          setSelectedRegion(data.favorite_regions[0] as ExploreRegionId);
        }
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

  useEffect(() => {
    if (visibleTrendingTopics.length > 0) {
      const lastDismissed = localStorage.getItem("explore_promo_v3");
      const shouldShow =
        !lastDismissed ||
        Date.now() - parseInt(lastDismissed, 10) > 2 * 24 * 60 * 60 * 1000;

      setShowStoryPromo(shouldShow);

      if (shouldShow) {
        setPromoStoryIndex(
          Math.floor(Math.random() * visibleTrendingTopics.length),
        );
      }
    }
  }, [visibleTrendingTopics.length]);

  const dismissStoryPromo = () => {
    localStorage.setItem("explore_promo_v3", Date.now().toString());
    setShowStoryPromo(false);
  };

  useLayoutEffect(() => {
    if (!showStoryPromo) return undefined;

    const updatePromoPosition = () => {
      const anchor = anchorRef.current;
      const promo = promoRef.current;
      if (!anchor || !promo) return;

      const anchorRect = anchor.getBoundingClientRect();
      const promoRect = promo.getBoundingClientRect();
      const viewportPadding = 12;
      const spacing = 12;

      const prefersAbove = window.innerWidth >= 768;
      let placement: "above" | "below" = prefersAbove ? "above" : "below";

      let top =
        placement === "above"
          ? anchorRect.top - promoRect.height - spacing
          : anchorRect.bottom + spacing;

      if (placement === "above" && top < viewportPadding) {
        placement = "below";
        top = anchorRect.bottom + spacing;
      }

      if (
        placement === "below" &&
        top + promoRect.height > window.innerHeight - viewportPadding
      ) {
        placement = "above";
        top = anchorRect.top - promoRect.height - spacing;
      }

      const centeredLeft =
        anchorRect.left + anchorRect.width / 2 - promoRect.width / 2;
      const minLeft = viewportPadding;
      const maxLeft = window.innerWidth - promoRect.width - viewportPadding;
      const left = Math.min(Math.max(centeredLeft, minLeft), maxLeft);
      const anchorCenter = anchorRect.left + anchorRect.width / 2;
      const minArrowLeft = 28;
      const maxArrowLeft = promoRect.width - 28;
      const arrowLeft = Math.min(
        Math.max(anchorCenter - left, minArrowLeft),
        maxArrowLeft,
      );

      setPromoPlacement(placement);
      setPromoStyle({ left, top });
      setPromoArrowLeft(arrowLeft);
    };

    const raf = window.requestAnimationFrame(updatePromoPosition);
    window.addEventListener("resize", updatePromoPosition);
    window.addEventListener("scroll", updatePromoPosition, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePromoPosition);
      window.removeEventListener("scroll", updatePromoPosition, true);
    };
  }, [showStoryPromo, promoStoryIndex]);

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
    if (showStoryPromo) {
      dismissStoryPromo();
    }
    window.dispatchEvent(
      new CustomEvent("sidebar-search", { detail: { query: tag } }),
    );
  };

  const handleSearchPreferredRegion = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleAISuggestionSelect = (suggestion: AIRegionSuggestion) => {
    const nextRegion = suggestion.mappedRegionId || "world";
    const nextQuery = suggestion.query.trim();

    setSelectedRegion(nextRegion);
    setSearchInput(nextQuery);
    setAppliedQuery(nextQuery);
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
            <div className="space-y-4 sm:space-y-6">
              <div className="relative">
                <div className="pointer-events-none absolute left-8 top-0 -z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-500/15 to-violet-500/15 blur-[60px] filter dark:from-indigo-500/10 dark:to-violet-500/10" />
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/80 px-4 py-3.5 sm:px-6 sm:py-4 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                          Explore
                        </h1>
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          Live
                        </span>
                      </div>
                      <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                        Switch regions or search a topic. Everything updates live. 🧭 🗺️
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <RegionSelector
                  selectedRegion={selectedRegion}
                  onRegionSelect={setSelectedRegion}
                  onSearchPreferredRegion={handleSearchPreferredRegion}
                  onAISuggestionSelect={handleAISuggestionSelect}
                />
              </motion.div>

              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onSubmit={handleSearchSubmit}
                className="mx-auto w-full max-w-4xl px-2"
              >
                <div className="group relative rounded-lg border border-slate-200/80 bg-gradient-to-r from-white via-slate-50 to-slate-100/60 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-1 focus-within:border-indigo-500 dark:border-slate-700/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 dark:focus-within:ring-offset-slate-950">
                  <Search
                    className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)] transition group-focus-within:text-[var(--primary)]"
                    aria-hidden
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={`Search any topic in ${data?.regionLabel || "world"}...`}
                    className="w-full rounded-lg bg-transparent px-12 py-3 text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setAppliedQuery("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200/70 bg-white/90 p-1.5 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-800 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </motion.form>
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
                    icon={Globe2}
                    description={
                      data?.regionBrief ||
                      "Latest stories from this region, AI-curated for you."
                    }
                    iconBesideEyebrow
                  />

                  <div className="flex flex-col gap-6">
                    {heroArticle ? (
                      <PageSurface className="overflow-hidden shadow-md transition-transform duration-500 hover:-translate-y-1">
                        <div className="relative h-[24rem] sm:h-[28rem] lg:h-[32rem]">
                          <div className="absolute inset-x-6 top-6 z-10 h-20 rounded-full bg-cyan-200/30 blur-3xl dark:bg-cyan-500/10" />
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
                          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--primary)] uppercase tracking-wider">
                              <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                              {heroArticle.source.name}
                            </div>
                            <h3 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                              {heroArticle.title}
                            </h3>
                          </div>
                        </div>

                        <div className="grid gap-8 bg-gradient-to-br from-white via-slate-50 to-sky-50/60 p-8 sm:p-10 xl:grid-cols-[1fr_0.8fr] dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
                          <div className="space-y-6">
                            <p className="text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
                              {heroArticle.description ||
                                "A significant regional development requiring your attention. Read the full analysis or explore deeper search angles below."}
                            </p>

                            <div className="flex flex-nowrap gap-2 sm:gap-4">
                              <a
                                href={heroArticle.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 text-xs font-bold text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] active:translate-y-0 sm:h-12 sm:flex-none sm:gap-2 sm:px-6 sm:text-sm"
                              >
                                Open full story
                                <ArrowUpRight className="h-4 w-4 shrink-0" />
                              </a>
                              <a
                                href="#explore-categories"
                                className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:h-12 sm:flex-none sm:gap-2 sm:px-6 sm:text-sm"
                              >
                                Browse topics
                                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                              </a>
                            </div>
                          </div>

                          <div className="group perspective-[2000px]">
                            <div className="flex h-full flex-col rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 p-4 transition-transform duration-500 hover:rotate-x-[2deg] hover:rotate-y-[-5deg] sm:p-6 dark:from-indigo-950/20 dark:to-violet-950/20">
                              <div className="flex flex-nowrap items-center gap-2">
                                <Sparkles className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <p className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400 sm:text-[11px] sm:tracking-[0.2em]">
                                  AI Suggested Search Direction
                                </p>
                              </div>
                              <p className="mt-4 text-base font-medium leading-relaxed text-[var(--foreground)]">
                                {data?.heroSearchPrompt ||
                                  "How is this event affecting regional stability and what are the long-term economic implications?"}
                              </p>
                              <div className="mt-auto flex flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex -space-x-2">
                                  {[
                                    { src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces", alt: "Perspective contributor" },
                                    { src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=faces", alt: "Perspective contributor" },
                                    { src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=96&h=96&fit=crop&crop=faces", alt: "Perspective contributor" },
                                  ].map((avatar, i) => (
                                    <img
                                      key={i}
                                      src={avatar.src}
                                      alt={avatar.alt}
                                      loading="lazy"
                                      className="h-8 w-8 rounded-full border-2 border-white/70 object-cover shadow-sm dark:border-slate-800"
                                    />
                                  ))}
                                  <div className="flex h-8 items-center pl-4 text-xs font-bold text-[var(--muted)]">
                                    +12 related perspectives
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleHeroPromptSearch}
                                  className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] hover:-translate-y-0.5 active:translate-y-0"
                                >
                                  Search this angle
                                  <Search className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </PageSurface>
                    ) : null}

                    <div className="flex items-center justify-between px-1 text-xs font-semibold text-[var(--muted)] md:hidden">
                      <span>Top stories</span>
                      <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-300">
                        Swipe for more <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
                      {sideArticles.map((article, index) => (
                        <PageSurface
                          key={article.url}
                          index={index + 1}
                          className="group w-[86%] shrink-0 snap-center overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-[0_10px_30px_-18px_rgba(49,46,129,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:w-[70%] md:w-auto md:shrink md:snap-none dark:border-slate-700/80 dark:bg-slate-900"
                        >
                          <div className="flex flex-col h-full bg-[var(--card)]">
                            <div className="relative h-44 w-full overflow-hidden sm:h-52">
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
                    icon={Compass}
                    description="AI-curated stories by category, tailored to this region right now. "
                    iconBesideEyebrow
                  />

                  {/* Mobile screen view: modern swipeable card stack */}
                  <div className="block md:hidden">
                    <CategoryCardStack
                      categories={visibleCategories}
                      selectedRegion={selectedRegion}
                    />
                  </div>

                  {/* Desktop screen view: clean responsive grid */}
                  <div className="hidden md:grid md:grid-cols-2 md:gap-4 xl:grid-cols-3">
                    {visibleCategories
                      .slice(0, showAllDesktopCategories ? visibleCategories.length : 3)
                      .map((category, index) => {
                      const categoryStyle =
                        CATEGORY_ICON_STYLES[
                          index % CATEGORY_ICON_STYLES.length
                        ];
                      const CategoryIcon = categoryStyle.icon;

                      return (
                        <Link
                          key={category.slug}
                          href={`/categories/${category.slug}?region=${selectedRegion}`}
                          className="group block"
                        >
                          <PageSurface
                            index={index}
                            className="h-full overflow-hidden border-slate-200/80 shadow-[0_10px_30px_-18px_rgba(49,46,129,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-700/80 dark:hover:border-slate-600"
                          >
                            <div
                              className={`flex h-28 items-center justify-center border-b border-white/60 transition-transform duration-300 group-hover:scale-[1.02] dark:border-slate-800/80 ${categoryStyle.panelClassName}`}
                            >
                              <div
                                className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm ${categoryStyle.className}`}
                              >
                                <CategoryIcon className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="space-y-3 p-4">
                              <span
                                className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${categoryStyle.pillClassName}`}
                              >
                                {category.title}
                              </span>
                              <h3 className="text-[15px] font-semibold leading-6 text-[var(--foreground)] sm:text-base">
                                {category.description}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-[var(--muted)] sm:text-sm">
                                <span>AI Curated</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                <span>Open topic</span>
                              </div>
                              <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                Open category
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </div>
                            </div>
                          </PageSurface>
                        </Link>
                      );
                      })}
                  </div>
                  {visibleCategories.length > 3 ? (
                    <div className="hidden justify-center pt-2 md:flex">
                      <button
                        type="button"
                        onClick={() => setShowAllDesktopCategories((showAll) => !showAll)}
                        aria-expanded={showAllDesktopCategories}
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md dark:border-indigo-900/70 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                      >
                        {showAllDesktopCategories ? "Show fewer categories" : "Show all categories"}
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAllDesktopCategories ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  ) : null}
                </section>

                <ExploreLiveStoriesAndVoices
                  PageSurface={PageSurface}
                  regionLabel={data?.regionLabel}
                  trendingTopics={visibleTrendingTopics}
                  sources={visibleSources}
                  promoStoryIndex={promoStoryIndex}
                  anchorRef={anchorRef}
                  onTopicClick={handleTopicClick}
                  onToggleSource={(sourceName) =>
                    void handleToggleSource(sourceName)
                  }
                  isSavingSource={isSavingSources}
                  followSet={followSet}
                />
              </>
            )}
          </>
        )}
      </div>

      <StoryPromoPopup
        isOpen={showStoryPromo && promoStoryIndex !== null}
        popupRef={promoRef}
        style={promoStyle}
        placement={promoPlacement}
        arrowLeft={promoArrowLeft}
        onDismiss={dismissStoryPromo}
      />
    </main>
  );
}
