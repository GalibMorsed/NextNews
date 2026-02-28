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
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
      >
        <Sparkles size={16} className="text-blue-600" />
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
              className="w-full rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl sm:max-w-2xl sm:rounded-2xl sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ai-summary-title"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-blue-600" />
                  <h3
                    id="ai-summary-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    AI Summary
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
                  aria-label="Close summary"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mb-4 line-clamp-2 text-sm font-medium text-slate-700">
                {title}
              </p>

              <div className="max-h-[58vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 size={16} className="animate-spin" />
                    Generating summary...
                  </div>
                ) : error ? (
                  <p className="text-sm text-red-600">{error}</p>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {summary}
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
