"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, type FormEvent, Suspense } from "react";
import clsx from "clsx";
import {
  CheckCircle2,
  Building2,
  Globe,
  HeartHandshake,
  PartyPopper,
  ShieldCheck,
  X,
  Sparkles,
  NotebookPen,
  Radio,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import SupportProject from "../components/supportProject";
import LottiePlayer from "../components/LottiePlayer";
import ChoosePlan, {
  type PlanKey as CheckoutPlanKey,
} from "./payments/choosePlan";
import {
  canUseFreePlan,
  cancelPlanInDatabase,
  type PlanKey as SubscriptionPlanKey,
  isPlanKey,
  loadUserSubscriptionPlan,
  savePlanToDatabase,
  syncSubscriptionPlanCache,
  type SubscriptionPlanRecord,
} from "../services/subscriptionPlanService";

const planCatalog = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: "A dependable everyday plan for casual readers, including a 16-day free trial.",
    credits: {
      monthly: "600 API call credits for 16 days",
      yearly: "600 API call credits for 16 days",
    },
    features: [
      "Core news access and daily reading",
      "Basic personalization",
      "Standard article browsing",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: 99,
    yearlyPrice: 899,
    desc: "Ideal for regular readers seeking enhanced customization, deeper content coverage, and priority access to premium features.",
    featured: true,
    credits: {
      monthly: "8,000 API call credits per month",
      yearly: "200,000 API call credits per year",
    },
    features: [
      "Enhanced and refined interface",
      "Advanced personalization controls",
      "Higher AI summary and assistant limits",
      "Priority access to premium reader tools",
      "Tailored specific space for Pro users in the app",
    ],
  },
  {
    name: "Pro+",
    monthlyPrice: 299,
    yearlyPrice: 2299,
    desc: "Designed for power users who want unlimited access to all NextNews features and priority support.",
    credits: {
      monthly: "45,000 API call credits per month",
      yearly: "Unlimited API call credits per year",
    },
    features: [
      "Exclusive Pro+ member benefits and recognition",
      "Expanded usage limits for all premium services",
      "Early access to new premium features",
      "Unlimited API calls for news and AI services",
      "Priority customer support with dedicated assistance",
      "Exclusive community access and special events",
      "Advanced AI analytics and personalized insights",
    ],
  },
];

const FREE_PLAN_EXPIRY_KEY = "nextnews-plan-expiry";
const FREE_PLAN_DAYS = 16;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

const productPerks = [
  {
    icon: Sparkles,
    title: "Better Reading",
    desc: "Cleaner reading with fewer distractions and more value in every visit.",
  },
  {
    icon: SlidersHorizontal,
    title: "Personalized Feed",
    desc: "Topics, sources, and settings adapt to what you like.",
  },
  {
    icon: NotebookPen,
    title: "Reader Tools",
    desc: "Save articles, add notes, and manage your preferences in one place.",
  },
  {
    icon: Radio,
    title: "More Features Ahead",
    desc: "Your plan helps us build live coverage, support, and premium tools.",
  },
];

const perkColors = [
  {
    card: "from-teal-50 to-white dark:from-teal-950/20 dark:to-slate-900/50 hover:from-teal-100/50 dark:hover:from-teal-900/30 border-teal-200/60 dark:border-teal-900/40 hover:border-teal-300/80 dark:hover:border-teal-700/60",
    icon: "from-teal-500 to-cyan-500 shadow-teal-500/30",
  },
  {
    card: "from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900/50 hover:from-blue-100/50 dark:hover:from-blue-900/30 border-blue-200/60 dark:border-blue-900/40 hover:border-blue-300/80 dark:hover:border-blue-700/60",
    icon: "from-blue-500 to-indigo-500 shadow-blue-500/30",
  },
  {
    card: "from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900/50 hover:from-indigo-100/50 dark:hover:from-indigo-900/30 border-indigo-200/60 dark:border-indigo-900/40 hover:border-indigo-300/80 dark:hover:border-indigo-700/60",
    icon: "from-indigo-500 to-blue-500 shadow-indigo-500/30",
  },
  {
    card: "from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900/50 hover:from-emerald-100/50 dark:hover:from-emerald-900/30 border-emerald-200/60 dark:border-emerald-900/40 hover:border-emerald-300/80 dark:hover:border-emerald-700/60",
    icon: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
  },
];

function PlansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [yearly, setYearly] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showChaiPopup, setShowChaiPopup] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [planExpiry, setPlanExpiry] = useState<number | null>(null);
  const [freePlanError, setFreePlanError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const checkoutPlanParam = searchParams.get("plan");
  const checkoutPlanKey: SubscriptionPlanKey | null = isPlanKey(
    checkoutPlanParam,
  )
    ? checkoutPlanParam
    : null;

  const applySubscriptionPlan = (plan: SubscriptionPlanRecord | null) => {
    syncSubscriptionPlanCache(plan);

    if (!plan || plan.status === "canceled" || plan.status === "expired") {
      setCurrentPlan(null);
      setPlanExpiry(null);
      return;
    }

    setCurrentPlan(plan.plan_name);

    if (plan.plan_key === "free" && plan.trial_end) {
      setPlanExpiry(new Date(plan.trial_end).getTime());
      return;
    } else if (plan.plan_key !== "free" && plan.current_period_end) {
      setPlanExpiry(new Date(plan.current_period_end).getTime());
      return;
    }

    setPlanExpiry(null);
  };

  useEffect(() => {
    let isMounted = true;

    const loadPlanState = async () => {
      if (checkoutPlanKey) {
        const savedPlan = await savePlanToDatabase(checkoutPlanKey);
        if (isMounted && savedPlan.data) {
          applySubscriptionPlan(savedPlan.data);
          router.replace("/plans");
          return;
        }
      }

      const { data } = await loadUserSubscriptionPlan();
      if (isMounted && data) {
        applySubscriptionPlan(data);
        return;
      }

      if (typeof window === "undefined" || !isMounted) return;

      const storedPlan = localStorage.getItem("nextnews-plan");
      if (storedPlan !== "Free") {
        setCurrentPlan(storedPlan);
        const storedExpiry = localStorage.getItem("nextnews-plan-expiry");
        if (
          storedExpiry &&
          storedExpiry !== "undefined" &&
          storedExpiry !== "null"
        ) {
          const parsedExpiry = new Date(storedExpiry).getTime();
          if (!Number.isNaN(parsedExpiry)) {
            setPlanExpiry(parsedExpiry);
          } else {
            setPlanExpiry(null);
          }
        } else {
          setPlanExpiry(null);
        }
        return;
      }

      const expiryRaw = localStorage.getItem(FREE_PLAN_EXPIRY_KEY);
      let expiry = expiryRaw ? Number(expiryRaw) : Number.NaN;

      if (!expiryRaw || Number.isNaN(expiry)) {
        expiry = Date.now() + FREE_PLAN_DAYS * MS_IN_DAY;
        localStorage.setItem(FREE_PLAN_EXPIRY_KEY, String(expiry));
      }

      if (Date.now() >= expiry) {
        localStorage.removeItem("nextnews-plan");
        localStorage.removeItem(FREE_PLAN_EXPIRY_KEY);
        setCurrentPlan(null);
        setPlanExpiry(null);
        return;
      }

      setCurrentPlan("Free");
      setPlanExpiry(expiry);
    };

    void loadPlanState();

    return () => {
      isMounted = false;
    };
  }, [checkoutPlanKey, router]);

  useEffect(() => {
    if (!planExpiry || Number.isNaN(planExpiry)) return undefined;

    // Only auto-clear Free plans based on timeout. Premium plans are managed by DB status.
    if (currentPlan !== "Free") return undefined;

    const timeLeft = planExpiry - Date.now();
    if (timeLeft <= 0) {
      localStorage.removeItem("nextnews-plan");
      localStorage.removeItem(FREE_PLAN_EXPIRY_KEY);
      setCurrentPlan(null);
      setPlanExpiry(null);
      return undefined;
    }

    // Cap the timeout to 24 days (max 32-bit int for setTimeout is ~24.8 days)
    const MAX_TIMEOUT = 2147483647;
    const safeTimeLeft = Math.min(timeLeft, MAX_TIMEOUT);

    const timeoutId = window.setTimeout(() => {
      localStorage.removeItem("nextnews-plan");
      localStorage.removeItem(FREE_PLAN_EXPIRY_KEY);
      setCurrentPlan(null);
      setPlanExpiry(null);
    }, safeTimeLeft);

    return () => window.clearTimeout(timeoutId);
  }, [planExpiry, currentPlan]);

  const handleActivateFreePlan = async () => {
    const freePlanStatus = await canUseFreePlan();

    if (freePlanStatus.error) {
      const expiry = Date.now() + FREE_PLAN_DAYS * MS_IN_DAY;
      localStorage.setItem("nextnews-plan", "Free");
      localStorage.setItem(FREE_PLAN_EXPIRY_KEY, String(expiry));
      setCurrentPlan("Free");
      setPlanExpiry(expiry);
      setSelectedPlan(null);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4200);
      return;
    }

    if (!freePlanStatus.allowed) {
      const nextAvailable = freePlanStatus.nextAvailableAt
        ? new Date(freePlanStatus.nextAvailableAt).toLocaleDateString(
            undefined,
            {
              year: "numeric",
              month: "short",
              day: "numeric",
            },
          )
        : null;

      setFreePlanError(
        nextAvailable
          ? `Free plan will be available again on ${nextAvailable}.`
          : "Free plan is not available yet.",
      );
      setTimeout(() => setFreePlanError(null), 6000);
      return;
    }

    const savedPlan = await savePlanToDatabase("free");
    if (savedPlan.data) {
      applySubscriptionPlan(savedPlan.data);
    } else {
      const expiry = Date.now() + FREE_PLAN_DAYS * MS_IN_DAY;
      localStorage.setItem("nextnews-plan", "Free");
      localStorage.setItem(FREE_PLAN_EXPIRY_KEY, String(expiry));
      setCurrentPlan("Free");
      setPlanExpiry(expiry);
    }

    setSelectedPlan(null);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 4200);
  };

  const handleCancelPlan = () => {
    setShowCancelConfirmation(true);
  };

  const handleConfirmCancel = async () => {
    const canceledPlan = await cancelPlanInDatabase();

    if (canceledPlan.data) {
      applySubscriptionPlan(canceledPlan.data);
    } else {
      localStorage.removeItem("nextnews-plan");
      localStorage.removeItem(FREE_PLAN_EXPIRY_KEY);
      setCurrentPlan(null);
      setPlanExpiry(null);
    }

    setShowCancelConfirmation(false);
  };

  const handleSupportComplete = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 4200);
  };

  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailInput = e.currentTarget.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement | null;
    const email = emailInput?.value ?? "";

    if (!email) {
      alert("Please enter a valid email address.");
      return;
    }

    setSubscribed(true);
    e.currentTarget.reset();
    setTimeout(() => setSubscribed(false), 5000);
  };

  const planExpiryDate = planExpiry
    ? new Date(planExpiry).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const selectedPlanKey: CheckoutPlanKey | null =
    selectedPlan === "Pro"
      ? yearly
        ? "pro_yearly"
        : "pro_monthly"
      : selectedPlan === "Pro+"
        ? yearly
          ? "proplus_yearly"
          : "proplus_monthly"
        : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Choose Your Perfect <br />
            <span
              style={{ fontFamily: "cursive" }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-600 font-medium italic drop-shadow-sm"
            >
              NextNews Plan
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-slate-600 dark:text-slate-300">
            Find the plan that matches your reading needs. Whether you prefer a
            streamlined daily experience or comprehensive premium features,
            NextNews adapts to help you stay informed.
          </p>

          <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
              Premium content
            </span>
            <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
              Reader-first tools
            </span>
            <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
              Designed for growing features
            </span>
          </div>

          <div className="mb-12 flex flex-wrap items-center justify-center gap-4 sm:mb-16">
            <span
              className={
                !yearly
                  ? "font-semibold text-teal-600"
                  : "text-slate-500 dark:text-slate-400"
              }
            >
              Monthly
            </span>
            <button
              onClick={() => setYearly((p) => !p)}
              className="relative h-10 w-20 rounded-full bg-slate-200 p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700"
              aria-label={yearly ? "Switch to monthly" : "Switch to yearly"}
            >
              <span
                className={clsx(
                  "absolute top-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-sm transition-transform duration-300 ease-in-out",
                  yearly ? "translate-x-10" : "translate-x-0",
                )}
              >
                {yearly ? "yr" : "mo"}
              </span>
            </button>
            <span
              className={
                yearly
                  ? "font-semibold text-teal-600"
                  : "text-slate-500 dark:text-slate-400"
              }
            >
              Yearly
            </span>
          </div>
        </div>
      </section>

      {currentPlan && (
        <section className="px-4 pb-8 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-4xl rounded-2xl border border-teal-200 bg-teal-50/50 p-6 shadow-sm dark:border-teal-800/50 dark:bg-teal-900/10 sm:p-8"
          >
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Current Plan: {currentPlan}
                  </h2>
                  <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                    Active
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {currentPlan === "Free"
                    ? "You have access to core news and daily reading features."
                    : `Your ${currentPlan} subscription is active and unlocking premium access.`}
                </p>
                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {currentPlan === "Free"
                    ? planExpiryDate
                      ? `Free plan expires on ${planExpiryDate}.`
                      : "Free plan expires 16 days after activation."
                    : planExpiryDate
                      ? `Your premium plan remains active until ${planExpiryDate}.`
                      : "Your premium plan remains active until it is canceled or its billing cycle ends."}
                </p>
              </div>
              <button
                onClick={handleCancelPlan}
                className="whitespace-nowrap rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 shadow-sm transition-all hover:bg-rose-50 hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-rose-900/30 dark:bg-slate-900 dark:hover:bg-rose-950/30"
              >
                Cancel Plan
              </button>
            </div>
          </motion.div>
        </section>
      )}

      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
          {productPerks.map((item, index) => {
            const IconComponent = item.icon;
            const colors = perkColors[index % perkColors.length];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`group relative rounded-3xl bg-gradient-to-br ${colors.card} p-4 sm:p-8 flex flex-col items-start text-left transition-all duration-300 border-2`}
              >
                <div
                  className={`mb-4 sm:mb-5 bg-gradient-to-br ${colors.icon} rounded-full p-2.5 shadow-lg border border-white/30 transition-transform group-hover:scale-110 w-fit`}
                >
                  <IconComponent
                    size={18}
                    className="text-white sm:h-5 sm:w-5"
                  />
                </div>
                <h2 className="text-base sm:text-xl font-bold mb-2 text-slate-900 dark:text-white">
                  {item.title}
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent dark:via-teal-600/40" />
      </div>

      <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-center justify-items-center gap-8 xl:grid-cols-3">
          {planCatalog.map((plan, index) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const annualSavingsPercent =
              yearly && plan.monthlyPrice > 0
                ? Math.max(
                    0,
                    Math.round(
                      (1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100,
                    ),
                  )
                : null;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className={clsx(
                  "relative w-full max-w-sm rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg",
                  plan.featured
                    ? "border-teal-200 bg-teal-50 ring-1 ring-teal-200/50 dark:border-teal-700 dark:bg-teal-950/40 lg:scale-105"
                    : plan.name === "Pro+"
                      ? "border-orange-200 bg-orange-50 ring-1 ring-orange-200/50 dark:border-orange-700 dark:bg-orange-950/40"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800",
                )}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                    Most Popular
                  </div>
                )}

                <div className="text-center">
                  <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {plan.name}
                  </h3>
                  <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                    {plan.desc}
                  </p>
                  <p className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/70 dark:text-slate-200">
                    {plan.name === "Free"
                      ? "Available now"
                      : "Monetization prep"}
                  </p>
                  <p className="mb-1 text-4xl font-bold text-teal-600">
                    Rs {price}.00
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {price === 0 ? "No cost" : `/${yearly ? "year" : "month"}`}
                  </p>
                  {yearly && (
                    <p className="mt-1 text-xs font-medium text-emerald-600">
                      {annualSavingsPercent
                        ? `Save ${annualSavingsPercent}% on annual billing`
                        : "Save on annual billing"}
                    </p>
                  )}
                </div>

                <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    <span>
                      {yearly ? plan.credits.yearly : plan.credits.monthly}
                    </span>
                  </li>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setSelectedPlan(plan.name)}
                  disabled={currentPlan === plan.name}
                  className={clsx(
                    "mt-8 w-full rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2",
                    currentPlan === plan.name
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                      : plan.featured
                        ? "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500"
                        : "border border-teal-300 bg-white text-teal-600 hover:bg-teal-50 focus:ring-teal-500 dark:border-teal-700 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-teal-950/40",
                  )}
                >
                  {currentPlan === plan.name
                    ? "Current Plan"
                    : plan.name === "Free"
                      ? "Continue with Free"
                      : "Choose Plan"}
                </button>

                <div className="mt-6 w-full border-t border-slate-100 pt-4 dark:border-slate-700">
                  <p className="mb-2 text-center text-xs text-slate-400 dark:text-slate-500">
                    Trusted by partners
                  </p>
                  <div className="flex justify-center space-x-4 opacity-60">
                    <Building2 className="h-5 w-5 text-slate-400" />
                    <Globe className="h-5 w-5 text-slate-400" />
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <footer className="bg-slate-900 px-4 py-12 text-white dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="text-center md:text-left">
              <h3 className="mb-4 text-lg font-bold">NextNews</h3>
              <p className="text-sm text-slate-300">
                Your trusted source for reliable, quality news.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center md:items-end">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-end">
                <a
                  href="tel:+918100684108"
                  className="text-sm text-slate-300 hover:text-teal-400"
                >
                  Contact Number
                </a>
                <a
                  href="mailto:galib.morsed@nextnews.co.in"
                  className="text-sm text-slate-300 hover:text-teal-400"
                >
                  Email
                </a>
                <a
                  href="https://www.instagram.com/nextnews.co.in?igsh=MTkxNXh6M2IzaXFxeQ=="
                  className="text-sm text-slate-300 hover:text-teal-400"
                >
                  Social Media
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row md:items-center">
            <p className="order-2 text-center text-sm text-slate-300 md:order-1 md:text-left">
              © 2026 NextNews.co.in All rights reserved.
            </p>
            <div className="order-1 w-full max-w-md md:order-2">
              {subscribed ? (
                <div className="animate-pulse rounded-full bg-teal-600 px-6 py-2 text-center text-sm font-medium text-white">
                  Response saved and you will be notified.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-full bg-white px-4 py-2 pr-20 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-800 dark:text-slate-100"
                    required
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-full rounded-t-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-700/80 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.98))] sm:max-w-md sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="space-y-4 text-center">
                {selectedPlan === "Free" ? (
                  <>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30">
                      <Sparkles className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      Unlock Free Access
                    </h3>
                    <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                      Get started with daily news, basic personalization, and
                      standard article browsing immediately.
                    </p>
                    <AnimatePresence>
                      {freePlanError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
                        >
                          {freePlanError}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button
                      onClick={handleActivateFreePlan}
                      className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-teal-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                      Activate Free Plan
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                      <ShieldCheck className="h-6 w-6 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {selectedPlan} selected
                    </h3>
                    <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                      Your selected plan will take you to secure checkout, where
                      you can complete activation and help support the ongoing
                      development of NextNews.
                    </p>
                    {selectedPlanKey ? (
                      <ChoosePlan
                        planKey={selectedPlanKey}
                        label={`Continue with ${selectedPlan}`}
                        className="w-full"
                      />
                    ) : null}
                    <button
                      onClick={() => {
                        setSelectedPlan(null);
                        setShowChaiPopup(true);
                      }}
                      className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-100"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <HeartHandshake className="h-4 w-4" />
                        Support the project
                      </span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setShowCancelConfirmation(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-full rounded-t-2xl bg-white p-6 shadow-xl dark:border dark:border-slate-700 dark:bg-slate-900 sm:max-w-sm sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex justify-center">
                  <LottiePlayer
                    src="/actiivity/error.json"
                    className="h-20 w-20"
                    loop
                    autoplay
                  />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                  Cancel {currentPlan} Plan?
                </h3>
                <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
                  Are you sure you want to cancel? You&apos;ll lose access to
                  your current curated news feed settings.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setShowCancelConfirmation(false)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Keep Plan
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SupportProject
        isOpen={showChaiPopup}
        onClose={() => setShowChaiPopup(false)}
        onSupportComplete={handleSupportComplete}
      />

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] overflow-hidden bg-slate-950/95 backdrop-blur-sm"
          >
            <div className="absolute inset-0">
              {Array.from({ length: 26 }).map((_, i) => {
                const left = (i * 17) % 100;
                const top = (i * 29) % 100;
                const delay = (i % 9) * 0.14;
                const duration = 1.4 + (i % 4) * 0.35;
                const size = 8 + (i % 3) * 8;
                const colors = [
                  "bg-amber-300",
                  "bg-teal-300",
                  "bg-rose-300",
                  "bg-sky-300",
                ];
                const color = colors[i % colors.length];

                return (
                  <motion.span
                    key={`spark-${i}`}
                    className={clsx(
                      "absolute rounded-full shadow-[0_0_16px_rgba(255,255,255,0.8)]",
                      color,
                    )}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.6, 0], opacity: [0, 1, 0] }}
                    transition={{
                      duration,
                      delay,
                      repeat: 2,
                      ease: "easeOut",
                    }}
                  />
                );
              })}
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
            >
              <PartyPopper className="mb-4 h-14 w-14 text-amber-300" />
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Thank You!
              </h2>
              <p className="mt-3 text-base text-slate-200 sm:text-lg">
                Your support helps us improve NextNews. We appreciate your
                interest.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500">
          Loading...
        </div>
      }
    >
      <PlansContent />
    </Suspense>
  );
}
