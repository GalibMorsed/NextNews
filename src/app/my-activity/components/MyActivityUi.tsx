"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export const softSpring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 24,
};

export function CountUpValue({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const from = previousValue.current;
    previousValue.current = value;
    if (reduceMotion || from === value) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const duration = 420;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, value]);

  return <span className="tabular-nums">{displayValue}</span>;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  delta,
  suffix,
  periodText,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  delta?: number;
  suffix?: string;
  periodText?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.article
      variants={fadeUp}
      transition={softSpring}
      whileHover={{ y: -2, transition: softSpring }}
      className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 sm:p-5 shadow-2xs backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-[0_12px_36px_-24px_rgba(16,185,129,0.18)] sm:rounded-3xl"
    >
      {/* 1st row: Icon and title text */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <span className="inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-800/40 [&>svg]:h-3.5 [&>svg]:w-3.5 sm:[&>svg]:h-4 sm:[&>svg]:w-4">
          {icon}
        </span>
        <p className="min-w-0 flex-1 truncate text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
      </div>

      {/* 2nd row: Number showing only */}
      <div className="mt-2.5 sm:mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-baseline gap-1">
        <CountUpValue value={value} />
        {suffix ? (
          <span className="text-xs sm:text-base font-semibold text-slate-500 dark:text-slate-400">
            {suffix}
          </span>
        ) : null}
      </div>

      {/* 3rd row: vs period text */}
      <div className="mt-1.5 sm:mt-2 min-h-[18px] sm:min-h-[20px] flex items-center">
        {typeof delta === "number" ? (
          <div
            className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold ${
              positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {positive ? (
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            )}
            <span>{Math.abs(delta)}% vs last period</span>
          </div>
        ) : periodText ? (
          <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span>{periodText}</span>
          </div>
        ) : null}
      </div>

      {/* 4th row: Normal text */}
      <p className="mt-2 text-[11px] sm:text-xs leading-normal sm:leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
        {subtitle}
      </p>
    </motion.article>
  );
}

export function Panel({
  title,
  description,
  children,
  icon,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <motion.section
      variants={fadeUp}
      transition={softSpring}
      className="rounded-[30px] border border-slate-200/80 bg-white/90 p-5 shadow-sm sm:p-6 dark:border-slate-700/80 dark:bg-slate-900/88 dark:shadow-[0_18px_52px_-34px_rgba(16,185,129,0.18)]"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>
        {icon ? (
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {icon}
          </span>
        ) : null}
      </div>
      {children}
    </motion.section>
  );
}

export function SummaryRow({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={softSpring}
      whileHover={{ x: 3, transition: softSpring }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-4 dark:border-slate-700/80 dark:bg-slate-950/40"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--primary)] shadow-sm dark:bg-slate-800">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{detail}</p>
      </div>
    </motion.div>
  );
}

export function EmptyStateText({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="rounded-[24px] border border-slate-200/80 bg-white px-4 py-5 text-sm leading-6 text-slate-500 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-400"
    >
      {children}
    </motion.div>
  );
}
