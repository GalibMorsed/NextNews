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
      "If you do not agree with these terms, you must not create an account, activate a plan, or use authenticated portions of the application."
    ],
    bullets: [
      "Acceptance applies to all free and paid account registrations.",
      "Continued use of the platform constitutes agreement to the updated terms."
    ],
    categories: ["privacy-policies", "events-plan"]
  },
  {
    title: "User Eligibility",
    icon: UserRound,
    paragraphs: [
      "NextNews is designed as a general-purpose news aggregator. You must be at least 13 years old, or have express consent from a legal guardian, to register an account or use authenticated features.",
      "If we discover that registration metadata represents an ineligible child, we reserve the right to delete the account record immediately."
    ],
    categories: ["privacy-policies", "events-plan"]
  },
  {
    title: "Account Creation & Verification",
    icon: UserRound,
    paragraphs: [
      "To access personalized feeds and premium features, you must register a unique account. You agree to provide accurate and complete registration profile information.",
      "NextNews reserves the right to request verification details or suspend accounts with suspicious or falsified registration details."
    ],
    categories: ["account", "login-signup"]
  },
  {
    title: "Credential Security",
    icon: LockKeyhole,
    paragraphs: [
      "You are solely responsible for protecting the confidentiality of your credentials (including login email, passwords, and API session keys). All actions performed under your account ID are deemed your responsibility.",
      "You must alert support at nextnews.co.in@gmail.com immediately upon discovering unauthorized account accesses or suspected credential leaks."
    ],
    bullets: [
      "Sessions utilize encrypted tokens managed by Supabase security layouts.",
      "We recommend enabling multi-factor options if supported."
    ],
    categories: ["account", "login-signup"]
  },
  {
    title: "Prohibited Conduct",
    icon: AlertTriangle,
    paragraphs: [
      "You must use NextNews in compliance with applicable laws. You are prohibited from attempting to disrupt server endpoints, inject malicious code, harvest platform articles, scrape data using automated bots, overload API routes, submit spam support requests, or interfere with security controls.",
      "Any attempt to bypass rate limits, forge subscription status, exploit payment gateways, manipulate AI usage credits, abuse support forms, or attack authentication systems may lead to immediate account restriction or termination."
    ],
    bullets: [
      "Do not share, sell, or automate access to your account or session tokens.",
      "Do not use NextNews to publish, store, or transmit unlawful, abusive, deceptive, or security-compromising content.",
      "Do not attempt to reverse engineer provider integrations or evade same-origin, token-verification, or webhook-signature checks."
    ],
    categories: ["account"]
  },
  {
    title: "SaaS Features and AI Disclaimers",
    icon: Bot,
    paragraphs: [
      "NextNews includes AI tools such as article summaries, topic suggestions, region suggestions, and assisted reading features. These outputs may be powered by model providers such as OpenRouter and are intended solely as assistive reading tools.",
      "AI outputs are not guaranteed to be factually complete, accurate, current, or free of bias. You remain responsible for checking original sources before relying on summaries, recommendations, or generated explanations."
    ],
    bullets: [
      "Summaries represent synthetic evaluations of external news, not factual guarantees.",
      "AI requests may send article title, source, description, and content excerpts to the model provider.",
      "AI metrics are subject to credit balances, authentication checks, and rate-limiting thresholds.",
      "AI features are not professional, legal, medical, financial, investment, election, or safety advice."
    ],
    categories: ["feature"]
  },
  {
    title: "News, Article, and Publisher Content",
    icon: FileText,
    paragraphs: [
      "NextNews aggregates and displays article metadata, images, excerpts, source names, links, and readable article content from external publishers and news APIs. Publisher content remains owned by the original publisher or rights holder.",
      "Article pages may fetch original URLs to extract title, source, image, publish time, and article paragraphs for a focused reading experience. If extraction is incomplete, unavailable, or disputed, the original publisher link remains the authoritative source."
    ],
    bullets: [
      "You should verify important facts, dates, claims, and source context with the original publication.",
      "You may not copy, redistribute, scrape, or commercially reuse publisher content except where permitted by law or the rights holder.",
      "External links may open third-party sites governed by their own terms, privacy policies, cookies, and advertising practices."
    ],
    categories: ["feature", "privacy-policies"]
  },
  {
    title: "Article Views Display",
    icon: Radio,
    paragraphs: [
      "NextNews may show a live-style Views count on article cards and article detail pages. In the current product version, this display is generated client-side from article metadata and animated for user experience.",
      "The Views display is not a certified analytics metric, not a publisher-reported count, and not a guarantee of actual readers currently viewing the article."
    ],
    bullets: [
      "The count may increase in visible decimal steps such as 15.6K, 15.7K, and 15.8K.",
      "The blink animation is presentation-only and indicates that the displayed value changed.",
      "NextNews may later replace this display with server-side aggregated view analytics."
    ],
    categories: ["feature", "privacy-policies"]
  },
  {
    title: "Video Integration Guidelines",
    icon: Radio,
    paragraphs: [
      "Short-form Shorts and live-news discoverability features depend on third-party video networks (such as Dailymotion and YouTube). All videos, stream feeds, thumbnails, and channel metrics belong to their respective publishers.",
      "NextNews surfaces these embeds strictly for discovery. You are prohibited from downloading, recording, clipping, or redistributing third-party stream content without express permission from the rights holder."
    ],
    categories: ["feature"]
  },
  {
    title: "Subscription Tiers & Plans",
    icon: CreditCard,
    paragraphs: [
      "We offer Free, Pro, and Pro+ access. Plan tiers govern API credits, AI summaries, personalized dashboard features, discovery features, and other entitlement checks shown in the product.",
      "By activating a free plan or subscribing to a paid tier, you agree to the billing cycles, costs, renewal dates, credit rules, usage limits, and provider terms disclosed during the checkout or plan activation flow."
    ],
    bullets: [
      "Free access may include a limited credit window and cooldown behavior.",
      "Pro and Pro+ paid access can be monthly or yearly depending on the plan selected.",
      "Plan status may be stored in Supabase and cached in browser storage to keep the app responsive."
    ],
    categories: ["billing", "events-plan"]
  },
  {
    title: "Dodo Payments Integration",
    icon: CreditCard,
    paragraphs: [
      "All subscription checkouts, invoice routing, plan renewals, and transactions are processed securely through our payment provider, Dodo Payments.",
      "NextNews does not store or process raw debit/credit card numbers directly. We only receive webhook indicators and transaction references to manage plan accesses."
    ],
    categories: ["billing"]
  },
  {
    title: "Free Tier Credit Restraints",
    icon: CreditCard,
    paragraphs: [
      "The Free tier may include a set quota of 600 API call credits for a 16-day period to access eligible features. Separate AI usage logic may also apply stepped free limits, weighted usage, and cooldown windows before additional free usage becomes available.",
      "During cooldowns or exhausted-limit states, you may be restricted from AI summaries, personalization suggestions, region suggestions, or other credit-gated endpoints unless you wait for eligibility to reset or upgrade to a paid subscription."
    ],
    bullets: [
      "Free usage limits may consider article opens, AI usage, personalization actions, and other weighted engagement events.",
      "Free limits and cooldown timing may change as the product scales or provider costs change.",
      "Free credits have no cash value and are not redeemable, transferable, or refundable."
    ],
    categories: ["billing", "events-plan"]
  },
  {
    title: "Pro and Pro+ Credit Allocations",
    icon: CreditCard,
    paragraphs: [
      "Paid plans are allocated higher service allowances: Pro plans receive 8,000 monthly credits (or 200,000 yearly) and Pro+ plans receive 45,000 monthly credits (or unlimited yearly).",
      "These credits represent non-cash usage entitlements. They reset at the start of each renewal billing period and do not roll over."
    ],
    categories: ["billing", "events-plan"]
  },
  {
    title: "Cancellation and Upgrades",
    icon: CreditCard,
    paragraphs: [
      "You can cancel or modify your plan where product controls and provider support allow it. Cancellation state is stored for entitlement purposes and may also be synchronized from Dodo Payments webhooks.",
      "Current in-app cancellation may mark the subscription as canceled and update access immediately in the NextNews database. Provider-side billing cancellation, renewal behavior, refunds, and invoice handling may still be subject to Dodo Payments controls and support processes."
    ],
    bullets: [
      "If there is a mismatch between app status and provider billing status, contact support promptly.",
      "Downgrades, cancellations, expired plans, failed payments, or on-hold subscriptions may restrict premium access.",
      "NextNews grants subscription access only after receiving valid provider confirmation such as a subscription.active webhook."
    ],
    categories: ["billing"]
  },
  {
    title: "Refund Policy",
    icon: CreditCard,
    paragraphs: [
      "Subscription purchases are generally non-refundable unless specified otherwise by local consumer protection regulations. We evaluate refund requests on a case-by-case basis through support.",
      "Refund requests are subject to audit checks on API credits consumed to prevent policy exploitation."
    ],
    categories: ["billing"]
  },
  {
    title: "Service Level Disclaimers",
    icon: ShieldCheck,
    paragraphs: [
      "NextNews is provided on an 'as is' and 'as available' basis. We do not guarantee that the application, live feeds, or AI summaries will be completely error-free, uninterrupted, or available at all times.",
      "We reserve the right to modify, pause, or sunset specific features or news categories to resolve technical errors or comply with provider demands."
    ],
    categories: ["privacy-policies"]
  },
  {
    title: "Personalization, Notes, and Activity Features",
    icon: UserRound,
    paragraphs: [
      "Authenticated users may save notes, favorite sources, favorite topics, favorite regions, activity progress, weekly goals, reading streaks, and other product preferences. These features are provided for personal use and account convenience.",
      "You are responsible for the content you enter into notes, support forms, settings, and profile fields. Do not store passwords, payment card numbers, government IDs, or sensitive third-party personal data inside note or support fields."
    ],
    bullets: [
      "Notes are private to the authenticated account by default.",
      "Activity metrics are product progress indicators and may be used for limits, dashboard statistics, and engagement features.",
      "Personalization preferences influence what stories and discovery suggestions the app prioritizes."
    ],
    categories: ["feature", "account"]
  },
  {
    title: "Support and Complaint Submissions",
    icon: HeadphonesIcon,
    paragraphs: [
      "When you contact support or submit a complaint, you agree to provide accurate information and authorize NextNews to use the submitted details to investigate, respond, prevent abuse, and improve the service.",
      "Support submissions may be rate-limited, validated, screened for spam, and stored in operational tools such as Google Sheets."
    ],
    bullets: [
      "Submitting false, abusive, automated, or malicious support requests may result in blocking or account action.",
      "Support responses are not guaranteed within a specific time unless a separate written service commitment applies.",
      "Billing, privacy, deletion, and account questions can be sent to nextnews.co.in@gmail.com."
    ],
    categories: ["account", "privacy-policies"]
  },
  {
    title: "Limitation of Liability Cap",
    icon: AlertTriangle,
    paragraphs: [
      "To the maximum extent permitted by law, NextNews and its operators will not be liable for incidental, indirect, consequential, or exemplary damages, including data loss, profits loss, or service interruptions.",
      "Our total liability for any claim under these terms is capped at the total amount paid by you to NextNews in the prior twelve (12) months, or INR 0 if no fees were paid."
    ],
    categories: ["privacy-policies", "events-plan"]
  },
  {
    title: "Termination & Suspension",
    icon: AlertTriangle,
    paragraphs: [
      "We reserve the right to restrict, suspend, or permanently terminate account accesses where we determine that a user has violated these Terms & Conditions, engaged in fraud, or posed security threats.",
      "Suspended users can submit appeals through the support route. Immediate suspension without notice may occur in cases involving legal requirements or direct system threats."
    ],
    categories: ["privacy-policies", "events-plan"]
  },
  {
    title: "Intellectual Property Rights",
    icon: FileText,
    paragraphs: [
      "All original source code, graphic designs, custom UI components, templates, and branding elements remain the exclusive intellectual property of NextNews.",
      "Aggregated news articles, thumbnails, and third-party stream content remain the intellectual property of their original publishers or licensors."
    ],
    categories: ["privacy-policies"]
  },
  {
    title: "Governing Law",
    icon: ShieldCheck,
    paragraphs: [
      "These Terms & Conditions are governed by and construed in accordance with the laws of India.",
      "Any legal actions or disputes arising from these Terms will be subject to the exclusive jurisdiction of the competent courts of Bangalore, Karnataka, India."
    ],
    categories: ["privacy-policies", "events-plan"],
  },
];

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <>{text}</>;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(escapedQuery, "gi");
  const parts: { text: string; matches: boolean; start: number }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        matches: false,
        start: lastIndex,
      });
    }

    parts.push({
      text: match[0],
      matches: true,
      start: match.index,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      matches: false,
      start: lastIndex,
    });
  }

  return (
    <>
      {parts.map((part) => {
        return part.matches ? (
          <mark
            key={`match-${part.start}`}
            className="bg-[#bae6fd] text-[#0369a1] dark:bg-[#0284c7]/40 dark:text-[#e0f2fe] rounded-[2px] px-0.5"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`text-${part.start}`}>{part.text}</span>
        );
      })}
    </>
  );
}

export default function TermsAndConditionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredSections = termsSections.filter((section) => {
    // 1. Filter by category if selected
    if (selectedCategory) {
      if (!section.categories.includes(selectedCategory)) {
        return false;
      }
    }

    // 2. Filter by search query if typed
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesTitle = section.title.toLowerCase().includes(query);
      const matchesParagraphs = section.paragraphs.some((p) =>
        p.toLowerCase().includes(query)
      );
      const matchesBullets = section.bullets?.some((b) =>
        b.toLowerCase().includes(query)
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
        <section className="overflow-hidden rounded-[20px] border border-[#e2e8f0] bg-[#ffffff] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:border-[#1e293b] dark:bg-[#0f172a]/90 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50/50 px-2.5 py-1 text-xs font-medium tracking-wide text-sky-700 dark:border-sky-950 dark:bg-sky-950/30 dark:text-sky-300">
                <LockKeyhole className="h-3.5 w-3.5" />
                TERMS &amp; CONDITIONS
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight leading-tight text-[#0f172a] dark:text-[#f8fafc] sm:text-4xl lg:text-4xl">
                Terms Governing the Use of NextNews
              </h1>

              <p className="mt-2 text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                Last updated: June, 2026
              </p>

              <p className="mt-5 max-w-4xl text-sm leading-7 text-[#475569] dark:text-[#cbd5e1] sm:text-base">
                These Terms &amp; Conditions set out the rules that apply to account
                creation, use of authenticated features, AI tools, plans, support
                interactions, and billing or API-credit systems across the
                NextNews platform.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-[#64748b] dark:text-[#cbd5e1]">
                <span className="flex items-center gap-1.5">
                  <HeadphonesIcon className="h-3.5 w-3.5" />
                  Grievance &amp; support: nextnews.co.in@gmail.com
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
                <span>
                  Official Terms of Service for SaaS features.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar section */}
        <section className="flex flex-col items-center py-4">
          <h2
            style={{ fontFamily: "cursive" }}
            className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#ffffff] sm:text-3xl text-center"
          >
            Hi, how can we help?
          </h2>

          <div className="relative mt-6 w-full max-w-2xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search className="h-[18px] w-[18px] text-slate-400 dark:text-slate-500" strokeWidth={1.8} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for articles..."
              className="block w-full rounded-[14px] border border-slate-200/80 bg-white/90 py-2.5 pl-10 pr-10 text-sm text-[#0f172a] shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300/80 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-[#f8fafc] dark:placeholder:text-slate-500 dark:hover:border-slate-600/80 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
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
                  transition={{ duration: 0.38, delay: Math.min(index * 0.03, 0.3) }}
                  className="group rounded-[28px] border border-[#e2e8f0]/85 bg-[#ffffff]/92 p-6 shadow-sm hover:border-[#bae6fd] dark:border-[#334155]/85 dark:bg-[#1e293b]/92 dark:hover:border-[#0284c7]/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 sm:p-8"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 group-hover:bg-sky-105 group-hover:text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 dark:group-hover:bg-sky-900/40 dark:group-hover:text-sky-300 transition-colors duration-300">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-semibold tracking-tight text-[#0f172a] dark:text-[#f8fafc] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-300">
                        <HighlightText text={section.title} query={searchQuery} />
                      </h2>

                      <div className="mt-4 space-y-4">
                        {section.paragraphs.map((paragraph, pIdx) => (
                          <p
                            key={pIdx}
                            className="text-sm leading-7 text-[#475569] dark:text-[#cbd5e1] sm:text-[15px]"
                          >
                            <HighlightText text={paragraph} query={searchQuery} />
                          </p>
                        ))}
                      </div>

                      {section.bullets?.length ? (
                        <div className="mt-5 grid gap-3">
                          {section.bullets.map((bullet, bIdx) => (
                            <div
                              key={bIdx}
                              className="flex items-start gap-3 rounded-2xl border border-[#f1f5f9] bg-[#f8fafc]/50 dark:border-[#334155]/50 dark:bg-[#0f172a]/30 px-4 py-3"
                            >
                              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 dark:bg-sky-400" />
                              <p className="text-sm leading-6 text-[#334155] dark:text-[#cbd5e1]">
                                <HighlightText text={bullet} query={searchQuery} />
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
                No clauses match your query &ldquo;<span className="italic">{searchQuery}</span>&rdquo;. Try searching for something else or clearing the filters.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory(null);
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
