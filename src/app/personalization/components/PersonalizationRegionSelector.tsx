"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { EXPLORE_REGIONS } from "@/lib/explore";
import { useRouter } from "next/navigation";

interface PersonalizationRegionSelectorProps {
  favoriteRegions: string[];
  onToggleRegion: (regionId: string) => void;
}

function RegionFlag({ id, label }: { id: string; label?: string }) {
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
    <div className="h-5 w-7 shrink-0 rounded-[3px] shadow-sm overflow-hidden flex items-center justify-center border border-black/5 dark:border-white/10">
      <ReactCountryFlag
        countryCode={code}
        svg
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        aria-label={label || id}
      />
    </div>
  );
}

export default function PersonalizationRegionSelector({
  favoriteRegions,
  onToggleRegion,
}: PersonalizationRegionSelectorProps) {
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mobilePages = useMemo(() => {
    const pagesList: (typeof EXPLORE_REGIONS)[] = [];
    const itemsPerPage = 4;
    for (let i = 0; i < EXPLORE_REGIONS.length; i += itemsPerPage) {
      pagesList.push(EXPLORE_REGIONS.slice(i, i + itemsPerPage));
    }
    return pagesList;
  }, []);

  const handleMobileScroll = () => {
    if (!mobileContainerRef.current) return;
    const { scrollLeft, clientWidth } = mobileContainerRef.current;
    if (clientWidth > 0) {
      const newIndex = Math.round(scrollLeft / clientWidth);
      if (newIndex !== activePageIndex) {
        setActivePageIndex(newIndex);
      }
    }
  };

  const scrollToMobilePage = (index: number) => {
    if (!mobileContainerRef.current) return;
    const { clientWidth } = mobileContainerRef.current;
    mobileContainerRef.current.scrollTo({
      left: index * clientWidth,
      behavior: "smooth",
    });
    setActivePageIndex(index);
  };

  const visibleRegions = showAll ? EXPLORE_REGIONS : EXPLORE_REGIONS.slice(0, 4);

  const handleExplore = () => {
    const queryParams = new URLSearchParams();
    if (favoriteRegions.length > 0) {
      queryParams.set("region", favoriteRegions[0]);
    }
    router.push(`/explore?${queryParams.toString()}`);
  };

  return (
    <>
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
          <h2 className="flex items-center gap-2 whitespace-nowrap text-lg font-semibold text-slate-900 dark:text-slate-50">
            Preferred Regions
          </h2>
          <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
        </div>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Select 1 region for tailored local updates
        </p>
      </div>

      {isMobile ? (
        <div className="mt-6 flex flex-col">
          <div
            ref={mobileContainerRef}
            onScroll={handleMobileScroll}
            className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none gap-4 pb-2"
          >
            {mobilePages.length > 0 ? (
              mobilePages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  className="grid w-full shrink-0 snap-center grid-cols-2 gap-2"
                >
                  {page.map((region) => {
                    const isSelected = favoriteRegions.includes(region.id);

                    return (
                      <motion.label
                        key={region.id}
                        whileHover={{ y: -1.5, scale: 1.018 }}
                        whileTap={{ scale: 0.982 }}
                        className={`group relative flex cursor-pointer items-center justify-between gap-2 rounded-[18px] border transition-all duration-300 px-3.5 py-3 shadow-sm hover:shadow-sm ${
                          isSelected
                            ? "border-purple-500 bg-purple-500/[0.06] dark:bg-purple-500/[0.12] ring-1 ring-purple-500/20"
                            : "border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60 hover:border-purple-300 dark:hover:border-purple-750/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={isSelected}
                          onChange={() => onToggleRegion(region.id)}
                        />
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <RegionFlag id={region.id} label={region.label} />
                          </div>
                          <span
                            className={`text-xs sm:text-sm font-semibold transition-colors leading-tight ${
                              isSelected
                                ? "text-purple-950 dark:text-purple-100"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {region.label}
                          </span>
                        </div>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                            isSelected
                              ? "border-purple-500 bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.22)]"
                              : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 group-hover:border-purple-400"
                          }`}
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, rotate: -35, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                exit={{ scale: 0, rotate: -35, opacity: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 450,
                                  damping: 20,
                                }}
                              >
                                <Check
                                  size={13}
                                  strokeWidth={4}
                                  className="text-white"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.label>
                    );
                  })}
                </div>
              ))
            ) : (
              <p className="w-full text-center text-sm text-slate-500 dark:text-slate-400 py-4">
                No regions found.
              </p>
            )}
          </div>

          {/* Animated Carousel Indicators (Image 2 style) */}
          {mobilePages.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {mobilePages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => scrollToMobilePage(index)}
                  className={`h-2 rounded-full transition-all duration-300 ease-out ${
                    index === activePageIndex
                      ? "w-8 bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.34)]"
                      : "w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-350 dark:hover:bg-slate-600"
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleRegions.map((region) => {
            const isSelected = favoriteRegions.includes(region.id);
            return (
              <motion.label
                key={region.id}
                whileHover={{ y: -1.5, scale: 1.018 }}
                whileTap={{ scale: 0.982 }}
                className={`group relative flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border p-4 transition-all duration-300 shadow-sm hover:shadow-sm ${
                  isSelected
                    ? "border-purple-500 bg-purple-500/[0.06] dark:bg-purple-500/[0.12] ring-1 ring-purple-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-purple-300 dark:hover:border-purple-700/50"
                }`}
              >
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isSelected}
                  onChange={() => onToggleRegion(region.id)}
                />
                <div className="flex items-center gap-3 min-w-0">
                  <RegionFlag id={region.id} label={region.label} />
                  <span
                    className={`truncate text-sm font-semibold transition-colors ${
                      isSelected
                        ? "text-purple-900 dark:text-purple-100"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {region.label}
                  </span>
                </div>

                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                    isSelected
                      ? "border-purple-500 bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.22)]"
                      : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 group-hover:border-purple-400"
                  }`}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -35, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, rotate: -35, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 20,
                        }}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3.5] text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.label>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex justify-center gap-4">
        {!showAll && EXPLORE_REGIONS.length > 4 && !isMobile && (
          <motion.button
            type="button"
            onClick={() => setShowAll(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-[18px] border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            See more options
          </motion.button>
        )}
        <motion.button
          type="button"
          onClick={handleExplore}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group flex items-center gap-2 rounded-[18px] bg-indigo-50 px-6 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm transition-all hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
        >
           Go Explore
        </motion.button>
      </div>
    </>
  );
}
