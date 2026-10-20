"use client";

import { motion } from "framer-motion";
import { Panel, softSpring } from "./MyActivityUi";

type HeatmapDay = {
  key: string;
  count: number;
};

interface MyActivityReadingStreakProps {
  heatmap: HeatmapDay[];
}

const heatColor = (count: number) =>
  count >= 6
    ? "bg-emerald-700 dark:bg-emerald-500"
    : count >= 3
      ? "bg-emerald-500 dark:bg-emerald-400"
      : count >= 1
        ? "bg-emerald-200 dark:bg-emerald-800/70"
        : "bg-slate-100 dark:bg-slate-800";

const HEAT_LEGEND = [
  { label: "None", color: "bg-slate-100 dark:bg-slate-800" },
  { label: "1–2", color: "bg-emerald-200 dark:bg-emerald-800/70" },
  { label: "3–5", color: "bg-emerald-500 dark:bg-emerald-400" },
  { label: "6+", color: "bg-emerald-700 dark:bg-emerald-500", suffix: "activities" },
] as const;

export default function MyActivityReadingStreak({
  heatmap,
}: MyActivityReadingStreakProps) {
  return (
    <Panel
      title="Reading streak"
      description="Your recent reading streak, day by day."
    >
      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 sm:gap-2.5 lg:grid-cols-10">
          {heatmap.map((day, index) => (
            <motion.div
              key={`${day.key}-${day.count}`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...softSpring, delay: index * 0.01 }}
              whileHover={{ scale: 1.08, y: -1 }}
              className={`flex aspect-square min-w-0 items-center justify-center rounded-lg text-[10px] font-semibold sm:rounded-xl sm:text-[11px] ${heatColor(day.count)} ${
                day.count > 0
                  ? "text-emerald-950 dark:text-emerald-50"
                  : "text-slate-500 dark:text-slate-400"
              }`}
              title={`${day.key}: ${day.count} activities`}
            >
              {day.key.slice(-2)}
            </motion.div>
          ))}
        </div>

        {/* Compact, sharp legend */}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900/60">
          {HEAT_LEGEND.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              <span
                className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-[3px] ring-1 ring-black/5 dark:ring-white/10 ${item.color}`}
                aria-hidden
              />
              <span>{item.label}</span>
              {"suffix" in item && item.suffix ? (
                <span className="text-slate-400 dark:text-slate-500">{item.suffix}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
