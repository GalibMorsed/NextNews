"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Calendar, Trophy, ChevronRight } from "lucide-react";
import UnderConstructionPopup from "./UnderConstructionPopup";

export default function FifaSection() {
  const [minute, setMinute] = useState(45);
  const [homeScore, setHomeScore] = useState(2);
  const [awayScore, setAwayScore] = useState(1);
  const [goalEvent, setGoalEvent] = useState<{
    active: boolean;
    team: "Brazil" | "Argentina" | null;
  }>({ active: false, team: null });
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Score simulation logic:
  // Minute increments by 1 every second.
  // Match starts at 45'.
  // Goals at:
  // 48' -> Argentina scores (2 - 2)
  // 56' -> Brazil scores (3 - 2)
  // 68' -> Argentina scores (3 - 3)
  // 77' -> Brazil scores (4 - 3)
  // 85' -> Argentina scores (4 - 4)
  // 90' -> FT (Full Time), shows FT for 3 seconds, then resets to 45' (2 - 1).
  useEffect(() => {
    const timer = setInterval(() => {
      setMinute((prevMin) => {
        if (prevMin >= 90) {
          // Reset score and minute after displaying FT
          setHomeScore(2);
          setAwayScore(1);
          return 45;
        }

        const nextMin = prevMin + 1;

        // Check if a goal happens at this new minute
        if (nextMin === 48) {
          setAwayScore(2);
          triggerGoal("Argentina");
        } else if (nextMin === 56) {
          setHomeScore(3);
          triggerGoal("Brazil");
        } else if (nextMin === 68) {
          setAwayScore(3);
          triggerGoal("Argentina");
        } else if (nextMin === 77) {
          setHomeScore(4);
          triggerGoal("Brazil");
        } else if (nextMin === 85) {
          setAwayScore(4);
          triggerGoal("Argentina");
        }

        return nextMin;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const triggerGoal = (team: "Brazil" | "Argentina") => {
    setGoalEvent({ active: true, team });
    setTimeout(() => {
      setGoalEvent({ active: false, team: null });
    }, 2000);
  };

  const handleButtonClick = () => {
    setIsPopupOpen(true);
  };

  return (
    <>
      <div
        className="
          relative w-full rounded-3xl overflow-hidden mb-10
          bg-cover bg-center bg-no-repeat min-h-[300px] flex items-center
          border border-white/15
          shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]
          transition-all duration-300 hover:border-white/25 hover:shadow-[0_30px_70px_-10px_rgba(99,102,241,0.25),0_25px_60px_-15px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.35)]
        "
        style={{ backgroundImage: `url('/fifaBG.png')` }}
      >
        {/* Dark overlay for readability on different screens */}
        <div className="absolute inset-0 bg-slate-950/20 mix-blend-multiply" />

        {/* Inner Content Grid */}
        <div className="relative z-10 w-full px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10 xl:py-12 grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-center">
          {/* Left Column: Trophy, Titles & Buttons */}
          <div className="xl:col-span-7 2xl:col-span-8 flex flex-col items-stretch gap-5 xl:gap-0">
            
            {/* Cup Row (Mobile & Tablet) */}
            <div className="flex items-center gap-3 xl:hidden">
              <div className="shrink-0 cursor-pointer flex items-center" onClick={handleButtonClick}>
                <img
                  src="/fifaCup.jpg"
                  alt="FIFA Cup Left"
                  className="w-12 h-12 object-contain"
                />
              </div>
              
              {/* Vertical Separator Line for Mobile */}
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/25 to-transparent self-center mx-1" />

              <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-300/95 uppercase">
                FIFA World Cup 2026
              </span>
            </div>

            {/* Header Block for Desktop & Main Text/Buttons */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-6 xl:gap-0">
              {/* Desktop Logo */}
              <div className="hidden xl:flex shrink-0 items-center justify-center pr-6 group cursor-pointer" onClick={handleButtonClick}>
                <img
                  src="/fifaCup.jpg"
                  alt="FIFA Cup Left"
                  className="w-16 sm:w-20 md:w-[88px] h-auto object-contain transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Vertical Separator Line */}
              <div className="hidden xl:block w-px h-28 bg-gradient-to-b from-transparent via-white/25 to-transparent self-center mr-6" />

              {/* Title & Info Block */}
              <div className="flex-1 space-y-2.5 sm:space-y-3">
                <span className="hidden xl:inline-block text-sm font-semibold tracking-wider text-slate-300/95 uppercase">
                  FIFA World Cup 2026
                </span>
                <h2 className="text-[25px] sm:text-3xl xl:text-[40px] font-extrabold tracking-tight text-white drop-shadow-sm leading-tight">
                  It's Happening Now! ⚽
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-slate-200 font-medium max-w-lg leading-relaxed">
                  Don't be late — catch up on matches with{" "}
                  <span className="text-amber-400 font-bold decoration-amber-400/30">
                    real-time
                  </span>{" "}
                  updated scores.
                </p>

                {/* Action Buttons Row */}
                {/* On mobile, grid forms one row with two buttons, on desktop it uses standard flex row */}
                <div className="grid grid-cols-2 gap-2.5 xl:flex xl:flex-wrap xl:items-center xl:gap-4 pt-2 xl:pt-3.5 w-full">
                  <button
                    onClick={handleButtonClick}
                    className="
                      flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-3 xl:px-6 xl:py-3 rounded-xl text-[11px] sm:text-xs xl:text-sm font-bold text-white
                      bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-indigo-600/20
                      transition-all duration-300 hover:from-blue-400 hover:to-purple-500 hover:scale-[1.02] active:scale-[0.98]
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full xl:w-auto
                    "
                  >
                    <span>Live Scores</span>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  </button>

                  <button
                    onClick={handleButtonClick}
                    className="
                      flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-3 xl:px-6 xl:py-3 rounded-xl text-[11px] sm:text-xs xl:text-sm font-bold text-white
                      border border-white/30 bg-transparent
                      transition-all duration-300 hover:bg-white/10 hover:border-white/60 hover:scale-[1.02] active:scale-[0.98]
                      hover:shadow-[0_0_15px_rgba(255,255,255,0.08)]
                      focus:outline-none focus:ring-2 focus:ring-white/30 w-full xl:w-auto
                    "
                  >
                    <Calendar size={14} className="xl:w-4 xl:h-4 shrink-0" strokeWidth={2.2} />
                    <span>View Fixtures</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Glassmorphic Scorecard */}
          <div className="xl:col-span-5 2xl:col-span-4 flex justify-center xl:justify-end">
            <div
              className="
                relative overflow-hidden w-full max-w-[340px] rounded-2xl p-5
                bg-slate-950/50 backdrop-blur-xl border border-white/15
                shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)]
                transition-all duration-300 hover:border-white/30 hover:bg-slate-950/60
                hover:shadow-[0_25px_55px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)]
              "
            >
              {/* Dynamic Goal Overlay Banner */}
              {goalEvent.active && (
                <div
                  className="
                    absolute inset-0 z-20 flex flex-col items-center justify-center text-center
                    bg-gradient-to-br from-amber-500/95 via-yellow-500/95 to-amber-600/95
                    animate-[fade-in_0.15s_ease-out]
                  "
                >
                  <Trophy className="h-10 w-10 text-white animate-[bounce_0.6s_infinite]" />
                  <span className="text-white text-3xl font-black tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] mt-1">
                    GOAL!!!
                  </span>
                  <span className="text-white text-sm font-bold tracking-wide mt-1">
                    {goalEvent.team} has scored!
                  </span>
                </div>
              )}

              {/* Card Header Row */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  LIVE
                </span>

                <span className="inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-200 border border-white/5">
                  Group Stage
                </span>
              </div>

              {/* Teams & Scoreboard Grid */}
              <div className="grid grid-cols-7 items-center justify-items-center text-center">
                {/* Team 1: Brazil */}
                <div
                  className="col-span-2 flex flex-col items-center gap-2 group cursor-pointer"
                  onClick={handleButtonClick}
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-white/15 flex items-center justify-center bg-slate-900/50 p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-300 group-hover:scale-110 group-hover:border-white/35 group-hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)]">
                    <svg
                      viewBox="0 0 720 504"
                      className="w-full h-full rounded-md shadow-sm"
                    >
                      <rect width="720" height="504" fill="#009c3b" />
                      <polygon
                        points="360,42 678,252 360,462 42,252"
                        fill="#ffdf00"
                      />
                      <circle cx="360" cy="252" r="105" fill="#002780" />
                      <path
                        d="M 264 278 Q 360 216 456 278"
                        stroke="#ffffff"
                        strokeWidth="12"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-100 tracking-wide truncate max-w-full">
                    Brazil
                  </span>
                </div>

                {/* Score & Time Display */}
                <div className="col-span-3 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black tracking-wider text-white drop-shadow-sm tabular-nums flex items-center gap-1.5">
                    <span>{homeScore}</span>
                    <span className="text-white/40 text-2xl font-light">-</span>
                    <span>{awayScore}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold font-mono tracking-wide text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-400/25 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
                    {minute >= 90 ? "FT" : `${minute}'`}
                  </span>
                </div>

                {/* Team 2: Argentina */}
                <div
                  className="col-span-2 flex flex-col items-center gap-2 group cursor-pointer"
                  onClick={handleButtonClick}
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-white/15 flex items-center justify-center bg-slate-900/50 p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-300 group-hover:scale-110 group-hover:border-white/35 group-hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)]">
                    <svg
                      viewBox="0 0 900 600"
                      className="w-full h-full rounded-md shadow-sm"
                    >
                      <rect width="900" height="600" fill="#74acdf" />
                      <rect y="200" width="900" height="200" fill="#ffffff" />
                      <rect y="400" width="900" height="200" fill="#74acdf" />
                      <circle cx="450" cy="300" r="40" fill="#f6b40e" />
                      <circle
                        cx="450"
                        cy="300"
                        r="24"
                        fill="#85530b"
                        opacity="0.25"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-100 tracking-wide truncate max-w-full">
                    Argentina
                  </span>
                </div>
              </div>

              {/* Bottom Card Action Link */}
              <button
                onClick={handleButtonClick}
                className="
                  w-full mt-4 pt-3.5 border-t border-white/10 flex items-center justify-center gap-1
                  text-xs font-bold text-indigo-300 hover:text-indigo-200 transition-colors group
                "
              >
                See All Live Matches
                <ChevronRight
                  size={14}
                  className="transition-transform duration-250 group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Under Construction Popup */}
      <UnderConstructionPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </>
  );
}
