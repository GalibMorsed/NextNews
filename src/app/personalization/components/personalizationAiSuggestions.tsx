"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { incrementPersonalizationSuggestionUsage } from "@/lib/activityAnalytics";
import { getExploreRegion } from "@/lib/explore";
import { PERSONALIZATION_PROMO_HIDE_EVENT } from "./personalizatioPopup";
import { useAILimit } from "@/hooks/useAILimit";
import CreditAlertBanner from "@/app/components/CreditAlertBanner";
import LottiePlayer from "@/app/components/LottiePlayer";

type TopicSuggestion = {
  topic: string;
  whyNow: string;
  whatToWatch: string;
  confidence: "high" | "medium" | "low";
};

const AI_LOADING_STEPS = [
  "Scanning breaking stories across your selected region...",
  "Comparing topic velocity and audience interest signals...",
  "Ranking suggestions by relevance and confidence...",
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

interface PersonalizationAiSuggestionsProps {
  favoriteTopics: string[];
  availableTopics: string[];
  selectedRegion?: string;
  onAddTopic: (topic: string) => void;
  onErrorMessage: (text: string) => void;
}

export default function PersonalizationAiSuggestions({
  favoriteTopics,
  availableTopics,
  selectedRegion,
  onAddTopic,
  onErrorMessage,
}: PersonalizationAiSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiElapsedSeconds, setAiElapsedSeconds] = useState(0);
  const { isLocked, limit, isActive, nextAvailableAt, isFreePlanCooldown } =
    useAILimit();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isSuggesting) {
      setAiElapsedSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setAiElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isSuggesting]);

  const aiLoadingMessage = useMemo(() => {
    if (aiElapsedSeconds < 4) return AI_LOADING_STEPS[0];
    if (aiElapsedSeconds < 8) return AI_LOADING_STEPS[1];
    return AI_LOADING_STEPS[2];
  }, [aiElapsedSeconds]);

  const isAiTakingLong = aiElapsedSeconds >= 8;

  const handleGetAiSuggestions = async () => {
    window.dispatchEvent(new Event(PERSONALIZATION_PROMO_HIDE_EVENT));
    setIsSuggesting(true);
    setSuggestions([]);

    if (isLocked) {
      onErrorMessage(
        `You've reached your free limit of ${limit} AI usages. Activate any plan to unlock.`,
      );
      setIsSuggesting(false);
      return;
    }

    try {
      // Use cached token — avoids another Supabase navigator-lock call
      const accessToken = localStorage.getItem("auth_token");

      if (!accessToken) {
        onErrorMessage("Please log in again to get AI suggestions.");
        return;
      }

      const regionConfig = getExploreRegion(selectedRegion);
      const countryCode = regionConfig?.country || "us";

      const response = await fetch("/api/topic-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          availableTopics,
          selectedTopics: favoriteTopics,
          country: countryCode,
        }),
      });

      const payload = (await response.json()) as {
        suggestions?: TopicSuggestion[];
        error?: string;
      };

      if (!response.ok) {
        onErrorMessage(
          payload.error
            ? `Oops! ${payload.error}`
            : "We couldn't get AI suggestions right now. Please try again shortly.",
        );
        return;
      }

      setSuggestions(
        Array.isArray(payload.suggestions) ? payload.suggestions : [],
      );
      incrementPersonalizationSuggestionUsage();
    } catch {
      onErrorMessage(
        "We couldn't get AI suggestions right now. Please try again shortly.",
      );
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="border-none bg-transparent p-0 shadow-none sm:rounded-3xl sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-800/80 sm:p-8 sm:shadow-sm sm:backdrop-blur">
      {/* Heading — full width divider */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
        <h2 className="flex items-center gap-2 whitespace-nowrap text-lg font-semibold text-slate-900 dark:text-slate-50">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            <LottiePlayer
              src="/explore/AI.json"
              className="h-full w-full"
              loop
              autoplay
            />
          </span>
          AI Topic Suggestions
        </h2>
        <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
      </div>

      {/* Subtitle + button row */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Real-time recommendations based on trending global news
        </p>

        {!isLocked ? (
          <button
            id="ai-topic-suggestions-button"
            type="button"
            onClick={handleGetAiSuggestions}
            disabled={isSuggesting}
            className="group relative inline-flex w-fit items-center gap-2 self-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-70 lg:self-auto"
          >
            {/* Shimmer sweep effect */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />

            {isSuggesting ? (
              <>
                <Loader2 className="animate-spin" size={17} />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles
                  size={17}
                  className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                />
                Get Suggestions
              </>
            )}
          </button>
        ) : null}
      </div>

      {isLocked && suggestions.length === 0 && !isSuggesting ? (
        <div className="mt-6">
          <CreditAlertBanner
            limit={limit}
            isPlan={isActive}
            nextAvailableAt={nextAvailableAt}
            isFreePlanCooldown={isFreePlanCooldown}
          />
        </div>
      ) : null}

      {isSuggesting && (
        <div className="mt-8">
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <Loader2
                className="animate-spin text-[var(--primary)]"
                size={18}
              />
              {aiLoadingMessage}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {isAiTakingLong
                ? "This is taking longer than usual, still processing..."
                : "Usually completes in under 20 seconds."}
            </div>
          </div>
          <div className="mb-4 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="animate-spin" size={18} />
            AI analysis in progress ({aiElapsedSeconds}s)
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-3xl border border-slate-200/80 bg-slate-100/80 p-4 dark:border-slate-700 dark:bg-slate-800/70"
              />
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && !isSuggesting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3"
        >
          {suggestions.map((item, index) => {
            const alreadySelected = favoriteTopics.some(
              (topic) =>
                topic.trim().toLowerCase() === item.topic.trim().toLowerCase(),
            );
            const isNewTopic = !availableTopics.includes(item.topic);

            return (
              <motion.article
                key={item.topic}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className="flex h-full flex-col justify-between group rounded-3xl border border-slate-200 bg-slate-50/80 p-6 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
                      {item.topic}
                    </h3>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {isNewTopic && (
                        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                          New topic
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          item.confidence === "high"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : item.confidence === "medium"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.confidence}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-xs mb-6">
                    <div>
                      <span className="font-medium text-slate-500 dark:text-slate-400">
                        Why now -
                      </span>{" "}
                      <span className="text-slate-700 dark:text-slate-300">
                        {item.whyNow}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500 dark:text-slate-400">
                        Watch for -
                      </span>{" "}
                      <span className="text-slate-700 dark:text-slate-300">
                        {item.whatToWatch}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddTopic(item.topic)}
                  disabled={alreadySelected}
                  className="mt-auto w-full rounded-2xl border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {alreadySelected ? "Already added" : "Add to my topics"}
                </button>
              </motion.article>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
