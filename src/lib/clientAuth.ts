"use client";

import { supabase } from "../../lib/superbaseClient";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  applyAppearanceSettings,
  removeAppearanceSettings,
} from "@/lib/appearance";
import { applyDarkMode, removeStoredAccountSettings } from "@/lib/accountSettings";

const UUID_TEMPLATE = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
const AUTH_STORAGE_KEYS = ["auth_email", "auth_token", "userEmail"] as const;

function getCryptoObject(): Crypto | null {
  if (typeof globalThis === "undefined" || !("crypto" in globalThis)) return null;
  return globalThis.crypto;
}

function randomNibble() {
  const cryptoObject = getCryptoObject();
  if (cryptoObject?.getRandomValues) {
    return cryptoObject.getRandomValues(new Uint8Array(1))[0] & 15;
  }
  return Math.floor(Math.random() * 16);
}

export function generateClientUuid() {
  const cryptoObject = getCryptoObject();
  if (cryptoObject?.randomUUID) {
    return cryptoObject.randomUUID();
  }

  return UUID_TEMPLATE.replace(/[xy]/g, (character) => {
    const randomValue = randomNibble();
    const value = character === "x" ? randomValue : (randomValue & 3) | 8;
    return value.toString(16);
  });
}

export function persistClientSession(emailValue: string, tokenValue: string) {
  localStorage.setItem("auth_email", emailValue);
  localStorage.setItem("auth_token", tokenValue);
  document.cookie = `auth_token=${encodeURIComponent(tokenValue)}; path=/; max-age=604800; samesite=lax`;
}

export function clearClientSession(email?: string | null) {
  const currentUserEmail =
    email?.trim() || localStorage.getItem("auth_email") || "";

  removeAppearanceSettings(currentUserEmail);
  removeStoredAccountSettings(currentUserEmail);

  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }

  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key.startsWith("accountSettings_") ||
      key.startsWith("appearanceSettings_")
    ) {
      localStorage.removeItem(key);
    }
  }

  localStorage.removeItem("app_dark_mode");
  document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
  applyDarkMode(false);
  applyAppearanceSettings(DEFAULT_APPEARANCE_SETTINGS);
}

export async function getVerifiedAuthUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      await supabase.auth.signOut();
    }

    if (typeof window !== "undefined") {
      clearClientSession(session?.user?.email);
    }

    return { user: null, error: error ?? new Error("Not logged in") };
  }

  return { user: data.user, error: null };
}
