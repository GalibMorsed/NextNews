"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NoteCard from "./noteCard";
import { getUserNotes } from "../services/notesService";

interface Note {
  id: string;
  article_title: string;
  article_url?: string;
  article_date?: string;
  source_name?: string;
  content: string;
  is_pinned?: boolean;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const { data, error: fetchError } = await getUserNotes();

      if (fetchError) {
        setError(fetchError.message);
        setNotes([]);
      } else {
        setError(null);
        setNotes((data as Note[]) ?? []);
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Unexpected error";
      setError(message);
      setNotes([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const sortedNotes = useMemo(
    () =>
      [...notes].sort((a, b) => {
        const pinOrder = Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned));
        if (pinOrder !== 0) return pinOrder;
        const dateA = a.article_date ? new Date(a.article_date).getTime() : 0;
        const dateB = b.article_date ? new Date(b.article_date).getTime() : 0;
        return dateB - dateA;
      }),
    [notes],
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 py-8 sm:py-10 dark:bg-slate-900">
        <div className="mx-auto w-[90%] animate-pulse space-y-5">
          <div className="h-28 rounded-3xl bg-white dark:bg-slate-800" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <div className="h-44 rounded-2xl bg-white dark:bg-slate-800" />
            <div className="h-44 rounded-2xl bg-white dark:bg-slate-800" />
            <div className="h-44 rounded-2xl bg-white dark:bg-slate-800" />
            <div className="h-44 rounded-2xl bg-white dark:bg-slate-800" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-slate-50 py-8 sm:py-10 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#e2e8f0,_#f8fafc_55%,_#ffffff)] dark:hidden" />
      <div className="relative mx-auto w-[90%] space-y-4 sm:space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/80 px-4 py-3.5 sm:px-6 sm:py-4 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Your Notes
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Archive
                </span>
              </div>

              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Your highlights, summaries, and notes, organized in one place.
              </p>
            </div>

            {/* Compact count badge */}
            <div className="flex items-center self-start sm:self-auto gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/90 px-3.5 py-1.5 dark:border-slate-800 dark:bg-slate-800/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Notes:
              </span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {notes.length}
              </span>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            <p className="font-semibold">Unable to load notes</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => void loadNotes(true)}
              className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-700 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-900/40"
            >
              Try Again
            </button>
          </section>
        ) : null}

        {!error && sortedNotes.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              No notes yet
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Save notes from any article and they will appear here.
            </p>
          </section>
        ) : null}

        {sortedNotes.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-5 lg:gap-6 items-stretch">
            {sortedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onDeleted={(id) =>
                  setNotes((prev) => prev.filter((item) => item.id !== id))
                }
                onUpdated={(id, content) =>
                  setNotes((prev) =>
                    prev.map((item) =>
                      item.id === id ? { ...item, content } : item,
                    ),
                  )
                }
                onPinned={(id, isPinned) =>
                  setNotes((prev) =>
                    prev.map((item) =>
                      item.id === id ? { ...item, is_pinned: isPinned } : item,
                    ),
                  )
                }
              />
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
