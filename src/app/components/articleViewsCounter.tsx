"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, TrendingUp } from "lucide-react";

interface ArticleViewsCounterProps {
  articleKey: string;
  title?: string;
  publishedAt?: string | null;
  className?: string;
  iconClassName?: string;
  compact?: boolean;
}

function stableHash(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hash >>> 0);
}

function getArticleAgeBoost(publishedAt?: string | null) {
  if (!publishedAt) return 1;

  const publishedTime = new Date(publishedAt).getTime();
  if (Number.isNaN(publishedTime)) return 1;

  const hoursOld = Math.max(0, (Date.now() - publishedTime) / 36e5);
  if (hoursOld <= 6) return 1.75;
  if (hoursOld <= 24) return 1.35;
  if (hoursOld <= 72) return 1.15;
  return 0.9;
}

function getInitialViews(articleKey: string, title?: string, publishedAt?: string | null) {
  const seed = stableHash(`${articleKey}:${title ?? ""}`);
  const ageBoost = getArticleAgeBoost(publishedAt);
  const base = 1200 + (seed % 24000);
  const momentum = (seed % 11) * 137;

  return Math.round((base + momentum) * ageBoost);
}

function formatViews(views: number) {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US").format(views);
}

function getVisibleStep(views: number) {
  if (views >= 1_000_000) return 100_000;
  if (views >= 1000) return 100;
  return 1;
}

export default function ArticleViewsCounter({
  articleKey,
  title,
  publishedAt,
  className = "",
  iconClassName = "",
  compact = false,
}: ArticleViewsCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const seed = useMemo(
    () => stableHash(`${articleKey}:${title ?? ""}`),
    [articleKey, title],
  );
  const baseViews = useMemo(
    () => getInitialViews(articleKey, title, publishedAt),
    [articleKey, publishedAt, title],
  );
  const [liveViews, setLiveViews] = useState(0);
  const views = baseViews + liveViews;
  const formattedViews = formatViews(views);

  useEffect(() => {
    const intervalMs = 1600 + (seed % 1200);
    const interval = window.setInterval(() => {
      setLiveViews((current) => current + getVisibleStep(baseViews + current));
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [baseViews, seed]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}
      aria-label={`${formattedViews} views`}
      title={`${new Intl.NumberFormat("en-US").format(views)} views`}
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <Eye
          size={compact ? 13 : 14}
          className={`shrink-0 ${iconClassName}`}
          aria-hidden
        />
        {!prefersReducedMotion && (
          <motion.span
            key={formattedViews}
            initial={{ opacity: 0, scale: 0.55 }}
            animate={{ opacity: [0, 1, 0], scale: [0.7, 1.25, 0.7] }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
          />
        )}
      </span>
      <motion.span
        key={formattedViews}
        initial={prefersReducedMotion ? false : { y: -6, opacity: 0, scale: 0.96 }}
        animate={prefersReducedMotion ? {} : { y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="inline-flex items-center gap-1 font-semibold tabular-nums"
      >
        {formattedViews}
        <span>Views</span>
      </motion.span>
      {!compact && (
        <TrendingUp size={13} className="text-emerald-500" aria-hidden />
      )}
    </span>
  );
}
