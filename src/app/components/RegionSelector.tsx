"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Compass, Sparkles, Loader2, ArrowRight } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { EXPLORE_REGIONS, type ExploreRegionId } from "@/lib/explore";

interface RegionSelectorProps {
  selectedRegion: ExploreRegionId;
  onRegionSelect: (regionId: ExploreRegionId) => void;
  onSearchPreferredRegion?: () => void;
}

interface AISuggestion {
  id: ExploreRegionId;
  label: string;
  reason: string;
}

function RegionFlag({
  id,
  active,
  size = "md",
}: {
  id: ExploreRegionId;
  active?: boolean;
  size?: "sm" | "md";
}) {
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
  };

  const code = countryCodeMap[id] || "UN";
  const sizeClasses = size === "sm" ? "h-4 w-5.5" : "h-5 w-7";

  return (
    <div
      className={`${sizeClasses} shrink-0 rounded-[3px] shadow-sm overflow-hidden flex items-center justify-center border border-black/5 dark:border-white/10 ${active ? "ring-1 ring-white/30" : ""}`}
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
  onSearchPreferredRegion,
}: RegionSelectorProps) {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasActivePlan, setHasActivePlan] = useState(false);

  useEffect(() => {
    const syncPlanState = () => {
      const planName = localStorage.getItem("nextnews-plan")?.trim();
      setHasActivePlan(Boolean(planName));
    };

    syncPlanState();
    window.addEventListener("storage", syncPlanState);
    window.addEventListener("focus", syncPlanState);

    return () => {
      window.removeEventListener("storage", syncPlanState);
      window.removeEventListener("focus", syncPlanState);
    };
  }, []);

  const handleAISuggest = async () => {
    const savedPlan = localStorage.getItem("nextnews-plan")?.trim();

    if (!savedPlan) {
      setHasActivePlan(false);
      setShowSuggestions(false);
      setSuggestions([]);
      setErrorMessage("");
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
        suggestions?: Array<{ id: ExploreRegionId; reason: string }>;
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
        ? payload.suggestions
          .map((suggestion) => {
            const region = EXPLORE_REGIONS.find(
              (item) => item.id === suggestion.id,
            );
            if (!region) return null;

            return {
              id: suggestion.id,
              label: region.label,
              reason: suggestion.reason,
            };
          })
          .filter((suggestion): suggestion is AISuggestion =>
            Boolean(suggestion),
          )
        : [];

      setSuggestions(nextSuggestions);
      setShowSuggestions(nextSuggestions.length > 0);
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
            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Trending Regions
            </h2>

            <div className="h-1 w-32 rounded-full bg-[var(--primary)]/40" />

            <div className="inline-flex max-w-fit items-center gap-2 rounded-full border border-sky-200/60 bg-sky-50/80 px-4 py-1.5 text-xs font-bold text-sky-700 shadow-sm dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-200">
              <Compass className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
              Switch regions to see localized analysis.
            </div>
          </div>

          {/* Region Tabs */}
          <div className="flex flex-col gap-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
              Select Area
            </p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 gap-3 overflow-x-auto pb-1 no-scrollbar">
                {EXPLORE_REGIONS.map((region) => (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => onRegionSelect(region.id)}
                    className={`inline-flex shrink-0 items-center gap-2.5 rounded-full border px-5 py-3 text-sm font-bold tracking-tight transition-all duration-300 ${selectedRegion === region.id
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] shadow-lg shadow-black/5 scale-105"
                      : "border-slate-200 bg-white text-[var(--foreground)] hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 shadow-sm"
                      }`}
                  >
                    <RegionFlag
                      id={region.id}
                      active={selectedRegion === region.id}
                      size="sm"
                    />
                    {region.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Suggest Section */}
          <div className="flex flex-col gap-5 pt-2">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                Personalized Assistant
              </p>
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="flex flex-col items-center gap-6">
              {hasActivePlan ? (
                <button
                  type="button"
                  onClick={handleAISuggest}
                  disabled={isSuggesting}
                  className="group relative inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[color:color-mix(in_srgb,var(--primary),#3b82f6)] px-8 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-[var(--primary)]/30 transition-all hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSuggesting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  )}
                  <span className="tracking-tight">AI Suggest Region</span>
                  <div className="absolute -inset-1 rounded-[2.2rem] bg-[var(--primary)]/20 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
                </button>
              ) : (
                <div className="w-full max-w-2xl rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-5 text-center shadow-sm dark:border-amber-900/40 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[var(--foreground)] sm:text-base">
                    AI region suggestions are available after you activate any
                    plan.
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Go to the plans page or search for your preferred region.
                  </p>
                  <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/plans"
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-md shadow-[var(--primary)]/20 transition-all hover:brightness-110"
                    >
                      Go to Plans
                    </Link>
                    <button
                      type="button"
                      onClick={onSearchPreferredRegion}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-[var(--foreground)] transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                    >
                      Search preferred region
                    </button>
                  </div>
                </div>
              )}

              {errorMessage ? (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {errorMessage}
                </div>
              ) : null}

              {/* AI Suggestions List */}
              {showSuggestions && (
                <div className="w-full animate-fade-up grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        onRegionSelect(suggestion.id);
                        setShowSuggestions(false);
                      }}
                      className="group flex flex-col items-start p-6 text-left rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/[0.02] hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:border-[var(--primary)]/40"
                    >
                      <div className="flex w-full items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <RegionFlag id={suggestion.id} />
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
