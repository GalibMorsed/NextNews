"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { updateNote, deleteNote, setNotePinned } from "../services/notesService";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bold,
  ArrowUpRight,
  Copy,
  FileText,
  Italic,
  List,
  ListOrdered,
  Minus,
  Newspaper,
  Pencil,
  Pin,
  Plus,
  Redo2,
  RemoveFormatting,
  Trash2,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import StatusPopup from "../components/statusPopup";
import LottiePlayer from "../components/LottiePlayer";

interface Note {
  id: string;
  article_title: string;
  article_url?: string;
  article_date?: string;
  source_name?: string;
  content: string;
  is_pinned?: boolean;
}

type NotePopupMessage = {
  tone: "success" | "error";
  text: string;
} | null;

function formatNoteDate(dateStr?: string) {
  if (!dateStr) return "Date not available";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  } catch {
    return dateStr;
  }
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

const NOTE_FORMATTING_TAGS = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "p",
  "div",
  "br",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "small",
  "big",
]);

function escapeNoteText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function prepareNoteHtml(value: string) {
  const hasFormatting = /<\/?(?:b|strong|i|em|u|s|p|div|br|ul|ol|li|blockquote|pre|code|small|big|font)\b/i.test(value);
  return hasFormatting
    ? sanitizeNoteHtml(value)
    : escapeNoteText(value).replace(/\r?\n/g, "<br>");
}

function sanitizeNoteHtml(value: string): string {
  const withoutDangerousBlocks = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");

  const withSafeFontSizes = withoutDangerousBlocks.replace(
    /<font\b([^>]*)>([\s\S]*?)<\/font\s*>/gi,
    (_match, attributes: string, innerHtml: string) => {
      const size = Number(attributes.match(/\bsize\s*=\s*["']?(\d)/i)?.[1] ?? 3);
      const wrapper = size >= 4 ? "big" : size <= 2 ? "small" : "span";
      return wrapper === "span"
        ? sanitizeNoteHtml(innerHtml)
        : `<${wrapper}>${sanitizeNoteHtml(innerHtml)}</${wrapper}>`;
    },
  );

  return withSafeFontSizes.replace(
    /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
    (tagText: string, rawTagName: string) => {
      const tagName = rawTagName.toLowerCase();
      if (!NOTE_FORMATTING_TAGS.has(tagName)) return "";
      if (tagName === "br") return "<br>";
      const isClosingTag = /^<\//.test(tagText);
      return isClosingTag ? `</${tagName}>` : `<${tagName}>`;
    },
  );
}

function RichNoteEditor({
  initialContent,
  onChange,
  onCopy,
}: {
  initialContent: string;
  onChange: (value: string) => void;
  onCopy: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = prepareNoteHtml(initialContent);
    }
  }, [initialContent]);

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) onChange(sanitizeNoteHtml(editorRef.current.innerHTML));
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
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-200"
    >
      {icon}
    </button>
  );

  const copyNote = async () => {
    const plainText = editorRef.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(plainText);
    } catch {
      editorRef.current?.focus();
      document.execCommand("selectAll");
      document.execCommand("copy");
      window.getSelection()?.removeAllRanges();
    }
    onCopy();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-indigo-950">
      <div
        role="toolbar"
        aria-label="Note formatting tools"
        className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/90 p-2 dark:border-slate-800 dark:bg-slate-900"
      >
        {toolbarButton("Undo", <Undo2 className="h-4 w-4" />, "undo")}
        {toolbarButton("Redo", <Redo2 className="h-4 w-4" />, "redo")}
        <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
        {toolbarButton("Bold", <Bold className="h-4 w-4" />, "bold")}
        {toolbarButton("Italic", <Italic className="h-4 w-4" />, "italic")}
        {toolbarButton("Underline", <Underline className="h-4 w-4" />, "underline")}
        <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
        {toolbarButton("Bulleted list", <List className="h-4 w-4" />, "insertUnorderedList")}
        {toolbarButton("Numbered list", <ListOrdered className="h-4 w-4" />, "insertOrderedList")}
        <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
        {toolbarButton("Decrease text size", <Minus className="h-4 w-4" />, "fontSize", "2")}
        {toolbarButton("Increase text size", <Plus className="h-4 w-4" />, "fontSize", "5")}
        {toolbarButton("Clear formatting", <RemoveFormatting className="h-4 w-4" />, "removeFormat")}
        <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
        <button
          type="button"
          title="Copy note"
          aria-label="Copy note"
          onClick={() => void copyNote()}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-200"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Edit note text"
        aria-multiline="true"
        onInput={(event) => onChange(sanitizeNoteHtml(event.currentTarget.innerHTML))}
        onPaste={(event) => {
          event.preventDefault();
          document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
        }}
        className="min-h-32 max-h-72 overflow-y-auto px-4 py-3.5 text-sm leading-relaxed text-slate-900 outline-none empty:before:content-['Write_your_note...'] empty:before:text-slate-400 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 dark:text-slate-100 dark:empty:before:text-slate-500 sm:min-h-36"
      />
    </div>
  );
}

export default function NoteCard({
  note,
  onDeleted,
  onUpdated,
  onPinned,
}: {
  note: Note;
  onDeleted?: (id: string) => void;
  onUpdated?: (id: string, content: string) => void;
  onPinned?: (id: string, isPinned: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [content, setContent] = useState(note.content);
  const [popupMessage, setPopupMessage] = useState<NotePopupMessage>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [faviconUnavailable, setFaviconUnavailable] = useState(false);
  const articleSource = getArticleSource(note.article_url);
  const sourceLabel = note.source_name || articleSource?.domain;

  useEffect(() => {
    setFaviconUnavailable(false);
  }, [note.article_url]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!popupMessage) return;
    const timer = window.setTimeout(() => setPopupMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [popupMessage]);

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

  const handleUpdate = async () => {
    const sanitizedContent = sanitizeNoteHtml(content.trim());
    const trimmedContent = /<\/?[a-z][^>]*>/i.test(sanitizedContent)
      ? sanitizedContent
      : `<p>${sanitizedContent}</p>`;
    const plainText = trimmedContent
      .replace(/<br\s*\/?\s*>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;|&#160;/gi, " ")
      .trim();

    if (!plainText) {
      setPopupMessage({
        tone: "error",
        text: "Note content cannot be empty.",
      });
      return;
    }

    setIsSaving(true);
    const { error } = await updateNote(note.id, trimmedContent);
    setIsSaving(false);

    if (error) {
      setPopupMessage({
        tone: "error",
        text: `Unable to update note: ${error.message}`,
      });
      return;
    }

    setContent(trimmedContent);
    onUpdated?.(note.id, trimmedContent);
    setIsEditing(false);
    setPopupMessage({ tone: "success", text: "Note updated successfully." });
  };

  const handleTogglePin = async () => {
    const nextPinnedState = !note.is_pinned;
    setIsPinning(true);
    try {
      const { error } = await setNotePinned(note.id, nextPinnedState);
      if (error) throw error;
      onPinned?.(note.id, nextPinnedState);
      setPopupMessage({
        tone: "success",
        text: nextPinnedState ? "Note pinned to the top." : "Note unpinned.",
      });
    } catch (pinError) {
      const message =
        pinError instanceof Error
          ? pinError.message
          : pinError && typeof pinError === "object" && "message" in pinError
            ? String(pinError.message)
            : "Unexpected error";
      setPopupMessage({ tone: "error", text: `Unable to update pin: ${message}` });
    } finally {
      setIsPinning(false);
    }
  };

  const handleCopyCardNote = async () => {
    const parsedContent = new DOMParser().parseFromString(
      prepareNoteHtml(note.content),
      "text/html",
    );
    const plainText = parsedContent.body.textContent ?? "";

    try {
      await navigator.clipboard.writeText(plainText);
      setPopupMessage({ tone: "success", text: "Note copied to clipboard." });
    } catch {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = plainText;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand("copy");
      temporaryInput.remove();

      setPopupMessage(
        copied
          ? { tone: "success", text: "Note copied to clipboard." }
          : { tone: "error", text: "Unable to copy this note." },
      );
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    const { error } = await deleteNote(note.id);
    setIsDeleting(false);

    if (error) {
      setPopupMessage({
        tone: "error",
        text: `Unable to delete note: ${error.message}`,
      });
      return;
    }

    onDeleted?.(note.id);
    setIsDeletePopupOpen(false);
    setPopupMessage({ tone: "success", text: "Note deleted successfully." });
  };

  const formattedDate = formatNoteDate(note.article_date);

  return (
    <article className={`group relative flex h-full flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all duration-300 hover:shadow-md sm:p-6 ${note.is_pinned ? "border-indigo-300 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/70 ring-1 ring-indigo-100 dark:border-indigo-800 dark:from-indigo-950/50 dark:via-slate-900 dark:to-violet-950/40 dark:ring-indigo-950" : "border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/95 dark:hover:border-slate-700"}`}>
      {note.is_pinned ? (
        <span className="absolute -top-3 right-5 z-10 inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700 shadow-sm dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
          <Pin className="h-3 w-3 fill-current" /> Pinned
        </span>
      ) : null}
      <div className="flex flex-col gap-3.5">
        {/* 1. Article Title */}
        <h3 className="text-base font-bold leading-snug tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">
          {note.article_title}
        </h3>

        {/* 2. Metadata Row: Source Pill | Date, Time ... Open article link */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {sourceLabel && (
              <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-sky-200/70 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-sky-100 dark:bg-slate-900 dark:ring-sky-900/60">
                  {articleSource && !faviconUnavailable ? (
                    <img
                      src={articleSource.favicon}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      onError={() => setFaviconUnavailable(true)}
                      className="h-4 w-4 object-contain"
                    />
                  ) : (
                    <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </span>
                <span className="truncate">{sourceLabel}</span>
              </span>
            )}

            {sourceLabel && (
              <span className="text-slate-300 dark:text-slate-700 select-none" aria-hidden="true">
                |
              </span>
            )}

            <span
              suppressHydrationWarning
              className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums"
            >
              {formattedDate}
            </span>
          </div>

          {note.article_url && (
            <a
              href={note.article_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-sky-600 transition-colors hover:text-sky-700 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
            >
              <span>Open article</span>
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* 3. Note Content Box with document icon */}
        {isEditing ? (
          <div className="mt-1">
            <RichNoteEditor
              initialContent={note.content}
              onChange={setContent}
              onCopy={() =>
                setPopupMessage({ tone: "success", text: "Note copied to clipboard." })
              }
            />
          </div>
        ) : (
          <div className="mt-1 flex items-start gap-3 rounded-xl border border-slate-100 bg-[#f4f6f8] p-3.5 sm:p-4 dark:border-slate-800/80 dark:bg-slate-800/60">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-600 dark:text-slate-400" />
            <div
              className="note-content min-w-0 flex-1 break-words text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200 [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_big]:text-lg [&_small]:text-xs"
              dangerouslySetInnerHTML={{ __html: prepareNoteHtml(note.content) }}
            />
          </div>
        )}
      </div>

      {/* 4. Action Buttons Pinned to Bottom Right */}
      <div className="mt-5 flex items-center justify-end gap-2.5 pt-1">
        {!isEditing ? (
          <>
            <button
              type="button"
              onClick={() => void handleCopyCardNote()}
              disabled={isDeleting || isSaving}
              aria-label="Copy note"
              title="Copy note"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleTogglePin()}
              disabled={isPinning || isDeleting || isSaving}
              aria-label={note.is_pinned ? "Unpin note" : "Pin note to top"}
              title={note.is_pinned ? "Unpin note" : "Pin note to top"}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${note.is_pinned ? "border-indigo-200 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:border-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900" : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300"}`}
            >
              <Pin className={`h-4 w-4 ${note.is_pinned ? "fill-current" : ""}`} />
            </button>
          </>
        ) : null}
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isSaving || isDeleting || !content.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setContent(note.content);
                setIsEditing(false);
              }}
              disabled={isSaving || isDeleting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066f5] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeletePopupOpen(true)}
              disabled={isDeleting || isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span>Delete</span>
            </button>
          </>
        )}
      </div>

      <StatusPopup
        isOpen={Boolean(popupMessage)}
        tone={popupMessage?.tone ?? "success"}
        message={popupMessage?.text ?? ""}
        onClose={() => setPopupMessage(null)}
        context="notes"
        isMobile={isMobile}
      />

      <AnimatePresence>
        {isDeletePopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              if (!isDeleting) setIsDeletePopupOpen(false);
            }}
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
                    Delete this note?
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    This action cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isDeleting) setIsDeletePopupOpen(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Close delete confirmation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 flex flex-row items-center justify-end gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setIsDeletePopupOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 sm:flex-none text-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 sm:flex-none text-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
