"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Shuffle, Pipette } from "lucide-react";
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
  { id: "rose", label: "Rose Gold", color: "#f43f5e" },
];

const CURATED_COLORS = [
  // Purples & Indigos
  { hex: "#7c3aed", name: "Violet" },
  { hex: "#4f46e5", name: "Indigo" },
  { hex: "#6366f1", name: "Lavender" },
  { hex: "#8b5cf6", name: "Purple" },
  // Blues
  { hex: "#0ea5e9", name: "Sky" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#1d4ed8", name: "Royal" },
  { hex: "#0284c7", name: "Ocean" },
  // Greens
  { hex: "#10b981", name: "Emerald" },
  { hex: "#22c55e", name: "Green" },
  { hex: "#16a34a", name: "Forest" },
  { hex: "#14b8a6", name: "Teal" },
  // Warm
  { hex: "#f59e0b", name: "Amber" },
  { hex: "#f97316", name: "Orange" },
  { hex: "#ef4444", name: "Red" },
  { hex: "#f43f5e", name: "Rose" },
  // Neutrals
  { hex: "#64748b", name: "Slate" },
  { hex: "#6b7280", name: "Gray" },
  { hex: "#78716c", name: "Stone" },
  { hex: "#0f172a", name: "Midnight" },
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
    label: "italic Serif (Playfair)",
    value: "'Playfair Display', Georgia, serif",
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
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const colorInputRef = useRef<HTMLInputElement>(null);

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

  const applyColor = (hex: string) => {
    setTheme("custom");
    setPrimaryColor(hex);
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== hex.toLowerCase());
      return [hex, ...filtered].slice(0, 5);
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full mx-auto bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 lg:rounded-none p-4 sm:p-6 md:p-8 lg:p-10 lg:min-h-[calc(100vh-65px)] space-y-8 sm:space-y-10"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 0.7, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-[var(--primary)]/12 blur-3xl dark:bg-[var(--primary)]/10"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 0.5, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="absolute right-0 top-40 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10"
          />
        </div>

        <section className="relative mb-6 md:mb-8 rounded-[20px] border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex justify-start mb-3">
            <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Signature Style
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
        <section className="relative border-t border-slate-300 dark:border-slate-600 px-0 pb-0 pt-6 bg-transparent shadow-none transition-all sm:rounded-[20px] sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-800/80 sm:p-8 sm:shadow-sm sm:backdrop-blur sm:hover:bg-white/95 sm:dark:hover:bg-slate-800/90">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Visual Atmosphere
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose the color scheme of your application
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {PRESET_THEMES.map((t) => {
              const isSelected = theme === t.id;
              return (
                <motion.button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setPrimaryColor(t.color);
                  }}
                  whileHover={{ y: -6, scale: 1.018 }}
                  whileTap={{ scale: 0.982 }}
                  className={`group relative rounded-[18px] border-2 transition-all duration-300 overflow-hidden
                  ${isSelected ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-md shadow-slate-200/25 dark:shadow-slate-950/25" : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white/50 dark:bg-slate-800/40"}`}
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
                        className="absolute top-4 sm:top-6 left-3 sm:left-4 w-[50%] h-1 sm:h-1.5 rounded"
                        style={{ backgroundColor: t.color }}
                      />
                      <div
                        className="absolute top-7 sm:top-10 left-3 sm:left-4 w-[75%] h-0.5 sm:h-1 rounded"
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
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Custom color */}
        <section className="relative border-t border-slate-300 dark:border-slate-600 px-0 pb-0 pt-6 bg-transparent shadow-none transition-all sm:rounded-[20px] sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-800/80 sm:p-8 sm:shadow-sm sm:backdrop-blur sm:hover:bg-white/95 sm:dark:hover:bg-slate-800/90">
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Customize Main Color
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Pick from curated palettes or set your own brand color
            </p>
          </div>

          {/* Two-column layout: swatches left, live preview right */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Left: Palette + controls */}
            <div className="flex-1 flex flex-col gap-5">

              {/* Curated swatch grid */}
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Curated palette</p>
                <div className="grid grid-cols-10 gap-2">
                  {CURATED_COLORS.map((c) => (
                    <motion.button
                      key={c.hex}
                      title={c.name}
                      onClick={() => applyColor(c.hex)}
                      whileHover={{ scale: 1.18 }}
                      whileTap={{ scale: 0.92 }}
                      className="relative w-7 h-7 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:focus:ring-slate-500 transition-shadow"
                      style={{ backgroundColor: c.hex }}
                    >
                      {primaryColor.toLowerCase() === c.hex.toLowerCase() && theme === "custom" && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white drop-shadow" strokeWidth={3} />
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Recent colors */}
              {recentColors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Recent</p>
                  <div className="flex items-center gap-2">
                    {recentColors.map((c) => (
                      <motion.button
                        key={c}
                        title={c}
                        onClick={() => applyColor(c)}
                        whileHover={{ scale: 1.18 }}
                        whileTap={{ scale: 0.92 }}
                        className="w-7 h-7 rounded-lg shadow-sm border-2 transition-all"
                        style={{
                          backgroundColor: c,
                          borderColor: primaryColor.toLowerCase() === c.toLowerCase() ? "white" : "transparent",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Custom hex input + color picker + surprise */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Color picker trigger */}
                <div className="relative">
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={primaryColor}
                    onChange={(e) => applyColor(e.target.value)}
                    className="sr-only"
                    aria-label="Custom color picker"
                  />
                  <motion.button
                    onClick={() => colorInputRef.current?.click()}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    <span
                      className="w-4 h-4 rounded-md border border-slate-200 dark:border-slate-600 flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <Pipette className="w-3.5 h-3.5" />
                    <span className="font-mono text-xs uppercase">{primaryColor}</span>
                  </motion.button>
                </div>

                {/* Surprise me */}
                <motion.button
                  onClick={() => applyColor(getRandomColor())}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium shadow-sm hover:shadow-md transition-all"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Surprise me
                </motion.button>
              </div>
            </div>

            {/* Right: Live preview mini-card */}
            <div className="lg:w-64 flex-shrink-0">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Live preview</p>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-lg">
                {/* Mini nav bar */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-xs font-bold text-white/90 tracking-wide">NextNews</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-1.5 rounded-full bg-white/30" />
                    <span className="w-3 h-1.5 rounded-full bg-white/30" />
                  </div>
                </div>
                {/* Mini content */}
                <div className="p-3 space-y-2.5">
                  {/* Heading */}
                  <div className="space-y-1">
                    <div className="h-2.5 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2 w-3/5 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                  {/* Tags */}
                  <div className="flex gap-1.5">
                    <span
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: primaryColor }}
                    >Breaking</span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Sports</span>
                  </div>
                  {/* Card */}
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-2 space-y-1.5">
                    <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-2 pt-0.5">
                      <span
                        className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: primaryColor }}
                      >Read</span>
                      <div className="h-1.5 w-8 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                  {/* Bottom bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div
                          key={i}
                          className={i === 0 ? "w-5 h-5 rounded-lg" : "w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800"}
                          style={i === 0 ? { backgroundColor: primaryColor } : undefined}
                        />
                      ))}
                    </div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor, opacity: 0.25 }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Font size */}
        <section className="relative border-t border-slate-300 dark:border-slate-600 px-0 pb-0 pt-6 bg-transparent shadow-none transition-all sm:rounded-[20px] sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-800/80 sm:p-8 sm:shadow-sm sm:backdrop-blur sm:hover:bg-white/95 sm:dark:hover:bg-slate-800/90">
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
        <section className="relative border-t border-slate-300 dark:border-slate-600 px-0 pb-0 pt-6 bg-transparent shadow-none transition-all sm:rounded-[20px] sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-800/80 sm:p-8 sm:shadow-sm sm:backdrop-blur sm:hover:bg-white/95 sm:dark:hover:bg-slate-800/90">
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
              className="w-full appearance-none rounded-[18px] border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 pr-10 text-sm sm:text-base text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent shadow-sm cursor-pointer transition-all hover:border-slate-400 dark:hover:border-slate-500"
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
        <section className="relative border-t border-slate-300 dark:border-slate-600 px-0 pb-0 pt-6 bg-transparent shadow-none transition-all sm:rounded-[20px] sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 sm:bg-white/90 sm:dark:bg-slate-800/80 sm:p-8 sm:shadow-sm sm:backdrop-blur sm:hover:bg-white/95 sm:dark:hover:bg-slate-800/90">
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
            <div className="flex items-center justify-between gap-4 p-4 rounded-[18px] bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur">
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
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full transition-colors duration-300 peer-checked:bg-[var(--primary)]" />
                <span className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full transition-all duration-300 shadow-sm transform peer-checked:translate-x-5" style={{ backgroundColor: "#ffffff" }} />
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-[18px] bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur">
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
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full transition-colors duration-300 peer-checked:bg-[var(--primary)]" />
                <span className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full transition-all duration-300 shadow-sm transform peer-checked:translate-x-5" style={{ backgroundColor: "#ffffff" }} />
              </label>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-red-50 dark:bg-red-950/40 px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-lg border border-red-100 dark:border-red-800">
            <motion.button
              onClick={resetDefaults}
              className="text-sm sm:text-xs text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 flex items-center gap-2 transition-colors font-semibold"
            >
              <span className="text-base sm:text-sm">↺</span> Reset to defaults
            </motion.button>
          </div>

          <div className="flex flex-row gap-3 w-full sm:w-auto mt-3 sm:mt-0">
            <motion.button className="w-full sm:w-auto px-6 sm:px-5 py-2.5 sm:py-2 rounded-xl sm:rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold text-sm">
              Cancel
            </motion.button>
            <motion.button
              onClick={saveSettings}
              className="w-full sm:w-auto px-6 sm:px-5 py-2.5 sm:py-2 rounded-xl sm:rounded-md bg-[var(--primary)] text-white font-semibold hover:brightness-110 transition-all shadow-md text-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              Save appearance
            </motion.button>
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
