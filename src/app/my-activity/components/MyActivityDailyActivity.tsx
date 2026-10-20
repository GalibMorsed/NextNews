"use client";

import { motion } from "framer-motion";
import { Panel, softSpring } from "./MyActivityUi";

type ChartBucket = {
  label: string;
  count: number;
};

interface MyActivityDailyActivityProps {
  chartBuckets: ChartBucket[];
}

export default function MyActivityDailyActivity({
  chartBuckets,
}: MyActivityDailyActivityProps) {
  const max = Math.max(...chartBuckets.map((entry) => entry.count), 1);

  return (
    <Panel
      title="Daily reading activity"
      description="A visual trend area for usage over time."
    >
      <div className="flex h-[280px] items-end gap-4 rounded-[24px] border border-slate-200/80 bg-white px-4 pb-6 pt-8 dark:border-slate-700 dark:bg-slate-950/40">
        {chartBuckets.map((item, index) => {
          const height = Math.max(
            (item.count / max) * 180,
            item.count > 0 ? 24 : 8,
          );

          return (
            <div
              key={item.label}
              className="flex flex-1 flex-col items-center gap-3"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {item.count}
              </div>
              <div className="flex h-[180px] w-full items-end">
                <motion.div
                  key={`${item.label}-${item.count}`}
                  initial={{ height: 0, opacity: 0.7 }}
                  animate={{ height: `${height}px`, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 180,
                    damping: 20,
                    delay: 0.12 + index * 0.08,
                  }}
                  className="relative w-full overflow-hidden rounded-t-2xl bg-[linear-gradient(180deg,_rgba(16,185,129,0.95),_rgba(20,184,166,0.78)_58%,_rgba(59,130,246,0.72))]"
                  title={`${item.label}: ${item.count}`}
                >
                  <motion.span
                    aria-hidden
                    className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%", opacity: 0 }}
                    animate={{ x: "300%", opacity: [0, 1, 0] }}
                    transition={{
                      duration: 0.8,
                      ease: "easeInOut",
                      delay: 0.25 + index * 0.06,
                    }}
                  />
                </motion.div>
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
