"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "../../../lib/superbaseClient";
import { incrementPersonalizationSuggestionUsage } from "@/lib/activityAnalytics";

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
  onAddTopic: (topic: string) => void;
  onErrorMessage: (text: string) => void;
}

export default function PersonalizationAiSuggestions({
  favoriteTopics,
  availableTopics,
  onAddTopic,
  onErrorMessage,
}: PersonalizationAiSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiElapsedSeconds, setAiElapsedSeconds] = useState(0);

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
    setIsSuggesting(true);
    setSuggestions([]);

    try {
      // Use cached token — avoids another Supabase navigator-lock call
      const accessToken = localStorage.getItem("auth_token");

      if (!accessToken) {
        onErrorMessage("Please log in again to get AI suggestions.");
        return;
      }

      const response = await fetch("/api/topic-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          availableTopics,
          selectedTopics: favoriteTopics,
          country: "us",
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
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/85 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
            <Sparkles className="text-[var(--primary)]" />
            AI Topic Suggestions
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Real-time recommendations based on trending global news
          </p>
        </div>

        <button
          type="button"
          onClick={handleGetAiSuggestions}
          disabled={isSuggesting}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSuggesting ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Analyzing trends...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Get Smart Suggestions
            </>
          )}
        </button>
      </div>

      {isSuggesting && (
        <div className="mt-8">
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <Loader2 className="animate-spin text-[var(--primary)]" size={18} />
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
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/80 p-4 dark:border-slate-700 dark:bg-slate-800/70"
              />
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && !isSuggesting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 grid gap-4 sm:grid-cols-2"
        >
          {suggestions.map((item, index) => {
            const alreadySelected = favoriteTopics.includes(item.topic);

            return (
              <motion.article
                key={item.topic}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className="group rounded-3xl border border-slate-200 bg-slate-50/80 p-6 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {item.topic}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
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

                <div className="mt-5 space-y-3 text-xs">
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

                <button
                  type="button"
                  onClick={() => onAddTopic(item.topic)}
                  disabled={alreadySelected}
                  className="mt-6 w-full rounded-2xl border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
