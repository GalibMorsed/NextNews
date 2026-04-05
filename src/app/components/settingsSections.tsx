"use client";

import Link from "next/link";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { readActivityAnalytics } from "@/lib/activityAnalytics";

type FlashMessage = {
  tone: "success" | "error" | "info";
  text: string;
} | null;

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

type SettingsCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
};

type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
};

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password" | "number";
  placeholder?: string;
  disabled?: boolean;
};

type BillingSettingsCardProps = {
  setFlash: React.Dispatch<React.SetStateAction<FlashMessage>>;
};

type SettingsHeaderSectionProps = {
  badge: string;
  title: string;
  subtitle: string;
};

type UpdateProfile = <K extends keyof ProfileSettings>(
  key: K,
  value: ProfileSettings[K],
) => void;

type PersonalDetailsSectionProps = {
  profileInitials: string;
  profile: ProfileSettings;
  genders: string[];
  onUpdateProfile: UpdateProfile;
};

type UpdateNotification = <K extends keyof NotificationSettings>(
  key: K,
  value: NotificationSettings[K],
) => void;

type NotificationsSectionProps = {
  notificationsEnabled: boolean;
  notifications: NotificationSettings;
  onToggleNotificationsEnabled: (next: boolean) => void;
  onUpdateNotification: UpdateNotification;
};

type SettingsActionFooterProps = {
  isLoaded: boolean;
  isSaving: boolean;
  onDeleteClick: () => void;
  onSaveClick: () => void;
};

type DeleteAccountDialogProps = {
  isOpen: boolean;
  isMobile: boolean;
  isSaving: boolean;
  confirmationText: string;
  description?: string;
  onChangeConfirmationText: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function PlanSettingsCard() {
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
        "relative overflow-hidden flex flex-col gap-4 rounded-2xl border p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5",
        currentPlan === "Pro+"
          ? "border-orange-200/60 bg-orange-50/60 dark:border-orange-700/40 dark:bg-orange-950/30"
          : "border-slate-200/60 bg-white/60 dark:border-slate-700/60 dark:bg-slate-800/60",
      )}
    >
      <div className="flex items-start gap-3.5 sm:items-center">
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
            Your selected subscription is{" "}
            <span className="font-medium">{currentPlan} Plan</span> currently
            active on this account.
          </p>
        </div>
      </div>
      <Link
        href="/plans"
        className="inline-flex w-auto self-end items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Manage
      </Link>
    </motion.div>
  );
}

export function SettingsCard({
  icon,
  title,
  description,
  className,
  children,
}: SettingsCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-slate-300/80 hover:shadow-md dark:hover:border-slate-600/80 sm:p-6 ${
        className ?? ""
      }`}
    >
      <div className="mb-4 relative z-10 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100/80 shadow-inner dark:bg-slate-700/80">
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

export function SettingsHeaderSection({
  badge,
  title,
  subtitle,
}: SettingsHeaderSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 p-5 shadow-sm backdrop-blur-xl sm:p-6"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--primary)]/5 blur-3xl dark:bg-[var(--primary)]/10" />
      <span className="relative mb-3 inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {badge}
      </span>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 bg-clip-text text-transparent dark:from-white dark:via-indigo-200 dark:to-violet-200">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
        {subtitle}
      </p>
    </motion.section>
  );
}

export function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
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

export function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
}: InputFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-slate-300/80 dark:border-slate-600/80 bg-white/50 dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none backdrop-blur-sm transition-all duration-200 hover:bg-white/80 hover:dark:bg-slate-900/80 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20 dark:focus:bg-slate-900 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:text-slate-500 dark:disabled:text-slate-400"
      />
    </div>
  );
}

export function PersonalDetailsSection({
  profileInitials,
  profile,
  genders,
  onUpdateProfile,
}: PersonalDetailsSectionProps) {
  return (
    <SettingsCard
      icon={<UserRound className="h-5 w-5 text-[var(--primary)]" />}
      title="Personal Details"
      description="Keep your account information up to date."
      className="lg:col-span-2"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex w-full shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50 dark:border-slate-600/80 dark:bg-slate-800/30 hover:dark:bg-slate-800/50 lg:w-48 xl:w-56">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 shadow-inner dark:from-slate-700 dark:to-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200">
            {profileInitials}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Avatar updates follow your account profile metadata.
          </p>
        </div>

        <div className="grid w-full min-w-0 flex-1 grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <InputField
            label="Name"
            value={profile.name}
            onChange={(value) => onUpdateProfile("name", value)}
            placeholder="Your full name"
          />
          <div>
            <label className="text-sm font-medium text-slate-600">Gender</label>
            <select
              value={profile.gender}
              onChange={(event) =>
                onUpdateProfile("gender", event.target.value)
              }
              className="mt-1 w-full rounded-xl border border-slate-300/80 bg-white/50 px-3 py-2 text-sm text-slate-700 outline-none backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20 dark:border-slate-600/80 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:bg-slate-900/80 dark:focus:bg-slate-900"
            >
              <option value="">Select gender</option>
              {genders.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </div>
          <InputField
            label="Age"
            type="number"
            value={profile.age}
            onChange={(value) => onUpdateProfile("age", value)}
            placeholder="Age"
          />
          <InputField
            label="Email"
            value={profile.email}
            disabled
            onChange={() => undefined}
          />
        </div>
      </div>
    </SettingsCard>
  );
}

export function NotificationsSection({
  notificationsEnabled,
  notifications,
  onToggleNotificationsEnabled,
  onUpdateNotification,
}: NotificationsSectionProps) {
  return (
    <SettingsCard
      icon={<Shield className="h-5 w-5 text-[var(--primary)]" />}
      title="Notifications"
      description="Control when and what we notify you about."
    >
      <ToggleRow
        label="Enable notifications"
        checked={notificationsEnabled}
        onChange={onToggleNotificationsEnabled}
      />

      <AnimatePresence initial={false}>
        {notificationsEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 space-y-3 overflow-hidden"
          >
            <ToggleRow
              label="Account activity"
              checked={notifications.accountActivity}
              onChange={(checked) =>
                onUpdateNotification("accountActivity", checked)
              }
            />
            <ToggleRow
              label="Security alerts"
              checked={notifications.securityAlerts}
              onChange={(checked) =>
                onUpdateNotification("securityAlerts", checked)
              }
            />
            <ToggleRow
              label="Product updates"
              checked={notifications.productUpdates}
              onChange={(checked) =>
                onUpdateNotification("productUpdates", checked)
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </SettingsCard>
  );
}

export function SettingsActionFooter({
  isLoaded,
  isSaving,
  onDeleteClick,
  onSaveClick,
}: SettingsActionFooterProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="relative mt-8 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 shadow-lg shadow-slate-200/40 dark:shadow-slate-950/40 backdrop-blur-sm"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent" />
      <div className="absolute -top-10 left-1/2 h-20 w-72 -translate-x-1/2 rounded-full bg-[var(--primary)]/8 blur-2xl dark:bg-[var(--primary)]/12" />

      <div className="relative flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Manage your account
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Save your preferences or delete your account. Need help? Visit{" "}
              <Link
                href="/support"
                className="font-semibold text-[var(--primary)] underline hover:brightness-110"
              >
                Support
              </Link>
              .
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDeleteClick}
            disabled={!isLoaded || isSaving}
            className="group inline-flex items-center gap-2 rounded-md border border-red-200/70 dark:border-red-800/60 bg-transparent px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-all duration-200 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2
              size={14}
              className="transition-transform group-hover:scale-110"
            />
            Delete account
          </button>

          <button
            type="button"
            onClick={onSaveClick}
            disabled={!isLoaded || isSaving}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-md bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[var(--primary)]/25 transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-[var(--primary)]/35 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save
                size={14}
                className="transition-transform group-hover:scale-110"
              />
            )}
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </motion.section>
  );
}

export function DeleteAccountDialog({
  isOpen,
  isMobile,
  isSaving,
  confirmationText,
  description,
  onChangeConfirmationText,
  onClose,
  onConfirm,
}: DeleteAccountDialogProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-sm"
          onClick={() => {
            if (!isSaving) onClose();
          }}
        >
          <motion.div
            variants={isMobile ? mobilePopupVariants : desktopPopupVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-white dark:bg-slate-800 p-5 sm:p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
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
                  {description ||
                    "This action is permanent and removes your account and saved data from our servers."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSaving) onClose();
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
              value={confirmationText}
              onChange={(event) => onChangeConfirmationText(event.target.value)}
              placeholder="DELETE"
              disabled={isSaving}
              className="w-full rounded-xl border border-slate-300/80 dark:border-slate-600/80 bg-white/50 dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none backdrop-blur-sm transition-all duration-200 hover:bg-white/80 hover:dark:bg-slate-900/80 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20 dark:focus:bg-slate-900 disabled:opacity-70"
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
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
  );
}

export function BillingSettingsCard({
  setFlash: _setFlash,
}: BillingSettingsCardProps) {
  const [planDetails, setPlanDetails] = useState<{
    name: string;
    purchaseDate: Date;
  } | null>(null);
  const [apiUsage, setApiUsage] = useState({
    used: 0,
    total: 100,
    percentage: 0,
  });

  useEffect(() => {
    const savedPlan = localStorage.getItem("nextnews-plan");
    if (savedPlan) {
      let savedDate = localStorage.getItem("nextnews-plan-date");
      if (!savedDate) {
        const now = new Date();
        savedDate = now.toISOString();
        localStorage.setItem("nextnews-plan-date", savedDate);
      }
      setPlanDetails({ name: savedPlan, purchaseDate: new Date(savedDate) });

      const analytics = readActivityAnalytics();
      const usedCalls =
        analytics.aiSummaryCount +
        analytics.personalizationSuggestionCount +
        analytics.events.length;
      let planTotal = 100;
      if (savedPlan === "Pro") planTotal = 1000;
      if (savedPlan === "Pro+") planTotal = 10000;

      setApiUsage({
        used: usedCalls,
        total: planTotal,
        percentage: Math.min(100, Math.round((usedCalls / planTotal) * 100)),
      });
    }
  }, []);

  if (!planDetails) {
    return (
      <SettingsCard
        icon={<CreditCard className="h-5 w-5 text-[var(--primary)]" />}
        title="Billing & Usage"
        description="Manage your subscription and track API usage."
        className="lg:col-span-2"
      >
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            No active subscription plan found.
          </p>
          <Link
            href="/plans"
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
          >
            View Plans
          </Link>
        </div>
      </SettingsCard>
    );
  }

  const expiryDate = new Date(
    planDetails.purchaseDate.getTime() + 7 * 24 * 60 * 60 * 1000,
  );
  const formattedExpiry = expiryDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedPurchase = planDetails.purchaseDate.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <SettingsCard
      icon={<CreditCard className="h-5 w-5 text-[var(--primary)]" />}
      title="Billing & Usage"
      description="Manage active plans, track API usage, and download activity logs."
      className="lg:col-span-2"
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Active Plan Details
          </h4>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 transition-colors hover:bg-slate-100/50 dark:border-slate-700/60 dark:bg-slate-800/30 hover:dark:bg-slate-800/50 shadow-sm">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 shadow-sm border border-emerald-200 dark:border-emerald-900 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {planDetails.name} Plan
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Expires on {formattedExpiry}
                </p>
              </div>
            </div>
            <Link
              href="/plans"
              className="shrink-0 text-sm font-semibold text-[var(--primary)] hover:underline"
            >
              Upgrade
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200/60 bg-white/50 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">NewsAPI and AI API Calls</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {apiUsage.percentage}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-indigo-500 transition-all duration-500"
                  style={{ width: `${apiUsage.percentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                You have used {apiUsage.used.toLocaleString()} of your{" "}
                {apiUsage.total.toLocaleString()} included API calls.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Recent Activity Logs
          </h4>
          <div className="space-y-2.5 rounded-xl border border-slate-200/60 bg-slate-50/50 p-2 dark:border-slate-700/60 dark:bg-slate-800/30">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg p-2.5 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/80 shadow-sm bg-white/60 dark:bg-slate-800/60">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-stone-200/50 dark:bg-stone-800/50">
                  <FileText className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {planDetails.name} Plan Activation
                  </p>
                  <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                    {formattedPurchase}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.alert("Data not available now")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-[var(--primary)] hover:shadow-sm dark:hover:bg-slate-700 transition-all"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
