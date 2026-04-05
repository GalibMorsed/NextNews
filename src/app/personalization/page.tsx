"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/superbaseClient";
import {
  broadcastPersonalizationUpdated,
  discardUserPersonalization,
  getUserPersonalization,
  saveUserPersonalization,
} from "../services/personalizationService";
import PersonalizationAiSuggestions from "../components/personalizationAiSuggestions";
import StatusPopup from "../components/statusPopup";

type PopupMessage = {
  tone: "success" | "error" | "info";
  text: string;
} | null;

type SuggestedTopicToast = {
  text: string;
} | null;

const AVAILABLE_SOURCES = [
  "NewsAPI Top Headlines",
  "NewsAPI Search (Everything)",
  "YouTube Live News Streams",
];

const AVAILABLE_TOPICS = [
  "Top Headlines",
  "Technology",
  "Business",
  "Entertainment",
  "Sports",
  "Health",
  "Science",
  "Politics",
  "Crime",
  "Environment",
  "Education",
  "Travel",
  "Food",
  "Fashion",
  "Finance",
  "Automotive",
  "Music",
  "Movies",
  "Books",
  "Art",
  "Culture",
  "Gaming",
  "Spirituality & Religion",
  "Mental Health",
  "Artificial Intelligence",
  "Cybersecurity",
  "Space & Astronomy",
  "Stock Market",
  "Trade & Economy",
  "Real Estate",
  "Defense & Military",
  "Agriculture & Farming",
];

const MAX_TOPICS = 10;
const INITIAL_VISIBLE_TOPICS = 12;
const DEFAULT_TOPIC_SELECTION = [
  "Top Headlines",
  "Technology",
  "Business",
  "Entertainment",
  "Sports",
  "Health",
  "Science",
];

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
  const [favoriteSources, setFavoriteSources] = useState<string[]>([]);
  const [favoriteTopics, setFavoriteTopics] = useState<string[]>([]);
  const [topicSearch, setTopicSearch] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [popupMessage, setPopupMessage] = useState<PopupMessage>(null);
  const [suggestedTopicToast, setSuggestedTopicToast] =
    useState<SuggestedTopicToast>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);

  const hasSelection = useMemo(
    () => favoriteSources.length > 0 || favoriteTopics.length > 0,
    [favoriteSources.length, favoriteTopics.length],
  );

  const filteredTopics = useMemo(
    () =>
      AVAILABLE_TOPICS.filter((t) =>
        t.toLowerCase().includes(topicSearch.toLowerCase()),
      ),
    [topicSearch],
  );

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
        // Read email from localStorage — no Supabase call needed
        const cachedEmail =
          localStorage.getItem("auth_email") ||
          localStorage.getItem("userEmail") ||
          "";
        if (mounted) setUserEmail(cachedEmail);

        const { data, error: fetchError } = await getUserPersonalization();
        if (fetchError) {
          if (mounted) {
            setPopupMessage({
              tone: "error",
              text: `Oops! ${fetchError.message} 😕`,
            });
          }
          return;
        }

        if (!mounted) return;

        if (!data) {
          setFavoriteSources([]);
          setFavoriteTopics(DEFAULT_TOPIC_SELECTION);
          return;
        }

        const persistedTopics = Array.isArray(data.favorite_topics)
          ? data.favorite_topics
          : [];

        setFavoriteSources(data.favorite_sources ?? []);
        setFavoriteTopics(
          persistedTopics.length > 0
            ? persistedTopics
            : DEFAULT_TOPIC_SELECTION,
        );
      } catch (loadError: any) {
        if (!mounted) return;
        if (loadError?.name === "AbortError") {
          console.warn("Personalization data load aborted/timed out.");
          return;
        }
        const messageText =
          loadError instanceof Error
            ? loadError.message
            : "We couldn't load your personalization right now. Please try again in a moment. 😕";
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
      });

      if (saveError) {
        setPopupMessage({
          tone: "error",
          text: `Oops! ${saveError.message} 😕`,
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
          : "We couldn't save your preferences right now. Please try again. 😕";
      setPopupMessage({ tone: "error", text: `Oops! ${messageText}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTopicToggle = (topic: string) => {
    const isSelected = favoriteTopics.includes(topic);

    if (!isSelected && favoriteTopics.length >= MAX_TOPICS) {
      setPopupMessage({
        tone: "error",
        text: `You can pick up to ${MAX_TOPICS} topics. Please remove one to add another. 🙂`,
      });
      return;
    }

    setFavoriteTopics((prev) => toggleValue(prev, topic));
  };

  const removeFavoriteTopic = (topic: string) => {
    setFavoriteTopics((prev) => prev.filter((t) => t !== topic));
  };

  const removeFavoriteSource = (source: string) => {
    setFavoriteSources((prev) => prev.filter((s) => s !== source));
  };

  const handleAddSuggestedTopic = (topic: string) => {
    if (favoriteTopics.includes(topic)) return;

    if (favoriteTopics.length >= MAX_TOPICS) {
      setPopupMessage({
        tone: "error",
        text: `You can pick up to ${MAX_TOPICS} topics. Please remove one to add another. 🙂`,
      });
      return;
    }

    setFavoriteTopics((prev) => [...prev, topic]);
    setSuggestedTopicToast({
      text: `"${topic}" preference is selected.`,
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
          text: `Oops! ${discardError.message} 😕`,
        });
        return;
      }

      setFavoriteSources([]);
      setFavoriteTopics([]);
      broadcastPersonalizationUpdated();
      setPopupMessage({
        tone: "success",
        text: "Your personalization has been cleared. You can start fresh anytime. 🧹",
      });
    } catch (discardActionError) {
      const messageText =
        discardActionError instanceof Error
          ? discardActionError.message
          : "We couldn't clear your personalization right now. Please try again. 😕";
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
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-800/70 lg:shrink-0 lg:text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Logged in as
              </p>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {userEmail || "Guest"}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={1}
          className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/85 p-6 shadow-sm backdrop-blur sm:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              News Sources
            </h2>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {AVAILABLE_SOURCES.map((source) => {
              const isSelected = favoriteSources.includes(source);
              return (
                <motion.label
                  key={source}
                  whileHover={{ scale: 1.01 }}
                  className={`group flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 p-5 transition-all hover:border-[var(--primary)] hover:shadow-sm ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 dark:bg-[var(--primary)]/15"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      setFavoriteSources((prev) => toggleValue(prev, source))
                    }
                    className="h-5 w-5 accent-[var(--primary)]"
                  />
                  <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {source}
                  </span>
                </motion.label>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={2}
          className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/85 p-6 shadow-sm backdrop-blur sm:p-8"
        >
          {/* Topics heading — full width divider */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <h2 className="whitespace-nowrap text-lg font-semibold text-slate-900 dark:text-slate-50">
              Topics
            </h2>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
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
              placeholder="Search topics..."
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900 px-5 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTopics.map((topic, index) => {
              const isSelected = favoriteTopics.includes(topic);
              const isDisabled =
                !isSelected && favoriteTopics.length >= MAX_TOPICS;

              return (
                <motion.label
                  key={topic}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.015 }}
                  whileHover={{ scale: 1.015 }}
                  className={`group flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 px-5 py-4 transition-all hover:border-[var(--primary)] hover:shadow ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 dark:bg-[var(--primary)]/15 shadow-sm"
                      : isDisabled
                        ? "opacity-40"
                        : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleTopicToggle(topic)}
                    className="h-5 w-5 accent-[var(--primary)]"
                  />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {topic}
                  </span>
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
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={3}
        >
          <PersonalizationAiSuggestions
            favoriteTopics={favoriteTopics}
            availableTopics={AVAILABLE_TOPICS}
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
          custom={4}
          className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/85 p-6 shadow-sm backdrop-blur sm:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <h2 className="whitespace-nowrap text-lg font-semibold text-slate-900 dark:text-slate-50">
              Your Favorites
            </h2>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
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
            <div className="space-y-8">
              {favoriteSources.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                      Sources
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {favoriteSources.map((source) => (
                      <div
                        key={source}
                        className="group flex flex-wrap items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm transition-all hover:bg-blue-100/70 hover:shadow dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 sm:px-4"
                      >
                        <span className="truncate">{source}</span>
                        <button
                          type="button"
                          onClick={() => removeFavoriteSource(source)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200/50 text-blue-600 transition-colors hover:bg-blue-600 hover:text-white dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white"
                          aria-label={`Remove ${source}`}
                        >
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {favoriteTopics.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                      Topics
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {favoriteTopics.map((topic) => (
                      <div
                        key={topic}
                        className="group flex flex-wrap items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm transition-all hover:bg-emerald-100/70 hover:shadow dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 sm:px-4"
                      >
                        <span className="truncate">{topic}</span>
                        <button
                          type="button"
                          onClick={() => removeFavoriteTopic(topic)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200/50 text-emerald-600 transition-colors hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white"
                          aria-label={`Remove ${topic}`}
                        >
                          <X size={12} strokeWidth={2.5} />
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
            <div className="w-full max-w-xs rounded-full border border-emerald-200/80 bg-white/95 px-4 py-2.5 text-center text-sm font-medium text-emerald-700 shadow-lg shadow-emerald-500/10 backdrop-blur dark:border-emerald-500/20 dark:bg-slate-900/95 dark:text-emerald-300">
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
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
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
