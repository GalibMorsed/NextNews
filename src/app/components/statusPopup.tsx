"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BellRing, Check, CheckCircle2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type PopupTone = "success" | "info" | "error";

type PopupContext = "settings" | "personalization" | "notes" | "appearance";

type PopupVariant = "rich" | "compact";

type PopupAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
};

type StatusPopupProps = {
  isOpen: boolean;
  tone: PopupTone;
  message: string;
  onClose: () => void;
  context?: PopupContext;
  variant?: PopupVariant;
  isMobile?: boolean;
  action?: PopupAction;
};

const COPY_BY_CONTEXT: Record<
  PopupContext,
  Record<PopupTone, { label: string; heading: string }>
> = {
  settings: {
    success: { label: "Settings Updated", heading: "Changes saved" },
    info: { label: "Settings Notice", heading: "Please review" },
    error: { label: "Settings Alert", heading: "Something needs attention" },
  },
  personalization: {
    success: {
      label: "Preferences Updated",
      heading: "Ready for a fresh start!",
    },
    info: { label: "Preferences Notice", heading: "Please review" },
    error: {
      label: "Preferences Alert",
      heading: "Something needs attention",
    },
  },
  notes: {
    success: { label: "Notes Updated", heading: "Changes saved" },
    info: { label: "Notes Notice", heading: "Please review" },
    error: { label: "Notes Alert", heading: "Something needs attention" },
  },
  appearance: {
    success: { label: "Appearance Updated", heading: "Changes saved" },
    info: { label: "Appearance Notice", heading: "Please review" },
    error: {
      label: "Appearance Alert",
      heading: "Something needs attention",
    },
  },
};

const FALLBACK_COPY: Record<PopupTone, { label: string; heading: string }> = {
  success: { label: "Update complete", heading: "Changes saved" },
  info: { label: "Notice", heading: "Please review" },
  error: { label: "Alert", heading: "Something needs attention" },
};

const TONE_STYLES: Record<
  PopupTone,
  {
    border: string;
    gradient: string;
    glow: string;
    icon: string;
    label: string;
    message: string;
    compactIcon: string;
  }
> = {
  success: {
    border: "border-emerald-200/70 dark:border-emerald-500/20",
    gradient:
      "bg-gradient-to-r from-emerald-400/20 via-sky-300/20 to-cyan-300/20 dark:from-emerald-400/10 dark:via-sky-400/10 dark:to-cyan-400/10",
    glow: "bg-emerald-300/20 dark:bg-emerald-400/10",
    icon: "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20",
    label: "text-emerald-600 dark:text-emerald-300",
    message:
      "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:border-emerald-500/10 dark:from-emerald-500/10 dark:via-slate-900 dark:to-sky-500/10",
    compactIcon: "bg-emerald-100 text-emerald-600",
  },
  info: {
    border: "border-sky-200/70 dark:border-sky-500/20",
    gradient:
      "bg-gradient-to-r from-sky-400/20 via-cyan-300/20 to-indigo-300/20 dark:from-sky-400/10 dark:via-cyan-400/10 dark:to-indigo-400/10",
    glow: "bg-sky-300/20 dark:bg-sky-400/10",
    icon: "bg-gradient-to-br from-sky-500 to-cyan-500 shadow-sky-500/20",
    label: "text-sky-600 dark:text-sky-300",
    message:
      "border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:border-sky-500/10 dark:from-sky-500/10 dark:via-slate-900 dark:to-cyan-500/10",
    compactIcon: "bg-sky-100 text-sky-600",
  },
  error: {
    border: "border-red-200/70 dark:border-red-500/20",
    gradient:
      "bg-gradient-to-r from-red-400/20 via-rose-300/20 to-orange-300/20 dark:from-red-400/10 dark:via-rose-400/10 dark:to-orange-400/10",
    glow: "bg-red-300/20 dark:bg-red-400/10",
    icon: "bg-gradient-to-br from-red-500 to-orange-500 shadow-red-500/20",
    label: "text-red-600 dark:text-red-300",
    message:
      "border-red-100 bg-gradient-to-br from-red-50 via-white to-orange-50 dark:border-red-500/10 dark:from-red-500/10 dark:via-slate-900 dark:to-orange-500/10",
    compactIcon: "bg-red-100 text-red-600",
  },
};

const desktopVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.95 },
};

const mobileVariants = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: "100%" },
};

export default function StatusPopup({
  isOpen,
  tone,
  message,
  onClose,
  context,
  variant,
  isMobile,
  action,
}: StatusPopupProps) {
  const [isMobileInternal, setIsMobileInternal] = useState(false);

  useEffect(() => {
    if (isMobile !== undefined) return;
    const checkMobile = () => setIsMobileInternal(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isMobile]);

  const resolvedVariant =
    variant ??
    (context === "personalization" && tone !== "success" ? "compact" : "rich");
  const resolvedIsMobile = isMobile ?? isMobileInternal;
  const copy = context ? COPY_BY_CONTEXT[context][tone] : FALLBACK_COPY[tone];
  const styles = TONE_STYLES[tone];
  const maxWidthClass =
    context === "personalization" && tone === "success"
      ? "sm:max-w-lg"
      : "sm:max-w-md";

  const successIcon =
    context === "appearance" ? (
      <Check className="h-7 w-7" />
    ) : (
      <CheckCircle2 className="h-7 w-7" />
    );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            variants={resolvedIsMobile ? mobileVariants : desktopVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
            className={`relative w-full overflow-hidden rounded-t-2xl shadow-xl sm:rounded-[28px] ${
              resolvedVariant === "compact"
                ? `sm:max-w-md bg-white p-5 dark:bg-slate-800 sm:p-6`
                : `${maxWidthClass} border bg-white/95 dark:bg-slate-900/95 ${styles.border}`
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            {resolvedVariant === "compact" ? (
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    styles.compactIcon
                  }`}
                >
                  {tone === "info" ? (
                    <BellRing className="h-5 w-5" />
                  ) : tone === "error" ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                </div>
                <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                  {message}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Close message"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`absolute inset-x-0 top-0 h-24 ${styles.gradient}`}
                />
                <div
                  className={`absolute -right-10 top-8 h-32 w-32 rounded-full blur-3xl ${styles.glow}`}
                />
                <div className="relative px-4 pb-5 pt-4 sm:p-7">
                  <div className="flex items-start justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-400 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-slate-600 dark:hover:text-slate-200"
                      aria-label="Close message"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-1 flex flex-col items-center text-center sm:mt-0 sm:flex-row sm:items-center sm:gap-4 sm:text-left">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
                        styles.icon
                      }`}
                    >
                      {tone === "success" ? (
                        successIcon
                      ) : tone === "info" ? (
                        <BellRing className="h-7 w-7" />
                      ) : (
                        <AlertTriangle className="h-7 w-7" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                          styles.label
                        }`}
                      >
                        {copy.label}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {copy.heading}
                      </h3>
                    </div>
                  </div>

                  <div
                    className={`mt-5 rounded-2xl border p-4 text-center sm:text-left ${
                      styles.message
                    }`}
                  >
                    <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                      {message}
                    </p>
                  </div>

                  {action ? (
                    <div className="mt-5 flex justify-end">
                      {action.href ? (
                        <Link
                          href={action.href}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          {action.label}
                          {action.icon}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={action.onClick}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          {action.label}
                          {action.icon}
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
