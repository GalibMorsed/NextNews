"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Loader2, Newspaper, TrendingUp, BadgeCheck } from "lucide-react";
import { SOURCE_ACCENT_STYLES, type ExploreResponse } from "@/lib/explore";
import SourceLogo from "@/app/components/sourceLogo";
import { getSourceLogoSrc } from "@/lib/newsImage";
import type { ReactElement, ReactNode, RefObject } from "react";

type PageSurfaceProps = {
  children?: ReactNode;
  className?: string;
  index?: number;
};

type ExploreLiveStoriesAndVoicesProps = {
  PageSurface: (props: PageSurfaceProps) => ReactElement;
  regionLabel?: string;
  trendingTopics: ExploreResponse["trendingTopics"];
  sources: ExploreResponse["sourceSuggestions"];
  promoStoryIndex: number | null;
  anchorRef: RefObject<HTMLDivElement | null>;
  onTopicClick: (tag: string) => void;
  onToggleSource: (sourceName: string) => void;
  isSavingSource: string | null;
  followSet: Set<string>;
};

export default function ExploreLiveStoriesAndVoices({
  PageSurface,
  regionLabel,
  trendingTopics,
  sources,
  promoStoryIndex,
  anchorRef,
  onTopicClick,
  onToggleSource,
  isSavingSource,
  followSet,
}: ExploreLiveStoriesAndVoicesProps) {
  const label = regionLabel ?? "world";

  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.4fr]">
      <PageSurface className="relative z-10 p-6 sm:p-7">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm shadow-rose-100/50 dark:bg-rose-950/50 dark:text-rose-200">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                  AI Live Stories
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-rose-700 dark:border-rose-950/40 dark:bg-rose-950/40 dark:text-rose-200">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              Trending in {label}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {trendingTopics.map((topic, index) => (
            <div
              key={`${topic.tag}-${index}`}
              className="relative z-20"
              ref={index === promoStoryIndex ? anchorRef : undefined}
            >
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => onTopicClick(topic.tag)}
                className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-rose-50/60 px-4 py-4 text-left transition-all hover:border-[var(--primary)]/30 hover:bg-white hover:shadow-md dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:hover:bg-slate-800"
              >
                <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-lg font-semibold text-[var(--foreground)] transition-colors">
                      {topic.tag}
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-[var(--muted)]">
                      {topic.reason}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform dark:bg-emerald-950/50 dark:text-emerald-200">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.button>
            </div>
          ))}
        </div>
      </PageSurface>

      <PageSurface className="overflow-hidden p-6 sm:p-7">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 via-rose-100 to-sky-100 text-amber-700 shadow-sm dark:from-amber-950/50 dark:via-rose-950/40 dark:to-sky-950/40 dark:text-amber-200">
                <Newspaper className="h-5 w-5" />
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                Suggested Voices
              </h2>
            </div>
          </div>
          <div className="inline-flex max-w-fit rounded-full border border-amber-200/60 bg-amber-50/80 px-4 py-1.5 text-xs font-bold text-amber-700 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
            Follow Best sources from {label}.
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {sources.map((source, index) => {
            const isFollowing = followSet.has(source.name);
            const isSaving = isSavingSource === source.name;
            const accentStyle =
              SOURCE_ACCENT_STYLES[index % SOURCE_ACCENT_STYLES.length];
            const logoSrc = getSourceLogoSrc(source.url);

            return (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                key={`${source.name}-${source.regionHint}-${index}`}
                className={`group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r p-4 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:hover:border-slate-600 ${accentStyle.panel}`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <SourceLogo
                    src={logoSrc}
                    alt={source.name}
                    fallbackLabel={source.name}
                    sizeClassName="h-12 w-12"
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 xl:flex-row xl:items-center xl:gap-5">
                    <div className="min-w-0 xl:min-w-[140px]">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-base font-bold text-[var(--foreground)]">
                          {source.name}
                        </p>
                        <BadgeCheck size={14} className="text-blue-500 fill-blue-500/10 shrink-0" />
                      </div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
                        {source.regionHint}
                      </p>
                    </div>

                    <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-800 xl:block" />

                    <p className="min-w-0 flex-1 break-words text-sm leading-relaxed text-[var(--muted)] line-clamp-2 xl:line-clamp-1">
                      {source.reason}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-1 sm:justify-end sm:pt-0">
                  <button
                    type="button"
                    onClick={() => onToggleSource(source.name)}
                    disabled={isSaving}
                    className={`inline-flex min-w-[120px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${
                      isFollowing
                        ? "border-indigo-500/30 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                        : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      "Following"
                    ) : (
                      "Follow"
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </PageSurface>
    </section>
  );
}
