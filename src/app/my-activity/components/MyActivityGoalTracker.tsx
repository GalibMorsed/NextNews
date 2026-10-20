"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Flame, Target, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaPlus } from "react-icons/fa";
import { Panel, softSpring } from "./MyActivityUi";
import LottiePlayer from "../../components/LottiePlayer";

interface MyActivityGoalTrackerProps {
  currentWeekProgress: number;
  weeklyGoal: number;
  weeklyStreak: number;
  onSetWeeklyGoal: (value: number) => void;
  weekArticles: number;
  weekNotes: number;
  weekAi: number;
  readingStreak: number;
}

export default function MyActivityGoalTracker({
  currentWeekProgress,
  weeklyGoal,
  weeklyStreak,
  onSetWeeklyGoal,
  weekArticles,
  weekNotes,
  weekAi,
  readingStreak,
}: MyActivityGoalTrackerProps) {
  const targetOptions = [8, 15];
  const isGoalComplete = currentWeekProgress >= weeklyGoal;
  const [customGoalInput, setCustomGoalInput] = useState("");
  const [goalPopupMessage, setGoalPopupMessage] = useState("");
  const [isMobilePopup, setIsMobilePopup] = useState(false);
  const hasCustomGoal = !targetOptions.includes(weeklyGoal);

  useEffect(() => {
    const checkMobile = () => setIsMobilePopup(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const showGoalPopup = (message: string) => {
    setGoalPopupMessage(message);
  };

  const handleAddCustomGoal = () => {
    const rawValue = customGoalInput.trim();
    if (!rawValue) {
      showGoalPopup("Enter a custom goal to add.");
      return;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      showGoalPopup("Enter a valid number.");
      return;
    }

    const nextValue = Math.floor(parsed);
    if (nextValue < 1) {
      showGoalPopup("Minimum goal is 1.");
      return;
    }
    if (nextValue > 100) {
      showGoalPopup("Maximum goal cannot exceed 100.");
      return;
    }

    onSetWeeklyGoal(nextValue);
    setCustomGoalInput("");
  };

  return (
    <Panel
      title="Goal tracker"
      description="Weekly reading goal."
      icon={<Target className="h-5 w-5" />}
    >
      <div className="mb-4 flex flex-nowrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2">
          <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            {currentWeekProgress}
          </span>
          <span className="whitespace-nowrap text-sm font-medium text-slate-400 dark:text-slate-500 sm:text-lg">
            / {weeklyGoal} activities
          </span>
        </div>

        <motion.div
          whileHover={{ scale: 1.04 }}
          transition={softSpring}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
        >
          <Flame className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 sm:h-4 sm:w-4" />
          {weeklyStreak}-week streak
        </motion.div>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80 mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${Math.min(100, (currentWeekProgress / weeklyGoal) * 100)}%`,
          }}
          transition={{ type: "spring", stiffness: 40, damping: 12 }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 shadow-[0_0_16px_-4px_rgba(16,185,129,0.5)]"
        />
        {isGoalComplete ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 text-sm mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-medium text-slate-600 dark:text-slate-300">
          {isGoalComplete ? (
            <span className="inline-flex items-start gap-3 sm:items-center">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100/80 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:ring-emerald-800/50"
                aria-hidden="true"
              >
                <LottiePlayer
                  src="/actiivity/congrats.json"
                  className="h-10 w-10"
                  loop={true}
                />
              </span>
              <span className="leading-6">
                Goal reached! Amazing work this week.
              </span>
            </span>
          ) : (
            <>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {weeklyGoal - currentWeekProgress} more
              </span>{" "}
              to hit your weekly goal
            </>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 sm:text-right">
          Resets Mon
        </p>
      </div>

      <div className="mb-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          This week&apos;s contributions
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Articles read",
              value: weekArticles,
              dot: "bg-emerald-500",
            },
            { label: "Notes added", value: weekNotes, dot: "bg-blue-500" },
            {
              label: "Reading streak",
              value: readingStreak,
              dot: "bg-violet-500",
            },
            { label: "AI uses", value: weekAi, dot: "bg-rose-400" },
          ].map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ y: -2, transition: softSpring }}
              className="flex flex-col gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-900/60"
            >
              <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {item.value}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {item.label}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${item.dot}`}
                aria-hidden
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div id="weekly-goal-target" className="scroll-mt-24">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          Set weekly target
        </p>
        <div className="flex flex-wrap gap-2">
          {targetOptions.map((val) => (
            <button
              key={val}
              onClick={() => onSetWeeklyGoal(val)}
              className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition-all ${
                weeklyGoal === val
                  ? "border-slate-900 bg-slate-900 text-white shadow-md dark:border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-500"
              }`}
            >
              {val}
            </button>
          ))}
          {hasCustomGoal ? (
            <button
              key={`custom-${weeklyGoal}`}
              onClick={() => onSetWeeklyGoal(weeklyGoal)}
              className="rounded-2xl border border-slate-900 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all dark:border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-300"
            >
              {weeklyGoal}
            </button>
          ) : null}
          <div className="flex items-center gap-2">
            <input
              type="number"
              max="100"
              value={customGoalInput}
              placeholder="Custom"
              onChange={(e) => {
                const nextValue = e.target.value;
                if (nextValue === "") {
                  setCustomGoalInput("");
                  return;
                }

                const parsedValue = Number(nextValue);
                if (Number.isFinite(parsedValue) && parsedValue > 100) {
                  showGoalPopup("Maximum goal cannot exceed 100.");
                  setCustomGoalInput("100");
                  return;
                }

                setCustomGoalInput(nextValue);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddCustomGoal();
                }
              }}
              className="h-10 w-24 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
            />
            <button
              type="button"
              onClick={handleAddCustomGoal}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition-all hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-slate-500"
              aria-label="Add custom weekly goal"
            >
              <FaPlus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-100/80 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
        <Flame className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          {weeklyStreak}
        </span>
        <span className="text-sm text-slate-600 dark:text-slate-300">
          week streak — keep it going!
        </span>
      </div>
      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
        {goalPopupMessage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setGoalPopupMessage("")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-popup-title"
          >
            <motion.div
              variants={{
                initial: isMobilePopup
                  ? { opacity: 0, y: "100%" }
                  : { opacity: 0, y: 20, scale: 0.95 },
                animate: { opacity: 1, y: 0, scale: 1 },
                exit: isMobilePopup
                  ? { opacity: 0, y: "100%" }
                  : { opacity: 0, y: 20, scale: 0.95 },
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
              className="relative w-full overflow-hidden rounded-t-2xl border border-emerald-100 bg-white p-5 shadow-2xl dark:border-emerald-900/40 dark:bg-slate-900 sm:max-w-md sm:rounded-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-emerald-400/15 via-teal-300/15 to-blue-300/15 dark:from-emerald-400/10 dark:via-teal-400/10 dark:to-blue-400/10" />
              <div className="absolute -right-12 top-8 h-28 w-28 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/10" />

              <div className="relative flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    id="goal-popup-title"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300"
                  >
                    Goal target
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                    {goalPopupMessage}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setGoalPopupMessage("")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close goal message"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

                  <button
                    type="button"
                    onClick={() => setGoalPopupMessage("")}
                    className="relative ml-auto mt-5 block min-w-24 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-1 dark:ring-emerald-500/40 dark:hover:bg-emerald-500/30"
                  >
                    Got it
                  </button>
            </motion.div>
          </motion.div>
        ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </Panel>
  );
}
