"use client";

import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { Bot, BrainCircuit, TrendingDown, TrendingUp } from "lucide-react";
import { EmptyStateText, Panel, softSpring } from "./MyActivityUi";

type IconType = ComponentType<{ className?: string }>;

type AnalystCard = {
  title: string;
  description: string;
  icon: IconType;
  delta?: number;
};

type AiUsageItem = {
  label: string;
  count: number;
  percent: number;
  color: string;
  icon: IconType;
};

type TopicSummary = {
  topic: string;
  count: number;
  percent: number;
};

interface MyActivityAiAnalystsProps {
  analystCards: readonly AnalystCard[];
  mostSummarizedTopics: readonly TopicSummary[];
  aiUsageDistribution: readonly AiUsageItem[];
  totalAiUsage: number;
}

export default function MyActivityAiAnalysts({
  analystCards,
  mostSummarizedTopics,
  aiUsageDistribution,
  totalAiUsage,
}: MyActivityAiAnalystsProps) {
  return (
    <Panel
      title="AI analysts"
      description="AI usage: summaries and suggestions."
      icon={<Bot className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {analystCards.map(({ title, description, icon: Icon, delta }, index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...softSpring, delay: index * 0.05 }}
            whileHover={{ y: -2, transition: softSpring }}
            className="rounded-2xl sm:rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(240,253,250,0.85))] p-4 sm:p-5 shadow-xs sm:shadow-sm dark:border-slate-800 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(10,18,34,0.92))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_10px_30px_-15px_rgba(16,185,129,0.1)]"
          >
            {/* 1st row on mobile: Icon and Title inline together */}
            <div className="flex items-center gap-3 sm:block">
              <span className="inline-flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-1 dark:ring-emerald-700/30">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-base sm:text-lg font-bold sm:font-semibold text-slate-900 dark:text-slate-100 sm:mt-4">
                {title}
              </h3>
            </div>

            {/* 2nd row on mobile: Normal text */}
            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300/90 sm:mt-2 sm:leading-6">
              {description}
            </p>

            {/* 3rd row on mobile: Period delta text badge */}
            {typeof delta === "number" ? (
              <div
                className={`mt-3 sm:mt-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                  delta >= 0
                    ? "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-rose-200/60 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-950/40 dark:text-rose-300"
                }`}
              >
                {delta >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {Math.abs(delta)}% vs last period
              </div>
            ) : null}
          </motion.article>
        ))}

        <motion.div
          whileHover={{ y: -4, transition: softSpring }}
          className="rounded-[24px] border border-slate-200/80 bg-slate-50/90 p-4 shadow-sm sm:p-5 dark:border-slate-700/80 dark:bg-slate-950/40 dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Most summarized topics
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Topics summarized most often.
              </p>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-emerald-300 dark:ring-slate-700">
              <BrainCircuit className="h-4 w-4" />
            </span>
          </div>

          {mostSummarizedTopics.length > 0 ? (
            <div className="mt-4 space-y-4">
              {mostSummarizedTopics.slice(0, 4).map((item) => (
                <div key={item.topic} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0 truncate font-medium capitalize text-slate-800 dark:text-slate-100">
                      {item.topic.replaceAll("-", " ")}
                    </div>
                    <div className="shrink-0 text-slate-500 dark:text-slate-400">
                      {item.count} uses
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ ...softSpring, delay: 0.2 }}
                      className="h-full rounded-full bg-[linear-gradient(90deg,_rgba(16,185,129,0.95),_rgba(59,130,246,0.75))]"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateText>
              No AI summaries yet. Use the AI summary on an article.
            </EmptyStateText>
          )}
        </motion.div>

        <motion.div
          whileHover={{ y: -4, transition: softSpring }}
          className="rounded-[24px] border border-slate-200/80 bg-slate-50/90 p-4 shadow-sm sm:p-5 lg:col-span-2 xl:col-span-1 dark:border-slate-700/80 dark:bg-slate-950/40 dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                AI usage distribution
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Breakdown of AI services.
              </p>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-blue-300 dark:ring-slate-700">
              <Bot className="h-4 w-4" />
            </span>
          </div>

          {totalAiUsage > 0 ? (
            <div className="mt-6 space-y-5">
              {aiUsageDistribution.map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...softSpring, delay: idx * 0.1 }}
                  className="space-y-2.5"
                >
                  <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} text-white shadow-sm`}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-50">
                        {item.percent}%
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        ({item.count})
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 60,
                        damping: 15,
                        delay: 0.3 + idx * 0.1,
                      }}
                      className={`h-full rounded-full bg-gradient-to-r ${item.color} shadow-[0_0_8px_-1px_rgba(59,130,246,0.3)]`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyStateText>
              No AI activity recorded in this range.
            </EmptyStateText>
          )}
        </motion.div>
      </div>
    </Panel>
  );
}
