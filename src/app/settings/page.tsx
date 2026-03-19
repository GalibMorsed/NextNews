"use client";

import Link from "next/link";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Globe,
  Lock,
  Moon,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { supabase } from "../../../lib/superbaseClient";
import {
  applyDarkMode,
  broadcastAccountSettings,
  getAccountSettingsStorageKey,
  persistDarkModeSetting,
  readDarkModeSetting,
} from "@/lib/accountSettings";
import { clearClientSession, getVerifiedAuthUser } from "@/lib/clientAuth";

type NotificationSettings = {
  accountActivity: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
};

type ProfileSettings = {
  name: string;
  gender: string;
  age: string;
  email: string;
};

type AccountSettings = {
  darkMode: boolean;
  language: string;
  notificationsEnabled: boolean;
  notifications: NotificationSettings;
  profile: ProfileSettings;
};

type FlashMessage = {
  tone: "success" | "error" | "info";
  text: string;
} | null;

const DEFAULT_SETTINGS: AccountSettings = {
  darkMode: false,
  language: "en",
  notificationsEnabled: true,
  notifications: {
    accountActivity: true,
    securityAlerts: true,
    productUpdates: true,
  },
  profile: {
    name: "",
    gender: "",
    age: "",
    email: "",
  },
};

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "fr", label: "French" },
];

const GENDERS = [
  "Male 🗿",
  "Female 👗",
  "Non-binary (Chakka👺)",
  "Prefer not to say 🏳️‍🌈",
];

function mergeSettings(raw: unknown): AccountSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
  const data = raw as Partial<AccountSettings>;
  return {
    darkMode: data.darkMode ?? DEFAULT_SETTINGS.darkMode,
    language: data.language ?? DEFAULT_SETTINGS.language,
    notificationsEnabled:
      data.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled,
    notifications: {
      accountActivity:
        data.notifications?.accountActivity ??
        DEFAULT_SETTINGS.notifications.accountActivity,
      securityAlerts:
        data.notifications?.securityAlerts ??
        DEFAULT_SETTINGS.notifications.securityAlerts,
      productUpdates:
        data.notifications?.productUpdates ??
        DEFAULT_SETTINGS.notifications.productUpdates,
    },
    profile: {
      name: data.profile?.name ?? DEFAULT_SETTINGS.profile.name,
      gender: data.profile?.gender ?? DEFAULT_SETTINGS.profile.gender,
      age: data.profile?.age ?? DEFAULT_SETTINGS.profile.age,
      email: data.profile?.email ?? DEFAULT_SETTINGS.profile.email,
    },
  };
}

export default function AccountSettingsPage() {
  const [settings, setSettings] = useState<AccountSettings>(() => ({
    ...DEFAULT_SETTINGS,
    darkMode: readDarkModeSetting(),
  }));
  const [password, setPassword] = useState({ next: "", confirm: "" });
  const [flash, setFlash] = useState<FlashMessage>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const profileInitials = useMemo(() => {
    if (!settings.profile.name.trim()) return "U";
    return settings.profile.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [settings.profile.name]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const emailFromLocal =
        localStorage.getItem("auth_email") ||
        localStorage.getItem("userEmail") ||
        "";

      const raw = localStorage.getItem(getAccountSettingsStorageKey());
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (mounted) {
            setSettings(() => {
              const merged = mergeSettings(parsed);
              return {
                ...merged,
                darkMode: readDarkModeSetting(),
                profile: {
                  ...merged.profile,
                  email: merged.profile.email || emailFromLocal,
                },
              };
            });
          }
        } catch {
          if (mounted) {
            setFlash({
              tone: "error",
              text: "Failed to read previous settings.",
            });
          }
        }
      } else if (mounted && emailFromLocal) {
        setSettings((prev) => ({
          ...prev,
          profile: { ...prev.profile, email: emailFromLocal },
        }));
      }

      const { user } = await getVerifiedAuthUser();
      if (mounted && user) {
        setSettings((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            name:
              (user.user_metadata?.full_name as string) || prev.profile.name,
            gender:
              (user.user_metadata?.gender as string) || prev.profile.gender,
            age: user.user_metadata?.age
              ? String(user.user_metadata.age)
              : prev.profile.age,
            email: user.email || prev.profile.email,
          },
        }));
      }

      if (mounted) setIsLoaded(true);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email ?? "";
      setSettings((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          email,
        },
      }));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    applyDarkMode(settings.darkMode);
    persistDarkModeSetting(settings.darkMode);
    broadcastAccountSettings({ darkMode: settings.darkMode });
  }, [settings.darkMode]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 3500);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const desktopPopupVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 20, scale: 0.95 },
  };

  const mobilePopupVariants = {
    initial: { opacity: 0, y: "100%" },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: "100%" },
  };

  const updateProfile = <K extends keyof ProfileSettings>(
    key: K,
    value: ProfileSettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      profile: { ...prev.profile, [key]: value },
    }));
  };

  const updateNotification = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const validateBeforeSave = (): string | null => {
    if (!settings.profile.name.trim()) return "Name is required.";
    if (settings.profile.age) {
      const numericAge = Number(settings.profile.age);
      if (Number.isNaN(numericAge) || numericAge < 13 || numericAge > 120) {
        return "Age must be between 13 and 120.";
      }
    }

    if (password.next || password.confirm) {
      if (password.next.length < 6) {
        return "New password must be at least 6 characters.";
      }
      if (password.next !== password.confirm) {
        return "Password and confirm password do not match.";
      }
    }
    return null;
  };

  const handleSaveAll = async () => {
    const validationError = validateBeforeSave();
    if (validationError) {
      setFlash({ tone: "error", text: validationError });
      return;
    }

    setIsSaving(true);
    try {
      const metadata: Record<string, unknown> = {
        full_name: settings.profile.name.trim(),
        gender: settings.profile.gender,
        age: settings.profile.age ? Number(settings.profile.age) : null,
        language: settings.language,
        notifications: settings.notifications,
      };

      const payload: { data: Record<string, unknown>; password?: string } = {
        data: metadata,
      };
      if (password.next) payload.password = password.next;

      const { error } = await supabase.auth.updateUser(payload);
      if (error) {
        setFlash({
          tone: "error",
          text: `Saved locally, but account sync failed: ${error.message}`,
        });
      } else {
        setFlash({
          tone: "success",
          text: "Settings saved successfully! 🎉 Language preferences are coming soon for select members. Stay tuned! 🌍✨",
        });
      }

      localStorage.setItem(
        getAccountSettingsStorageKey(),
        JSON.stringify(settings),
      );
      broadcastAccountSettings({ darkMode: settings.darkMode });
      setPassword({ next: "", confirm: "" });
    } catch {
      setFlash({ tone: "error", text: "Something went wrong while saving." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") {
      setFlash({
        tone: "error",
        text: "Please type DELETE exactly to confirm account deletion.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        setFlash({
          tone: "error",
          text: "You must be logged in to delete your account.",
        });
        return;
      }

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setFlash({
          tone: "error",
          text: payload.error || "Failed to delete account.",
        });
        return;
      }

      clearClientSession(session.user.email);
      broadcastAccountSettings({ darkMode: false });
      await supabase.auth.signOut();

      window.location.href = "/auth/register";
    } catch {
      setFlash({
        tone: "error",
        text: "Something went wrong while deleting your account.",
      });
    } finally {
      setIsSaving(false);
      setIsDeletePopupOpen(false);
      setDeleteConfirmationText("");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-6"
        >
          <span className="mb-3 inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Account
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Manage profile, security, preferences, and communication settings.🧠
          </p>
        </motion.section>

        <PlanSettingsCard />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SettingsCard
            icon={<Moon className="h-5 w-5 text-[var(--primary)]" />}
            title="Appearance"
            description="Theme preference for the full application."
          >
            <ToggleRow
              label="Enable dark mode"
              checked={settings.darkMode}
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, darkMode: checked }))
              }
            />
          </SettingsCard>

          <SettingsCard
            icon={<Globe className="h-5 w-5 text-[var(--primary)]" />}
            title="Language"
            description="Choose your preferred interface language."
          >
            <select
              value={settings.language}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, language: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </SettingsCard>

          <SettingsCard
            icon={<UserRound className="h-5 w-5 text-[var(--primary)]" />}
            title="Personal Details"
            description="Keep your account information up to date."
            className="lg:col-span-2"
          >
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:w-52">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-xl font-bold text-slate-700">
                  {profileInitials}
                </div>
                <p className="mt-3 text-center text-xs text-slate-500">
                  Avatar updates follow your account profile metadata.
                </p>
              </div>

              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  label="Name"
                  value={settings.profile.name}
                  onChange={(value) => updateProfile("name", value)}
                  placeholder="Your full name"
                />
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Gender
                  </label>
                  <select
                    value={settings.profile.gender}
                    onChange={(e) => updateProfile("gender", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </div>
                <InputField
                  label="Age"
                  type="number"
                  value={settings.profile.age}
                  onChange={(value) => updateProfile("age", value)}
                  placeholder="Age"
                />
                <InputField
                  label="Email"
                  value={settings.profile.email}
                  disabled
                  onChange={() => undefined}
                />
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={<Shield className="h-5 w-5 text-[var(--primary)]" />}
            title="Notifications"
            description="Control when and what we notify you about."
          >
            <ToggleRow
              label="Enable notifications"
              checked={settings.notificationsEnabled}
              onChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  notificationsEnabled: checked,
                }))
              }
            />

            <AnimatePresence initial={false}>
              {settings.notificationsEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-3 overflow-hidden"
                >
                  <ToggleRow
                    label="Account activity"
                    checked={settings.notifications.accountActivity}
                    onChange={(checked) =>
                      updateNotification("accountActivity", checked)
                    }
                  />
                  <ToggleRow
                    label="Security alerts"
                    checked={settings.notifications.securityAlerts}
                    onChange={(checked) =>
                      updateNotification("securityAlerts", checked)
                    }
                  />
                  <ToggleRow
                    label="Product updates"
                    checked={settings.notifications.productUpdates}
                    onChange={(checked) =>
                      updateNotification("productUpdates", checked)
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </SettingsCard>

          <SettingsCard
            icon={<Lock className="h-5 w-5 text-[var(--primary)]" />}
            title="Security"
            description="Change your password and keep your account secure."
          >
            <InputField
              label="New password"
              type="password"
              value={password.next}
              onChange={(value) =>
                setPassword((prev) => ({ ...prev, next: value }))
              }
              placeholder="At least 6 characters"
            />
            <InputField
              label="Confirm password"
              type="password"
              value={password.confirm}
              onChange={(value) =>
                setPassword((prev) => ({ ...prev, confirm: value }))
              }
              placeholder="Re-enter your password"
            />
          </SettingsCard>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="sm:flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Actions
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Save your preferences or request account deletion support.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={!isLoaded || isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmationText("");
                  setIsDeletePopupOpen(true);
                }}
                disabled={!isLoaded || isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete account
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Need help? Visit{" "}
            <Link
              href="/support"
              className="font-medium text-[var(--primary)] underline"
            >
              Support
            </Link>
            .
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-sm"
            onClick={() => setFlash(null)}
          >
            <motion.div
              variants={isMobile ? mobilePopupVariants : desktopPopupVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
              className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-white dark:bg-slate-800 p-5 sm:p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    flash.tone === "success"
                      ? "bg-emerald-100 text-emerald-600"
                      : flash.tone === "info"
                        ? "bg-sky-100 text-sky-600"
                        : "bg-red-100 text-red-600"
                  }`}
                >
                  {flash.tone === "success" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : flash.tone === "info" ? (
                    <BellRing className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                  {flash.text}
                </p>
                <button
                  type="button"
                  onClick={() => setFlash(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Close message"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeletePopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              if (!isSaving) {
                setIsDeletePopupOpen(false);
                setDeleteConfirmationText("");
              }
            }}
          >
            <motion.div
              variants={isMobile ? mobilePopupVariants : desktopPopupVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
              className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-white dark:bg-slate-800 p-5 sm:p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Confirm account deletion
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    This action is permanent and removes your account and saved
                    data from our servers 😥.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isSaving) return;
                    setIsDeletePopupOpen(false);
                    setDeleteConfirmationText("");
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Close delete confirmation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Type <span className="font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                disabled={isSaving}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none transition focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-70"
              />

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeletePopupOpen(false);
                    setDeleteConfirmationText("");
                  }}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isSaving}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Deleting..." : "Delete permanently"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function PlanSettingsCard() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    const savedPlan = localStorage.getItem("nextnews-plan");
    if (savedPlan) setCurrentPlan(savedPlan);
  }, []);

  if (!currentPlan) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm transition-all sm:p-5",
        currentPlan === "Pro+"
          ? "border-orange-200 bg-orange-50 dark:border-orange-700/50 dark:bg-orange-950/20"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800",
      )}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={clsx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            currentPlan === "Pro+"
              ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
              : "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
          )}
        >
          {currentPlan === "Pro+" ? (
            <Zap className="h-6 w-6" />
          ) : currentPlan === "Pro" ? (
            <ShieldCheck className="h-6 w-6" />
          ) : (
            <Sparkles className="h-6 w-6" />
          )}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Current Plan
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your selected subscription is <span className="font-medium">{currentPlan} Plan</span>{" "}
            currently active on this account.
          </p>
        </div>
      </div>
      <Link
        href="/plans"
        className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Manage
      </Link>
    </motion.div>
  );
}

function SettingsCard({
  icon,
  title,
  description,
  className,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -2 }}
      className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-6 ${className ?? ""}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-[var(--primary)]" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password" | "number";
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none transition focus:ring-2 focus:ring-[var(--primary)] disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-300"
      />
    </div>
  );
}
