"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowRight, Check, Loader2, Save, Trash2, X } from "lucide-react";
import {
  AVAILABLE_PERSONALIZATION_TOPICS,
  DEFAULT_PERSONALIZATION_TOPICS,
  MAX_PERSONALIZATION_TOPICS,
  getPersonalizationTopicMetadata,
  sanitizePersonalizationTopic,
} from "@/lib/personalizationTopics";
import {
  broadcastPersonalizationUpdated,
  discardUserPersonalization,
  getUserPersonalization,
  saveUserPersonalization,
} from "../services/personalizationService";
import PersonalizationAiSuggestions from "./components/personalizationAiSuggestions";
import PersonalizationRegionSelector from "./components/PersonalizationRegionSelector";
import PersonalizationNewsSources, {
  PERSONALIZATION_DEFAULT_SOURCE_SELECTION,
  PERSONALIZATION_MAX_SOURCES,
} from "./components/PersonalizationNewsSources";
import StatusPopup from "../components/statusPopup";
import PersonalizationPromoAd, {
  PERSONALIZATION_PROMO_DISMISS_KEY,
} from "./components/personalizatioPopup";
import LottiePlayer from "@/app/components/LottiePlayer";

type PopupMessage = {
  tone: "success" | "error" | "info";
  text: string;
} | null;

type SuggestedTopicToast = {
  text: string;
  tone: "success" | "warning";
} | null;

const AVAILABLE_TOPICS = [...AVAILABLE_PERSONALIZATION_TOPICS];
const MAX_TOPICS = MAX_PERSONALIZATION_TOPICS;
const INITIAL_VISIBLE_TOPICS = 12;
const DEFAULT_TOPIC_SELECTION = [...DEFAULT_PERSONALIZATION_TOPICS];
const getTopicMetadata = getPersonalizationTopicMetadata;

function toggleValue(current: string[], value: string): string[] {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  return [...current, value];
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function PersonalizationPage() {
  const [favoriteSources, setFavoriteSources] = useState<string[]>(
    PERSONALIZATION_DEFAULT_SOURCE_SELECTION,
  );
  const [favoriteTopics, setFavoriteTopics] = useState<string[]>([]);
  const [favoriteRegions, setFavoriteRegions] = useState<string[]>([]);
  const [topicSearch, setTopicSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [popupMessage, setPopupMessage] = useState<PopupMessage>(null);
  const [suggestedTopicToast, setSuggestedTopicToast] =
    useState<SuggestedTopicToast>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [promoResetKey, setPromoResetKey] = useState(0);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActivePageIndex(0);
    if (mobileContainerRef.current) {
      mobileContainerRef.current.scrollLeft = 0;
    }
  }, [topicSearch]);

  const hasSelection = useMemo(
    () =>
      favoriteSources.length > 0 ||
      favoriteTopics.length > 0 ||
      favoriteRegions.length > 0,
    [favoriteSources.length, favoriteTopics.length, favoriteRegions.length],
  );

  const filteredTopics = useMemo(
    () =>
      AVAILABLE_TOPICS.filter((t) =>
        t.toLowerCase().includes(topicSearch.toLowerCase()),
      ),
    [topicSearch],
  );
  const mobilePages = useMemo(() => {
    const pagesList: string[][] = [];
    const itemsPerPage = 6;
    for (let i = 0; i < filteredTopics.length; i += itemsPerPage) {
      pagesList.push(filteredTopics.slice(i, i + itemsPerPage));
    }
    return pagesList;
  }, [filteredTopics]);

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

  const visibleTopics = useMemo(() => {
    if (topicSearch.trim()) return filteredTopics;
    if (showAllTopics) return filteredTopics;
    return filteredTopics.slice(0, INITIAL_VISIBLE_TOPICS);
  }, [filteredTopics, showAllTopics, topicSearch]);

  const shouldShowMoreTopicsButton =
    !topicSearch.trim() &&
    !showAllTopics &&
    filteredTopics.length > INITIAL_VISIBLE_TOPICS;

  const desktopPopupVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 20, scale: 0.95 },
  };

  const mobilePopupVariants = {
    initial: { opacity: 0, y: "100%" },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: "100%" },
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const { data, error: fetchError } = await getUserPersonalization();
        if (fetchError) {
          if (mounted) {
            setPopupMessage({
              tone: "error",
              text: `Oops! ${fetchError.message}`,
            });
          }
          return;
        }

        if (!mounted) return;

        if (!data) {
          setFavoriteSources(PERSONALIZATION_DEFAULT_SOURCE_SELECTION);
          setFavoriteTopics(DEFAULT_TOPIC_SELECTION);
          setFavoriteRegions([]);
          return;
        }

        const persistedTopics = Array.isArray(data.favorite_topics)
          ? data.favorite_topics
          : [];

        setFavoriteSources(
          Array.isArray(data.favorite_sources) &&
            data.favorite_sources.length > 0
            ? data.favorite_sources.slice(0, PERSONALIZATION_MAX_SOURCES)
            : PERSONALIZATION_DEFAULT_SOURCE_SELECTION,
        );
        setFavoriteTopics(
          Array.isArray(data.favorite_topics) && data.favorite_topics.length > 0
            ? persistedTopics
            : DEFAULT_TOPIC_SELECTION,
        );
        setFavoriteRegions(data.favorite_regions ?? []);
      } catch (loadError: unknown) {
        if (!mounted) return;
        if (loadError instanceof Error && loadError.name === "AbortError") {
          console.warn("Personalization data load aborted/timed out.");
          return;
        }
        const messageText =
          loadError instanceof Error
            ? loadError.message
            : "We couldn't load your personalization right now. Please try again in a moment.";
        setPopupMessage({ tone: "error", text: `Oops! ${messageText}` });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!popupMessage) return;
    if (popupMessage.tone === "success") return;
    const timer = window.setTimeout(() => setPopupMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [popupMessage]);

  useEffect(() => {
    if (!suggestedTopicToast) return;
    const timer = window.setTimeout(() => setSuggestedTopicToast(null), 1200);
    return () => window.clearTimeout(timer);
  }, [suggestedTopicToast]);

  const handleSave = async () => {
    setIsSaving(true);
    setPopupMessage(null);

    try {
      const { error: saveError } = await saveUserPersonalization({
        favoriteSources,
        favoriteTopics,
        favoriteRegions,
      });

      if (saveError) {
        setPopupMessage({
          tone: "error",
          text: `Oops! ${saveError.message}`,
        });
        return;
      }

      broadcastPersonalizationUpdated();
      setPopupMessage({
        tone: "success",
        text: "New preference list has been updated successfully. You are all set, go home and get a new start.",
      });
    } catch (saveActionError) {
      const messageText =
        saveActionError instanceof Error
          ? saveActionError.message
          : "We couldn't save your preferences right now. Please try again.";
      setPopupMessage({ tone: "error", text: `Oops! ${messageText}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTopicToggle = (topic: string) => {
    const isSelected = favoriteTopics.includes(topic);

    if (!isSelected && favoriteTopics.length >= MAX_TOPICS) {
      setSuggestedTopicToast({
        tone: "warning",
        text: `Limit of ${MAX_TOPICS} topics reached.`,
      });
      return;
    }

    setFavoriteTopics((prev) => toggleValue(prev, topic));
  };

  const handleRegionToggle = (region: string) => {
    const isSelected = favoriteRegions.includes(region);

    if (!isSelected && favoriteRegions.length >= 1) {
      setSuggestedTopicToast({
        tone: "warning",
        text: `Limit of 1 region reached.`,
      });
      return;
    }

    setFavoriteRegions((prev) => toggleValue(prev, region));
  };

  const removeFavoriteTopic = (topic: string) => {
    setFavoriteTopics((prev) => prev.filter((t) => t !== topic));
  };

  const removeFavoriteSource = (source: string) => {
    setFavoriteSources((prev) => prev.filter((s) => s !== source));
  };

  const handleAddSuggestedTopic = (topic: string) => {
    const normalizedTopic = sanitizePersonalizationTopic(topic);
    if (!normalizedTopic) return;

    const alreadyAdded = favoriteTopics.some(
      (favoriteTopic) =>
        favoriteTopic.trim().toLowerCase() === normalizedTopic.toLowerCase(),
    );
    if (alreadyAdded) return;

    if (favoriteTopics.length >= MAX_TOPICS) {
      setSuggestedTopicToast({
        tone: "warning",
        text: `Limit of ${MAX_TOPICS} topics reached. Remove one to add more.`,
      });
      return;
    }

    setFavoriteTopics((prev) => [...prev, normalizedTopic]);
    setSuggestedTopicToast({
      tone: "success",
      text: `"${normalizedTopic}" preference is selected.`,
    });
  };

  const confirmDiscard = async () => {
    setIsDiscarding(true);
    setPopupMessage(null);

    try {
      const { error: discardError } = await discardUserPersonalization();
      if (discardError) {
        setPopupMessage({
          tone: "error",
          text: `Oops! ${discardError.message}`,
        });
        return;
      }

      setFavoriteSources(PERSONALIZATION_DEFAULT_SOURCE_SELECTION);
      setFavoriteTopics([]);
      setFavoriteRegions([]);
      localStorage.removeItem(PERSONALIZATION_PROMO_DISMISS_KEY);
      setPromoResetKey((prev) => prev + 1);
      broadcastPersonalizationUpdated();
      setPopupMessage({
        tone: "success",
        text: "Your personalization has been cleared. You can start fresh anytime. 🧹",
      });
    } catch (discardActionError) {
      const messageText =
        discardActionError instanceof Error
          ? discardActionError.message
          : "We couldn't clear your personalization right now. Please try again.";
      setPopupMessage({ tone: "error", text: `Oops! ${messageText}` });
    } finally {
      setIsDiscarding(false);
      setIsDeletePopupOpen(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-28 rounded-3xl bg-white/80 dark:bg-slate-900/80" />
          <div className="h-72 rounded-3xl bg-white/80 dark:bg-slate-900/80" />
          <div className="h-80 rounded-3xl bg-white/80 dark:bg-slate-900/80" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-[var(--primary)]/12 blur-3xl dark:bg-[var(--primary)]/10"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="absolute right-0 top-40 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10"
        />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-7">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={0}
          className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/85 p-6 shadow-sm backdrop-blur sm:p-8"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <span className="mb-3 inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Tailor Your Experience
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 bg-clip-text text-transparent dark:from-white dark:via-indigo-200 dark:to-violet-200">
                Personalization
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                Curate your feed with trusted sources and focused topics. Your
                preferences sync across the app for a cleaner, more relevant
                reading experience.💪🏼
              </p>
            </div>
          </div>
        </motion.section>
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={1}
          className="border-none bg-transparent p-0 shadow-none sm:rounded-3xl sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-900/85 sm:p-8 sm:shadow-sm sm:backdrop-blur"
        >
          <PersonalizationNewsSources
            favoriteSources={favoriteSources}
            onFavoriteSourcesChange={setFavoriteSources}
          />
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={2}
          className="border-none bg-transparent p-0 shadow-none sm:rounded-3xl sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-900/85 sm:p-8 sm:shadow-sm sm:backdrop-blur"
        >
          <PersonalizationRegionSelector
            favoriteRegions={favoriteRegions}
            onToggleRegion={handleRegionToggle}
          />
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={3}
          className="border-none bg-transparent p-0 shadow-none sm:rounded-3xl sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-900/85 sm:p-8 sm:shadow-sm sm:backdrop-blur"
        >
          {/* Topics heading — full width divider */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
            <h2 className="whitespace-nowrap text-lg font-semibold text-slate-900 dark:text-slate-50">
              Category Topics
            </h2>
            <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
          </div>

          {/* Subtitle + progress bar row */}
          <div className="flex flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
              Select up to {MAX_TOPICS} topics
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80 sm:h-2.5 sm:w-52">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] via-indigo-500 to-sky-400 shadow-[0_0_12px_rgba(99,102,241,0.35)]"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(favoriteTopics.length / MAX_TOPICS) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:px-2.5 sm:text-xs">
                {favoriteTopics.length}/{MAX_TOPICS}
              </span>
            </div>
          </div>

          <div className="relative mt-6">
            <input
              type="text"
              placeholder="Search any topics..."
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900 px-5 py-3 pr-12 text-sm text-slate-900 dark:text-slate-100 focus:border-[var(--primary)] focus:outline-none"
            />
            {topicSearch.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setTopicSearch("")}
                aria-label="Clear topic search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Conditional Layout: Desktop Grid vs Mobile Horizontal Scroll */}
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
                      {page.map((topic, topicIndex) => {
                        const isSelected = favoriteTopics.includes(topic);
                        const isDisabled =
                          !isSelected && favoriteTopics.length >= MAX_TOPICS;
                        const metadata = getTopicMetadata(topic);
                        const IconComponent = metadata.icon;

                        return (
                          <motion.label
                            key={topic}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: topicIndex * 0.012 }}
                            whileHover={{ y: -1, scale: 1.015 }}
                            whileTap={{ scale: 0.985 }}
                            className={`group relative flex cursor-pointer items-center justify-between gap-2 rounded-2xl border transition-all duration-300 px-3.5 py-3 shadow-sm hover:shadow-md ${
                              isSelected
                                ? "border-[var(--primary)] bg-[var(--primary)]/[0.06] dark:bg-[var(--primary)]/[0.12] ring-1 ring-[var(--primary)]/20"
                                : isDisabled
                                  ? "opacity-60 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40"
                                  : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTopicToggle(topic)}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex shrink-0 items-center justify-center p-0.5 rounded-lg group-hover:scale-110 transition-transform">
                                <IconComponent
                                  className={`h-5 w-5 shrink-0 ${metadata.color}`}
                                />
                              </div>
                              <span className="text-xs sm:text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100 transition-colors group-hover:text-slate-900 dark:group-hover:text-white leading-tight">
                                {topic}
                              </span>
                            </div>

                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                                isSelected
                                  ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                  : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 group-hover:border-[var(--primary)]/50"
                              }`}
                            >
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 500,
                                      damping: 30,
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
                    No topics match your search.
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
                          ? "w-8 bg-[var(--primary)] shadow-[0_0_8px_rgba(99,102,241,0.45)]"
                          : "w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-350 dark:hover:bg-slate-600"
                      }`}
                      aria-label={`Go to page ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                {visibleTopics.map((topic, index) => {
                  const isSelected = favoriteTopics.includes(topic);
                  const isDisabled =
                    !isSelected && favoriteTopics.length >= MAX_TOPICS;
                  const metadata = getTopicMetadata(topic);
                  const IconComponent = metadata.icon;

                  return (
                    <motion.label
                      key={topic}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.012 }}
                      whileHover={{ y: -1, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className={`group relative flex cursor-pointer items-center justify-between gap-3 rounded-2xl border transition-all duration-300 px-3.5 py-3 sm:gap-4 sm:px-5 sm:py-4 shadow-sm hover:shadow-md ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--primary)]/[0.06] dark:bg-[var(--primary)]/[0.12] ring-1 ring-[var(--primary)]/20"
                          : isDisabled
                            ? "opacity-60 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40"
                            : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTopicToggle(topic)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex shrink-0 items-center justify-center p-1 rounded-lg group-hover:scale-110 transition-transform">
                          <IconComponent
                            className={`h-5 w-5 shrink-0 ${metadata.color}`}
                          />
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100 transition-colors group-hover:text-slate-900 dark:group-hover:text-white truncate">
                          {topic}
                        </span>
                      </div>

                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                          isSelected
                            ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                            : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 group-hover:border-[var(--primary)]/50"
                        }`}
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                            >
                              <Check
                                size={14}
                                strokeWidth={3.5}
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

              {shouldShowMoreTopicsButton && (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllTopics(true)}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    See more options
                  </button>
                </div>
              )}

              {filteredTopics.length === 0 && (
                <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  No topics match your search.
                </p>
              )}
            </>
          )}
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={4}
          id="ai-topic-suggestions"
        >
          <PersonalizationAiSuggestions
            favoriteTopics={favoriteTopics}
            availableTopics={AVAILABLE_TOPICS}
            selectedRegion={favoriteRegions[0]}
            onAddTopic={handleAddSuggestedTopic}
            onErrorMessage={(text) => {
              setPopupMessage({ tone: "error", text });
            }}
          />
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={5}
          className="border-none bg-transparent p-0 shadow-none sm:rounded-3xl sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-900/85 sm:p-8 sm:shadow-sm sm:backdrop-blur"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
            <h2 className="whitespace-nowrap text-lg font-semibold text-slate-900 dark:text-slate-50">
              Your Favorites
            </h2>
            <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
          </div>

          {!hasSelection ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-12 px-6 text-center transition-all hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-slate-600">
              <span className="mb-3 text-2xl opacity-90">🗂️</span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No favorites selected
              </p>
              <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Your personalized feed will appear here once you select and save
                your preferred sources and topics.
              </p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {favoriteSources.length > 0 && (
                <div>
                  <div className="mb-2 sm:mb-3 flex items-center gap-2.5">
                    <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      News Sources
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {favoriteSources.map((source) => (
                      <div
                        key={source}
                        className="group inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-300 hover:border-blue-300 hover:bg-blue-100/50 hover:shadow dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300 dark:hover:border-blue-800 dark:hover:bg-blue-900/30 sm:px-4 sm:py-1.5 sm:text-sm"
                      >
                        <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">{source}</span>
                        <button
                          type="button"
                          onClick={() => removeFavoriteSource(source)}
                          className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-blue-100/80 text-blue-600 transition-colors duration-300 hover:bg-red-500 hover:text-white dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-red-600 dark:hover:text-white"
                          aria-label={`Remove ${source}`}
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {favoriteTopics.length > 0 && (
                <div>
                  <div className="mb-2 sm:mb-3 flex items-center gap-2.5">
                    <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Category Topics
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {favoriteTopics.map((topic) => (
                      <div
                        key={topic}
                        className="group inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-100/50 hover:shadow dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/30 sm:px-4 sm:py-1.5 sm:text-sm"
                      >
                        <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">{topic}</span>
                        <button
                          type="button"
                          onClick={() => removeFavoriteTopic(topic)}
                          className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-600 transition-colors duration-300 hover:bg-red-500 hover:text-white dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-red-600 dark:hover:text-white"
                          aria-label={`Remove ${topic}`}
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {favoriteRegions.length > 0 && (
                <div>
                  <div className="mb-2 sm:mb-3 flex items-center gap-2.5">
                    <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-purple-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Preferred Region
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {favoriteRegions.map((region) => (
                      <div
                        key={region}
                        className="group inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/50 px-3 py-1 text-xs font-semibold text-purple-700 shadow-sm transition-all duration-300 hover:border-purple-300 hover:bg-purple-100/50 hover:shadow dark:border-purple-900/50 dark:bg-purple-950/20 dark:text-purple-300 dark:hover:border-purple-800 dark:hover:bg-purple-900/30 sm:px-4 sm:py-1.5 sm:text-sm"
                      >
                        <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">{region}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFavoriteRegions((prev) =>
                              prev.filter((r) => r !== region),
                            )
                          }
                          className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-purple-100/80 text-purple-600 transition-colors duration-300 hover:bg-red-500 hover:text-white dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-red-600 dark:hover:text-white"
                          aria-label={`Remove ${region}`}
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Premium Action Footer ── */}
          <div className="relative mt-8 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 shadow-lg shadow-slate-200/40 dark:shadow-slate-950/40 backdrop-blur-sm">
            {/* Gradient shimmer band at top */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent" />
            <div className="absolute -top-10 left-1/2 h-20 w-72 -translate-x-1/2 rounded-full bg-[var(--primary)]/8 blur-2xl dark:bg-[var(--primary)]/12" />

            <div className="relative flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
              {/* Left — info block */}
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Ready to apply your changes?
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {favoriteSources.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/80 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                      {favoriteSources.length} source
                      {favoriteSources.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {favoriteTopics.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      {favoriteTopics.length} topic
                      {favoriteTopics.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {favoriteRegions.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100/80 dark:bg-purple-900/40 border border-purple-200/60 dark:border-purple-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                      {favoriteRegions.length} region
                      {favoriteRegions.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Your feed will sync after saving.
                  </span>
                </div>
              </div>

              {/* Right — action buttons */}
              <div className="flex shrink-0 flex-row items-center justify-end gap-2">
                {/* Discard button */}
                <button
                  type="button"
                  onClick={() => setIsDeletePopupOpen(true)}
                  disabled={isSaving || isDiscarding}
                  className="group inline-flex items-center gap-2 rounded-md border border-red-200/70 dark:border-red-800/60 bg-transparent px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-all duration-200 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDiscarding ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2
                      size={14}
                      className="transition-transform group-hover:scale-110"
                    />
                  )}
                  {isDiscarding ? "Discarding..." : "Discard All"}
                </button>

                {/* Save button */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isDiscarding}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-md bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[var(--primary)]/25 transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-[var(--primary)]/35 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save
                      size={14}
                      className="transition-transform group-hover:scale-110"
                    />
                  )}
                  {isSaving ? "Saving..." : "Save All"}
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {suggestedTopicToast && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:bottom-6"
          >
            <div
              className={`w-full max-w-xs rounded-full border px-4 py-2.5 text-center text-sm font-medium shadow-lg backdrop-blur ${
                suggestedTopicToast.tone === "success"
                  ? "border-emerald-200/80 bg-white/95 text-emerald-700 shadow-emerald-500/10 dark:border-emerald-500/20 dark:bg-slate-900/95 dark:text-emerald-300"
                  : "border-red-200/80 bg-white/95 text-red-700 shadow-red-500/10 dark:border-red-500/20 dark:bg-slate-900/95 dark:text-red-300"
              }`}
            >
              {suggestedTopicToast.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StatusPopup
        isOpen={Boolean(popupMessage)}
        tone={popupMessage?.tone ?? "success"}
        message={popupMessage?.text ?? ""}
        onClose={() => setPopupMessage(null)}
        context="personalization"
        isMobile={isMobile}
        action={
          popupMessage?.tone === "success"
            ? {
                label: "Go Home",
                href: "/",
                icon: <ArrowRight className="h-4 w-4" />,
              }
            : undefined
        }
      />

      <PersonalizationPromoAd
        key={promoResetKey}
        favoriteSourcesCount={favoriteSources.length}
        favoriteTopicsCount={favoriteTopics.length}
      />

      <AnimatePresence>
        {isDeletePopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-sm"
            onClick={() => !isDiscarding && setIsDeletePopupOpen(false)}
          >
            <motion.div
              variants={isMobile ? mobilePopupVariants : desktopPopupVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
              className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-white dark:bg-slate-800 p-5 sm:p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 flex shrink-0 items-center justify-center">
                  <LottiePlayer
                    src="/actiivity/error.json"
                    className="h-10 w-10"
                    loop
                    autoplay
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Clear all personalization? 🗑️
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    This will remove all saved sources and topics. You can set
                    everything again anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isDiscarding && setIsDeletePopupOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Close discard confirmation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsDeletePopupOpen(false)}
                  disabled={isDiscarding}
                  className="rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Keep my settings
                </button>
                <button
                  type="button"
                  onClick={confirmDiscard}
                  disabled={isDiscarding}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDiscarding ? "Clearing... 🧹" : "Yes, clear all"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
