"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useEffect, type ReactNode } from "react";
import { saveNote } from "../services/notesService";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bold,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Italic,
  List,
  ListOrdered,
  Minus,
  Newspaper,
  Notebook,
  Pencil,
  Plus,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/superbaseClient";
import { getVerifiedAuthUser } from "@/lib/clientAuth";

interface AddNoteButtonProps {
  title: string;
  link: string;
  publishedAt?: string;
  sourceName?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  buttonIcon?: "notebook" | "pencil" | "none";
}

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function getArticleSource(articleUrl?: string) {
  if (!articleUrl) return null;
  try {
    const url = new URL(articleUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const domain = url.hostname.replace(/^www\./, "");
    return {
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
    };
  } catch {
    return null;
  }
}

function formatArticleDate(dateStr?: string) {
  if (!dateStr) return "Date not available";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

const sanitizeNoteHtml = (html: string) => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
};

export default function AddNoteButton({
  title,
  link,
  publishedAt,
  sourceName,
  buttonLabel,
  buttonClassName,
  buttonIcon,
}: AddNoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [faviconUnavailable, setFaviconUnavailable] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const articleSource = useMemo(() => getArticleSource(link), [link]);
  const sourceLabel = sourceName || articleSource?.domain || "";

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        if (
          localStorage.getItem("auth_token") ||
          localStorage.getItem("auth_email")
        ) {
          if (isMounted) setIsAuthenticated(true);
          return;
        }
        const { user } = await getVerifiedAuthUser();
        if (isMounted) setIsAuthenticated(Boolean(user));
      } catch {
        // silently ignore AbortError / navigator-lock timeout
      }
    };

    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setIsAuthenticated(Boolean(session?.user));
    });

    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("resize", checkMobile);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setFaviconUnavailable(false);
  }, [link]);

  const formattedDate = useMemo(() => {
    return formatArticleDate(publishedAt);
  }, [publishedAt]);

  const plainText = useMemo(() => {
    return content
      .replace(/<br\s*\/?>/gi, "")
      .replace(/<\/?[a-z][^>]*>/gi, "")
      .replace(/&nbsp;|&#160;/gi, " ")
      .trim();
  }, [content]);

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(sanitizeNoteHtml(editorRef.current.innerHTML));
    }
  };

  const toolbarButton = (
    label: string,
    icon: ReactNode,
    command: string,
    value?: string,
  ) => (
    <button
      key={label}
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => runCommand(command, value)}
      className="inline-flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:text-slate-300 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 active:scale-95"
    >
      {icon}
    </button>
  );

  const copyNote = async () => {
    const text = editorRef.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      editorRef.current?.focus();
      document.execCommand("selectAll");
      document.execCommand("copy");
      window.getSelection()?.removeAllRanges();
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!plainText) {
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
        source_name: sourceLabel,
        content: content.trim(),
      });

      if (error) {
        setMessage(`Unable to save note: ${error.message}`);
        setIsSaving(false);
        return;
      }

      setMessage("Note saved successfully!");
      setContent("");
      if (editorRef.current) editorRef.current.innerHTML = "";
      setIsSaving(false);
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
        setMessage("");
      }, 1200);
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
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
          editorRef.current.focus();
        }
      }, 60);
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
    initial: { opacity: 0, y: 16, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 16, scale: 0.96 },
  };

  const mobileVariants = {
    initial: { opacity: 0, y: "100%" },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: "100%" },
  };

  const resolvedButtonClassName =
    buttonClassName ??
    "inline-flex whitespace-nowrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-slate-700";
  const resolvedButtonLabel = buttonLabel ?? "Add Note";
  const resolvedButtonIcon = buttonIcon ?? "notebook";
  const buttonIconNode =
    resolvedButtonIcon === "pencil" ? (
      <Pencil
        size={20}
        className="group-hover:rotate-12 transition-transform"
      />
    ) : resolvedButtonIcon === "notebook" ? (
      <Notebook size={16} className="text-blue-600 dark:text-blue-400" />
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={resolvedButtonClassName}
      >
        {buttonIconNode}
        {resolvedButtonLabel}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              variants={isMobile ? mobileVariants : desktopVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.24 }}
              className="relative w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[92vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="note-dialog-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <Notebook size={16} />
                  </span>
                  <h3
                    id="note-dialog-title"
                    className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100"
                  >
                    {isAuthenticated ? "Article Notepad" : "Member Feature"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </div>

              {isAuthenticated ? (
                <>
                  {/* Article Metadata Card */}
                  <div className="mb-3.5 sm:mb-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 sm:p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/50">
                    {/* Headline */}
                    <div className="mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                        Headline
                      </span>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 text-xs sm:text-sm leading-snug">
                        {title}
                      </h4>
                    </div>

                    {/* Unified Metadata Row: Date, Source, and Domain Link Pill */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2 dark:border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Source Badge with Favicon */}
                        {sourceLabel && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200/70 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-300">
                            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center overflow-hidden rounded bg-white dark:bg-slate-900">
                              {articleSource && !faviconUnavailable ? (
                                <img
                                  src={articleSource.favicon}
                                  alt=""
                                  loading="lazy"
                                  onError={() => setFaviconUnavailable(true)}
                                  className="h-3 w-3 object-contain"
                                />
                              ) : (
                                <Newspaper size={10} />
                              )}
                            </span>
                            <span className="truncate max-w-[110px]">{sourceLabel}</span>
                          </span>
                        )}

                        {/* Date */}
                        <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                          <Calendar size={11} className="text-slate-400" />
                          {formattedDate}
                        </span>
                      </div>

                      {/* Compact Domain Link Pill */}
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={link}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] sm:text-xs font-medium text-slate-600 shadow-2xs transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
                        >
                          <ExternalLink size={11} className="text-slate-400" />
                          <span className="max-w-[120px] sm:max-w-[180px] truncate">
                            {articleSource?.domain || "Source link"}
                          </span>
                          <span className="text-[10px] text-slate-400">↗</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Rich-Text Write Pad */}
                  <div className="overflow-hidden rounded-xl border border-slate-300/90 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-blue-950/60 shadow-2xs">
                    {/* Adaptive Toolbar */}
                    <div
                      role="toolbar"
                      aria-label="Note formatting tools"
                      className="flex items-center gap-0.5 sm:gap-1 border-b border-slate-200/80 bg-slate-50/90 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900"
                    >
                      {toolbarButton("Undo", <Undo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, "undo")}
                      {toolbarButton("Redo", <Redo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, "redo")}

                      <span className="mx-0.5 sm:mx-1 h-4.5 w-px bg-slate-200 dark:bg-slate-700" />

                      {toolbarButton("Bold", <Bold className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, "bold")}
                      {toolbarButton("Italic", <Italic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, "italic")}
                      {toolbarButton("Underline", <Underline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, "underline")}

                      <span className="mx-0.5 sm:mx-1 h-4.5 w-px bg-slate-200 dark:bg-slate-700" />

                      {toolbarButton("Bulleted list", <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, "insertUnorderedList")}
                      <span className="hidden sm:inline-flex">
                        {toolbarButton("Numbered list", <ListOrdered className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, "insertOrderedList")}
                      </span>

                      {/* Extended desktop toolbar tools */}
                      <span className="hidden sm:inline-flex items-center">
                        <span className="mx-1 h-4.5 w-px bg-slate-200 dark:bg-slate-700" />
                        {toolbarButton("Decrease text size", <Minus className="h-4 w-4" />, "fontSize", "2")}
                        {toolbarButton("Increase text size", <Plus className="h-4 w-4" />, "fontSize", "5")}
                        {toolbarButton("Clear formatting", <RemoveFormatting className="h-4 w-4" />, "removeFormat")}
                      </span>

                      {/* Copy Button */}
                      <div className="ml-auto flex items-center">
                        <span className="mx-0.5 sm:mx-1 h-4.5 w-px bg-slate-200 dark:bg-slate-700" />
                        <button
                          type="button"
                          title="Copy note"
                          aria-label="Copy note"
                          onClick={() => void copyNote()}
                          className="inline-flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:text-slate-300 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 active:scale-95"
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ContentEditable Write Area */}
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      role="textbox"
                      aria-label="Write note"
                      aria-multiline="true"
                      onInput={(event) =>
                        setContent(sanitizeNoteHtml(event.currentTarget.innerHTML))
                      }
                      onPaste={(event) => {
                        event.preventDefault();
                        document.execCommand(
                          "insertText",
                          false,
                          event.clipboardData.getData("text/plain"),
                        );
                      }}
                      className="min-h-32 max-h-56 sm:min-h-36 sm:max-h-60 overflow-y-auto px-3.5 py-3 text-sm leading-relaxed text-slate-900 outline-none empty:before:content-['Write_your_thoughts_and_notes_here...'] empty:before:text-slate-400 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 dark:text-slate-100 dark:empty:before:text-slate-500"
                    />
                  </div>

                  {message && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 text-xs font-medium px-3 py-2 rounded-lg ${
                        isErrorMessage
                          ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                      }`}
                    >
                      {message}
                    </motion.p>
                  )}

                  {/* Actions: Cancel and Save Note ALWAYS in One Row */}
                  <div className="mt-4 sm:mt-5 flex flex-row items-center gap-2.5 sm:gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSaving}
                      className="flex-1 sm:flex-initial rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving || !plainText}
                      className="flex-1 sm:flex-initial rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xs transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-blue-400"
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
