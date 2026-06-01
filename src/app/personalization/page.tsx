"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Loader2,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  AVAILABLE_PERSONALIZATION_TOPICS,
  DEFAULT_PERSONALIZATION_TOPICS,
  MAX_PERSONALIZATION_TOPICS,
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
import PersonalizationCategoryTopics from "./components/PersonalizationCategoryTopics";

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
const DEFAULT_TOPIC_SELECTION = [...DEFAULT_PERSONALIZATION_TOPICS];

function toggleValue(current: string[], value: string): string[] {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  return [...current, value];
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.975 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 75,
      damping: 14,
      mass: 0.9,
      delay: i * 0.08,
    },
  }),
};

const accordionContentVariants: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
  },
  visible: {
    height: "auto",
    opacity: 1,
    transition: {
      height: {
        type: "spring",
        stiffness: 280,
        damping: 30,
      },
      opacity: { duration: 0.2 },
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        type: "spring",
        stiffness: 300,
        damping: 32,
      },
      opacity: { duration: 0.15 },
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

const itemBadgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.88, y: 6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.88,
    y: 6,
    transition: {
      duration: 0.12,
    },
  },
};

export default function PersonalizationPage() {
  const [favoriteSources, setFavoriteSources] = useState<string[]>(
    PERSONALIZATION_DEFAULT_SOURCE_SELECTION,
  );
  const [favoriteTopics, setFavoriteTopics] = useState<string[]>([]);
  const [favoriteRegions, setFavoriteRegions] = useState<string[]>([]);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [isTopicsExpanded, setIsTopicsExpanded] = useState(false);
  const [isRegionsExpanded, setIsRegionsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [popupMessage, setPopupMessage] = useState<PopupMessage>(null);
  const [suggestedTopicToast, setSuggestedTopicToast] =
    useState<SuggestedTopicToast>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [promoResetKey, setPromoResetKey] = useState(0);

  const hasSelection = useMemo(
    () =>
      favoriteSources.length > 0 ||
      favoriteTopics.length > 0 ||
      favoriteRegions.length > 0,
    [favoriteSources.length, favoriteTopics.length, favoriteRegions.length],
  );

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
        text: `Limit of ${MAX_TOPICS} topics reached, Remove one.`,
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
      <main className="relative min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-hidden">
        {/* Decorative background shapes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-[var(--primary)]/8 blur-3xl dark:bg-[var(--primary)]/6" />
          <div className="absolute right-0 top-40 h-64 w-64 rounded-full bg-sky-300/8 blur-3xl dark:bg-sky-500/6" />
        </div>

        <div className="relative mx-auto max-w-6xl space-y-9">
          {/* Header Card Skeleton */}
          <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/40 p-6 sm:p-8 space-y-4">
            <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-3.5 w-full max-w-xl rounded-md bg-slate-150 dark:bg-slate-850 animate-pulse" />
          </div>

          {/* News Sources Skeleton */}
          <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-5 w-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border border-slate-200/60 dark:border-slate-800/80 rounded-[18px] bg-slate-50/50 dark:bg-slate-900/20 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
                    <div className="h-4 w-28 rounded-md bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="h-6 w-6 rounded-full bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Region Selector Skeleton */}
          <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-36 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border border-slate-200/60 dark:border-slate-800/80 rounded-[18px] bg-slate-50/50 dark:bg-slate-900/20 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-7 rounded bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
                    <div className="h-4 w-16 rounded-md bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="h-6 w-6 rounded-full bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
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

      <div className="relative mx-auto max-w-6xl space-y-9">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={0}
          className="rounded-[20px] border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/80 p-6 shadow-sm backdrop-blur sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <span className="mb-3 inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Tailor Your Experience
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 bg-clip-text text-transparent dark:from-white dark:via-indigo-200 dark:to-violet-200">
                Personalization
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                Choose trusted sources and focused topics. Your preferences sync
                across the app for a cleaner, more relevant feed.💪🏼
              </p>
            </div>
          </div>
        </motion.section>
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={1}
          className="border-none bg-transparent p-0 shadow-none sm:rounded-[20px] sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-800/80 sm:p-8 sm:shadow-sm sm:backdrop-blur"
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
          className="border-none bg-transparent p-0 shadow-none sm:rounded-[20px] sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-800/80 sm:p-8 sm:shadow-sm sm:backdrop-blur"
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
          className="border-none bg-transparent p-0 shadow-none sm:rounded-[20px] sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-800/80 sm:p-8 sm:shadow-sm sm:backdrop-blur"
        >
          <PersonalizationCategoryTopics
            favoriteTopics={favoriteTopics}
            onFavoriteTopicsChange={setFavoriteTopics}
            onLimitReached={(text) =>
              setSuggestedTopicToast({ tone: "warning", text })
            }
            isMobile={isMobile}
          />
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
          className="border-none bg-transparent p-0 shadow-none sm:rounded-[20px] sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-800/80 sm:p-8 sm:shadow-sm sm:backdrop-blur"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
            <h2 className="whitespace-nowrap text-lg font-semibold text-slate-900 dark:text-slate-50">
              Your Favorites
            </h2>
            <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
          </div>

          <div className="space-y-4">
            {/* Accordion 1: News Sources */}
            <div className="overflow-hidden rounded-[18px] border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/20 transition-all hover:bg-white/60 dark:hover:bg-slate-900/30">
              <motion.button
                type="button"
                onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                whileTap={{ scale: 0.992 }}
                className="flex w-full items-center justify-between px-5 py-4 text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wider text-slate-700 dark:text-slate-200 uppercase">
                    News Sources
                  </span>
                  <span className="ml-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {favoriteSources.length}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isSourcesExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-slate-400 dark:text-slate-500"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </motion.button>
              <AnimatePresence initial={false}>
                {isSourcesExpanded && (
                  <motion.div
                    variants={accordionContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-200/60 dark:border-slate-800/60 px-5 pb-5 pt-4">
                      <AnimatePresence mode="wait">
                        {favoriteSources.length > 0 ? (
                          <motion.div
                            key="sources-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-wrap gap-2"
                          >
                            <AnimatePresence mode="popLayout">
                              {favoriteSources.map((source) => (
                                <motion.div
                                  layout
                                  key={source}
                                  variants={itemBadgeVariants}
                                  className="group inline-flex items-center gap-2.5 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-md"
                                >
                                  <div className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                  <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none font-medium leading-none">
                                    {source}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeFavoriteSource(source)}
                                    className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors duration-300 hover:bg-red-500 hover:text-white dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-red-650 dark:hover:text-white"
                                    aria-label={`Remove ${source}`}
                                  >
                                    <X
                                      className="h-2.5 w-2.5"
                                      strokeWidth={3.5}
                                    />
                                  </button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </motion.div>
                        ) : (
                          <motion.p
                            key="sources-empty"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-slate-400 dark:text-slate-500 italic"
                          >
                            No news sources selected. Select preferred sources
                            in the section above.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion 2: Category Topics */}
            <div className="overflow-hidden rounded-[18px] border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/20 transition-all hover:bg-white/60 dark:hover:bg-slate-900/30">
              <motion.button
                type="button"
                onClick={() => setIsTopicsExpanded(!isTopicsExpanded)}
                whileTap={{ scale: 0.992 }}
                className="flex w-full items-center justify-between px-5 py-4 text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wider text-slate-700 dark:text-slate-200 uppercase">
                    Category Topics
                  </span>
                  <span className="ml-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {favoriteTopics.length}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isTopicsExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-slate-400 dark:text-slate-500"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </motion.button>
              <AnimatePresence initial={false}>
                {isTopicsExpanded && (
                  <motion.div
                    variants={accordionContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-200/60 dark:border-slate-800/60 px-5 pb-5 pt-4">
                      <AnimatePresence mode="wait">
                        {favoriteTopics.length > 0 ? (
                          <motion.div
                            key="topics-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-wrap gap-2"
                          >
                            <AnimatePresence mode="popLayout">
                              {favoriteTopics.map((topic) => (
                                <motion.div
                                  layout
                                  key={topic}
                                  variants={itemBadgeVariants}
                                  className="group inline-flex items-center gap-2.5 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm transition-all duration-300 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md"
                                >
                                  <div className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                  <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none font-medium leading-none">
                                    {topic}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeFavoriteTopic(topic)}
                                    className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors duration-300 hover:bg-red-500 hover:text-white dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-red-650 dark:hover:text-white"
                                    aria-label={`Remove ${topic}`}
                                  >
                                    <X
                                      className="h-2.5 w-2.5"
                                      strokeWidth={3.5}
                                    />
                                  </button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </motion.div>
                        ) : (
                          <motion.p
                            key="topics-empty"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-slate-400 dark:text-slate-500 italic"
                          >
                            No category topics selected. Select preferred topics
                            in the section above.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion 3: Preferred Region */}
            <div className="overflow-hidden rounded-[18px] border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/20 transition-all hover:bg-white/60 dark:hover:bg-slate-900/30">
              <motion.button
                type="button"
                onClick={() => setIsRegionsExpanded(!isRegionsExpanded)}
                whileTap={{ scale: 0.992 }}
                className="flex w-full items-center justify-between px-5 py-4 text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-purple-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wider text-slate-700 dark:text-slate-200 uppercase">
                    Preferred Region
                  </span>
                  <span className="ml-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {favoriteRegions.length}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isRegionsExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-slate-400 dark:text-slate-500"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </motion.button>
              <AnimatePresence initial={false}>
                {isRegionsExpanded && (
                  <motion.div
                    variants={accordionContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-200/60 dark:border-slate-800/60 px-5 pb-5 pt-4">
                      <AnimatePresence mode="wait">
                        {favoriteRegions.length > 0 ? (
                          <motion.div
                            key="regions-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-wrap gap-2"
                          >
                            <AnimatePresence mode="popLayout">
                              {favoriteRegions.map((region) => (
                                <motion.div
                                  layout
                                  key={region}
                                  variants={itemBadgeVariants}
                                  className="group inline-flex items-center gap-2.5 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-700 hover:shadow-md"
                                >
                                  <div className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                                  <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none font-medium leading-none">
                                    {region}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFavoriteRegions((prev) =>
                                        prev.filter((r) => r !== region),
                                      )
                                    }
                                    className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors duration-300 hover:bg-red-500 hover:text-white dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-red-650 dark:hover:text-white"
                                    aria-label={`Remove ${region}`}
                                  >
                                    <X
                                      className="h-2.5 w-2.5"
                                      strokeWidth={3.5}
                                    />
                                  </button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </motion.div>
                        ) : (
                          <motion.p
                            key="regions-empty"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-slate-400 dark:text-slate-500 italic"
                          >
                            No regions selected. Select your preferred region in
                            the section above.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {/* ── Premium Action Footer ── */}
          <div className="relative mt-8 overflow-hidden rounded-[18px] border border-slate-200/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 shadow-md shadow-slate-200/25 dark:shadow-slate-950/25 backdrop-blur-sm">
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
                <motion.button
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
                </motion.button>

                {/* Save button */}
                <motion.button
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
                </motion.button>
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
