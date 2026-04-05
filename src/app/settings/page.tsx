"use client";

import { useEffect, useMemo, useState } from "react";
import { EyeOff, Globe, Lock, Moon } from "lucide-react";
import { supabase } from "../../../lib/superbaseClient";
import {
  applyDarkMode,
  broadcastAccountSettings,
  getAccountSettingsStorageKey,
  persistDarkModeSetting,
  readDarkModeSetting,
} from "@/lib/accountSettings";
import { clearClientSession, getVerifiedAuthUser } from "@/lib/clientAuth";
import StatusPopup from "../components/statusPopup";
import {
  BillingSettingsCard,
  DeleteAccountDialog,
  InputField,
  NotificationsSection,
  PersonalDetailsSection,
  PlanSettingsCard,
  SettingsCard,
  SettingsActionFooter,
  SettingsHeaderSection,
  ToggleRow,
} from "../components/settingsSections";

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

type PrivacySettings = {
  profileVisibility: boolean;
  searchIndexing: boolean;
  dataSharing: boolean;
};

type AccountSettings = {
  darkMode: boolean;
  language: string;
  notificationsEnabled: boolean;
  notifications: NotificationSettings;
  profile: ProfileSettings;
  privacy: PrivacySettings;
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
  privacy: {
    profileVisibility: true,
    searchIndexing: false,
    dataSharing: false,
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
    privacy: {
      profileVisibility:
        data.privacy?.profileVisibility ??
        DEFAULT_SETTINGS.privacy.profileVisibility,
      searchIndexing:
        data.privacy?.searchIndexing ?? DEFAULT_SETTINGS.privacy.searchIndexing,
      dataSharing:
        data.privacy?.dataSharing ?? DEFAULT_SETTINGS.privacy.dataSharing,
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

  const updatePrivacy = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value },
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
        privacy: settings.privacy,
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
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 px-4 py-8 sm:px-6 md:py-10 lg:px-8 transition-colors duration-500">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <SettingsHeaderSection
          badge="User Profile"
          title="Account Settings"
          subtitle="Manage profile, security, preferences, and communication settings.🧠"
        />

        <PlanSettingsCard />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SettingsCard
            icon={<Moon className="h-5 w-5 text-[var(--primary)]" />}
            title="App Theme"
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
              className="w-full rounded-xl border border-slate-300/80 bg-white/50 px-3 py-2 text-sm text-slate-700 outline-none backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20 dark:border-slate-600/80 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:bg-slate-900/80 dark:focus:bg-slate-900"
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </SettingsCard>

          <PersonalDetailsSection
            profileInitials={profileInitials}
            profile={settings.profile}
            genders={GENDERS}
            onUpdateProfile={updateProfile}
          />

          <NotificationsSection
            notificationsEnabled={settings.notificationsEnabled}
            notifications={settings.notifications}
            onToggleNotificationsEnabled={(checked) =>
              setSettings((prev) => ({
                ...prev,
                notificationsEnabled: checked,
              }))
            }
            onUpdateNotification={updateNotification}
          />

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

          <SettingsCard
            icon={<EyeOff className="h-5 w-5 text-[var(--primary)]" />}
            title="Privacy Controls"
            description="Manage your profile visibility and data sharing."
          >
            <ToggleRow
              label="Public profile visibility"
              checked={settings.privacy.profileVisibility}
              onChange={(checked) =>
                updatePrivacy("profileVisibility", checked)
              }
            />
            <ToggleRow
              label="Allow search indexing"
              checked={settings.privacy.searchIndexing}
              onChange={(checked) => updatePrivacy("searchIndexing", checked)}
            />
            <ToggleRow
              label="Data sharing with partners"
              checked={settings.privacy.dataSharing}
              onChange={(checked) => updatePrivacy("dataSharing", checked)}
            />
          </SettingsCard>

          <BillingSettingsCard setFlash={setFlash} />
        </div>

        <SettingsActionFooter
          isLoaded={isLoaded}
          isSaving={isSaving}
          onDeleteClick={() => {
            setDeleteConfirmationText("");
            setIsDeletePopupOpen(true);
          }}
          onSaveClick={handleSaveAll}
        />
      </div>

      <StatusPopup
        isOpen={Boolean(flash)}
        tone={flash?.tone ?? "success"}
        message={flash?.text ?? ""}
        onClose={() => setFlash(null)}
        context="settings"
        isMobile={isMobile}
      />

      <DeleteAccountDialog
        isOpen={isDeletePopupOpen}
        isMobile={isMobile}
        isSaving={isSaving}
        confirmationText={deleteConfirmationText}
        description="This action is permanent and removes your account and saved data from our servers😥."
        onChangeConfirmationText={setDeleteConfirmationText}
        onClose={() => {
          if (!isSaving) {
            setIsDeletePopupOpen(false);
            setDeleteConfirmationText("");
          }
        }}
        onConfirm={handleDeleteAccount}
      />
    </main>
  );
}
