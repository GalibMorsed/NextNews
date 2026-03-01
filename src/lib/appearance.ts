"use client";

export type AppearanceSettings = {
  theme: string;
  primaryColor: string;
  fontSize: number;
  fontFamily: string;
  reducedMotion: boolean;
  highContrast: boolean;
};

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: "aquamarine",
  primaryColor: "#1e40af",
  fontSize: 16,
  fontFamily: "system-ui, -apple-system, sans-serif",
  reducedMotion: false,
  highContrast: false,
};

export const APPEARANCE_EVENT = "appearance-settings-changed";

export function getAppearanceStorageKey(): string {
  if (typeof window === "undefined") return "appearanceSettings_guest";

  try {
    const userId = localStorage.getItem("auth_token");
    return userId ? `appearanceSettings_${userId}` : "appearanceSettings_guest";
  } catch {
    return "appearanceSettings_guest";
  }
}

export function readAppearanceSettings(): AppearanceSettings {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE_SETTINGS;

  let raw: string | null = null;
  try {
    raw = localStorage.getItem(getAppearanceStorageKey());
  } catch {
    return DEFAULT_APPEARANCE_SETTINGS;
  }
  if (!raw) return DEFAULT_APPEARANCE_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<AppearanceSettings>;
    return {
      theme: parsed.theme ?? DEFAULT_APPEARANCE_SETTINGS.theme,
      primaryColor: parsed.primaryColor ?? DEFAULT_APPEARANCE_SETTINGS.primaryColor,
      fontSize: parsed.fontSize ?? DEFAULT_APPEARANCE_SETTINGS.fontSize,
      fontFamily: parsed.fontFamily ?? DEFAULT_APPEARANCE_SETTINGS.fontFamily,
      reducedMotion: parsed.reducedMotion ?? DEFAULT_APPEARANCE_SETTINGS.reducedMotion,
      highContrast: parsed.highContrast ?? DEFAULT_APPEARANCE_SETTINGS.highContrast,
    };
  } catch {
    return DEFAULT_APPEARANCE_SETTINGS;
  }
}

export function applyAppearanceSettings(settings: AppearanceSettings): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--primary", settings.primaryColor);
  root.style.setProperty("--primaryDark", settings.primaryColor);
  root.style.fontSize = `${settings.fontSize}px`;
  root.style.fontFamily = settings.fontFamily;
  root.classList.toggle("high-contrast", settings.highContrast);
  root.classList.toggle("reduced-motion", settings.reducedMotion);
}

export function saveAppearanceSettings(settings: AppearanceSettings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getAppearanceStorageKey(), JSON.stringify(settings));
  } catch {
    // Ignore localStorage write errors (e.g., private mode or storage limits).
  }
}

export function broadcastAppearanceSettings(settings: AppearanceSettings): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AppearanceSettings>(APPEARANCE_EVENT, { detail: settings }));
}
