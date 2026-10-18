"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronsRight, ArrowRight, Sparkles } from "lucide-react";
import {
  CATEGORY_ICON_STYLES,
  type ExploreCategorySuggestion,
} from "@/lib/explore";

interface CategoryCardStackProps {
  categories: ExploreCategorySuggestion[];
  selectedRegion: string;
}

const VISIBLE_STACK_DEPTH = 4; // Top card + 3 stacked behind, matching reference design

export default function CategoryCardStack({
  categories,
  selectedRegion,
}: CategoryCardStackProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<-1 | 1>(1);
  const [isSwiping, setIsSwiping] = useState(false);
  const dragDistanceRef = useRef(0);

  const total = categories?.length ?? 0;

  // Next card trigger: top card leaves, next card smoothly ascends, swiped card loops underneath
  const handleNext = useCallback(
    (direction: -1 | 1 = 1) => {
      if (total <= 1 || isSwiping) return;
      setIsSwiping(true);
      setExitDirection(direction);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % total);
        setIsSwiping(false);
      }, 260);
    },
    [total, isSwiping]
  );

  if (!categories || categories.length === 0) {
    return null;
  }

  // Circular progress for (currentIndex + 1) / total
  const progressRatio = total > 0 ? (currentIndex + 1) / total : 0;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Visible stack items from back to front
  const stackItems = [];
  const depth = Math.min(VISIBLE_STACK_DEPTH, total);
  for (let i = depth - 1; i >= 0; i--) {
    const itemIndex = (currentIndex + i) % total;
    stackItems.push({
      item: categories[itemIndex],
      itemIndex,
      depthIndex: i, // 0 is top, 1 is behind, etc.
    });
  }

  const handleCardClick = (slug: string) => {
    // If dragged more than 8px, it was a swipe gesture, not a tap
    if (Math.abs(dragDistanceRef.current) > 8) {
      dragDistanceRef.current = 0;
      return;
    }
    router.push(`/categories/${slug}?region=${selectedRegion}`);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/40">
      {/* Blueprint / grid texture background inspired by reference design */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.45] dark:opacity-[0.16]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          color: "rgba(100, 116, 139, 0.4)",
        }}
      />

      {/* Top Header: Progress Ring + Counter on left, Fast-Forward Button on right */}
      <div className="relative z-10 mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          {/* Circular progress indicator */}
          <div className="relative flex h-7 w-7 items-center justify-center">
            <svg className="h-7 w-7 -rotate-90 transform" viewBox="0 0 28 28">
              <circle
                cx="14"
                cy="14"
                r={radius}
                className="stroke-slate-300/80 dark:stroke-slate-700"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="14"
                cy="14"
                r={radius}
                className="stroke-indigo-600 transition-all duration-300 dark:stroke-indigo-400"
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-slate-800 dark:text-slate-200 tabular-nums">
            {currentIndex + 1} / {total}
          </span>
        </div>

        {/* Skip / Next Button `>>` matching reference design */}
        <button
          type="button"
          onClick={() => handleNext(1)}
          aria-label="Next category card"
          className="group flex h-9 w-9 items-center justify-center rounded-full border border-slate-300/90 bg-white/95 text-slate-700 shadow-xs transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 active:scale-90 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400"
        >
          <ChevronsRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Stack Container: Padded on the left so layered card edges on the left are prominently visible */}
      <div className="relative mx-auto h-[320px] w-full max-w-[340px] pl-8 pr-2 select-none">
        <div className="relative h-full w-full">
          {stackItems.map(({ item, itemIndex, depthIndex }) => {
            const isTop = depthIndex === 0;
            const style =
              CATEGORY_ICON_STYLES[itemIndex % CATEGORY_ICON_STYLES.length];
            const Icon = style.icon;

            // When swipe animation starts, background cards immediately step forward
            const effectiveDepth = isSwiping ? Math.max(0, depthIndex - 1) : depthIndex;
            const offsetX = -effectiveDepth * 10;
            const offsetY = effectiveDepth * 5;
            const scale = 1 - effectiveDepth * 0.025;
            const zIndex = 20 - depthIndex;

            if (isTop) {
              return (
                <TopInteractiveCard
                  key={`card-${item.slug}-${itemIndex}`}
                  item={item}
                  style={style}
                  Icon={Icon}
                  onSwipe={handleNext}
                  onClick={() => handleCardClick(item.slug)}
                  dragDistanceRef={dragDistanceRef}
                  isSwiping={isSwiping}
                  exitDirection={exitDirection}
                  zIndex={zIndex}
                />
              );
            }

            // Stacked cards behind with physical border and layered shadow
            return (
              <motion.div
                key={`stacked-${item.slug}-${itemIndex}-${depthIndex}`}
                initial={false}
                animate={{
                  x: offsetX,
                  y: offsetY,
                  scale,
                  opacity: 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 340,
                  damping: 26,
                }}
                style={{
                  zIndex,
                  boxShadow:
                    "0 8px 20px -4px rgba(0, 0, 0, 0.09), -4px 4px 10px -2px rgba(0, 0, 0, 0.08)",
                }}
                className="absolute inset-0 rounded-3xl border border-slate-300/90 bg-white dark:border-slate-700/80 dark:bg-slate-900"
                aria-hidden="true"
              >
                {/* Subtle rim content for cards behind */}
                <div className="flex h-full flex-col justify-between p-5 opacity-30">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {item.title}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile Swipe prompt */}
      <div className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
        <span>Swipe card left/right or tap to explore</span>
      </div>
    </div>
  );
}

interface TopInteractiveCardProps {
  item: ExploreCategorySuggestion;
  style: (typeof CATEGORY_ICON_STYLES)[number];
  Icon: (typeof CATEGORY_ICON_STYLES)[number]["icon"];
  onSwipe: (dir: -1 | 1) => void;
  onClick: () => void;
  dragDistanceRef: React.MutableRefObject<number>;
  isSwiping: boolean;
  exitDirection: -1 | 1;
  zIndex: number;
}

function TopInteractiveCard({
  item,
  style,
  Icon,
  onSwipe,
  onClick,
  dragDistanceRef,
  isSwiping,
  exitDirection,
  zIndex,
}: TopInteractiveCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const opacity = useTransform(
    x,
    [-240, -160, 0, 160, 240],
    [0.4, 0.9, 1, 0.9, 0.4]
  );

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        zIndex,
        touchAction: "pan-y",
        boxShadow:
          "0 14px 34px -8px rgba(30, 27, 75, 0.22), -3px 4px 12px -2px rgba(0, 0, 0, 0.08)",
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragStart={() => {
        dragDistanceRef.current = 0;
      }}
      onDrag={(_, info) => {
        dragDistanceRef.current = info.offset.x;
      }}
      onDragEnd={(_, info) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;
        if (Math.abs(offset) > 65 || Math.abs(velocity) > 300) {
          const dir = offset > 0 ? 1 : -1;
          onSwipe(dir);
        }
      }}
      animate={
        isSwiping
          ? {
              x: exitDirection * 340,
              rotate: exitDirection * 16,
              opacity: 0,
              transition: { duration: 0.26, ease: "easeOut" },
            }
          : {
              x: 0,
              rotate: 0,
              opacity: 1,
            }
      }
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 25,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="absolute inset-0 flex flex-col justify-between cursor-grab active:cursor-grabbing rounded-3xl border border-slate-300/90 bg-white p-5 backdrop-blur-md transition-shadow hover:shadow-[0_16px_36px_-10px_rgba(30,27,75,0.28)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.65)]"
    >
      {/* Top section: Category Icon Badge & Monogram/Tag */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs ${style.className}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span
              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${style.pillClassName}`}
            >
              {item.title}
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-slate-200/90 bg-slate-100/70 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>AI CURATED</span>
          </div>
        </div>

        {/* Headline & Description */}
        <div className="mt-5">
          <h3 className="text-xl font-extrabold leading-snug tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
            {item.title}
          </h3>
          <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {item.description}
          </p>
        </div>
      </div>

      {/* Bottom section: Modern terminal prompt inspired by the reference design */}
      <div className="mt-auto border-t border-slate-100 pt-3.5 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center">
            <span className="text-indigo-600 dark:text-indigo-400 mr-1.5 font-bold">&gt;</span>
            <span>READY TO EXPLORE</span>
            <span className="ml-1 inline-block animate-pulse text-indigo-600 dark:text-indigo-400 font-bold">_</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 transition-transform group-hover:translate-x-1 dark:text-indigo-400">
            <span>Open</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
