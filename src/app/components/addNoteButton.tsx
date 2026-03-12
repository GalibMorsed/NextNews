"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useEffect } from "react";
import { saveNote } from "../services/notesService";
import { AnimatePresence, motion } from "framer-motion";
import { Notebook, X } from "lucide-react";
import { supabase } from "../../../lib/superbaseClient";

interface AddNoteButtonProps {
  title: string;
  link: string;
  publishedAt?: string;
  sourceName?: string;
}

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function AddNoteButton({
  title,
  link,
  publishedAt,
  sourceName,
}: AddNoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Cleanup timeout on component unmount
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("resize", checkMobile);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formattedDate = useMemo(() => {
    if (!publishedAt) return "Date Not Available";
    const parsed = new Date(publishedAt);
    if (Number.isNaN(parsed.getTime())) return "Date Not Available";
    return parsed.toLocaleString("en-US");
  }, [publishedAt]);

  const handleSave = async () => {
    if (!content.trim()) {
      setMessage("Please write something before saving.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const { error } = await saveNote({
        article_title: title,
        article_slug: toSlug(title),
        article_url: link,
        article_date: publishedAt ?? "",
        source_name: sourceName ?? "",
        content: content.trim(),
      });

      if (error) {
        setMessage(`Unable to save note: ${error.message}`);
        setIsSaving(false);
        return;
      }

      setMessage("Note saved successfully!");
      setContent("");
      setIsSaving(false);
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
        setMessage(""); // Reset message when closing
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to save note.";
      setMessage(errorMessage);
      setIsSaving(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (isAuthenticated) {
      setMessage("");
      setContent("");
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(false);
  };

  const isErrorMessage = message.toLowerCase().includes("unable");

  const desktopVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 20, scale: 0.95 },
  };

  const mobileVariants = {
    initial: { opacity: 0, y: "100%" },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: "100%" },
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-slate-700"
      >
        <Notebook size={16} className="text-blue-600 dark:text-blue-400" />
        Add Note
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-md"
          >
            <motion.div
              variants={isMobile ? mobileVariants : desktopVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
              className="relative w-full sm:max-w-lg rounded-t-2xl rounded-b-none sm:rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:rounded-2xl sm:border-slate-200 sm:p-6 sm:shadow-2xl dark:border-slate-700 dark:bg-slate-800"
              role="dialog"
              aria-modal="true"
              aria-labelledby="note-dialog-title"
            >
              <div className="flex items-center justify-between mb-5">
                <h3
                  id="note-dialog-title"
                  className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100"
                >
                  {isAuthenticated ? "Article Notepad" : "Member Feature"}
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {isAuthenticated ? (
                <>
                  <div className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs sm:text-sm dark:border-slate-700 dark:bg-slate-900/40">
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-3">
                      <p className="sm:col-span-2">
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          Headline:
                        </span>
                        <span className="mt-1 block line-clamp-2 font-normal text-slate-900 dark:text-slate-100 sm:line-clamp-1">
                          {title}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          Date:
                        </span>
                        <span className="mt-1 block text-slate-900 dark:text-slate-100">
                          {formattedDate}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          Source:
                        </span>
                        <span className="mt-1 block text-slate-900 dark:text-slate-100">
                          {sourceName || "Unknown Source"}
                        </span>
                      </p>
                      <p className="sm:col-span-2">
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          Link:
                        </span>
                        <span className="block mt-1">
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 sm:text-sm"
                          >
                            {link}
                          </a>
                        </span>
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your thoughts and notes here..."
                    className="h-32 w-full resize-none rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-800 shadow-sm transition-all duration-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 sm:h-40 sm:text-base"
                    aria-label="Note content"
                    rows={4}
                  />

                  {message && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 text-sm font-medium px-3 py-2 rounded-lg ${
                        isErrorMessage
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}
                    >
                      {message}
                    </motion.p>
                  )}

                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSaving}
                      className="flex-1 sm:flex-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving || !content.trim()}
                      className="flex-1 sm:flex-none rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-blue-400"
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        "Save Note"
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="mb-4 rounded-full bg-blue-50 p-4 dark:bg-blue-950/40">
                    <Notebook
                      size={32}
                      className="text-blue-600 dark:text-blue-300"
                    />
                  </div>
                  <p className="mb-6 max-w-xs text-sm text-slate-600 dark:text-slate-300">
                    This functionality is only for registered members. Please
                    log in or register to save notes.🤭
                  </p>
                  <div className="flex w-full gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Close
                    </button>
                    <Link
                      href="/auth/register"
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 text-center"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
