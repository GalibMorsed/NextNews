"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Construction, X } from "lucide-react";

interface UnderConstructionPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnderConstructionPopup({
  isOpen,
  onClose,
}: UnderConstructionPopupProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
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
                  onClick={onClose}
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
                    FIFA pages will be available soon
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
    document.body
  );
}
