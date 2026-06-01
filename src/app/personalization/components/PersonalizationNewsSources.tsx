"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Loader2,
  X,
  Globe,
  Languages,
  ExternalLink,
} from "lucide-react";
import SourceLogo from "../../components/sourceLogo";
import { getSourceLogoSrc } from "@/lib/newsImage";

export const PERSONALIZATION_DEFAULT_SOURCE_SELECTION = [
  "NewsAPI Top Headlines",
];
export const PERSONALIZATION_MAX_SOURCES = 5;

type NewsSourceOption = {
  id: string;
  name: string;
  url: string | null;
  description?: string | null;
  category?: string | null;
  language?: string | null;
  country?: string | null;
};

interface PersonalizationNewsSourcesProps {
  favoriteSources: string[];
  onFavoriteSourcesChange: (sources: string[]) => void;
}

const DEFAULT_AVAILABLE_SOURCES: NewsSourceOption[] = [
  {
    id: "newsapi-top-headlines",
    name: "NewsAPI Top Headlines",
    url: "https://newsapi.org",
  },
];

const INITIAL_VISIBLE_SOURCES = 6;

type NewsSourceDetails = {
  description: string;
  country?: string | null;
  languages: string[];
  categories: string[];
  website?: string | null;
};

function formatLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).replace(/-/g, " ");
}

function getSourceDetails(source: NewsSourceOption): NewsSourceDetails | null {
  const description =
    typeof source.description === "string" ? source.description.trim() : "";
  const language =
    typeof source.language === "string" ? source.language.trim() : "";
  const category =
    typeof source.category === "string" ? source.category.trim() : "";
  const country =
    typeof source.country === "string" ? source.country.trim() : "";

  if (!description && !language && !category && !country) return null;

  const languages = language ? [language.toUpperCase()] : [];
  const categories = category ? [formatLabel(category)] : [];

  return {
    description,
    country: country ? country.toUpperCase() : null,
    languages,
    categories,
    website: source.url || null,
  };
}

const detailsDesktopPopupVariants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.97 },
};

const detailsMobilePopupVariants = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
};

function toggleValue(current: string[], value: string): string[] {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  return [...current, value];
}

export default function PersonalizationNewsSources({
  favoriteSources,
  onFavoriteSourcesChange,
}: PersonalizationNewsSourcesProps) {
  const [newsSourceOptions, setNewsSourceOptions] = useState<
    NewsSourceOption[]
  >(DEFAULT_AVAILABLE_SOURCES);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [sourceSearch, setSourceSearch] = useState("");
  const [showAllSources, setShowAllSources] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedDetailsSource, setSelectedDetailsSource] =
    useState<NewsSourceOption | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setActivePageIndex(0);
    if (mobileContainerRef.current) {
      mobileContainerRef.current.scrollLeft = 0;
    }
  }, [sourceSearch]);

  useEffect(() => {
    let mounted = true;

    const loadSources = async () => {
      try {
        const response = await fetch("/api/personalization/sources");
        if (!response.ok) return;

        const data = await response.json();
        const sources = Array.isArray(data?.sources)
          ? data.sources
              .map((source: Partial<NewsSourceOption>) => ({
                id: typeof source.id === "string" ? source.id : "",
                name: typeof source.name === "string" ? source.name.trim() : "",
                url: typeof source.url === "string" ? source.url : null,
                description:
                  typeof source.description === "string"
                    ? source.description.trim()
                    : null,
                category:
                  typeof source.category === "string"
                    ? source.category.trim()
                    : null,
                language:
                  typeof source.language === "string"
                    ? source.language.trim()
                    : null,
                country:
                  typeof source.country === "string"
                    ? source.country.trim()
                    : null,
              }))
              .filter((source: NewsSourceOption) => source.name)
          : [];

        if (mounted && sources.length > 0) {
          setNewsSourceOptions(sources);
        }
      } catch (sourceError) {
        console.warn("News sources could not be loaded.", sourceError);
      } finally {
        if (mounted) setIsLoadingSources(false);
      }
    };

    void loadSources();

    return () => {
      mounted = false;
    };
  }, []);

  const availableSources = useMemo(() => {
    const byName = new Map<string, NewsSourceOption>();

    for (const source of newsSourceOptions) {
      byName.set(source.name.toLowerCase(), source);
    }

    for (const source of favoriteSources) {
      const name = source.trim();
      if (!name || byName.has(name.toLowerCase())) continue;
      byName.set(name.toLowerCase(), {
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        url: null,
      });
    }

    return Array.from(byName.values());
  }, [favoriteSources, newsSourceOptions]);

  const filteredSources = useMemo(() => {
    const query = sourceSearch.trim().toLowerCase();
    if (!query) return availableSources;

    return availableSources.filter((source) =>
      source.name.toLowerCase().includes(query),
    );
  }, [availableSources, sourceSearch]);

  const mobilePages = useMemo(() => {
    const pagesList: NewsSourceOption[][] = [];
    const itemsPerPage = 6;
    for (let i = 0; i < filteredSources.length; i += itemsPerPage) {
      pagesList.push(filteredSources.slice(i, i + itemsPerPage));
    }
    return pagesList;
  }, [filteredSources]);

  const handleMobileScroll = () => {
    if (!mobileContainerRef.current) return;
    const { scrollLeft, clientWidth } = mobileContainerRef.current;
    if (clientWidth > 0) {
      const newIndex = Math.round(scrollLeft / clientWidth);
      if (newIndex !== activePageIndex) {
        setActivePageIndex(newIndex);
      }
    }
  };

  const scrollToMobilePage = (index: number) => {
    if (!mobileContainerRef.current) return;
    const { clientWidth } = mobileContainerRef.current;
    mobileContainerRef.current.scrollTo({
      left: index * clientWidth,
      behavior: "smooth",
    });
    setActivePageIndex(index);
  };

  const visibleSources = useMemo(() => {
    if (sourceSearch.trim()) return filteredSources;
    if (showAllSources) return filteredSources;
    return filteredSources.slice(0, INITIAL_VISIBLE_SOURCES);
  }, [filteredSources, showAllSources, sourceSearch]);

  const shouldShowMoreSourcesButton =
    !sourceSearch.trim() &&
    !showAllSources &&
    filteredSources.length > INITIAL_VISIBLE_SOURCES;

  const selectedDetails = useMemo(
    () =>
      selectedDetailsSource ? getSourceDetails(selectedDetailsSource) : null,
    [selectedDetailsSource],
  );

  const handleSourceToggle = (source: string) => {
    const isSelected = favoriteSources.includes(source);

    if (!isSelected && favoriteSources.length >= PERSONALIZATION_MAX_SOURCES) {
      return;
    }

    onFavoriteSourcesChange(toggleValue(favoriteSources, source));
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          News Sources
        </h2>
        <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
          Select up to {PERSONALIZATION_MAX_SOURCES} news sources
        </p>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:px-2.5 sm:text-xs">
          {favoriteSources.length}/{PERSONALIZATION_MAX_SOURCES}
        </span>
      </div>

      <div className="relative mb-5 w-[80%] mx-auto">
        <input
          type="text"
          placeholder="Search any channels..."
          value={sourceSearch}
          onChange={(event) => setSourceSearch(event.target.value)}
          className="w-full rounded-[18px] border border-slate-200 bg-white/95 px-5 py-3 pr-12 text-sm text-slate-900 transition focus:border-[var(--primary)] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {sourceSearch.trim().length > 0 && (
          <button
            type="button"
            onClick={() => setSourceSearch("")}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Clear source search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isMobile ? (
        <div className="mt-6 flex flex-col">
          <div
            ref={mobileContainerRef}
            onScroll={handleMobileScroll}
            className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none gap-4 pb-2"
          >
            {mobilePages.length > 0 ? (
              mobilePages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  className="grid w-full shrink-0 snap-center grid-cols-2 gap-2"
                >
                  {page.map((source) => {
                    const isSelected = favoriteSources.includes(source.name);
                    const logoSrc = getSourceLogoSrc(source.url);

                    return (
                      <motion.label
                        key={source.id || source.name}
                        whileHover={{ y: -1.5, scale: 1.018 }}
                        whileTap={{ scale: 0.982 }}
                        className={`group relative flex cursor-pointer items-center justify-between gap-2 rounded-[18px] border transition-all duration-300 px-3.5 py-3 shadow-sm hover:shadow-sm ${
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary)]/[0.06] dark:bg-[var(--primary)]/[0.12] ring-1 ring-[var(--primary)]/20"
                            : "border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSourceToggle(source.name)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <SourceLogo
                              src={logoSrc}
                              alt={`${source.name} logo`}
                              fallbackLabel={source.name}
                              sizeClassName="h-9 w-9"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setSelectedDetailsSource(source);
                              }}
                              className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:scale-110 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-455 dark:hover:bg-slate-850 dark:hover:text-slate-200"
                              title="View details"
                            >
                              <span className="text-[10px] font-bold leading-none select-none">
                                i
                              </span>
                            </button>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100 transition-colors group-hover:text-slate-900 dark:group-hover:text-white leading-tight line-clamp-2 flex-1 min-w-0">
                            {source.name}
                          </span>
                        </div>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                            isSelected
                              ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-[0_0_8px_rgba(99,102,241,0.22)]"
                              : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 group-hover:border-[var(--primary)]/50"
                          }`}
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, rotate: -35, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                exit={{ scale: 0, rotate: -35, opacity: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 450,
                                  damping: 20,
                                }}
                              >
                                <Check
                                  size={13}
                                  strokeWidth={4}
                                  className="text-white"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.label>
                    );
                  })}
                </div>
              ))
            ) : (
              <p className="w-full text-center text-sm text-slate-500 dark:text-slate-400 py-4">
                No news channels match your search.
              </p>
            )}
          </div>

          {/* Animated Carousel Indicators (Image 2 style) */}
          {mobilePages.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {mobilePages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => scrollToMobilePage(index)}
                  className={`h-2 rounded-full transition-all duration-300 ease-out ${
                    index === activePageIndex
                      ? "w-8 bg-[var(--primary)] shadow-[0_0_6px_rgba(99,102,241,0.34)]"
                      : "w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-350 dark:hover:bg-slate-600"
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleSources.map((source) => {
            const isSelected = favoriteSources.includes(source.name);
            const logoSrc = getSourceLogoSrc(source.url);

            return (
              <motion.label
                key={source.id || source.name}
                whileHover={{ y: -1.5, scale: 1.018 }}
                whileTap={{ scale: 0.982 }}
                className={`group relative flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-sm sm:gap-4 sm:p-5 ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]/[0.06] ring-1 ring-[var(--primary)]/20 dark:bg-[var(--primary)]/[0.12]"
                    : "border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSourceToggle(source.name)}
                  className="sr-only"
                />
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <SourceLogo
                      src={logoSrc}
                      alt={`${source.name} logo`}
                      fallbackLabel={source.name}
                      sizeClassName="h-9 w-9"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setSelectedDetailsSource(source);
                      }}
                      className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:scale-110 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-455 dark:hover:bg-slate-850 dark:hover:text-slate-200"
                      title="View details"
                    >
                      <span className="text-[10px] font-bold leading-none select-none">
                        i
                      </span>
                    </button>
                  </div>
                  <span className="min-w-0 flex-1 line-clamp-2 text-sm font-semibold tracking-tight text-slate-800 transition-colors group-hover:text-slate-900 dark:text-slate-100 dark:group-hover:text-white leading-tight">
                    {source.name}
                  </span>
                </div>

                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                    isSelected
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-[0_0_8px_rgba(99,102,241,0.22)]"
                      : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 group-hover:border-[var(--primary)]/50"
                  }`}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -35, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, rotate: -35, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 20,
                        }}
                      >
                        <Check
                          size={13}
                          strokeWidth={4}
                          className="text-white"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.label>
            );
          })}
        </div>
      )}

      {!isMobile && sourceSearch.trim() && filteredSources.length === 0 ? (
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          No news channels match your search.
        </p>
      ) : null}
      {shouldShowMoreSourcesButton && !showAllSources && !isMobile && (
        <div className="mt-5 flex justify-center">
          <motion.button
            type="button"
            onClick={() => setShowAllSources(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-[18px] border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Show More Options
          </motion.button>
        </div>
      )}

      {isLoadingSources ? (
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading source channels
        </div>
      ) : null}

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedDetailsSource && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24 }}
                className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
                onClick={() => setSelectedDetailsSource(null)}
              >
                <motion.div
                  variants={
                    isMobile
                      ? detailsMobilePopupVariants
                      : detailsDesktopPopupVariants
                  }
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.38 }}
                  className="relative w-full sm:max-w-md rounded-t-[20px] sm:rounded-[12px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl flex flex-col focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Drag handle for mobile */}
                  <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-4 block sm:hidden" />

                  {/* Close icon */}
                  <button
                    type="button"
                    onClick={() => setSelectedDetailsSource(null)}
                    className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-105 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Close details"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Header with Logo */}
                  <div className="flex flex-col items-center text-center mt-2">
                    <div className="h-16 w-16 rounded-[12px] flex items-center justify-center border border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2 shrink-0 shadow-sm mb-3">
                      <SourceLogo
                        src={getSourceLogoSrc(selectedDetailsSource.url)}
                        alt={`${selectedDetailsSource.name} logo`}
                        fallbackLabel={selectedDetailsSource.name}
                        sizeClassName="h-11 w-11"
                      />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight px-4">
                      {selectedDetailsSource.name}
                    </h3>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Details provided by NewsAPI
                    </p>
                  </div>

                  {/* Metadata Badges */}
                  {selectedDetails ? (
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {selectedDetails.country ? (
                        <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                          <Globe className="h-3.5 w-3.5" />
                          {selectedDetails.country}
                        </span>
                      ) : null}
                      {selectedDetails.languages.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100/50 dark:border-amber-900/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          <Languages className="h-3.5 w-3.5" />
                          {selectedDetails.languages.join(", ")}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 text-center mt-4.5 px-1 font-medium">
                    {selectedDetails?.description ||
                      "Details are not available from NewsAPI for this source yet."}
                  </p>

                  {/* Core categories */}
                  {selectedDetails?.categories.length ? (
                    <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 text-center sm:text-left">
                        Core News Coverage
                      </p>
                      <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                        {selectedDetails.categories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center rounded-[8px] bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Footer Actions */}
                  <div className="mt-6 flex flex-row gap-3">
                    {selectedDetails?.website && (
                      <a
                        href={selectedDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-350 dark:hover:border-slate-750 shadow-sm whitespace-nowrap"
                      >
                        Visit Website
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      </a>
                    )}
                    {!selectedDetails && (
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(
                          selectedDetailsSource.name,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-350 dark:hover:border-slate-750 shadow-sm whitespace-nowrap"
                      >
                        Google Search
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedDetailsSource(null)}
                      className="flex-1 rounded-[10px] bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 text-white shadow-md shadow-sky-600/10 dark:shadow-sky-500/10 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition whitespace-nowrap"
                    >
                      Got It
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
