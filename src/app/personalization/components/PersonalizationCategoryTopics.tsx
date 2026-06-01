"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Check, X } from "lucide-react";
import {
  AVAILABLE_PERSONALIZATION_TOPICS,
  MAX_PERSONALIZATION_TOPICS,
  getPersonalizationTopicMetadata,
} from "@/lib/personalizationTopics";

type PersonalizationCategoryTopicsProps = {
  favoriteTopics: string[];
  onFavoriteTopicsChange: (topics: string[]) => void;
  onLimitReached?: (message: string) => void;
  isMobile: boolean;
};

const AVAILABLE_TOPICS = [...AVAILABLE_PERSONALIZATION_TOPICS];
const MAX_TOPICS = MAX_PERSONALIZATION_TOPICS;
const INITIAL_VISIBLE_TOPICS = 12;
const getTopicMetadata = getPersonalizationTopicMetadata;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 15,
    },
  },
};

export default function PersonalizationCategoryTopics({
  favoriteTopics,
  onFavoriteTopicsChange,
  onLimitReached,
  isMobile,
}: PersonalizationCategoryTopicsProps) {
  const [topicSearch, setTopicSearch] = useState("");
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActivePageIndex(0);
    if (mobileContainerRef.current) {
      mobileContainerRef.current.scrollLeft = 0;
    }
  }, [topicSearch]);

  const filteredTopics = useMemo(
    () =>
      AVAILABLE_TOPICS.filter((topic) =>
        topic.toLowerCase().includes(topicSearch.toLowerCase()),
      ),
    [topicSearch],
  );

  const mobilePages = useMemo(() => {
    const pagesList: string[][] = [];
    const itemsPerPage = 6;
    for (let i = 0; i < filteredTopics.length; i += itemsPerPage) {
      pagesList.push(filteredTopics.slice(i, i + itemsPerPage));
    }
    return pagesList;
  }, [filteredTopics]);

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

  const visibleTopics = useMemo(() => {
    if (topicSearch.trim()) return filteredTopics;
    if (showAllTopics) return filteredTopics;
    return filteredTopics.slice(0, INITIAL_VISIBLE_TOPICS);
  }, [filteredTopics, showAllTopics, topicSearch]);

  const shouldShowMoreTopicsButton =
    !topicSearch.trim() &&
    !showAllTopics &&
    filteredTopics.length > INITIAL_VISIBLE_TOPICS;

  const handleTopicToggle = (topic: string) => {
    const isSelected = favoriteTopics.includes(topic);

    if (!isSelected && favoriteTopics.length >= MAX_TOPICS) {
      onLimitReached?.(`Limit of ${MAX_TOPICS} topics reached.`);
      return;
    }

    const nextTopics = isSelected
      ? favoriteTopics.filter((item) => item !== topic)
      : [...favoriteTopics, topic];

    onFavoriteTopicsChange(nextTopics);
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
        <h2 className="whitespace-nowrap text-lg font-semibold text-slate-900 dark:text-slate-50">
          Category Topics
        </h2>
        <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
      </div>

      <div className="flex flex-row items-center justify-between gap-2">
        <p className="text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
          Select up to {MAX_TOPICS} topics
        </p>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80 sm:h-2.5 sm:w-52">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] via-indigo-500 to-sky-400 shadow-[0_0_12px_rgba(99,102,241,0.35)]"
              initial={{ width: 0 }}
              animate={{
                width: `${(favoriteTopics.length / MAX_TOPICS) * 100}%`,
              }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:px-2.5 sm:text-xs">
            {favoriteTopics.length}/{MAX_TOPICS}
          </span>
        </div>
      </div>

      <div className="relative mt-6 w-[80%] mx-auto">
        <input
          type="text"
          placeholder="Search any topics..."
          value={topicSearch}
          onChange={(event) => setTopicSearch(event.target.value)}
          className="w-full rounded-[18px] border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900 px-5 py-3 pr-12 text-sm text-slate-900 dark:text-slate-100 focus:border-[var(--primary)] focus:outline-none"
        />
        {topicSearch.trim().length > 0 && (
          <button
            type="button"
            onClick={() => setTopicSearch("")}
            aria-label="Clear topic search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
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
                  {page.map((topic, topicIndex) => {
                    const isSelected = favoriteTopics.includes(topic);
                    const isDisabled =
                      !isSelected && favoriteTopics.length >= MAX_TOPICS;
                    const metadata = getTopicMetadata(topic);
                    const IconComponent = metadata.icon;

                    return (
                      <motion.label
                        key={topic}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: topicIndex * 0.012 }}
                        whileHover={{ y: -1.5, scale: 1.018 }}
                        whileTap={{ scale: 0.982 }}
                        className={`group relative flex cursor-pointer items-center justify-between gap-2 rounded-[18px] border transition-all duration-300 px-3.5 py-3 shadow-sm hover:shadow-sm ${
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary)]/[0.06] dark:bg-[var(--primary)]/[0.12] ring-1 ring-[var(--primary)]/20"
                            : isDisabled
                              ? "opacity-60 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40"
                              : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTopicToggle(topic)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex shrink-0 items-center justify-center p-0.5 rounded-lg group-hover:scale-110 transition-transform">
                            <IconComponent
                              className={`h-5 w-5 shrink-0 ${metadata.color}`}
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100 transition-colors group-hover:text-slate-900 dark:group-hover:text-white leading-tight">
                            {topic}
                          </span>
                        </div>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                            isSelected
                              ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-[0_0_8px_rgba(99,102,241,0.22)]"
                              : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 group-hover:border-[var(--primary)]/50"
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
                No topics match your search.
              </p>
            )}
          </div>

          {mobilePages.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {mobilePages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => scrollToMobilePage(index)}
                  className={`h-2 rounded-full transition-all duration-300 ease-out ${
                    index === activePageIndex
                      ? "w-8 bg-[var(--primary)] shadow-[0_0_8px_rgba(99,102,241,0.45)]"
                      : "w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-350 dark:hover:bg-slate-600"
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {visibleTopics.map((topic, index) => {
              const isSelected = favoriteTopics.includes(topic);
              const isDisabled =
                !isSelected && favoriteTopics.length >= MAX_TOPICS;
              const metadata = getTopicMetadata(topic);
              const IconComponent = metadata.icon;

              return (
                <motion.label
                  key={topic}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.012 }}
                  whileHover={{ y: -1.5, scale: 1.018 }}
                  whileTap={{ scale: 0.982 }}
                  className={`group relative flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border transition-all duration-300 px-3.5 py-3 sm:gap-4 sm:px-5 sm:py-4 shadow-sm hover:shadow-sm ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)]/[0.06] dark:bg-[var(--primary)]/[0.12] ring-1 ring-[var(--primary)]/20"
                      : isDisabled
                        ? "opacity-60 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40"
                        : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleTopicToggle(topic)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex shrink-0 items-center justify-center p-1 rounded-lg group-hover:scale-110 transition-transform">
                      <IconComponent
                        className={`h-5 w-5 shrink-0 ${metadata.color}`}
                      />
                    </div>
                    <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100 transition-colors group-hover:text-slate-900 dark:group-hover:text-white truncate">
                      {topic}
                    </span>
                  </div>

                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isSelected
                        ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-[0_0_8px_rgba(99,102,241,0.22)]"
                        : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 group-hover:border-[var(--primary)]/50"
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
                            size={14}
                            strokeWidth={3.5}
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

          {shouldShowMoreTopicsButton && (
            <div className="mt-5 flex justify-center">
              <motion.button
                type="button"
                onClick={() => setShowAllTopics(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-[18px] border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                See more options
              </motion.button>
            </div>
          )}

          {filteredTopics.length === 0 && (
            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              No topics match your search.
            </p>
          )}
        </>
      )}
    </>
  );
}
