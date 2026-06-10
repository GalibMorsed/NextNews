"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import LottiePlayer from "./LottiePlayer";

const DOWNLOADED_KEY = "nextnews_app_downloaded";
const DISMISSED_KEY = "nextnews_download_popup_dismissed_until";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function DownloadNowPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if user has already downloaded or recently dismissed the popup
    const isDownloaded = localStorage.getItem(DOWNLOADED_KEY) === "true";
    const dismissedUntilRaw = localStorage.getItem(DISMISSED_KEY);
    const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0;

    if (!isDownloaded && (!Number.isFinite(dismissedUntil) || dismissedUntil <= Date.now())) {
      setIsVisible(true);
    }

    // Handle beforeinstallprompt event for PWA download functionality
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Ensure popup is shown if install prompt is available and not already downloaded
      if (!isDownloaded && (!Number.isFinite(dismissedUntil) || dismissedUntil <= Date.now())) {
        setIsVisible(true);
      }
    };

    // Handle standard browser install event detection
    const handleAppInstalled = () => {
      localStorage.setItem(DOWNLOADED_KEY, "true");
      setIsVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleDownload = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          localStorage.setItem(DOWNLOADED_KEY, "true");
          setIsVisible(false);
        }
      } catch (err) {
        console.warn("PWA installation prompt error:", err);
        // Fallback: mark as downloaded anyway on click
        localStorage.setItem(DOWNLOADED_KEY, "true");
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // If deferredPrompt is not available (e.g. running in standalone mode or already installed),
      // fallback to marking as downloaded on button click
      localStorage.setItem(DOWNLOADED_KEY, "true");
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    // Store dismissal timestamp for 1 day
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + ONE_DAY_MS));
    setIsVisible(false);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.offset.y) > 90) {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="fixed top-5 inset-x-0 z-[9999] flex justify-center px-4 pointer-events-none"
        >
          <motion.div
            drag
            dragElastic={0.2}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="pointer-events-auto flex items-start sm:items-center gap-3.5 sm:gap-5 p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[20px] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.4)] backdrop-blur-md w-full max-w-sm sm:max-w-xl sm:pr-5 cursor-grab active:cursor-grabbing select-none"
          >
            {/* Logo container */}
            <div className="h-11 w-11 shrink-0 rounded-xl border border-slate-100 bg-white p-1.5 flex items-center justify-center dark:border-slate-800 dark:bg-slate-950 shadow-sm mt-0.5 sm:mt-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo1.png"
                alt="NextNews Logo"
                className="h-full w-full object-contain rounded-md"
              />
            </div>

            {/* Info & Button container */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              {/* Texts info */}
              <div className="min-w-0 text-left">
                <h4 className="text-[14px] font-extrabold text-slate-900 dark:text-slate-50 leading-snug">
                  Get NextNews on the App
                </h4>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                  Faster. Smarter. All in one place.
                </p>
              </div>

              {/* Action button */}
              <div className="flex sm:block justify-start">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/60 px-4 py-2.5 text-[12px] font-bold text-blue-600 transition duration-300 dark:border-blue-900/40 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 dark:text-blue-400 cursor-pointer w-full sm:w-auto"
                >
                  <span>Download Now</span>
                  <LottiePlayer
                    src="/personalization/download.json"
                    className="h-5 w-5"
                  />
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-350 transition-colors duration-200 cursor-pointer mt-0.5 sm:mt-0 self-start sm:self-center"
              aria-label="Dismiss download banner"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
