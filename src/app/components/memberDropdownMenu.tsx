"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Compass,
  Construction,
  UserRound,
  Users,
  X,
} from "lucide-react";

interface MemberLink {
  id: string;
  label: string;
  accessLabel: string;
  description?: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
  }>;
  href?: string;
  isComingSoon?: boolean;
}

const memberLinks: MemberLink[] = [
  {
    id: "community",
    label: "Community",
    accessLabel: "Pro+",
    description: "Connect with other members",
    icon: Users,
    isComingSoon: true,
  },
  {
    id: "for-you",
    label: "For You",
    accessLabel: "Pro",
    description: "Personalized tailored to you",
    icon: UserRound,
    isComingSoon: true,
  },
  {
    id: "my-activity",
    label: "My Activity",
    accessLabel: "Free",
    description: "Your history and engagements",
    icon: Activity,
    href: "/my-activity",
    isComingSoon: false,
  },
  {
    id: "explore",
    label: "Explore",
    accessLabel: "Free",
    description: "Discover topics and new perspectives",
    icon: Compass,
    href: "/explore",
    isComingSoon: false,
  },
] as const;

const dropdownTransition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as const,
};

const springPanel = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
  mass: 0.82,
};

const springItem = {
  type: "spring" as const,
  stiffness: 440,
  damping: 34,
  mass: 0.65,
};

const springToggle = {
  type: "spring" as const,
  stiffness: 520,
  damping: 28,
};

const AnimatedPanelsIcon = ({ isOpen }: { isOpen: boolean }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="overflow-visible"
      animate={reduceMotion ? {} : { rotate: isOpen ? 90 : 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      {/* Top Header Panel */}
      <motion.rect
        x="3"
        y="3"
        width="18"
        height="5"
        rx="1"
        animate={
          reduceMotion
            ? {}
            : {
                y: isOpen ? -1.5 : 0,
                opacity: isOpen ? 0.8 : 1,
              }
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      {/* Bottom Left Panel (Sidebar) */}
      <motion.rect
        x="3"
        y="10"
        width="5"
        height="11"
        rx="1"
        animate={
          reduceMotion
            ? {}
            : {
                x: isOpen ? -1.5 : 0,
                opacity: isOpen ? 0.8 : 1,
              }
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      {/* Bottom Right Panel (Content) */}
      <motion.rect
        x="10"
        y="10"
        width="11"
        height="11"
        rx="1"
        animate={
          reduceMotion
            ? {}
            : {
                x: isOpen ? 1.5 : 0,
                y: isOpen ? 1.5 : 0,
                stroke: isOpen ? "var(--primary)" : "currentColor",
              }
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
    </motion.svg>
  );
};

interface MemberDropdownMenuProps {
  className?: string;
}

export default function MemberDropdownMenu({
  className = "",
}: MemberDropdownMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const popupTimerRef = useRef<number | null>(null);
  const menuId = useId();
  const titleId = useId();
  const reduceMotion = useReducedMotion();

  const menuListVariants = useMemo(
    () => ({
      hidden: { opacity: reduceMotion ? 1 : 0 },
      show: {
        opacity: 1,
        transition: reduceMotion
          ? { duration: 0 }
          : { staggerChildren: 0.052, delayChildren: 0.07 },
      },
    }),
    [reduceMotion],
  );

  const menuItemVariants = useMemo(
    () => ({
      hidden: {
        opacity: reduceMotion ? 1 : 0,
        x: reduceMotion ? 0 : -14,
        filter: reduceMotion ? "blur(0px)" : "blur(4px)",
      },
      show: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: reduceMotion ? { duration: 0 } : springItem,
      },
    }),
    [reduceMotion],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setShowNotice(false);
          buttonRef.current?.focus();
          break;
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % memberLinks.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + memberLinks.length) % memberLinks.length,
          );
          break;
        case "Home":
          event.preventDefault();
          setSelectedIndex(0);
          break;
        case "End":
          event.preventDefault();
          setSelectedIndex(memberLinks.length - 1);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          menuItemsRef.current[selectedIndex]?.click();
          break;
        default:
          break;
      }
    },
    [isOpen, selectedIndex],
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) {
        window.clearTimeout(popupTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      menuItemsRef.current[selectedIndex]?.focus();
    }
  }, [selectedIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleOpenToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setSelectedIndex(0);
  }, []);

  const handleComingSoonClick = useCallback(() => {
    setIsOpen(false);
    setShowNotice(true);

    if (popupTimerRef.current) {
      window.clearTimeout(popupTimerRef.current);
    }

    popupTimerRef.current = window.setTimeout(() => {
      setShowNotice(false);
    }, 4000);
  }, []);

  const handleMemberClick = useCallback(
    (item: (typeof memberLinks)[number]) => {
      if (item.isComingSoon) {
        handleComingSoonClick();
        return;
      }

      if (item.href) {
        setIsOpen(false);
        setShowNotice(false);
        router.push(item.href);
      }
    },
    [handleComingSoonClick, router],
  );

  const dismissNotice = useCallback(() => {
    setShowNotice(false);
    if (popupTimerRef.current) {
      window.clearTimeout(popupTimerRef.current);
    }
  }, []);

  const panelMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: -30, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: {
          opacity: 0,
          y: -20,
          scale: 0.96,
          transition: { duration: 0.16, ease: [0.4, 0, 1, 1] as const },
        },
      };

  const panelTransition = reduceMotion ? dropdownTransition : springPanel;

  return (
    <>
      <div className={`relative flex items-center justify-center ${className}`}>
        <motion.button
          ref={buttonRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-haspopup="menu"
          onClick={handleOpenToggle}
          aria-label={isOpen ? "Close member menu" : "Open member menu"}
          whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          transition={springToggle}
          className={`
            inline-flex h-10 w-10 items-center justify-center rounded-xl border
            bg-[var(--card)] text-[var(--foreground)] transition-colors duration-200
            hover:border-[color:color-mix(in_srgb,var(--primary)_45%,var(--border))]
            hover:bg-[color:color-mix(in_srgb,var(--card)_88%,var(--primary)_12%)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40
            focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]
            dark:hover:bg-[color:color-mix(in_srgb,var(--card)_84%,var(--primary)_16%)]
            ${
              isOpen
                ? "border-[color:color-mix(in_srgb,var(--primary)_48%,var(--border))] shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_28%,transparent),0_8px_28px_-8px_color-mix(in_srgb,var(--primary)_32%,transparent)]"
                : "border-[var(--border)] shadow-sm"
            }
          `}
        >
          <span className={`inline-flex ${isOpen ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
            <AnimatedPanelsIcon isOpen={isOpen} />
          </span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.22,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => setIsOpen(false)}
                className="
                  fixed inset-x-0 bottom-0 top-[4.65rem] z-40 backdrop-blur-[3px]
                  bg-[color:color-mix(in_srgb,#0f172a_22%,var(--primary)_10%)]
                  lg:pointer-events-none lg:bg-transparent lg:backdrop-blur-none lg:inset-auto
                "
                aria-hidden="true"
              />

              <motion.div
                ref={panelRef}
                id={menuId}
                role="menu"
                aria-labelledby={titleId}
                {...panelMotion}
                transition={panelTransition}
                className="
                  fixed inset-x-3 top-[4.65rem] z-50 max-h-[min(78vh,32rem)] overflow-visible
                  lg:absolute lg:left-1/2 lg:right-auto lg:top-[calc(100%+1.25rem)] lg:max-h-none lg:w-[min(96vw,52rem)] lg:-translate-x-1/2
                "
              >
                <div
                  className="
                    relative flex max-h-[inherit] flex-col overflow-hidden rounded-2xl border
                    border-[color:color-mix(in_srgb,var(--primary)_18%,var(--border))]
                    bg-[var(--card)]
                    shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_12%,transparent),0_20px_50px_-12px_color-mix(in_srgb,#0f172a_16%,var(--primary)_8%),0_8px_24px_-8px_rgba(15,23,42,0.12)]
                    dark:border-[color:color-mix(in_srgb,var(--primary)_22%,var(--border))]
                    dark:shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_15%,transparent),0_24px_56px_-12px_rgba(0,0,0,0.55),0_0_40px_-12px_color-mix(in_srgb,transparent_40%,var(--primary)_12%)]
                    lg:rounded-2xl lg:shadow-xl
                  "
                >
                  <motion.div
                    aria-hidden
                    className="
                      pointer-events-none absolute inset-x-6 top-0 z-10 h-px rounded-full
                      bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent
                      opacity-90 shadow-[0_0_12px_1px_color-mix(in_srgb,var(--primary)_35%,transparent)]
                      lg:inset-x-12 lg:via-[var(--foreground)] lg:shadow-[0_0_12px_1px_color-mix(in_srgb,var(--foreground)_25%,transparent)]
                    "
                    initial={
                      reduceMotion
                        ? { opacity: 1, scaleX: 1 }
                        : { scaleX: 0, opacity: 0 }
                    }
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{
                      duration: reduceMotion ? 0.01 : 0.5,
                      ease: [0.22, 1, 0.36, 1],
                      delay: reduceMotion ? 0 : 0.04,
                    }}
                    style={{ transformOrigin: "50% 50%" }}
                  />
                  <motion.div
                    className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-4 pb-4 pt-5 lg:hidden"
                    initial={reduceMotion ? {} : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { ...springItem, delay: 0.05 }
                    }
                  >
                    <div className="min-w-0 pr-2">
                      <p
                        id={titleId}
                        className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400 lg:text-xs lg:tracking-[0.15em]"
                      >
                        Advance NextNews
                      </p>
                      <p className="mt-1.5 text-xs font-normal leading-relaxed text-[var(--muted)] lg:mt-2 lg:text-sm">
                        Pick one to jump
                        there in a single tap-no digging through menus.🤫
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Close member menu"
                      onClick={() => setIsOpen(false)}
                      className="
                        -mr-1 -mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                        text-[var(--muted)] transition-colors
                        hover:bg-[color:color-mix(in_srgb,var(--foreground)_6%,transparent)]
                        hover:text-[var(--foreground)]
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30
                      "
                    >
                      <X size={16} strokeWidth={2} aria-hidden />
                    </button>
                  </motion.div>

                  <motion.ul
                    className="flex flex-col gap-2.5 overflow-y-auto overscroll-contain px-3.5 py-3.5 lg:flex-row lg:items-stretch lg:gap-0 lg:overflow-visible lg:px-3 lg:py-3"
                    role="none"
                    variants={menuListVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {memberLinks.map((item, index) => {
                      const Icon = item.icon;
                      const isSelected = selectedIndex === index;
                      const inactive = Boolean(item.isComingSoon);

                      return (
                        <motion.li
                          key={item.id}
                          role="none"
                          variants={menuItemVariants}
                          className="w-full lg:flex-1"
                        >
                          <div className="flex w-full items-center h-full">
                            {index > 0 && (
                              <div
                                className="hidden lg:block w-px self-stretch bg-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] mx-1 shrink-0 rounded-full"
                                aria-hidden
                              />
                            )}
                            <motion.button
                              ref={(el) => {
                                menuItemsRef.current[index] = el;
                              }}
                              type="button"
                              role="menuitem"
                              aria-disabled={inactive}
                              tabIndex={isOpen && isSelected ? 0 : -1}
                              aria-label={item.label}
                              onClick={() => {
                                if (inactive) handleComingSoonClick();
                                else handleMemberClick(item);
                              }}
                              whileHover={
                                reduceMotion
                                  ? undefined
                                  : {
                                      y: -2.5,
                                      scale: 1.015,
                                      boxShadow:
                                        "0 16px 32px -8px color-mix(in srgb, var(--primary) 30%, transparent), 0 6px 14px -6px rgba(15, 23, 42, 0.15)",
                                    }
                              }
                              whileTap={
                                reduceMotion ? undefined : { scale: 0.985 }
                              }
                              transition={{
                                type: "spring",
                                stiffness: 460,
                                damping: 36,
                              }}
                              className={`
                                group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left shadow-sm
                                transition-all duration-200
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40
                                focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]
                                lg:w-full lg:flex-col lg:items-center lg:justify-center lg:border-none lg:px-5 lg:py-4 lg:shadow-none lg:gap-2 lg:rounded-xl lg:text-center
                                ${
                                  isSelected
                                    ? "border-[color:color-mix(in_srgb,var(--primary)_48%,var(--border))] bg-[color:color-mix(in_srgb,var(--primary)_8%,var(--card))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_12%,transparent),0_8px_20px_-10px_color-mix(in_srgb,var(--primary)_18%,transparent)] lg:bg-blue-50/60 dark:lg:bg-[color:color-mix(in_srgb,var(--foreground)_7%,transparent)] lg:shadow-none"
                                    : "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_98%,var(--primary)_2%)] hover:border-[color:color-mix(in_srgb,var(--primary)_28%,var(--border))] hover:bg-[color:color-mix(in_srgb,var(--card)_94%,var(--primary)_6%)] lg:bg-transparent lg:hover:bg-blue-50/60 dark:lg:hover:bg-[color:color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                                }
                                ${inactive ? "cursor-default" : ""}
                              `}
                            >
                              {/* Mobile Leading Icon */}
                              <motion.span
                                className="
                                  inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                                  bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 ring-1 ring-emerald-100/80
                                  transition-all duration-300
                                  group-hover:from-emerald-100 group-hover:to-teal-100 group-hover:text-emerald-700 group-hover:ring-emerald-200/90 group-hover:shadow-md
                                  dark:from-emerald-400/10 dark:to-teal-400/10 dark:text-emerald-400 dark:ring-emerald-500/20
                                  dark:group-hover:from-emerald-400/20 dark:group-hover:to-teal-400/20 dark:group-hover:text-emerald-300 dark:group-hover:ring-emerald-500/40 dark:group-hover:shadow-[0_4px_12px_rgba(16,185,129,0.15)]
                                  lg:hidden
                                "
                                aria-hidden
                                whileHover={reduceMotion ? undefined : { scale: 1.1, rotate: 3 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 350,
                                  damping: 20,
                                }}
                              >
                                <Icon size={18} strokeWidth={1.6} />
                              </motion.span>

                              {/* Desktop Icon */}
                              <span
                                className={`hidden lg:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                                  isSelected
                                    ? "bg-blue-100 text-blue-600 dark:bg-[color:color-mix(in_srgb,var(--foreground)_12%,transparent)] dark:text-[var(--foreground)]"
                                    : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-[color:color-mix(in_srgb,var(--foreground)_6%,transparent)] dark:text-[var(--muted)] dark:group-hover:bg-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] dark:group-hover:text-[var(--foreground)]"
                                }`}
                              >
                                <Icon size={20} strokeWidth={1.8} />
                              </span>

                              <span className="min-w-0 flex-1 lg:flex-initial lg:text-center lg:mt-0.5">
                                <span className="flex items-center gap-2 lg:flex-col lg:gap-1.5 lg:justify-center">
                                  <span
                                    className={`text-sm transition-colors duration-200 lg:text-[12px] lg:font-medium lg:tracking-wide ${
                                      isSelected
                                        ? "font-semibold text-[var(--foreground)] lg:text-blue-700 dark:lg:text-[var(--foreground)]"
                                        : "font-semibold text-[var(--foreground)] group-hover:text-[color:color-mix(in_srgb,var(--foreground)_90%,var(--primary)_10%)] lg:text-[var(--muted)] lg:group-hover:text-blue-600 dark:lg:group-hover:text-[var(--foreground)]"
                                    }`}
                                  >
                                    {item.label}
                                  </span>
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ring-1 transition-colors duration-200 ${
                                    isSelected 
                                      ? "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700" 
                                      : "bg-slate-100 text-slate-600 ring-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:ring-blue-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200 dark:group-hover:ring-slate-600"
                                  }`}>
                                    {item.accessLabel}
                                  </span>
                                </span>
                                {item.description ? (
                                  <span className="mt-0.5 block text-[11px] leading-snug text-[var(--muted)] lg:hidden">
                                    {item.description}
                                  </span>
                                ) : null}
                              </span>

                              {/* Mobile Trailing Arrow */}
                              <motion.span
                                className="
                                  inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                                  border border-emerald-100/90 bg-gradient-to-br from-emerald-50/90 to-teal-50/90 text-emerald-500
                                  transition-all duration-300
                                  group-hover:border-emerald-200 group-hover:from-emerald-100/95 group-hover:to-teal-100/95 group-hover:text-emerald-600
                                  dark:border-emerald-500/20 dark:from-emerald-400/10 dark:to-teal-400/10 dark:text-emerald-400
                                  dark:group-hover:border-emerald-500/30 dark:group-hover:from-emerald-400/20 dark:group-hover:to-teal-400/20 dark:group-hover:text-emerald-300
                                  lg:hidden
                                "
                                aria-hidden
                                whileHover={reduceMotion ? undefined : { x: 5, scale: 1.08 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 350,
                                  damping: 20,
                                }}
                              >
                                <ArrowRight
                                  size={16}
                                  strokeWidth={2}
                                  className="transition-colors duration-200"
                                />
                              </motion.span>
                            </motion.button>
                          </div>
                        </motion.li>
                      );
                    })}
                  </motion.ul>

                  {/* Mobile-only footer */}
                  <motion.div
                    className="shrink-0 border-t border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_96%,var(--primary)_4%)] px-4 py-3 dark:bg-[color:color-mix(in_srgb,var(--card)_92%,var(--primary)_5%)] lg:hidden"
                    initial={reduceMotion ? {} : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.35,
                      delay: reduceMotion ? 0 : 0.28,
                    }}
                  >
                    <p className="text-center text-[11px] leading-relaxed text-[var(--muted)]">
                      Most areas are available only to{" "}
                      <span className="font-semibold text-[var(--foreground)]">Pro</span>{" "}
                      and{" "}
                      <span className="font-semibold text-[var(--foreground)]">Pro+</span>{" "}
                      members. Be part of our family and unlock the whole world of NextNews.
                    </p>
                  </motion.div>

                  {/* Desktop-only pro access strip */}
                  <motion.div
                    className="hidden lg:flex shrink-0 items-center justify-between gap-4 border-t border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] px-5 py-3"
                    initial={reduceMotion ? {} : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.3,
                      delay: reduceMotion ? 0 : 0.22,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <p className="text-[11px] leading-relaxed text-[var(--muted)]">
                      <span className="font-semibold text-[var(--foreground)]">Pro</span> &amp;{" "}
                      <span className="font-semibold text-[var(--foreground)]">Pro+</span> areas are coming soon — be part of the NextNews family.
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.5)]"/>
                      Live
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {showNotice && (
                <motion.div
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 28, x: 16, scale: 0.97 }
                  }
                  animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 16, x: 8, scale: 0.98 }
                  }
                  transition={{
                    ease: [0.16, 1, 0.3, 1],
                    duration: reduceMotion ? 0.01 : 0.32,
                  }}
                  className="pointer-events-none fixed bottom-4 right-4 z-[60] w-[min(100vw-2rem,22rem)] sm:bottom-6 sm:right-6"
                >
              <div
                className="
                  pointer-events-auto relative overflow-hidden rounded-2xl border border-emerald-200/70
                  bg-white/95 shadow-xl dark:border-emerald-500/20 dark:bg-slate-900/95
                  sm:rounded-[24px]
                "
                role="status"
                aria-live="polite"
                aria-atomic
              >
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-emerald-400/20 via-teal-300/20 to-cyan-300/20 dark:from-emerald-400/10 dark:via-teal-400/10 dark:to-cyan-400/10" />
                <div className="absolute -right-8 top-6 h-28 w-28 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/10" />
              <div className="relative px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={dismissNotice}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-400 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-slate-600 dark:hover:text-slate-200"
                    aria-label="Close message"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>

                <div className="-mt-1 flex flex-col gap-3 text-center sm:mt-0 sm:flex-row sm:items-center sm:gap-4 sm:text-left">
                  <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 sm:mx-0">
                    <Construction className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
                      Under construction
                    </p>
                    <h3 className="mt-1 text-base font-semibold leading-snug text-slate-900 dark:text-slate-50 sm:text-lg">
                      Advanced pages aren’t available yet
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      We’re actively building these areas. They’ll open from this
                      menu when they’re ready.
                    </p>
                  </div>
                </div>
              </div>
            </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
