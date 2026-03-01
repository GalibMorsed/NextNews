"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  applyAppearanceSettings,
  broadcastAppearanceSettings,
  readAppearanceSettings,
  saveAppearanceSettings,
  type AppearanceSettings,
} from "@/lib/appearance";

const PRESET_THEMES = [
  { id: "indigo", label: "Soft Indigo", color: "#4f46e5" },
  { id: "emerald", label: "Deep Emerald", color: "#10b981" },
  { id: "slate", label: "Slate Blue", color: "#64748b" },
];

const FONT_FAMILY_OPTIONS = [
  {
    label: "System Default (Sans Serif)",
    value:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    label: "italic Sans Serif",
    value: "italic system-ui, -apple-system, sans-serif",
  },
  { label: "Roboto", value: "'Roboto', system-ui, sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  {
    label: "Playfair Display (Serif)",
    value: "'Playfair Display', Georgia, serif",
  },
];

export default function AppearancePage() {
  const [theme, setTheme] = useState(DEFAULT_APPEARANCE_SETTINGS.theme);
  const [primaryColor, setPrimaryColor] = useState(
    DEFAULT_APPEARANCE_SETTINGS.primaryColor,
  );
  const [fontSize, setFontSize] = useState(DEFAULT_APPEARANCE_SETTINGS.fontSize);
  const [fontFamily, setFontFamily] = useState(
    DEFAULT_APPEARANCE_SETTINGS.fontFamily,
  );
  const [reducedMotion, setReducedMotion] = useState(
    DEFAULT_APPEARANCE_SETTINGS.reducedMotion,
  );
  const [highContrast, setHighContrast] = useState(
    DEFAULT_APPEARANCE_SETTINGS.highContrast,
  );
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoadedStoredSettings, setHasLoadedStoredSettings] = useState(false);

  const currentSettings = useMemo<AppearanceSettings>(
    () => ({
      theme,
      primaryColor,
      fontSize,
      fontFamily,
      reducedMotion,
      highContrast,
    }),
    [theme, primaryColor, fontSize, fontFamily, reducedMotion, highContrast],
  );

  // Apply changes live
  useEffect(() => {
    if (!hasLoadedStoredSettings) return;
    applyAppearanceSettings(currentSettings);
    broadcastAppearanceSettings(currentSettings);
  }, [currentSettings, hasLoadedStoredSettings]);

  // Load saved settings after mount to avoid hydration mismatch.
  useEffect(() => {
    const stored = readAppearanceSettings();
    const frame = window.requestAnimationFrame(() => {
      setTheme(stored.theme);
      setPrimaryColor(stored.primaryColor);
      setFontSize(stored.fontSize);
      setFontFamily(stored.fontFamily);
      setReducedMotion(stored.reducedMotion);
      setHighContrast(stored.highContrast);
      setHasLoadedStoredSettings(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-dismiss popup message
  useEffect(() => {
    if (popupMessage) {
      const timer = setTimeout(() => {
        setPopupMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [popupMessage]);

  const saveSettings = () => {
    if (!hasLoadedStoredSettings) return;
    saveAppearanceSettings(currentSettings);
    broadcastAppearanceSettings(currentSettings);
    setPopupMessage("Appearance saved successfully!");
  };

  const resetDefaults = () => {
    const defaults = DEFAULT_APPEARANCE_SETTINGS;
    setTheme(defaults.theme);
    setPrimaryColor(defaults.primaryColor);
    setFontSize(defaults.fontSize);
    setFontFamily(defaults.fontFamily);
    setReducedMotion(defaults.reducedMotion);
    setHighContrast(defaults.highContrast);
    if (hasLoadedStoredSettings) {
      saveAppearanceSettings(defaults);
      applyAppearanceSettings(defaults);
      broadcastAppearanceSettings(defaults);
    }
    setPopupMessage("Settings have been reset to defaults.");
  };

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mx-auto bg-white dark:bg-slate-900 lg:rounded-none shadow-xl lg:shadow-none p-4 sm:p-6 md:p-8 lg:p-10 lg:min-h-[calc(100vh-65px)]"
      >
        <section className="mb-6 md:mb-8 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6">
          <span className="mb-3 inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Personalization
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100 text-center md:text-left">
            Appearance Settings
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-slate-300 text-center md:text-left">
            Customize theme color, typography, and accessibility preferences to
            make the app look and feel the way you prefer. 😉
          </p>
        </section>

        {/* Interface theme */}
        <section className="mb-8 md:mb-10">
          <div className="mb-3 md:mb-4">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-slate-100">
              Interface theme
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              Choose the color of your application
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {PRESET_THEMES.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setPrimaryColor(t.color);
                  }}
                  className={`group relative rounded-xl border-2 transition-all duration-200 overflow-hidden
                  ${isSelected ? "border-[var(--primary)] shadow-md" : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500"}`}
                >
                  <div className="p-3 sm:p-4 pb-2 sm:pb-3">
                    <div className="bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden shadow-inner mb-2 sm:mb-3 aspect-[4/3] relative">
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{ backgroundColor: t.color }}
                      />
                      <div className="absolute top-1 sm:top-2 left-1 sm:left-2 right-1 sm:right-2 h-1 sm:h-1.5 bg-gray-300 rounded-full" />
                      <div className="absolute top-3 sm:top-5 left-2 sm:left-3 right-2 sm:right-3 h-12 sm:h-16 bg-white dark:bg-slate-900 rounded shadow-sm" />
                      <div
                        className="absolute top-4 sm:top-6 left-3 sm:left-4 w-16 sm:w-20 h-1 sm:h-1.5 rounded"
                        style={{ backgroundColor: t.color }}
                      />
                      <div
                        className="absolute top-7 sm:top-10 left-3 sm:left-4 w-24 sm:w-32 h-0.5 sm:h-1 rounded"
                        style={{ backgroundColor: t.color, opacity: 0.7 }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-slate-200 group-hover:text-[var(--primary)] transition-colors">
                        {t.label}
                      </p>
                      {isSelected && (
                        <div className="bg-[var(--primary)] text-white rounded-full p-0.5 sm:p-0.5">
                          <Check size={12} className="sm:w-4 sm:h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Custom color */}
        <section className="mb-8 md:mb-10 pt-6 md:pt-8 border-t border-gray-100 dark:border-slate-700">
          <div className="mb-3 md:mb-4">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-slate-100">
              Customize main color
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              Add your own main color
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
            <button
              onClick={() => {
                const random = getRandomColor();
                setTheme("custom");
                setPrimaryColor(random);
              }}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium"
            >
              ✨ Surprise me
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-gray-300 dark:border-slate-600 shadow-sm flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => {
                  setTheme("custom");
                  setPrimaryColor(e.target.value);
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded cursor-pointer flex-shrink-0"
              />
              <span className="text-xs sm:text-sm font-mono text-gray-600 dark:text-slate-300 uppercase truncate">
                {primaryColor}
              </span>
            </div>
          </div>
        </section>

        {/* Font size */}
        <section className="mb-10 md:mb-12 pt-6 md:pt-8 border-t border-gray-100 dark:border-slate-700">
          <div className="mb-3 md:mb-4">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-slate-100">
              Font size
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              Personalize your application font size
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 max-w-xs sm:max-w-md md:max-w-lg mx-auto">
            <span className="text-sm sm:text-base font-medium text-gray-600 dark:text-slate-300">
              Aa
            </span>

            <input
              type="range"
              min={14}
              max={20}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="flex-1 h-2 sm:h-2.5 rounded-full appearance-none cursor-pointer accent-[var(--primary)] bg-gray-200"
              style={{
                background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((fontSize - 14) / 6) * 100}%, #e5e7eb ${((fontSize - 14) / 6) * 100}%, #e5e7eb 100%)`,
              }}
            />

            <span className="text-lg sm:text-xl font-medium text-gray-600 dark:text-slate-300">
              Aa
            </span>
          </div>

          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-2 sm:mt-3 text-center">
            Current size: {fontSize}px
          </p>
        </section>

        {/* Font family - Updated styling to match page design */}
        <section className="mb-8 md:mb-10 pt-6 md:pt-8 border-t border-gray-100 dark:border-slate-700">
          <div className="mb-3 md:mb-4">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-slate-100">
              Font family
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              Choose how text looks across the website
            </p>
          </div>

          <div className="relative w-full sm:max-w-md">
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base text-gray-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent shadow-sm cursor-pointer transition-all hover:border-gray-400"
            >
              {FONT_FAMILY_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  style={{ fontFamily: option.value }}
                >
                  {option.label}
                </option>
              ))}
            </select>

            {/* Custom dropdown arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-slate-300">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* Accessibility & Motion */}
        <section className="mb-8 md:mb-10 pt-6 md:pt-8 border-t border-gray-100 dark:border-slate-700 space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-slate-100 text-base sm:text-lg">
                Reduce motion
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                Minimize animations for better focus
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-[var(--primary)] after:content-[''] after:absolute after:top-[1px] sm:after:top-[2px] after:left-[1px] sm:after:left-[2px] after:bg-white after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:after:translate-x-4 sm:peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-slate-100 text-base sm:text-lg">
                High contrast mode
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                Increase contrast for better readability
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-[var(--primary)] after:content-[''] after:absolute after:top-[1px] sm:after:top-[2px] after:left-[1px] sm:after:left-[2px] after:bg-white after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:after:translate-x-4 sm:peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-6 border-t border-gray-100 dark:border-slate-700">
          <div className="bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-lg border border-red-100 dark:border-red-800">
            <button
              onClick={resetDefaults}
              className="text-xs sm:text-sm text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 flex items-center gap-1 transition-colors"
            >
              <span className="text-sm sm:text-base">↺</span> Reset to defaults
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-3 sm:mt-0">
            <button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-xs sm:text-sm">
              Cancel
            </button>
            <button
              onClick={saveSettings}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-[var(--primary)] text-white font-medium hover:brightness-110 transition-all shadow-sm text-xs sm:text-sm"
            >
              Save appearance
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {popupMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-sm"
            onClick={() => setPopupMessage(null)}
          >
            <motion.div
              variants={isMobile ? mobileVariants : desktopVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
              className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl bg-white dark:bg-slate-800 p-5 sm:p-6 shadow-xl flex items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <Check size={20} />
              </div>
              <p className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-100">
                {popupMessage}
              </p>
              <button
                type="button"
                onClick={() => setPopupMessage(null)}
                className="flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-slate-200 transition-all duration-200"
                aria-label="Close message"
              >
                <X size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
