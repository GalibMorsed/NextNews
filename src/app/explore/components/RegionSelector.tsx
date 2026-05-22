"use client";

import { useEffect, useRef, useState } from "react";
import {
  Compass,
  Sparkles,
  Loader2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Globe2,
} from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { EXPLORE_REGIONS, type ExploreRegionId } from "@/lib/explore";
import { incrementRegionSuggestionUsage } from "@/lib/activityAnalytics";
import { useAILimit } from "@/hooks/useAILimit";
import CreditAlertBanner from "@/app/components/CreditAlertBanner";
import LottiePlayer from "@/app/components/LottiePlayer";

export interface AIRegionSuggestion {
  label: string;
  reason: string;
  query: string;
  countryCode: string;
  mappedRegionId?: ExploreRegionId;
}

interface RegionSelectorProps {
  selectedRegion: ExploreRegionId;
  onRegionSelect: (regionId: ExploreRegionId) => void;
  onSearchPreferredRegion?: () => void;
  onAISuggestionSelect?: (suggestion: AIRegionSuggestion) => void;
}

function RegionFlag({
  id,
  countryCode,
  label,
  active,
  size = "md",
}: {
  id?: ExploreRegionId | null;
  countryCode?: string | null;
  label?: string;
  active?: boolean;
  size?: "sm" | "md";
}) {
  const sizeClasses = size === "sm" ? "h-4 w-5.5" : "h-5 w-7";

  if (countryCode && /^[A-Z]{2}$/.test(countryCode)) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-[3px] shadow-sm overflow-hidden flex items-center justify-center border border-black/5 dark:border-white/10 ${active ? "ring-1 ring-[var(--primary)]/30 dark:ring-white/30" : ""}`}
      >
        <ReactCountryFlag
          countryCode={countryCode}
          svg
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          aria-label={label || countryCode}
        />
      </div>
    );
  }

  if (!id) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-[3px] shadow-sm overflow-hidden flex items-center justify-center border border-black/5 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 ${active ? "ring-1 ring-[var(--primary)]/30 dark:ring-white/30" : ""}`}
      >
        <Globe2 className="h-3.5 w-3.5" />
      </div>
    );
  }

  // Direct mapping to representative ISO codes for the library
  const countryCodeMap: Record<string, string> = {
    world: "UN",
    us: "US",
    europe: "EU",
    asia: "CN",
    "middle-east": "SA",
    africa: "ZA",
    "latin-america": "BR",
    india: "IN",
    china: "CN",
    russia: "RU",
    japan: "JP",
    "east-asia": "KR",
    oceania: "AU",
    "southeast-asia": "SG",
  };

  const code = countryCodeMap[id] || "UN";

  return (
    <div
      className={`${sizeClasses} shrink-0 rounded-[3px] shadow-sm overflow-hidden flex items-center justify-center border border-black/5 dark:border-white/10 ${active ? "ring-1 ring-[var(--primary)]/30 dark:ring-white/30" : ""}`}
    >
      <ReactCountryFlag
        countryCode={code}
        svg
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        aria-label={id}
      />
    </div>
  );
}

export default function RegionSelector({
  selectedRegion,
  onRegionSelect,
  onSearchPreferredRegion: _onSearchPreferredRegion,
  onAISuggestionSelect,
}: RegionSelectorProps) {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AIRegionSuggestion[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollStopTimerRef = useRef<number | null>(null);
  const { isLocked, limit, isActive, nextAvailableAt, isFreePlanCooldown } =
    useAILimit();

  const refreshScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const hasOverflow = scrollWidth > clientWidth + 1;

    setCanScrollLeft(hasOverflow && scrollLeft > 0);
    setCanScrollRight(
      hasOverflow && scrollLeft < scrollWidth - clientWidth - 1,
    );
  };

  const handleTabsScroll = () => {
    setIsScrolling(true);
    refreshScrollState();

    if (scrollStopTimerRef.current) {
      window.clearTimeout(scrollStopTimerRef.current);
    }

    scrollStopTimerRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 900);
  };

  const scrollTabs = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const delta = Math.max(220, Math.round(container.clientWidth * 0.7));
    container.scrollBy({
      left: direction === "left" ? -delta : delta,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return undefined;

    const resizeObserver = new ResizeObserver(() => {
      refreshScrollState();
    });

    resizeObserver.observe(container);
    window.requestAnimationFrame(refreshScrollState);
    window.addEventListener("resize", refreshScrollState);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", refreshScrollState);
      if (scrollStopTimerRef.current) {
        window.clearTimeout(scrollStopTimerRef.current);
      }
    };
  }, []);

  const handleAISuggest = async () => {
    if (isLocked) {
      setErrorMessage(
        `You've reached your free limit of ${limit} AI usages. Activate any plan to unlock.`,
      );
      return;
    }

    setIsSuggesting(true);
    setErrorMessage("");
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const accessToken = localStorage.getItem("auth_token");

      if (!accessToken) {
        setErrorMessage("Please log in again to get AI region suggestions.");
        return;
      }

      const response = await fetch("/api/region-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          selectedRegion,
        }),
      });

      const payload = (await response.json()) as {
        suggestions?: AIRegionSuggestion[];
        error?: string;
      };

      if (!response.ok) {
        setErrorMessage(
          payload.error ||
            "We couldn't get AI region suggestions right now. Please try again shortly.",
        );
        return;
      }

      const nextSuggestions = Array.isArray(payload.suggestions)
        ? payload.suggestions.filter(
            (suggestion): suggestion is AIRegionSuggestion =>
              Boolean(
                suggestion &&
                suggestion.label?.trim() &&
                suggestion.reason?.trim() &&
                suggestion.query?.trim() &&
                /^[A-Z]{2}$/.test(suggestion.countryCode?.trim() || ""),
              ),
          )
        : [];

      setSuggestions(nextSuggestions);
      setShowSuggestions(nextSuggestions.length > 0);
      incrementRegionSuggestionUsage({ region: selectedRegion });
      if (nextSuggestions.length === 0) {
        setErrorMessage("No region suggestions were returned.");
      }
    } catch {
      setErrorMessage(
        "We couldn't get AI region suggestions right now. Please try again shortly.",
      );
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/92 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/88 overflow-hidden">
      <div className="px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-8">
          {/* Section Header */}
          <div className="flex flex-col gap-3">
            <h4 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Trending Regions
            </h4>
            <p className="text-sm text-[var(--muted)]">
              Switch regions to see localized analysis.
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex flex-col gap-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
              Select Area
            </p>
            <div className="relative w-full">
              <div
                ref={scrollContainerRef}
                onScroll={handleTabsScroll}
                className={`flex gap-3 overflow-x-auto pb-2 pr-8 ${
                  isScrolling ? "scrollbar-active" : "scrollbar-hide"
                }`}
              >
                {EXPLORE_REGIONS.map((region) => (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => onRegionSelect(region.id)}
                    className={`inline-flex shrink-0 items-center gap-2.5 rounded-xl border px-5 py-3 text-sm font-bold tracking-tight transition-all duration-300 ${
                      selectedRegion === region.id
                        ? "border-[var(--primary)] bg-[var(--primary)]/[0.08] text-[var(--primary)] dark:border-[var(--primary)] dark:bg-[var(--primary)]/[0.18] dark:text-white shadow-md shadow-[var(--primary)]/10 scale-[1.02]"
                        : "border-slate-200 bg-white text-[var(--foreground)] shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                    }`}
                  >
                    {selectedRegion === region.id ? (
                      <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-40 animate-ping dark:opacity-50" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)] shadow-[0_0_0_3px_rgba(59,130,246,0.12)] dark:shadow-[0_0_0_3px_rgba(96,165,250,0.16)]" />
                      </span>
                    ) : null}
                    <RegionFlag
                      id={region.id}
                      label={region.label}
                      active={selectedRegion === region.id}
                      size="sm"
                    />
                    {region.label}
                  </button>
                ))}
              </div>

              {canScrollLeft && !isScrolling ? (
                <button
                  type="button"
                  aria-label="Scroll region tabs left"
                  onClick={() => scrollTabs("left")}
                  className="absolute left-0 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/30 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-[18px] transition-all duration-200 hover:-translate-y-1/2 hover:border-white/70 hover:bg-white/45 hover:text-slate-950 dark:border-white/15 dark:bg-slate-950/30 dark:text-slate-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_26px_rgba(0,0,0,0.35)] dark:hover:border-white/25 dark:hover:bg-slate-950/45 dark:hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>
              ) : null}

              {canScrollRight && !isScrolling ? (
                <button
                  type="button"
                  aria-label="Scroll region tabs right"
                  onClick={() => scrollTabs("right")}
                  className="absolute right-0 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/30 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-[18px] transition-all duration-200 hover:-translate-y-1/2 hover:border-white/70 hover:bg-white/45 hover:text-slate-950 dark:border-white/15 dark:bg-slate-950/30 dark:text-slate-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_26px_rgba(0,0,0,0.35)] dark:hover:border-white/25 dark:hover:bg-slate-950/45 dark:hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>
              ) : null}
            </div>
          </div>

          {/* AI Suggest Section */}
          <div className="flex flex-col gap-5 pt-2">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
              <LottiePlayer
                src="/explore/AI.json"
                className="h-5 w-5 shrink-0"
                loop
                autoplay
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                Personalized Assistant
              </p>
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="flex flex-col items-center gap-6">
              {!isLocked ? (
                <button
                  type="button"
                  onClick={handleAISuggest}
                  disabled={isSuggesting}
                  className="group relative inline-flex w-fit items-center gap-3 self-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-70 lg:self-auto"
                >
                  {/* Shimmer sweep effect */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />

                  {isSuggesting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles
                        size={20}
                        className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                      />
                      AI Suggest Region
                    </>
                  )}
                </button>
              ) : null}

              {errorMessage ? (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {errorMessage}
                </div>
              ) : null}

              {isLocked ? (
                <CreditAlertBanner
                  limit={limit}
                  isPlan={isActive}
                  nextAvailableAt={nextAvailableAt}
                  isFreePlanCooldown={isFreePlanCooldown}
                />
              ) : null}

              {/* AI Suggestions List */}
              {showSuggestions && (
                <div className="w-full animate-fade-up grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.label}-${suggestion.query}`}
                      onClick={() => {
                        if (suggestion.mappedRegionId) {
                          onRegionSelect(suggestion.mappedRegionId);
                        }
                        onAISuggestionSelect?.(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="group flex flex-col items-start p-6 text-left rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/[0.02] hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:border-[var(--primary)]/40"
                    >
                      <div className="flex w-full items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <RegionFlag
                            id={suggestion.mappedRegionId}
                            countryCode={suggestion.countryCode}
                            label={suggestion.label}
                          />
                          <span className="text-base font-bold tracking-tight text-[var(--foreground)]">
                            {suggestion.label}
                          </span>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 dark:bg-slate-700 dark:border-slate-600">
                          <ArrowRight className="h-3 w-3 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-[var(--muted)] line-clamp-2">
                        {suggestion.reason}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
