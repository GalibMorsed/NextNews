"use client";

import { motion } from "framer-motion";
import { fadeUp, softSpring } from "./MyActivityUi";

type RangeOption<TLabel extends string> = { label: TLabel };

interface MyActivityHeaderProps<TLabel extends string> {
  selectedRange: TLabel;
  rangeOptions: readonly RangeOption<TLabel>[];
  onRangeChange: (label: TLabel) => void;
  pageError?: string | null;
}

export default function MyActivityHeader<TLabel extends string>({
  selectedRange,
  rangeOptions,
  onRangeChange,
  pageError,
}: MyActivityHeaderProps<TLabel>) {
  return (
    <motion.section
      variants={fadeUp}
      transition={softSpring}
      className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/95 p-4 sm:px-6 sm:py-5 shadow-xs backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-[0_12px_40px_-24px_rgba(16,185,129,0.2)]"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            My Activity
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Your reading insights, history, and AI activity in one place.{"\u{1F9D0}"}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-slate-100/70 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Selected filter:{" "}
            <motion.span
              key={selectedRange}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="font-semibold text-slate-800 dark:text-slate-200"
            >
              {selectedRange}
            </motion.span>
          </div>
          {pageError ? (
            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
              {pageError}
            </p>
          ) : null}
        </div>

        <div className="flex w-full sm:w-auto items-center gap-1.5 sm:gap-2 flex-nowrap overflow-x-auto pb-0.5 sm:pb-0">
          {rangeOptions.map(({ label }) => {
            const isSelected = selectedRange === label;
            return (
              <motion.button
                key={label}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={softSpring}
                onClick={() => onRangeChange(label)}
                className={`flex-1 sm:flex-initial whitespace-nowrap text-center rounded-full border px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-600 shadow-2xs dark:border-indigo-500/80 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "border-slate-200/90 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
