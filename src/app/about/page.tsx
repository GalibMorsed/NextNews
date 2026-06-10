"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Sparkles,
  Star,
  Eye,
  Users,
  Globe,
  Download,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Zap,
  MapPin,
  Linkedin,
  Twitter,
  Instagram,
  Github,
  Mail,
  LayoutGrid,
  X,
  ExternalLink,
  Handshake,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { FAQSection } from "./components/QandA";
import LottiePlayer from "../components/LottiePlayer";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";

const desktopVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.95 },
};

const mobileVariants = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: "100%" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const floatVariants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const Counter = ({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    return latest.toFixed(decimals) + suffix;
  });

  React.useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2, ease: [0.33, 1, 0.68, 1] });
    }
  }, [isInView, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

export default function AboutPage() {
  const [authState, setAuthState] = React.useState<
    "unknown" | "logged-in" | "logged-out"
  >("unknown");
  const [isWorkWithUsOpen, setIsWorkWithUsOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const email = localStorage.getItem("auth_email");
    const token = localStorage.getItem("auth_token");
    setAuthState(email && token ? "logged-in" : "logged-out");

    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-blue-50/30 dark:bg-[#0B0F19]">
      {/* 1. HERO SECTION */}
      <section className="relative px-4 pt-20 pb-16 mx-auto max-w-7xl sm:px-6 lg:px-8 text-center overflow-hidden">
        {/* Abstract animated gradient background for hero */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-blue-950/20 dark:via-[#0B0F19] dark:to-cyan-950/20" />
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 right-[10%] -z-10 w-[500px] h-[500px] bg-blue-200/40 blur-[100px] rounded-full mix-blend-multiply dark:bg-blue-900/20"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[20%] left-[10%] -z-10 w-[400px] h-[400px] bg-cyan-200/40 blur-[100px] rounded-full mix-blend-multiply dark:bg-cyan-900/20"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-14 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-default dark:bg-slate-800 dark:border-slate-700"
          >
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-slate-800 dark:text-slate-200">
              About NextNews
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="flex flex-col items-center text-4xl md:text-5xl lg:text-[4rem] font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto mb-8 leading-tight"
          >
            <div className="flex flex-wrap items-center justify-center gap-x-2 md:gap-x-4 mb-1">
              <span>Discover Who We Are</span>
              <span>and Why</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-2 md:gap-x-4">
              <span
                style={{ fontFamily: "cursive" }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600 font-medium italic text-[2.25rem] md:text-[3.5rem] lg:text-[4.5rem] mt-2 md:mt-3 px-2 pr-1 drop-shadow-sm"
              >
                We Built This Platform
              </span>
            </div>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="max-w-[50rem] mx-auto text-base md:text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium"
          >
            NextNews brings together curated categories, top headlines, live
            coverage, saved notes, and user preferences so readers can follow
            what matters to them without losing context.
          </motion.p>

          <motion.div variants={itemVariants} className="mb-20">
            {authState === "logged-out" && (
              <Link
                href="/auth/register"
                className="inline-block px-8 py-4 text-lg font-bold text-white transition-all duration-300 transform rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:-translate-y-1 border border-white/20"
              >
                Be a Member
              </Link>
            )}
            {authState === "logged-in" && (
              <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-5 py-3 rounded-3xl bg-white/80 border border-slate-200 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
                <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">
                  Heyy! Ready to know more about us?
                </span>
                <button
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="px-6 py-2.5 text-sm sm:text-base font-bold text-white rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 transition-all duration-300 border border-white/20"
                >
                  Start Exploring
                </button>
              </div>
            )}
            {authState === "unknown" && (
              <div className="h-12" aria-hidden="true" />
            )}
          </motion.div>

          {/* Hero Video Thumbnail */}
          <motion.div
            variants={itemVariants}
            className="relative max-w-5xl mx-auto group cursor-pointer aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10"
          >
            <Image
              src="/about/aboutBG.png"
              alt="About NextNews Hero Video Thumbnail"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-colors" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex flex-col items-center">
                <div className="flex items-center justify-center w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-transform group-hover:scale-110 dark:bg-slate-800/90">
                  <Play
                    className="w-8 h-8 text-blue-600 dark:text-blue-400 ml-1"
                    fill="currentColor"
                  />
                </div>
                <span className="absolute top-full mt-4 whitespace-nowrap px-4 py-2 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-xl border border-white/10">
                  Not ready yet
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. WHY NEXTNEWS */}
      <section className="py-16 bg-gradient-to-b from-white via-blue-50/40 to-white border-b border-slate-200 dark:bg-gradient-to-b dark:from-[#0B0F19] dark:via-blue-950/20 dark:to-[#0B0F19] dark:border-slate-800">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div
            variants={itemVariants}
            className="text-center mb-8 sm:mb-10"
          >
            <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4 flex items-center justify-center gap-2">
              <Sparkles size={16} className="text-blue-400" />
              Why Readers Trust NextNews
            </h3>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-500 dark:text-slate-400">
              A focused and reliable reading experience built for people who
              want clarity, relevance, and speed without noise.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                title: "Curated Headlines",
                detail:
                  "Top stories organized by category so you can scan what matters fast.",
              },
              {
                title: "Live News Monitoring",
                detail:
                  "Breaking developments are surfaced quickly in one place for easy tracking.",
              },
              {
                title: "Personalized feed",
                detail:
                  "Topics and regions adapt to your interests for a more relevant feed.",
              },
              {
                title: "AI-Powered Insights",
                detail:
                  "Get intelligent summaries and deeper context on complex stories using our advanced AI.",
              },
            ].map((item, index) => {
              const colors = [
                {
                  border: "border-blue-500",
                  bg: "from-blue-500/5 to-cyan-500/5",
                  accent: "bg-blue-500/10 dark:bg-blue-500/20",
                },
                {
                  border: "border-cyan-500",
                  bg: "from-cyan-500/5 to-blue-500/5",
                  accent: "bg-cyan-500/10 dark:bg-cyan-500/20",
                },
                {
                  border: "border-blue-400",
                  bg: "from-blue-400/5 to-cyan-400/5",
                  accent: "bg-blue-400/10 dark:bg-blue-400/20",
                },
                {
                  border: "border-cyan-400",
                  bg: "from-cyan-400/5 to-blue-400/5",
                  accent: "bg-cyan-400/10 dark:bg-cyan-400/20",
                },
              ];
              const color = colors[index % 4];
              return (
                <motion.article
                  key={item.title}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className={`group flex flex-col justify-start rounded-2xl border-2 ${color.border} bg-gradient-to-br ${color.bg} to-white sm:from-white sm:to-slate-50 p-3.5 sm:px-4 sm:py-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-lg hover:border-opacity-100 dark:border-opacity-50 dark:from-slate-900 dark:to-slate-800/60 dark:hover:border-opacity-100`}
                >
                  <p className="mt-2 sm:mt-1.5 text-[13px] sm:text-lg font-semibold leading-snug text-slate-800 dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3 sm:line-clamp-none">
                    {item.detail}
                  </p>
                </motion.article>
              );
            })}
          </div>

          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col items-center gap-3 text-center"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Interested in media collaborations or contributor opportunities?
            </p>
            <button
              type="button"
              onClick={() => setIsWorkWithUsOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-800 bg-gradient-to-r from-slate-900/80 to-slate-800/80 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-700 hover:from-slate-900 hover:to-slate-800 dark:border-slate-700 dark:from-slate-800/90 dark:to-slate-700/90 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:from-slate-800 dark:hover:to-slate-700"
            >
              Talk to our team
              <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-white dark:text-slate-400 dark:group-hover:text-slate-200" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. STATS GRID */}
      <section className="py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-slate-200 relative overflow-hidden dark:from-slate-900/60 dark:via-[#0d1225] dark:to-slate-900/60 dark:border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-slate-200/30 opacity-60 mix-blend-overlay"></div>
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-40 top-40 w-96 h-96 bg-blue-300/30 rounded-full blur-[100px] dark:bg-blue-800/15"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-40 bottom-40 w-96 h-96 bg-cyan-300/30 rounded-full blur-[100px] dark:bg-cyan-800/15"
        />
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[300px] bg-gradient-to-b from-blue-200/20 via-transparent to-transparent rounded-full blur-[80px] dark:from-blue-900/10"></div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        >
          {/* Section Header */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-cyan-600 bg-cyan-100 rounded-full mb-6 dark:bg-cyan-900/30 dark:text-cyan-400">
              <Zap size={16} />
              <span>Our Impact</span>
            </div>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Join thousands of users who rely on NextNews for their daily life.
              Here's what we've achieved together.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                label: "AI Insights Delivered",
                value: 10,
                suffix: "K+",
                icon: <Sparkles size={24} />,
              },
              {
                label: "Active Readers",
                value: 400,
                suffix: "+",
                icon: <Users size={24} />,
              },
              {
                label: "Regions Supported",
                value: 190,
                suffix: "+",
                icon: <Globe size={24} />,
              },
              {
                label: "Average Rating",
                value: 4.8,
                suffix: "/5",
                decimals: 1,
                icon: <Star fill="currentColor" size={24} />,
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="flex flex-col items-center text-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900/80 p-5 sm:p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all dark:border-slate-700 dark:hover:border-slate-600"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 dark:from-blue-900/40 dark:to-blue-900/20 dark:text-blue-400">
                  {stat.icon}
                </div>
                <h4 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                  <Counter
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </h4>
                <p className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-[100px] sm:max-w-none leading-snug">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section
        id="how-it-works"
        className="py-24 bg-gradient-to-b from-white via-blue-50/30 to-white border-t border-blue-100/50 dark:bg-gradient-to-b dark:from-[#0B0F19] dark:via-blue-950/10 dark:to-[#0B0F19] dark:border-blue-950/50"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-900 dark:text-white"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full mb-6 dark:bg-blue-900/30 dark:text-blue-400"
          >
            <Wand2 size={16} />
            <span>Process</span>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-16"
          >
            Stay informed with a seamless news experience. Personalized,
            AI-enhanced, and always up to date.
          </motion.p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Step 1 */}
            <motion.div variants={itemVariants} className="text-left group">
              <div className="relative h-64 mb-6 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900/50 p-6 flex items-center justify-center group-hover:from-blue-100/50 dark:group-hover:from-blue-900/30 transition-all duration-300 border-2 border-blue-200/60 dark:border-blue-900/40 group-hover:border-blue-300/80 dark:group-hover:border-blue-700/60">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md ring-1 ring-slate-900/5 dark:ring-white/10 dark:shadow-slate-900/50">
                  <Image
                    src="/about/step1.png"
                    alt="Step 1"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute right-4 bottom-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full p-2.5 shadow-lg shadow-blue-500/30 border border-white/30 transition-transform group-hover:scale-110">
                  <LayoutGrid size={18} className="text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                Personalize Your Feed
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Select your favorite topics and regions to create a news
                experience tailored specifically to your interests and location.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={itemVariants} className="text-left group">
              <div className="relative h-64 mb-6 rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-slate-900/50 p-6 flex items-center justify-center group-hover:from-cyan-100/50 dark:group-hover:from-cyan-900/30 transition-all duration-300 border-2 border-cyan-200/60 dark:border-cyan-900/40 group-hover:border-cyan-300/80 dark:group-hover:border-cyan-700/60">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md ring-1 ring-slate-900/5 dark:ring-white/10 dark:shadow-slate-900/50">
                  <Image
                    src="/about/step2.png"
                    alt="Step 2"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute right-4 bottom-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-2.5 shadow-lg shadow-purple-500/30 border border-white/30 transition-transform group-hover:scale-110">
                  <Sparkles size={18} className="text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                AI-Powered Insights
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Save time with intelligent summaries of complex stories. Our AI
                distills the most important information so you stay informed
                quickly.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={itemVariants} className="text-left group">
              <div className="relative h-64 mb-6 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900/50 p-6 flex items-center justify-center group-hover:from-blue-100/50 dark:group-hover:from-blue-900/30 transition-all duration-300 border-2 border-blue-200/60 dark:border-blue-900/40 group-hover:border-blue-300/80 dark:group-hover:border-blue-700/60">
                <div className="relative w-full h-full flex gap-2">
                  <div className="w-1/2 h-full relative rounded-2xl overflow-hidden shadow-md ring-1 ring-slate-900/5 dark:ring-white/10 dark:shadow-slate-900/50">
                    <Image
                      src="/about/step3.1.png"
                      alt="Daily News Alerts"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="w-1/2 h-full flex flex-col gap-2">
                    <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 dark:shadow-slate-900/50">
                      <Image
                        src="/about/step3.2.png"
                        alt="News Updates"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 dark:shadow-slate-900/50 bg-gradient-to-br from-blue-500 to-cyan-500">
                      <Image
                        src="/about/step3.3.png"
                        alt="Breaking Alerts"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute right-4 bottom-4 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full p-2.5 shadow-lg shadow-indigo-500/30 border border-white/30 transition-transform group-hover:scale-110">
                  <Globe size={18} className="text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                Live Monitoring & Alerts
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Stay ahead with real-time updates and breaking news alerts.
                Follow developing stories as they happen with continuous
                coverage.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 5. TEAM */}
      <section className="py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden border-t border-blue-200/60 dark:from-slate-900/60 dark:via-[#0d1225] dark:to-slate-900/60 dark:border-blue-800/30">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-40 top-40 w-96 h-96 bg-blue-300/30 rounded-full blur-[100px] dark:bg-blue-800/15"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-40 bottom-40 w-96 h-96 bg-cyan-300/30 rounded-full blur-[100px] dark:bg-cyan-800/15"
        />
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[300px] bg-gradient-to-b from-blue-200/20 via-transparent to-transparent rounded-full blur-[80px] dark:from-blue-900/10"></div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        >
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full mb-6 dark:bg-blue-900/30 dark:text-blue-400">
              <Users size={16} />
              <span>Team</span>
            </div>
            <h2 className="text-[36px] leading-tight font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 max-w-2xl mx-auto">
              The Minds Behind the Magic
            </h2>
            <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              At NextNews, we build a modern news experience that delivers
              real-time headlines, category browsing, and fast performance with
              a clean, responsive interface across devices.
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-stretch">
            {/* Left side: Team Members */}
            <div className="flex-1 w-full">
              <div className="flex flex-wrap gap-6 sm:gap-8 justify-center lg:justify-start h-full">
                {[
                  {
                    name: "Galib Morsed",
                    role: "Lead Engineer, Founder",
                    img: "/about/galib.jpg",
                    socials: [
                      {
                        label: "GitHub",
                        href: "https://github.com/GalibMorsed",
                        icon: Github,
                      },
                      {
                        label: "LinkedIn",
                        href: "https://www.linkedin.com/in/galib-morsed",
                        icon: Linkedin,
                      },
                      {
                        label: "Instagram",
                        href: "https://www.instagram.com/galib_morsed/",
                        icon: Instagram,
                      },
                      {
                        label: "Email",
                        href: "mailto:galib.morsed@nextnews.co.in",
                        icon: Mail,
                      },
                    ],
                  },
                  {
                    name: "",
                    role: "",
                    img: "/about/developer.jpg",
                    socials: [
                      {
                        label: "GitHub",
                        href: "/",
                        icon: Github,
                      },
                      {
                        label: "LinkedIn",
                        href: "/",
                        icon: Linkedin,
                      },
                      {
                        label: "Instagram",
                        href: "/",
                        icon: Instagram,
                      },
                      {
                        label: "Email",
                        href: "/",
                        icon: Mail,
                      },
                    ],
                  },
                ].map((member, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    whileHover={{ y: -10, transition: { duration: 0.3 } }}
                    className="group w-full max-w-[280px] bg-gradient-to-br from-white to-slate-50 rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-blue-200/50 hover:border-blue-400/60 dark:from-slate-800 dark:to-slate-900/80 dark:border-blue-700/30 dark:hover:border-blue-500/50"
                  >
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-6 bg-slate-200 ring-1 ring-blue-200/40 dark:bg-slate-700 dark:ring-blue-700/30">
                      <Image
                        src={member.img}
                        alt={member.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="px-2">
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                        {member.name}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        {member.role}
                      </p>
                      <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
                        {member.socials.map((social) => {
                          const Icon = social.icon;
                          const isExternal = social.href.startsWith("http");
                          return (
                            <motion.a
                              key={social.label}
                              href={social.href}
                              whileHover={{ scale: 1.2, color: "#3b82f6" }}
                              {...(isExternal
                                ? {
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                  }
                                : {})}
                              className="transition-colors duration-300"
                              aria-label={social.label}
                            >
                              <Icon className="h-5 w-5" />
                            </motion.a>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right side: Our Story */}
            <motion.div
              variants={itemVariants}
              className="w-full lg:w-[400px] xl:w-[450px] shrink-0"
            >
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 sm:p-10 shadow-sm border-2 border-blue-200/50 dark:from-slate-800 dark:to-slate-900/80 dark:border-blue-700/30 h-full flex flex-col relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-blue-400/20"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl -ml-10 -mb-10 transition-all duration-500 group-hover:bg-cyan-400/20"></div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 relative z-10 flex items-center gap-3">
                  <Eye className="text-purple-500" size={24} />
                  Our Vision
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 relative z-10 text-sm sm:text-base">
                  NextNews started with a simple idea: keeping up with the world
                  shouldn't feel like a chore. As avid readers and
                  technologists, we were frustrated by cluttered interfaces,
                  irrelevant stories, and slow load times.
                  <br />
                  We set out to build a platform that leverages cutting-edge AI
                  to deliver personalized, lightning-fast updates without
                  compromising quality.
                </p>

                <div className="mt-auto relative z-10 pt-4 border-t border-blue-100 dark:border-blue-800/30">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm uppercase tracking-wide"
                  >
                    Read our full journey <ChevronRight size={16} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 7. WHAT SETS US APART */}
      <section className="py-24 bg-slate-50 border-y border-slate-200/80 dark:bg-slate-900/50 dark:border-slate-700/60">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full mb-6 dark:bg-blue-900/30 dark:text-blue-400">
              <Star size={16} />
              <span>Features</span>
            </div>
            <h2 className="text-[36px] leading-tight font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 max-w-2xl mx-auto">
              What sets us apart
            </h2>
            <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Explore the core strengths that make NextNews a faster, smarter,
              and more balanced way to stay informed every day.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="flex-1 group relative rounded-3xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900/50 p-8 flex flex-col items-start text-left hover:from-blue-100/50 dark:hover:from-blue-900/30 transition-all duration-300 border-2 border-blue-200/60 dark:border-blue-900/40 hover:border-blue-300/80 dark:hover:border-blue-700/60"
              >
                <div className="mb-5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full p-2.5 shadow-lg shadow-blue-500/30 border border-white/30 transition-transform group-hover:scale-110 w-fit">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                  Curated Sources
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  We aggregate news from thousands of verified global
                  publishers, ensuring you only read content you can trust.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="flex-1 group relative rounded-3xl bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-900/50 p-8 flex flex-col items-start text-left hover:from-purple-100/50 dark:hover:from-purple-900/30 transition-all duration-300 border-2 border-purple-200/60 dark:border-purple-900/40 hover:border-purple-300/80 dark:hover:border-purple-700/60"
              >
                <div className="mb-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-2.5 shadow-lg shadow-purple-500/30 border border-white/30 transition-transform group-hover:scale-110 w-fit">
                  <Scale size={20} className="text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                  Balanced Perspectives
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Avoid echo chambers. Our platform groups related stories to
                  provide multiple viewpoints on every major issue.
                </p>
              </motion.div>
            </div>

            {/* Center Column */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
              className="flex flex-col"
            >
              <div className="flex-1 bg-gradient-to-br from-blue-950 to-[#0B0F19] dark:from-slate-900 dark:to-blue-950/60 rounded-[2rem] p-8 sm:p-10 flex flex-col items-center text-center shadow-xl border border-blue-900/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B0F19]/80 z-0"></div>
                <div className="absolute -top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-500/25 blur-3xl z-0"></div>
                <div className="absolute -bottom-16 right-8 h-56 w-56 rounded-full bg-blue-500/20 blur-[120px] z-0"></div>
                <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl z-0"></div>

                <div className="relative w-full flex-1 flex items-center justify-center min-h-[250px] mb-8 z-10">
                  <div className="absolute inset-0 flex justify-center items-center">
                    <div className="relative w-48 h-60 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 z-10 transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-2">
                      <Image
                        src="/about/feature.jpg"
                        alt="Feature preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-auto">
                  <h3 className="text-xl font-semibold text-white mb-3">
                    AI-Powered Insights
                  </h3>
                  <p className="text-[15px] text-slate-400 leading-relaxed">
                    Short on time? Our advanced AI distills complex articles
                    into quick, digestible insights so you can stay informed
                    faster.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="flex-1 group relative rounded-3xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900/50 p-8 flex flex-col items-start text-left hover:from-indigo-100/50 dark:hover:from-indigo-900/30 transition-all duration-300 border-2 border-indigo-200/60 dark:border-indigo-900/40 hover:border-indigo-300/80 dark:hover:border-indigo-700/60"
              >
                <div className="mb-5 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full p-2.5 shadow-lg shadow-indigo-500/30 border border-white/30 transition-transform group-hover:scale-110 w-fit">
                  <Wand2 size={20} className="text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                  Tailored Experience
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Follow specific topics and regions. Your feed adapts
                  dynamically to your reading habits over time.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="flex-1 group relative rounded-3xl bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-slate-900/50 p-8 flex flex-col items-start text-left hover:from-cyan-100/50 dark:hover:from-cyan-900/30 transition-all duration-300 border-2 border-cyan-200/60 dark:border-cyan-900/40 hover:border-cyan-300/80 dark:hover:border-cyan-700/60"
              >
                <div className="mb-5 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full p-2.5 shadow-lg shadow-cyan-500/30 border border-white/30 transition-transform group-hover:scale-110 w-fit">
                  <Zap size={20} className="text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                  Real-time Alerts
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Never miss a beat with instant breaking news alerts and
                  continuous live coverage of developing events.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <FAQSection />
      </motion.div>

      {/* 9. BOTTOM CTA */}
      <section className="py-16 bg-slate-50 dark:bg-[#0d1225] border-t border-slate-100 dark:border-slate-800">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-blue-900/20 dark:via-slate-900/60 dark:to-cyan-900/20 rounded-3xl px-8 py-14 relative overflow-hidden ring-1 ring-blue-100 dark:ring-white/10"
          >
            {/* Subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-cyan-400/5 dark:from-blue-500/10 dark:to-cyan-500/10 pointer-events-none rounded-3xl" />

            {/* Logo */}
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-md ring-1 ring-blue-100 dark:ring-slate-700 mb-6 mx-auto"
            >
              <Image
                src="/logo1.png"
                alt="NextNews"
                fill
                className="object-contain p-2"
              />
            </motion.div>

            <h2 className="relative text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
              Stay Informed. Stay Ahead.
            </h2>
            <p className="relative text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-2 text-[15px] leading-relaxed">
              NextNews delivers real-time headlines, AI-powered insights, and a
              personalized feed — all in one place with premium plans for power
              readers.
            </p>

            {/* Cool emoji Lottie */}
            <div className="flex justify-center mb-6">
              <LottiePlayer
                src="/about/Cool emoji.json"
                className="w-20 h-20"
                loop
                autoplay
              />
            </div>

            <Link
              href={authState === "logged-in" ? "/" : "/auth/register"}
              className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 text-sm"
            >
              {authState === "logged-in" ? "Start Exploring" : "Be a Member"}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-[#0B0F19] text-slate-400 py-16 border-t border-slate-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Image
                  src="/nav-logo.jpg"
                  alt="NextNews Logo"
                  width={32}
                  height={32}
                  className="rounded-lg object-contain"
                />
                <span className="text-2xl font-bold text-white tracking-tight">
                  NextNews
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm mb-6 text-slate-400">
                NextNews delivers premium, AI-curated journalism from around the
                globe, providing a seamless and personalized reading experience.
              </p>
              <div className="flex gap-4">
                <motion.a
                  whileHover={{ y: -3, color: "#fff" }}
                  href="mailto:nextnews.co.in@gmail.com"
                  className="p-2 bg-slate-800 rounded-full transition-colors text-slate-300"
                  aria-label="Email Us"
                >
                  <Mail size={18} />
                </motion.a>
                <motion.a
                  whileHover={{ y: -3, color: "#fff" }}
                  href="https://x.com/NextNewsCo"
                  className="p-2 bg-slate-800 rounded-full transition-colors text-slate-300"
                  aria-label="Follow us on Twitter"
                >
                  <Twitter size={18} />
                </motion.a>
                <motion.a
                  whileHover={{ y: -3, color: "#fff" }}
                  href="https://www.instagram.com/nextnews.co.in?igsh=MTkxNXh6M2IzaXFxeQ=="
                  className="p-2 bg-slate-800 rounded-full transition-colors text-slate-300"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram size={18} />
                </motion.a>
              </div>
            </div>

            <div className="col-span-1 md:col-span-1 lg:col-span-3 grid grid-cols-2 gap-8 lg:gap-12">
              <div>
                <h4 className="text-white font-bold mb-4 sm:mb-6 tracking-wide">
                  Navigation
                </h4>
                <ul className="space-y-3 sm:space-y-4 text-sm font-medium">
                  <li>
                    <Link
                      href="/"
                      className="hover:text-blue-400 transition-colors"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={
                        authState === "logged-in"
                          ? "/explore"
                          : "/auth/register"
                      }
                      className="hover:text-blue-400 transition-colors"
                    >
                      Explore
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={
                        authState === "logged-in" ? "/plans" : "/auth/register"
                      }
                      className="hover:text-blue-400 transition-colors"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={
                        authState === "logged-in"
                          ? "/my-activity"
                          : "/auth/register"
                      }
                      className="hover:text-blue-400 transition-colors"
                    >
                      My Activity
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4 sm:mb-6 tracking-wide">
                  Legal
                </h4>
                <ul className="space-y-3 sm:space-y-4 text-sm font-medium">
                  <li>
                    <Link
                      href="/privacy-policy"
                      className="hover:text-blue-400 transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms-and-conditions"
                      className="hover:text-blue-400 transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/support"
                      className="hover:text-blue-400 transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© 2026 NextNews.co.in All rights reserved.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsWorkWithUsOpen(true)}
                className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-slate-700/60 bg-slate-800/40 hover:border-blue-500/40 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-500 ring-1 ring-blue-500/20">
                  <Handshake className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                    Work With Us
                  </p>
                  <p className="text-xs text-slate-400">
                    Collaborations and contributor roles
                  </p>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </footer>

      <AnimatePresence>
        {isWorkWithUsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setIsWorkWithUsOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              variants={isMobile ? mobileVariants : desktopVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ ease: [0.16, 1, 0.3, 1] as const, duration: 0.3 }}
              className="relative w-full overflow-hidden rounded-t-2xl shadow-xl sm:rounded-[28px] sm:max-w-md border border-slate-200/70 bg-white/95 dark:border-slate-700/50 dark:bg-slate-900/95"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-300/20 to-indigo-300/20 dark:from-blue-400/10 dark:via-cyan-400/10 dark:to-indigo-400/10" />
              <div className="absolute -right-10 top-8 h-32 w-32 rounded-full blur-3xl bg-blue-300/20 dark:bg-blue-400/10" />

              <div className="relative px-4 pb-6 pt-4 sm:p-7">
                <div className="flex items-start justify-end">
                  <button
                    type="button"
                    onClick={() => setIsWorkWithUsOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-400 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-slate-600 dark:hover:text-slate-200"
                    aria-label="Close message"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-1 flex flex-col items-center text-center sm:mt-0 sm:flex-row sm:items-center sm:gap-4 sm:text-left">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2.5 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                    <Image
                      src="/logo1.png"
                      alt="NextNews Logo"
                      width={58}
                      height={58}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">
                      Work With Us
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                      Collaborate with NextNews
                    </h3>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 text-center sm:text-left dark:border-blue-500/10 dark:from-blue-500/10 dark:via-slate-900 dark:to-cyan-500/10">
                  <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                    Reach out to us with your proposal or work and we
                    will get back to you soon.
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <a
                    href="mailto:galib.morsed@nextnews.co.in"
                    className="group relative flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-500/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500/40"
                  >
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 dark:text-slate-200 dark:group-hover:text-blue-400 transition-colors">
                      galib.morsed@nextnews.co.in
                    </span>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors dark:text-slate-500 dark:group-hover:text-blue-400" />
                  </a>
                  <a
                    href="mailto:nextnews.co.in@gmail.com"
                    className="group relative flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-500/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500/40"
                  >
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 dark:text-slate-200 dark:group-hover:text-blue-400 transition-colors">
                      nextnews.co.in@gmail.com
                    </span>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors dark:text-slate-500 dark:group-hover:text-blue-400" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
