"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  Radio,
  Bot,
  CreditCard,
  FileText,
  HeadphonesIcon,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  Search,
  X,
  Key,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TermsSection = {
  title: string;
  icon: typeof ShieldCheck;
  paragraphs: string[];
  bullets?: string[];
  categories: string[];
};

const termsSections: TermsSection[] = [
  {
    title: "Acceptance of Terms",
    icon: LockKeyhole,
    paragraphs: [
      "By creating an account, accessing authenticated features, activating any plan, or continuing to use NextNews after being presented with applicable legal notices, you agree to be bound by these Terms and Conditions together with the Privacy Policy and any additional rules published by the platform.",
      "If you do not agree with these terms, you must not create an account, activate a plan, or use authenticated portions of the application.",
    ],
    bullets: [
      "Acceptance applies to all free and paid account registrations.",
      "Continued use of the platform constitutes agreement to the updated terms.",
    ],
    categories: ["privacy-policies", "events-plan"],
  },
  {
    title: "User Eligibility",
    icon: UserRound,
    paragraphs: [
      "NextNews is designed as a general-purpose news aggregator. You must be at least 13 years old, or have express consent from a legal guardian, to register an account or use authenticated features.",
      "If we discover that registration metadata represents an ineligible child, we reserve the right to delete the account record immediately.",
    ],
    categories: ["privacy-policies", "events-plan"],
  },
  {
    title: "Account Creation & Verification",
    icon: UserRound,
    paragraphs: [
      "To access personalized feeds and premium features, you must register a unique account. You agree to provide accurate and complete registration profile information.",
      "NextNews reserves the right to request verification details or suspend accounts with suspicious or falsified registration details.",
    ],
    categories: ["account", "login-signup"],
  },
  {
    title: "Credential Security",
    icon: LockKeyhole,
    paragraphs: [
      "You are solely responsible for protecting the confidentiality of your credentials (including login email, passwords, and API session keys). All actions performed under your account ID are deemed your responsibility.",
      "You must alert support at nextnews.co.in@gmail.com immediately upon discovering unauthorized account accesses or suspected credential leaks.",
    ],
    bullets: [
      "Sessions utilize encrypted tokens managed by Supabase security layouts.",
      "We recommend enabling multi-factor options if supported.",
    ],
    categories: ["account", "login-signup"],
  },
  {
    title: "Prohibited Conduct",
    icon: AlertTriangle,
    paragraphs: [
      "You must use NextNews in compliance with applicable laws. You are prohibited from attempting to disrupt server endpoints, inject malicious code, harvest platform articles, or scrape data using automated bots.",
      "Any attempt to bypass rate-limits, exploit payment gateways, or abuse AI tools will lead to immediate account termination.",
    ],
    categories: ["account"],
  },
  {
    title: "SaaS Features and AI Disclaimers",
    icon: Bot,
    paragraphs: [
      "NextNews includes multiple AI tools (like article summaries, regional guidelines, and topic suggestion engines). These outputs are powered by model providers like OpenRouter and are intended solely as assistive reading tools.",
      "AI outputs are not guaranteed to be factually complete, accurate, or free of bias. NextNews disclaims all responsibility for decisions made based on AI-generated context.",
    ],
    bullets: [
      "Summaries represent synthetic evaluations of external news, not factual guarantees.",
      "AI metrics are subject to credit balances and rate-limiting thresholds.",
    ],
    categories: ["feature"],
  },
  {
    title: "Video Integration Guidelines",
    icon: Radio,
    paragraphs: [
      "Short-form Shorts and live-news discoverability features depend on third-party video networks (such as Dailymotion and YouTube). All videos, stream feeds, thumbnails, and channel metrics belong to their respective publishers.",
      "NextNews surfaces these embeds strictly for discovery. You are prohibited from downloading, recording, clipping, or redistributing third-party stream content without express permission from the rights holder.",
    ],
    categories: ["feature"],
  },
  {
    title: "Subscription Tiers & Plans",
    icon: CreditCard,
    paragraphs: [
      "We offer three tier classifications: Free, Pro, and Pro+. Plan tiers govern limits for AI summaries, personalized dashboard categories, and priority access parameters.",
      "By subscribing to a paid tier, you agree to the billing cycles, costs, and terms disclosed during the checkout flow.",
    ],
    categories: ["billing", "events-plan"],
  },
  {
    title: "Dodo Payments Integration",
    icon: CreditCard,
    paragraphs: [
      "All subscription checkouts, invoice routing, plan renewals, and transactions are processed securely through our payment provider, Dodo Payments.",
      "NextNews does not store or process raw debit/credit card numbers directly. We only receive webhook indicators and transaction references to manage plan accesses.",
    ],
    categories: ["billing"],
  },
  {
    title: "Free Tier Credit Restraints",
    icon: CreditCard,
    paragraphs: [
      "The Free tier includes a set quota of 600 API call credits for a 16-day period to access personalized feeds. Once exhausted, the Free plan enters a 30-day cooldown period.",
      "During the cooldown, you will be restricted from querying personalized endpoints unless you upgrade to a paid subscription.",
    ],
    categories: ["billing", "events-plan"],
  },
  {
    title: "Pro and Pro+ Credit Allocations",
    icon: CreditCard,
    paragraphs: [
      "Paid plans are allocated higher service allowances: Pro plans receive 8,000 monthly credits (or 200,000 yearly) and Pro+ plans receive 45,000 monthly credits (or unlimited yearly).",
      "These credits represent non-cash usage entitlements. They reset at the start of each renewal billing period and do not roll over.",
    ],
    categories: ["billing", "events-plan"],
  },
  {
    title: "Cancellation and Upgrades",
    icon: CreditCard,
    paragraphs: [
      "You can cancel your subscription or modify your plan tier at any time through the Billing settings. Cancellations will apply to the upcoming billing cycle.",
      "Downgrades or cancellations will revert your access permissions to the Free tier once the active billing period expires.",
    ],
    categories: ["billing"],
  },
  {
    title: "Refund Policy",
    icon: CreditCard,
    paragraphs: [
      "Subscription purchases are generally non-refundable unless specified otherwise by local consumer protection regulations. We evaluate refund requests on a case-by-case basis through support.",
      "Refund requests are subject to audit checks on API credits consumed to prevent policy exploitation.",
    ],
    categories: ["billing"],
  },
  {
    title: "Service Level Disclaimers",
    icon: ShieldCheck,
    paragraphs: [
      "NextNews is provided on an 'as is' and 'as available' basis. We do not guarantee that the application, live feeds, or AI summaries will be completely error-free, uninterrupted, or available at all times.",
      "We reserve the right to modify, pause, or sunset specific features or news categories to resolve technical errors or comply with provider demands.",
    ],
    categories: ["privacy-policies"],
  },
  {
    title: "Limitation of Liability Cap",
    icon: AlertTriangle,
    paragraphs: [
      "To the maximum extent permitted by law, NextNews and its operators will not be liable for incidental, indirect, consequential, or exemplary damages, including data loss, profits loss, or service interruptions.",
      "Our total liability for any claim under these terms is capped at the total amount paid by you to NextNews in the prior twelve (12) months, or INR 0 if no fees were paid.",
    ],
    categories: ["privacy-policies", "events-plan"],
  },
  {
    title: "Termination & Suspension",
    icon: AlertTriangle,
    paragraphs: [
      "We reserve the right to restrict, suspend, or permanently terminate account accesses where we determine that a user has violated these Terms & Conditions, engaged in fraud, or posed security threats.",
      "Suspended users can submit appeals through the support route. Immediate suspension without notice may occur in cases involving legal requirements or direct system threats.",
    ],
    categories: ["privacy-policies", "events-plan"],
  },
  {
    title: "Intellectual Property Rights",
    icon: FileText,
    paragraphs: [
      "All original source code, graphic designs, custom UI components, templates, and branding elements remain the exclusive intellectual property of NextNews.",
      "Aggregated news articles, thumbnails, and third-party stream content remain the intellectual property of their original publishers or licensors.",
    ],
    categories: ["privacy-policies"],
  },
  {
    title: "Governing Law",
    icon: ShieldCheck,
    paragraphs: [
      "These Terms & Conditions are governed by and construed in accordance with the laws of India.",
      "Any legal actions or disputes arising from these Terms will be subject to the exclusive jurisdiction of the competent courts of Bangalore, Karnataka, India.",
    ],
    categories: ["privacy-policies", "events-plan"],
  },
];

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <>{text}</>;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

  return (
    <>
      {parts.map((part, index) => {
        const matches = part.toLowerCase() === query.toLowerCase();
        return matches ? (
          <mark
            key={index}
            className="bg-sky-100 text-sky-950 dark:bg-sky-950/80 dark:text-sky-100 rounded-[2px] px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </>
  );
}

export default function TermsAndConditionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = termsSections.filter((section) => {
    // 2. Filter by search query if typed
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesTitle = section.title.toLowerCase().includes(query);
      const matchesParagraphs = section.paragraphs.some((p) =>
        p.toLowerCase().includes(query),
      );
      const matchesBullets = section.bullets?.some((b) =>
        b.toLowerCase().includes(query),
      );

      return matchesTitle || matchesParagraphs || matchesBullets;
    }

    return true;
  });

  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_28%),linear-gradient(to_bottom,#f8fafc,#ffffff_24%,#f8fafc)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.10),transparent_24%),linear-gradient(to_bottom,#020617,#0f172a_36%,#020617)] sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900/90 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50/50 px-2.5 py-1 text-xs font-medium tracking-wide text-sky-700 dark:border-sky-950 dark:bg-sky-950/30 dark:text-sky-300">
                <LockKeyhole className="h-3.5 w-3.5" />
                TERMS &amp; CONDITIONS
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-slate-100 sm:text-4xl lg:text-4xl">
                Terms Governing the Use of NextNews
              </h1>

              <p className="mt-2 text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                Last updated: May, 2026
              </p>

              <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                These Terms &amp; Conditions set out the rules that apply to
                account creation, use of authenticated features, AI tools,
                plans, support interactions, and billing or API-credit systems
                across the NextNews platform.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <HeadphonesIcon className="h-3.5 w-3.5" />
                  Grievance &amp; support: nextnews.co.in@gmail.com
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">
                  |
                </span>
                <span>
                  Official Terms of Service for SaaS features, subscriptions,
                  &amp; credits.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar section */}
        <section className="flex flex-col items-center py-4">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl text-center">
            Hi, how can we help?
          </h2>

          <div className="relative mt-6 w-full max-w-2xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search
                className="h-[18px] w-[18px] text-slate-400 dark:text-slate-500"
                strokeWidth={1.8}
              />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for articles..."
              className="block w-full rounded-[14px] border border-slate-200/80 bg-white/90 py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300/80 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600/80 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </section>

        {/* Detailed terms clauses */}
        <section className="space-y-6">
          {filteredSections.length > 0 ? (
            filteredSections.map((section, index) => {
              const Icon = section.icon;

              return (
                <motion.article
                  key={section.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.38,
                    delay: Math.min(index * 0.03, 0.3),
                  }}
                  className="group rounded-[28px] border border-slate-200/80 bg-white/92 p-6 shadow-sm hover:border-sky-200 dark:border-slate-700/80 dark:bg-slate-900/88 dark:hover:border-sky-900/60 hover:-translate-y-1 hover:shadow-md transition-all duration-300 sm:p-8"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 group-hover:bg-sky-100 group-hover:text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 dark:group-hover:bg-sky-900/40 dark:group-hover:text-sky-300 transition-colors duration-300">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-300">
                        <HighlightText
                          text={section.title}
                          query={searchQuery}
                        />
                      </h2>

                      <div className="mt-4 space-y-4">
                        {section.paragraphs.map((paragraph, pIdx) => (
                          <p
                            key={pIdx}
                            className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]"
                          >
                            <HighlightText
                              text={paragraph}
                              query={searchQuery}
                            />
                          </p>
                        ))}
                      </div>

                      {section.bullets?.length ? (
                        <div className="mt-5 grid gap-3">
                          {section.bullets.map((bullet, bIdx) => (
                            <div
                              key={bIdx}
                              className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 px-4 py-3"
                            >
                              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 dark:bg-sky-400" />
                              <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                                <HighlightText
                                  text={bullet}
                                  query={searchQuery}
                                />
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.article>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-slate-200/80 bg-white/92 p-12 text-center dark:border-slate-700/80 dark:bg-slate-900/88">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                No terms articles found
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                No clauses match your query &ldquo;
                <span className="italic">{searchQuery}</span>&rdquo;. Try
                searching for something else or clearing the filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                }}
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 transition-colors duration-200 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-6 text-slate-100 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="lg:max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                <LockKeyhole className="h-4 w-4" />
                Questions or Concerns
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-3xl">
                Need help with our Terms or Account rules?
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                If you have any questions regarding these Terms &amp;
                Conditions, account responsibilities, AI usage limits, or
                upcoming billing and credit policies, please reach out to our
                support team.
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300 sm:text-base">
                Email: nextnews.co.in@gmail.com
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 border-t border-white/10 pt-5 lg:w-auto lg:max-w-xs lg:border-t-0 lg:pt-0">
              <Link
                href="/support"
                className="group flex items-center gap-3 rounded-[20px] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur transition-all duration-200 hover:border-sky-400/40 hover:bg-white/15"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300 transition-colors duration-200 group-hover:bg-sky-500/30">
                  <HeadphonesIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    Visit Support
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-300">
                    Get help with terms, usage, or billing queries
                  </p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-sky-300" />
              </Link>
              <p className="px-1 text-xs leading-5 text-slate-400">
                Our support team is available to clarify rules, investigate
                account concerns, and assist with service-related inquiries.
              </p>
            </div>
          </div>
        </section>
      </div>
    </motion.main>
  );
}
