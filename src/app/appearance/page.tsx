"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  applyAppearanceSettings,
  broadcastAppearanceSettings,
  readAppearanceSettings,
  saveAppearanceSettings,
  type AppearanceSettings,
} from "@/lib/appearance";
import StatusPopup from "../components/statusPopup";

const PRESET_THEMES = [
  { id: "indigo", label: "Soft Indigo", color: "#4f46e5" },
  { id: "emerald", label: "Deep Emerald", color: "#10b981" },
  { id: "slate", label: "Slate Blue", color: "#64748b" },
];

const FONT_FAMILY_OPTIONS = [
  {
    label: "App Default (Jakarta Sans)",
    value: "var(--font-jakarta), system-ui, sans-serif",
  },
  {
    label: "System Native (OS Default)",
    value:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  {
    label: "italic Sans Serif",
    value: "italic system-ui, -apple-system, sans-serif",
  },
  {
    label: "Editorial Serif (Georgia)",
    value: "Georgia, Cambria, 'Times New Roman', Times, serif",
  },
  {
    label: "Classic Sans (Arial / Helvetica)",
    value: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
  },
];

export default function AppearancePage() {
  const [theme, setTheme] = useState(DEFAULT_APPEARANCE_SETTINGS.theme);
  const [primaryColor, setPrimaryColor] = useState(
    DEFAULT_APPEARANCE_SETTINGS.primaryColor,
  );
  const [fontSize, setFontSize] = useState(
    DEFAULT_APPEARANCE_SETTINGS.fontSize,
  );
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mx-auto bg-white dark:bg-slate-900 lg:rounded-none shadow-xl lg:shadow-none p-4 sm:p-6 md:p-8 lg:p-10 lg:min-h-[calc(100vh-65px)] space-y-6 sm:space-y-8"
      >
        <section className="mb-6 md:mb-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6">
          <div className="flex justify-start mb-3">
            <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Theme & Style
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Appearance Settings
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-left">
            Customize theme color, typography, and accessibility preferences to
            make the app look and feel the way you prefer. 😉
          </p>
        </section>

        {/* Interface theme */}
        <section className="bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-8 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/20">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Interface theme
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose the color scheme of your application
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRESET_THEMES.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setPrimaryColor(t.color);
                  }}
                  className={`group relative rounded-2xl border-2 transition-all duration-300 overflow-hidden
                  ${isSelected ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-lg translate-y-[-4px]" : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white/50 dark:bg-slate-800/40"}`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden shadow-inner mb-4 aspect-[16/10] relative transition-transform group-hover:scale-[1.02] duration-300">
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

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[var(--primary)] transition-colors">
                        {t.label}
                      </p>
                      {isSelected ? (
                        <div className="bg-[var(--primary)] text-white rounded-full p-1 shadow-sm">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-[var(--primary)]/50 transition-colors" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Custom color */}
        <section className="bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-8 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/20">
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Customize main color
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Add your own main color
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <button
              onClick={() => {
                const random = getRandomColor();
                setTheme("custom");
                setPrimaryColor(random);
              }}
              className="px-5 py-2.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 text-sm font-semibold shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              ✨ Surprise me
            </button>

            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => {
                  setTheme("custom");
                  setPrimaryColor(e.target.value);
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer flex-shrink-0 appearance-none border-0"
              />
              <span className="text-sm font-mono text-slate-600 dark:text-slate-300 uppercase truncate pr-2">
                {primaryColor}
              </span>
            </div>
          </div>
        </section>

        {/* Font size */}
        <section className="bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-8 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/20">
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Font size
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Personalize your application font size
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 max-w-lg">
              <span className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400">
                Aa
              </span>

              <input
                type="range"
                min={14}
                max={20}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 h-2 sm:h-2.5 rounded-full appearance-none cursor-pointer accent-[var(--primary)] bg-slate-200 dark:bg-slate-700"
                style={{
                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((fontSize - 14) / 6) * 100}%, #e5e7eb ${((fontSize - 14) / 6) * 100}%, #e5e7eb 100%)`,
                }}
              />

              <span className="text-xl sm:text-2xl font-medium text-slate-600 dark:text-slate-400">
                Aa
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className="bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Current: {fontSize}px
              </div>
            </div>
          </div>
        </section>

        {/* Font family */}
        <section className="bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-8 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/20">
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Font family
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose how text looks across the website
            </p>
          </div>

          <div className="relative w-full sm:max-w-md">
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 pr-10 text-sm sm:text-base text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent shadow-sm cursor-pointer transition-all hover:border-slate-400 dark:hover:border-slate-500"
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

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-300">
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
        <section className="bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-8 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/20">
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Accessibility & Motion
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Customize your browsing experience for better focus and
              readability
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Reduce motion
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-[var(--primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  High contrast mode
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-[var(--primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
          <div className="bg-red-50 dark:bg-red-950/40 px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-lg border border-red-100 dark:border-red-800">
            <button
              onClick={resetDefaults}
              className="text-sm sm:text-xs text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 flex items-center gap-2 transition-colors font-semibold"
            >
              <span className="text-base sm:text-sm">↺</span> Reset to defaults
            </button>
          </div>

          <div className="flex flex-row gap-3 w-full sm:w-auto mt-3 sm:mt-0">
            <button className="w-full sm:w-auto px-6 sm:px-5 py-2.5 sm:py-2 rounded-xl sm:rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold text-sm">
              Cancel
            </button>
            <button
              onClick={saveSettings}
              className="w-full sm:w-auto px-6 sm:px-5 py-2.5 sm:py-2 rounded-xl sm:rounded-md bg-[var(--primary)] text-white font-semibold hover:brightness-110 transition-all shadow-md text-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              Save appearance
            </button>
          </div>
        </div>
      </motion.div>

      <StatusPopup
        isOpen={Boolean(popupMessage)}
        tone="success"
        message={popupMessage ?? ""}
        onClose={() => setPopupMessage(null)}
        context="appearance"
      />
    </>
  );
}
