"use client";

import { useEffect, useState } from "react";

interface NewsStatsTickerProps {
  initialArticlesCount: number;
}

function getStatsForTime(articlesCount: number, timeMs: number) {
  const date = new Date(timeMs);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const tenMinuteSlot = Math.floor(minutes / 10);

  // Seed hash based on date (year, month, day, hours, tenMinuteSlot)
  const seed =
    date.getFullYear() * 10000 +
    (date.getMonth() + 1) * 100 +
    date.getDate() +
    hours * 10 +
    tenMinuteSlot;

  // Simple LCG pseudo-random number generator
  const lcg = (s: number) => {
    return (s * 1664525 + 1013904223) % 4294967296;
  };

  const r1 = lcg(seed);
  const r2 = lcg(r1);
  const r3 = lcg(r2);

  // Base stories processed: articlesCount * 3 + timeOfDayBonus + variation
  const baseStories = Math.max(45, articlesCount * 3);
  const timeOfDayBonus = hours * 8 + tenMinuteSlot * 2;
  const storiesProcessed = baseStories + timeOfDayBonus + (r1 % 15);

  // Events you should know today
  const eventsYouShouldKnow = 5 + (r2 % 12) + Math.floor(hours / 2);

  // Read time for key events (approx 20-30 seconds per event, ranging from 3 to 12 mins)
  const totalReadTime = Math.max(
    3,
    Math.min(12, Math.floor(eventsYouShouldKnow * 0.4) + (r3 % 3) + 1),
  );

  return {
    storiesProcessed,
    eventsYouShouldKnow,
    totalReadTime,
  };
}

// Static fallback timestamp to ensure consistent SSR/hydration
const STATIC_FALLBACK_TIMESTAMP = 1780665600000; // June 5, 2026 12:00:00 UTC

export default function NewsStatsTicker({
  initialArticlesCount,
}: NewsStatsTickerProps) {
  const [stats, setStats] = useState(() =>
    getStatsForTime(initialArticlesCount, STATIC_FALLBACK_TIMESTAMP),
  );

  useEffect(() => {
    // Set to current live stats on mount asynchronously to prevent cascading synchronous renders
    const initTimer = setTimeout(() => {
      setStats(getStatsForTime(initialArticlesCount, Date.now()));
    }, 0);

    // Align with the next 10-minute boundary
    const getMsUntilNextInterval = () => {
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      const nextTenMinutes = Math.ceil(now / tenMinutes) * tenMinutes;
      return nextTenMinutes - now;
    };

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const setupTimer = () => {
      const msUntilNext = getMsUntilNextInterval();
      timeoutId = setTimeout(() => {
        setStats(getStatsForTime(initialArticlesCount, Date.now()));

        intervalId = setInterval(() => {
          setStats(getStatsForTime(initialArticlesCount, Date.now()));
        }, 10 * 60 * 1000);
      }, msUntilNext);
    };

    setupTimer();

    return () => {
      clearTimeout(initTimer);
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [initialArticlesCount]);

  const handleScrollToArticles = () => {
    const element = document.getElementById("articles-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <p className="text-sm md:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
      Here&apos;s what happened while you were away.{" "}
      <span
        onClick={handleScrollToArticles}
        className="font-extrabold text-slate-800 dark:text-slate-200 border-b-2 border-indigo-500/70 dark:border-indigo-400/70 pb-0.5 mx-0.5 cursor-pointer hover:border-indigo-600 dark:hover:border-indigo-400 transition-colors duration-200"
        style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}
        title="Scroll to articles"
      >
        {stats.storiesProcessed}
      </span>{" "}
      Stories Processed,{" "}
      <span
        onClick={handleScrollToArticles}
        className="font-extrabold text-slate-800 dark:text-slate-200 border-b-2 border-violet-500/70 dark:border-violet-400/70 pb-0.5 mx-0.5 cursor-pointer hover:border-violet-600 dark:hover:border-violet-400 transition-colors duration-200"
        style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}
        title="Scroll to articles"
      >
        {stats.eventsYouShouldKnow}
      </span>{" "}
      Events You Should Know Today, Read in{" "}
      <span
        onClick={handleScrollToArticles}
        className="font-extrabold text-slate-800 dark:text-slate-200 border-b-2 border-emerald-500/70 dark:border-emerald-400/70 pb-0.5 mx-0.5 cursor-pointer hover:border-emerald-600 dark:hover:border-emerald-400 transition-colors duration-200"
        style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}
        title="Scroll to articles"
      >
        {stats.totalReadTime}
      </span>{" "}
      Minutes.
    </p>
  );
}
