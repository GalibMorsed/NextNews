
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { AlertTriangle, ArrowRight, BellRing, CheckCircle2, X } from "lucide-react";
import { supabase } from "../../../lib/superbaseClient";
import {
  broadcastPersonalizationUpdated,
  discardUserPersonalization,
  getUserPersonalization,
  saveUserPersonalization,
} from "../services/personalizationService";
import PersonalizationAiSuggestions from "../components/personalizationAiSuggestions";

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
const INITIAL_VISIBLE_TOPICS = 15;
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
    !topicSearch.trim() && !showAllTopics && filteredTopics.length > INITIAL_VISIBLE_TOPICS;

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
            setPopupMessage({ tone: "error", text: `Oops! ${fetchError.message} 😕` });
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
        setPopupMessage({ tone: "error", text: `Oops! ${saveError.message} 😕` });
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
        setPopupMessage({ tone: "error", text: `Oops! ${discardError.message} 😕` });
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="mb-3 inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Tailor Your Experience
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                Personalization
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                Curate your feed with trusted sources and focused topics. Your
                preferences sync across the app for a cleaner, more relevant
                reading experience.💪🏼
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left sm:text-right dark:border-slate-700/80 dark:bg-slate-800/70">
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Topics
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Select up to {MAX_TOPICS} topics for better recommendations
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-2.5 w-44 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 sm:w-52">
                <motion.div
                  className="h-full bg-[var(--primary)]"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(favoriteTopics.length / MAX_TOPICS) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="tabular-nums text-sm font-medium text-slate-500 dark:text-slate-400">
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
          <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-50">
            Your Favorites
          </h2>

          {!hasSelection ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/70 py-12 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nothing selected yet. Your personalized feed will appear here
                once you save.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {favoriteSources.length > 0 && (
                <div>
                  <p className="mb-3 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {favoriteSources.map((source) => (
                      <div
                        key={source}
                        className="group flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-100/80 dark:bg-blue-950/70 px-4 py-1.5 text-sm text-blue-700 dark:text-blue-300"
                      >
                        {source}
                        <button
                          type="button"
                          onClick={() => removeFavoriteSource(source)}
                          className="rounded-full p-0.5 opacity-60 hover:bg-blue-200 dark:hover:bg-blue-900 hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {favoriteTopics.length > 0 && (
                <div>
                  <p className="mb-3 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Topics
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {favoriteTopics.map((topic) => (
                      <div
                        key={topic}
                        className="group flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-100/80 dark:bg-emerald-950/70 px-4 py-1.5 text-sm text-emerald-700 dark:text-emerald-300"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => removeFavoriteTopic(topic)}
                          className="rounded-full p-0.5 opacity-60 hover:bg-emerald-200 dark:hover:bg-emerald-900 hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-3 sm:p-4">
            <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Save to apply these preferences across your feed.
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsDeletePopupOpen(true)}
                disabled={isSaving || isDiscarding}
                className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-6 py-3 text-sm font-medium text-red-700 dark:text-red-300 transition hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-60"
              >
                {isDiscarding ? "Discarding..." : "Discard All"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isDiscarding}
                className="rounded-2xl bg-[var(--primary)] px-8 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save My Preferences"}
              </button>
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

      <AnimatePresence>
        {popupMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-sm"
            onClick={() => setPopupMessage(null)}
          >
            <motion.div
              variants={isMobile ? mobilePopupVariants : desktopPopupVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
              className={`relative w-full overflow-hidden rounded-t-2xl shadow-xl sm:rounded-[28px] ${
                popupMessage.tone === "success"
                  ? "sm:max-w-lg border border-emerald-200/70 bg-white/95 p-0 dark:border-emerald-500/20 dark:bg-slate-900/95"
                  : "sm:max-w-md bg-white p-5 dark:bg-slate-800 sm:p-6"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {popupMessage.tone === "success" ? (
                <>
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-emerald-400/20 via-sky-300/20 to-cyan-300/20 dark:from-emerald-400/10 dark:via-sky-400/10 dark:to-cyan-400/10" />
                  <div className="absolute -right-10 top-8 h-32 w-32 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/10" />
                  <div className="relative p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
                            Preferences Updated
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                            You're ready for a fresh start
                          </h3>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPopupMessage(null)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-400 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-slate-600 dark:hover:text-slate-200"
                        aria-label="Close message"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 dark:border-emerald-500/10 dark:from-emerald-500/10 dark:via-slate-900 dark:to-sky-500/10">
                      <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                        {popupMessage.text}
                      </p>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        Go Home
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      popupMessage.tone === "info"
                        ? "bg-sky-100 text-sky-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {popupMessage.tone === "info" ? (
                      <BellRing className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>
                  <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                    {popupMessage.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPopupMessage(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    aria-label="Close message"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
