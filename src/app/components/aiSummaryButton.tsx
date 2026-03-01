"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, Sparkles, X } from "lucide-react";
import { supabase } from "../../../lib/superbaseClient";

interface AISummaryButtonProps {
  title: string;
  description: string | null;
  content: string | null;
  sourceName?: string;
}

function toBulletPoints(rawSummary: string) {
  const normalized = rawSummary.trim();
  if (!normalized) return [];

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines
      .map((line) =>
        line.replace(/^(\d+[\).\s-]+|[-*\u2022]+\s*)/, "").trim(),
      )
      .filter(Boolean);
  }

  return normalized
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function AISummaryButton({
  title,
  description,
  content,
  sourceName,
}: AISummaryButtonProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const summaryPoints = toBulletPoints(summary);

  useEffect(() => {
    const updateAuthState = () => {
      const token = localStorage.getItem("auth_token");
      setIsLoggedIn(Boolean(token));
    };

    updateAuthState();
    window.addEventListener("storage", updateAuthState);
    window.addEventListener("focus", updateAuthState);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = localStorage.getItem("auth_token");
      setIsLoggedIn(Boolean(token) && Boolean(session));
    });

    return () => {
      window.removeEventListener("storage", updateAuthState);
      window.removeEventListener("focus", updateAuthState);
      subscription.unsubscribe();
    };
  }, []);

  if (!isLoggedIn) {
    return null;
  }

  const openSummary = async () => {
    setIsOpen(true);
    setError("");

    if (summary || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          content,
          source: sourceName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Unable to create summary.",
        );
      }

      setSummary(typeof data?.summary === "string" ? data.summary : "");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create summary.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openSummary}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 dark:focus:ring-offset-slate-900"
        aria-label="AI summary"
        title="AI summary"
      >
        <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-md p-0 sm:p-6"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl sm:max-w-3xl sm:rounded-2xl sm:p-6 dark:border-slate-700 dark:bg-slate-900"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ai-summary-title"
            >
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-500/15">
                    <Bot size={18} className="text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3
                      id="ai-summary-title"
                      className="text-lg font-semibold text-slate-900 dark:text-slate-100"
                    >
                      AI Summary
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Article summary generated by AI.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus:ring-offset-slate-900"
                  aria-label="Close summary"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mb-4 text-sm font-medium leading-relaxed text-slate-700 sm:text-base dark:text-slate-200">
                {title}
              </p>

              <div className="max-h-[62vh] overflow-y-auto rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-5 dark:border-slate-700 dark:from-slate-950 dark:to-slate-900">
                {isLoading ? (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <Loader2 size={16} className="animate-spin" />
                    Generating summary...
                  </div>
                ) : error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                  </p>
                ) : summaryPoints.length > 0 ? (
                  <ul className="space-y-3">
                    {summaryPoints.map((point, index) => (
                      <li key={`${point.slice(0, 24)}-${index}`} className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500 dark:bg-blue-400" />
                        <p className="text-sm leading-7 text-slate-800 sm:text-[15px] dark:text-slate-200">
                          {point}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    No summary was generated for this article.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
