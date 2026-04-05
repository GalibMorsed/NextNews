"use client";

import { useEffect, useState } from "react";
import { updateNote, deleteNote } from "../services/notesService";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, X } from "lucide-react";
import StatusPopup from "../components/statusPopup";

interface Note {
  id: string;
  article_title: string;
  article_url?: string;
  article_date?: string;
  source_name?: string;
  content: string;
}

type NotePopupMessage = {
  tone: "success" | "error";
  text: string;
} | null;

export default function NoteCard({
  note,
  onDeleted,
  onUpdated,
}: {
  note: Note;
  onDeleted?: (id: string) => void;
  onUpdated?: (id: string, content: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [content, setContent] = useState(note.content);
  const [popupMessage, setPopupMessage] = useState<NotePopupMessage>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    const trimmedContent = content.trim();

    if (!trimmedContent) {
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

  const formattedDate = note.article_date
    ? new Date(note.article_date).toLocaleString()
    : "Date not available";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="max-w-3xl text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100 sm:text-xl">
          {note.article_title}
        </h3>
        {note.source_name ? (
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:border-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
            {note.source_name}
          </span>
        ) : null}
      </div>

      <p
        suppressHydrationWarning
        className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300"
      >
        {formattedDate}
      </p>

      {note.article_url ? (
        <a
          href={note.article_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          Open article
          <ArrowUpRight className="h-4 w-4" />
        </a>
      ) : null}

      {isEditing ? (
        <div className="mt-4">
          <label htmlFor={`note-${note.id}`} className="sr-only">
            Edit note content
          </label>
          <textarea
            id={`note-${note.id}`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-32 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900"
          />
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {note.content}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isSaving || isDeleting || !content.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={isDeleting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Edit
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsDeletePopupOpen(true)}
          disabled={isDeleting || isSaving}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
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
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
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

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsDeletePopupOpen(false)}
                  disabled={isDeleting}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
