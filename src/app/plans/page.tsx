"use client";

import { useState, useEffect, type FormEvent } from "react";
import clsx from "clsx";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Building2,
  Globe,
  HandCoins,
  HeartHandshake,
  Landmark,
  PartyPopper,
  Copy,
  ShieldCheck,
  X,
  Sparkles,
  NotebookPen,
  Radio,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const planCatalog = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: "A solid everyday plan for casual readers who want the core NextNews experience.",
    features: [
      "Core news access and daily reading",
      "Basic personalization",
      "Standard article browsing",
      "Preview of upcoming premium tools",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: 79,
    yearlyPrice: 790,
    desc: "For regular readers who want deeper coverage, more control, and early premium value.",
    featured: true,
    features: [
      "Everything is more polished with Pro",
      "Deeper personalization controls",
      "Higher AI summary and assistant limits",
      "Priority access to premium reader tools",
    ],
  },
  {
    name: "Pro+",
    monthlyPrice: 199,
    yearlyPrice: 1990,
    desc: "Built for power users who want the fullest NextNews experience as advanced features roll out.",
    features: [
      "Pro+ includes you in the inner circle of NextNews",
      "Expanded AI usage limits",
      "Early access to upcoming premium features",
      "Extra personalization and supporter perks",
    ],
  },
];

const productPerks = [
  {
    icon: Sparkles,
    title: "Premium Reading",
    desc: "A more polished reading flow for people who want fewer distractions and more value from every visit.",
  },
  {
    icon: SlidersHorizontal,
    title: "Personalized Experience",
    desc: "Plans are designed to complement personalized topics, sources, and the wider account experience.",
  },
  {
    icon: NotebookPen,
    title: "Reader Tools",
    desc: "Notes, saved preferences, and upcoming premium improvements are aimed at active readers, not passive scrolling.",
  },
  {
    icon: Radio,
    title: "Growing Platform",
    desc: "Subscriptions support a product that continues expanding across live coverage, support tools, and premium content.",
  },
];

export default function PlansPage() {
  const [yearly, setYearly] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showChaiPopup, setShowChaiPopup] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "online">("bank");
  const [copied, setCopied] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  const upiVpa = "morsedgalib982@oksbi";
  const payeeName = "Galib";
  const amount = "25";

  const transactionNote = encodeURIComponent(
    `Chai treat via ${paymentMethod === "bank" ? "e-Transfer" : "Online"}`,
  );
  const upiString = `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${transactionNote}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;

  useEffect(() => {
    const savedPlan = localStorage.getItem("nextnews-plan");
    if (savedPlan) setCurrentPlan(savedPlan);
  }, []);

  const handleActivateFreePlan = () => {
    localStorage.setItem("nextnews-plan", "Free");
    setCurrentPlan("Free");
    setSelectedPlan(null);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 4200);
  };

  const handleCancelPlan = () => {
    setShowCancelConfirmation(true);
  };

  const handleConfirmCancel = () => {
    localStorage.removeItem("nextnews-plan");
    setCurrentPlan(null);
    setShowCancelConfirmation(false);
  };

  const handleProcessPayment = () => {
    if (typeof window !== "undefined") {
      window.location.href = upiString;
    }

    setShowChaiPopup(false);
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

  const handleCopyUpi = async () => {
    await navigator.clipboard.writeText(upiVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Plans for Better <span className="text-teal-600">NextNews</span>{" "}
            Experience
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-slate-600 dark:text-slate-300">
            Choose a plan that fits how you read. Whether you want a cleaner
            daily experience or deeper premium access, NextNews is built to grow
            with serious readers.🫡
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

      {currentPlan === "Free" && (
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
                    Current Plan: Free
                  </h2>
                  <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                    Active
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  You have access to core news and daily reading features.
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
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-4">
          {productPerks.map((item) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/85"
              >
                <div className="mb-4 inline-flex rounded-xl bg-teal-50 p-3 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300">
                  <IconComponent className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-6xl justify-items-center gap-8 lg:grid-cols-3">
          {planCatalog.map((plan, index) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;

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
                      Save 20% on annual billing
                    </p>
                  )}
                </div>

                <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600" />
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
                Your gateway to trusted and reliable news.⚡
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
                  href="mailto:morsedgalib982@gmail.com"
                  className="text-sm text-slate-300 hover:text-teal-400"
                >
                  Email
                </a>
                <a
                  href="https://www.instagram.com/galib_morsed/"
                  className="text-sm text-slate-300 hover:text-teal-400"
                >
                  Social Media
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row md:items-center">
            <p className="order-2 text-center text-sm text-slate-300 md:order-1 md:text-left">
              © 2026 NextNews. All rights reserved.
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
                      Payment flows are still being finalized. For now, this
                      page previews the upcoming premium experience and
                      available plan direction for NextNews.🤝
                    </p>
                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-teal-700 hover:shadow-lg"
                    >
                      Got it
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlan(null);
                        setPaymentMethod("bank");
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
                <div className="mb-4 rounded-full bg-rose-100 p-3 dark:bg-rose-900/30">
                  <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                  Cancel Free Plan?
                </h3>
                <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
                  Are you sure you want to cancel? You'll lose access to your
                  current curated news feed settings.
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

      <AnimatePresence>
        {showChaiPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setShowChaiPopup(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-full rounded-t-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 sm:max-w-md sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowChaiPopup(false)}
                className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close support popup"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:ring-amber-400/20">
                  <HandCoins className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                </div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-200">
                  I&apos;m Galib, and if NextNews feels useful to you, you can
                  support the project with a small chai treat.
                </p>
                <div className="mx-auto w-full max-w-sm rounded-[30px] bg-slate-100 p-4 text-left ring-1 ring-slate-200/80 dark:bg-slate-950/70 dark:ring-slate-700/70">
                  <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900/90 dark:ring-slate-700/80">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          Galib Morsed
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          India
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {upiVpa}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-1 dark:ring-slate-700 dark:hover:bg-slate-700"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-950/80 dark:ring-1 dark:ring-slate-800">
                      <div className="flex flex-col items-center justify-center">
                        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                          Scan to pay via UPI
                        </p>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-white">
                          <img
                            src={qrCodeUrl}
                            alt="UPI QR Code"
                            width={150}
                            height={150}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Payment method
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("bank")}
                          className={clsx(
                            "rounded-xl border p-3 text-center transition-colors dark:shadow-sm",
                            paymentMethod === "bank"
                              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/12"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800",
                          )}
                        >
                          <div className="mb-1 flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-300">
                            <Landmark className="h-4 w-4" />
                            {paymentMethod === "bank" && (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            e-Transfer
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("online")}
                          className={clsx(
                            "rounded-xl border p-3 text-center transition-colors dark:shadow-sm",
                            paymentMethod === "online"
                              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/12"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800",
                          )}
                        >
                          <div className="mb-1 flex items-center justify-center text-slate-700 dark:text-slate-200">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            Online
                          </p>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleProcessPayment}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-emerald-400/90 dark:text-slate-950 dark:hover:bg-emerald-300"
                    >
                      Process Payment
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                Thank You So Much! 🎉
              </h2>
              <p className="mt-3 text-base text-slate-200 sm:text-lg">
                Your kindness means a lot. Have an amazing day! 🛐✨
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
