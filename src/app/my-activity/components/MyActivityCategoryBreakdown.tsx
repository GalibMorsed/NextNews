"use client";

import { motion } from "framer-motion";
import { EmptyStateText, Panel, softSpring } from "./MyActivityUi";

type CategoryBreakdownItem = {
  category: string;
  count: number;
  percent: number;
};

interface MyActivityCategoryBreakdownProps {
  categoryBreakdown: CategoryBreakdownItem[];
}

export default function MyActivityCategoryBreakdown({
  categoryBreakdown,
}: MyActivityCategoryBreakdownProps) {
  return (
    <Panel
      title="Category breakdown"
      description="Categories ranked by your usage this period."
    >
      {categoryBreakdown.length > 0 ? (
        <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {categoryBreakdown.map((item, idx) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{
                y: -2,
                borderColor: "rgba(16, 185, 129, 0.4)",
              }}
              transition={{ ...softSpring, delay: idx * 0.04 }}
              className="group relative flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition-colors dark:border-slate-800/50 dark:bg-slate-900/40"
            >
              <div className="flex items-center justify-between gap-3 px-0.5">
                <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-200">
                  {item.category.replaceAll("-", " ")}
                </span>
                <span className="text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
                  {item.percent}%
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percent}%` }}
                  transition={{
                    ...softSpring,
                    delay: 0.2 + idx * 0.05,
                  }}
                  className="h-full rounded-full bg-[linear-gradient(90deg,_rgba(16,185,129,0.95),_rgba(59,130,246,0.75))] shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]"
                />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyStateText>
          No category usage found yet. Open any categories.
        </EmptyStateText>
      )}
    </Panel>
  );
}
