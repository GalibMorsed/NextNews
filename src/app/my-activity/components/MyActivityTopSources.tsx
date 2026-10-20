"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { EmptyStateText, Panel, softSpring } from "./MyActivityUi";

interface MyActivityTopSourcesProps {
  sourceCounts: Array<[string, number]>;
}

export default function MyActivityTopSources({
  sourceCounts,
}: MyActivityTopSourcesProps) {
  const [showAllMobile, setShowAllMobile] = useState(false);

  return (
    <Panel
      title="Top sources"
      description="Sources ranked by your usage this period."
    >
      {sourceCounts.length > 0 ? (
        (() => {
          const total = sourceCounts.reduce((sum, [, count]) => sum + count, 0);

          return (
            <div className="min-w-0">
              <div className="grid min-w-0 gap-3 sm:gap-x-10 sm:gap-y-6 sm:grid-cols-2">
                {sourceCounts.map(([source, count], idx) => {
                  const max = sourceCounts[0]?.[1] ?? 1;
                  const percent = Math.max((count / max) * 100, 10);
                  const share =
                    total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
                  const isHiddenOnMobile = !showAllMobile && idx >= 2;

                  return (
                    <motion.div
                      key={source}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{
                        y: -2,
                        borderColor: "rgba(16, 185, 129, 0.4)",
                      }}
                      transition={{ ...softSpring, delay: idx * 0.03 }}
                      className={`${
                        isHiddenOnMobile ? "hidden sm:flex" : "flex"
                      } group relative min-w-0 flex-col gap-2 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:p-4 transition-all dark:border-slate-800/60 dark:bg-slate-900/40`}
                    >
                      <div className="flex items-center justify-between gap-3 px-0.5">
                        <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {source}
                        </span>
                        <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
                          {share}%
                        </span>
                      </div>
                      <div className="relative h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{
                            ...softSpring,
                            delay: 0.15 + idx * 0.04,
                          }}
                          className="h-full rounded-full bg-[linear-gradient(90deg,_rgba(16,185,129,0.95),_rgba(59,130,246,0.75))] shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {sourceCounts.length > 2 ? (
                <button
                  type="button"
                  onClick={() => setShowAllMobile((prev) => !prev)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:hidden"
                >
                  <span>
                    {showAllMobile
                      ? "Show less"
                      : `Show all (${sourceCounts.length})`}
                  </span>
                  {showAllMobile ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  )}
                </button>
              ) : null}
            </div>
          );
        })()
      ) : (
        <EmptyStateText>No source activity yet.</EmptyStateText>
      )}
    </Panel>
  );
}
