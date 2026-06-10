"use client";

import { MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import MobileCategoryRow from "./mobileCategoryRow";
import Template from "../template";
import GoalCompletionBanner from "./GoalCompletionBanner";
import AuthSessionSync from "../auth/register/components/authSessionSync";
import DownloadNowPopup from "./DownloadNowPopup";
import { syncGoalTrackerProgress } from "@/lib/activityAnalytics";
import {
  APPEARANCE_EVENT,
  applyAppearanceSettings,
  readAppearanceSettings,
  type AppearanceSettings,
} from "@/lib/appearance";
import {
  ACCOUNT_SETTINGS_EVENT,
  applyDarkMode,
  readDarkModeSetting,
  type StoredAccountSettings,
} from "@/lib/accountSettings";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [appearance, setAppearance] = useState<AppearanceSettings>(() =>
    readAppearanceSettings(),
  );

  useEffect(() => {
    const nextAppearance = readAppearanceSettings();
    applyAppearanceSettings(nextAppearance);
    applyDarkMode(readDarkModeSetting());
  }, []);

  useEffect(() => {
    void syncGoalTrackerProgress();
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const errorName =
        reason instanceof Error
          ? reason.name
          : typeof reason === "object" &&
              reason !== null &&
              "name" in reason &&
              typeof (reason as { name?: unknown }).name === "string"
            ? (reason as { name: string }).name
            : "";

      if (errorName === "AbortError") {
        // Ignore expected aborts from auth lock timeouts.
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
  }, []);

  useEffect(() => {
    const handleAppearanceChange = (event: Event) => {
      const customEvent = event as CustomEvent<AppearanceSettings>;
      applyAppearanceSettings(customEvent.detail);
      setAppearance(customEvent.detail);
    };

    window.addEventListener(APPEARANCE_EVENT, handleAppearanceChange);
    return () =>
      window.removeEventListener(APPEARANCE_EVENT, handleAppearanceChange);
  }, []);

  useEffect(() => {
    const handleAccountSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent<StoredAccountSettings>;
      applyDarkMode(Boolean(customEvent.detail.darkMode));
    };

    const handleStorageChange = () => {
      applyDarkMode(readDarkModeSetting());
    };

    window.addEventListener(
      ACCOUNT_SETTINGS_EVENT,
      handleAccountSettingsChange,
    );
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener(
        ACCOUNT_SETTINGS_EVENT,
        handleAccountSettingsChange,
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <MotionConfig reducedMotion={appearance.reducedMotion ? "always" : "never"}>
      <AuthSessionSync />
      <GoalCompletionBanner />
      <DownloadNowPopup />
      <Navbar
        onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        isMobileOpen={isSidebarOpen}
      />
      <MobileCategoryRow />
      <div className="flex min-h-[calc(100vh-65px)]">
        <Sidebar
          isMobileOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          isDesktopCollapsed={isDesktopCollapsed}
          onToggleDesktop={() => setIsDesktopCollapsed((prev) => !prev)}
        />
        <main
          className={`min-w-0 flex-1 overflow-x-hidden transition-[margin] duration-300 ${isDesktopCollapsed ? "md:ml-20" : "md:ml-72"}`}
        >
          <Template>{children}</Template>
        </main>
      </div>
    </MotionConfig>
  );
}
