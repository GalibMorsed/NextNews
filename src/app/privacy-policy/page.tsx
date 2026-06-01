"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  Bot,
  CreditCard,
  Database,
  Eye,
  FileText,
  HeadphonesIcon,
  LockKeyhole,
  NotebookPen,
  Radio,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Search,
  X,
  Key,
  Users,
  Lightbulb,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type PolicySection = {
  title: string;
  icon: typeof ShieldCheck;
  paragraphs: string[];
  bullets?: string[];
  categories: string[];
};

const policySections: PolicySection[] = [
  {
    title: "Acceptance of Terms and Policies",
    icon: LockKeyhole,
    paragraphs: [
      "By creating a NextNews account, completing the signup process, accessing authenticated features, purchasing or activating any plan, or continuing to use the application after being presented with applicable policies, the user acknowledges that they have read, understood, and agreed to be bound by the Terms and Conditions, this Privacy Policy, and any other applicable platform rules, plan conditions, or operational policies published by NextNews.",
      "If a user does not agree with the governing terms, conditions, privacy practices, or usage rules of the platform, that user should not create an account, should not activate a plan, and should discontinue use of authenticated or paid features of the application.",
    ],
    bullets: [
      "Acceptance applies to account creation, authenticated use, plan activation, premium feature access, and continued use after policy updates.",
      "For stronger production readiness, this Privacy Policy should be read together with our dedicated Terms and Conditions page.",
    ],
    categories: ["privacy-policies", "events-plan"],
  },
  {
    title: "Scope of This Policy",
    icon: ShieldCheck,
    paragraphs: [
      "This Privacy Policy explains how NextNews collects, stores, uses, protects, and manages information when a person visits the app, creates an account, reads articles, uses personalization, generates AI features, saves notes, adjusts settings, interacts with support, or activates plan-related features.",
      "This page is intended to be production-facing. It covers active production features, including domain launch, payment integration, subscription plans, and API credit-based access for news and AI usage.",
    ],
    bullets: [
      "This policy applies to public browsing, authenticated use, personalization, saved notes, AI tools, settings, support, and paid plan services.",
      "Features described on this page are operational as part of the NextNews production environment.",
    ],
    categories: ["privacy-policies", "events-plan"],
  },
  {
    title: "Information We Collect",
    icon: Database,
    paragraphs: [
      "NextNews collects account details, session tokens, personalization preferences, article activity, saved notes, appearance settings, support details, and plan-related billing information to operate the application and improve the reading experience.",
      "Data may be stored in Supabase database tables, processed through integrated service providers, or cached locally inside the user's browser to preserve session state, product preferences, and performance.",
    ],
    bullets: [
      "Account data includes your email address, profile name, authentication identifiers, and user settings.",
      "Personalization data captures selected sources, topics, regions, feed preferences, and accepted suggestions.",
      "Reader activity can include article-open counts, AI summary usage, personalization usage, category visit duration, weekly goal state, and reading streak progress.",
      "Support submissions may include name, email, issue type, optional contact number, submission timestamp, and anti-spam metadata.",
    ],
    categories: ["account", "privacy-policies"],
  },
  {
    title: "Profile Metadata",
    icon: UserRound,
    paragraphs: [
      "When setting up or updating your account details, NextNews collects profile details such as display name, gender, age, language preferences, notification settings, and privacy permissions.",
      "This metadata allows us to customize the layout, display content in preferred languages, and send notification updates relevant to your account tier.",
    ],
    bullets: [
      "Display profile information is stored on secure databases using Supabase.",
      "Users can edit, update, or empty profile fields at any time in their Account Settings.",
    ],
    categories: ["account"],
  },
  {
    title: "Settings and Preferences",
    icon: Settings2,
    paragraphs: [
      "The application permits users to store client-side preferences to control layout appearance and accessibility. This includes selecting theme modes (dark, light, system theme), color accents, custom fonts, reduced motion animations, and high contrast options.",
      "These preferences are stored functional-only inside browser LocalStorage to provide immediate interface continuity.",
    ],
    bullets: [
      "Theme options, typography size, and color presets are saved locally.",
      "Accessibility settings automatically adjust motion animations based on device flags.",
    ],
    categories: ["account", "privacy-policies"],
  },
  {
    title: "Account Security & Session Tokens",
    icon: LockKeyhole,
    paragraphs: [
      "We secure user sessions by utilizing JSON Web Tokens (JWT) generated by our identity provider, Supabase. NextNews stores these credentials securely to maintain your login status and protect against unauthorized access.",
      "Session tokens are transmitted over TLS and validated server-side on every request to premium or personalized features.",
    ],
    bullets: [
      "Tokens are automatically refreshed to minimize interception risks.",
      "Session invalidation immediately logs out all clients to secure compromised accounts.",
    ],
    categories: ["account", "login-signup"],
  },
  {
    title: "Data Sharing Controls",
    icon: Settings2,
    paragraphs: [
      "NextNews provides explicit toggles within your Account Settings to control how your profile information is visible or indexed.",
      "These controls govern whether your public profile is visible to other readers, whether your shared content can be indexed by search engines, and whether diagnostic data sharing is active.",
    ],
    bullets: [
      "Profile Visibility toggle allows you to set your account to private or public.",
      "Search Engine Indexing toggle requests search bots not to index your user page.",
      "Data Sharing toggle lets you opt out of optional telemetry reporting.",
    ],
    categories: ["account", "privacy-policies"],
  },
  {
    title: "User Choices and Rights",
    icon: UserRound,
    paragraphs: [
      "Users can access, edit, download, or delete their profile information directly from the user interface. We recognize user rights to restrict processing, request corrections, or cancel service accounts.",
      "If you reside in jurisdictions with specialized privacy frameworks (such as India's DPDP Act 2023), you may submit formal inquiries or exercise statutory rights through our support email.",
    ],
    bullets: [
      "Immediate access to personalization history and profile parameters.",
      "Right to request complete correction or updating of outdated records.",
      "Support contact point: nextnews.co.in@gmail.com.",
    ],
    categories: ["account", "privacy-policies"],
  },
  {
    title: "Permanent Account Deletion",
    icon: UserRound,
    paragraphs: [
      "If you no longer wish to use NextNews, you can request permanent deletion of your account. This action can be triggered inside account settings and requires an authenticated session plus explicit DELETE confirmation.",
      "The current deletion workflow removes the Supabase authentication user, saved notes, and stored Terms acceptance records tied to the account. Some related operational, subscription, support, activity, or provider records may require separate handling where retention is needed for security, billing, legal, or support reasons.",
    ],
    bullets: [
      "Deletion requests are rate-limited to reduce abuse and accidental repeated submissions.",
      "Local browser settings, cached plan labels, and appearance preferences may also need to be cleared from the device by logging out, clearing browser storage, or using product controls where available.",
      "Certain billing, webhook, support, or audit records may be retained separately for tax, fraud-prevention, dispute, security, or compliance purposes.",
    ],
    categories: ["account", "login-signup"],
  },
  {
    title: "Information Sharing with Partners",
    icon: LockKeyhole,
    paragraphs: [
      "NextNews does not rent, sell, or trade user data. We share specific details with trusted service partners solely to facilitate application features like authentication, payment routing, and AI responses.",
      "All partners are bound by confidentiality clauses and are prohibited from using your data for advertisement or marketing.",
    ],
    bullets: [
      "Supabase handles secure database functions and user authentication.",
      "Dodo Payments manages credit card processing and billing ledger entries.",
      "OpenRouter processes anonymous content prompts to generate summaries.",
      "Google Sheets may store support or complaint submissions submitted through the support route.",
      "Currents API, Dailymotion, YouTube, and original publishers provide external news, image, video, or stream content.",
    ],
    categories: ["privacy-policies", "account"],
  },
  {
    title: "Supabase Authentication Flows",
    icon: Key,
    paragraphs: [
      "NextNews utilizes Supabase Auth to manage signups, logins, and identity verification. You can choose to sign up using your email and password, or authenticate using authorized OAuth credentials such as Google Sign-in.",
      "Supabase verifies credentials, manages password resets, and issues signed tokens to confirm your identity.",
    ],
    bullets: [
      "Supports email-based password authentication with encryption.",
      "Integrates third-party Google authentication for instant login.",
      "Enforces rate-limits on login attempts to block brute-force attacks.",
    ],
    categories: ["login-signup", "account"],
  },
  {
    title: "Auth Session Cookies",
    icon: Key,
    paragraphs: [
      "When you successfully authenticate, NextNews and Supabase issue functional cookies to keep you signed in as you browse. These cookies store cryptographically signed session tokens.",
      "We also read standard OAuth authentication tokens if you log in via Google. These cookies are essential for security and are not used to track you across unrelated third-party websites.",
    ],
    bullets: [
      "First-party authentication cookies keep your session active across tabs.",
      "Third-party sign-in cookies are set and managed directly by Google Auth APIs.",
      "Session cookies expire automatically or are cleared upon explicit logout.",
    ],
    categories: ["login-signup", "privacy-policies"],
  },
  {
    title: "Session Expiration and Re-authentication",
    icon: Key,
    paragraphs: [
      "To prevent hijacking, session tokens are configured with short lifespans and must be refreshed. If a token cannot be refreshed or becomes invalid, NextNews clears all in-memory state.",
      "If the security token expires, the application automatically redirects the user to the login screen to re-authenticate.",
    ],
    bullets: [
      "Automatic token refresh occurs in the background during active use.",
      "Invalid or altered session tokens trigger immediate token revocation.",
      "Redirects prevent unauthorized access to notes or personalization.",
    ],
    categories: ["login-signup"],
  },
  {
    title: "Monetization and Subscriptions",
    icon: CreditCard,
    paragraphs: [
      "NextNews operates on a freemium model offering Free, Pro, and Pro+ access. We record and use selected plan status, billing cycle, provider identifiers, product identifiers, current period dates, credit limits, and entitlement metadata to gate premium features, AI usage, and advanced discovery features.",
      "Subscription tiers determine API credit allowances and feature access. The active codebase defines Free access as a limited 16-day credit window, Pro monthly and yearly credit pools, Pro+ monthly credits, and Pro+ yearly unlimited API credit access.",
    ],
    bullets: [
      "Free tier: 600 API call credits for 16 days where available, followed by plan-specific access controls and cooldown logic.",
      "Pro tier: 8,000 monthly credits or 200,000 yearly credits.",
      "Pro+ tier: 45,000 monthly credits or unlimited yearly API credits.",
      "Plan labels and expiry dates may also be cached locally to keep the UI responsive.",
    ],
    categories: ["billing", "events-plan"],
  },
  {
    title: "Payment Processing and Invoices",
    icon: CreditCard,
    paragraphs: [
      "All payment processing, plan checkouts, subscription upgrades, renewals, and invoice history are securely handled by Dodo Payments, our merchant of record.",
      "NextNews does not receive or store your raw credit card numbers or billing CVV. We receive transaction status, plan identifiers, and partial card descriptors.",
    ],
    bullets: [
      "Transactions are encrypted using TLS and compliant with PCI-DSS guidelines.",
      "Invoices and subscription status codes are synced to our servers via secure webhooks.",
      "Partial card details (e.g. brand, last 4 digits) are saved for account references.",
    ],
    categories: ["billing"],
  },
  {
    title: "API Service Credits",
    icon: CreditCard,
    paragraphs: [
      "Plan credits are used to control access to product actions such as news API requests, AI summaries, personalization suggestions, region suggestions, article opens, and other weighted usage events. These credits are digital service entitlements only.",
      "Credit calculations may use weighted usage. For example, AI summaries and article opens can count differently from personalization or region suggestions depending on the feature being used.",
    ],
    bullets: [
      "API credits have zero cash value and are non-transferable.",
      "Credit logs track historical consumption metrics to prevent abuse.",
      "Unused credits do not roll over to the next billing cycle.",
      "Free users may be subject to stepped limits and cooldown windows before additional free usage becomes available.",
    ],
    categories: ["billing", "events-plan"],
  },
  {
    title: "Overage and Overage Prevention",
    icon: CreditCard,
    paragraphs: [
      "To protect users from unexpected billing charges, NextNews blocks further premium calls once credit balances reach zero. We do not automatically charge overage fees.",
      "When limits are reached, the app restricts access to summaries or search queries and suggests upgrading your plan.",
    ],
    bullets: [
      "Hard caps block additional request processing to control costs.",
      "Entitlement errors are displayed in the UI with a link to checkout options.",
    ],
    categories: ["billing"],
  },
  {
    title: "Refunds, Renewals, and Cancellations",
    icon: CreditCard,
    paragraphs: [
      "Subscriptions are set to renew automatically unless cancelled. You can cancel your plan at any time through your Billing Dashboard to stop future charges.",
      "Refund requests are evaluated in compliance with our Terms and Conditions and processed by Dodo Payments if approved.",
    ],
    bullets: [
      "Cancellations take effect at the end of the current billing cycle.",
      "Refund evaluations check usage metrics to prevent policy exploitation.",
      "Subscription cancellations downgrade accounts to the Free tier.",
    ],
    categories: ["billing"],
  },
  {
    title: "Feed Personalization and Topic Selection",
    icon: Sparkles,
    paragraphs: [
      "The feed personalization setup allows readers to select specific news categories and topics to customize their dashboard content.",
      "Your selected choices are saved in our database against your authenticated ID, letting us prioritize articles matching your interest profile.",
    ],
    bullets: [
      "Customizing topics shapes the dynamic news dashboard feed.",
      "Personalized lists can be modified or cleared under Feed Settings.",
      "Topic selection includes political, business, science, and AI categories.",
    ],
    categories: ["feature", "account"],
  },
  {
    title: "AI-Assisted Topic Suggestions",
    icon: Sparkles,
    paragraphs: [
      "NextNews employs server-side algorithms to evaluate live headline signals and cross-reference them with your selected interests to recommend new topics.",
      "Accepting suggested topics adds them to your active personalization profile. The recommendation process does not share your private data with third parties.",
    ],
    bullets: [
      "Suggestions leverage anonymous top headline statistics.",
      "Algorithms identify trending tags related to your category views.",
      "Topic expansion suggestions can be accepted or dismissed.",
    ],
    categories: ["feature"],
  },
  {
    title: "Article Interaction and Bookmark Notes",
    icon: NotebookPen,
    paragraphs: [
      "NextNews enables authenticated readers to write personal notes and bookmarks tied directly to articles. These notes may contain custom text, article reference URLs, slugs, titles, and creation timestamps.",
      "These bookmarks are saved in our databases and are private to the account owner.",
    ],
    bullets: [
      "Bookmarks link custom notes with article metadata.",
      "Notes are editable, deletable, and private by default.",
      "Account deletion cleans up all stored note rows.",
    ],
    categories: ["feature"],
  },
  {
    title: "Reader Activity Analytics",
    icon: NotebookPen,
    paragraphs: [
      "The application logs account-linked activity metadata, including article-open events, AI summary usage, personalization suggestions, region suggestions, category visits, duration estimates, weekly goal progress, notes-linked progress, and reading streaks to power the My Activity dashboard.",
      "Activity data is stored in Supabase when the user is authenticated. It helps show reading milestones, weekly progress, AI usage, and engagement totals, and it also supports free-plan usage limits and cooldown behavior.",
    ],
    bullets: [
      "Analytics dashboards aggregate read counts and summarization frequencies.",
      "Recent activity history is capped to limit stored event volume.",
      "Activity rows may include account email, account ID, timestamps, source names, categories, article metadata, and engagement scores.",
      "Clearing browser storage may remove local UI caches but does not necessarily delete activity already saved in Supabase.",
    ],
    categories: ["feature"],
  },
  {
    title: "Article Views Counter",
    icon: Eye,
    paragraphs: [
      "Article cards and article detail pages may display a live-looking Views count next to the date and reading metadata. In the current implementation, this count is generated in the browser from the article URL, title, and published date, then incremented visually for product presentation.",
      "This Views display is not currently fetched from a server-side analytics table and should not be interpreted as a verified, publisher-reported, or platform-wide real-time audience measurement.",
    ],
    bullets: [
      "The counter is deterministic for each article so a story starts from a stable-looking baseline.",
      "The visible number can animate in decimal steps such as 15.6K, 15.7K, and 15.8K.",
      "The animation respects reduced-motion preferences and blinks only when the displayed value changes.",
      "Future releases may replace the simulated display with authenticated, aggregated server-side view analytics.",
    ],
    categories: ["feature", "privacy-policies"],
  },
  {
    title: "AI Summaries and Explanations",
    icon: Bot,
    paragraphs: [
      "We utilize large language models via OpenRouter to generate summaries, explain complex details, or translate articles. Requests send the article's text, title, and source to LLM APIs.",
      "No account profile details are sent to LLM providers. Generated text is for reference purposes only and does not constitute official advice.",
    ],
    bullets: [
      "Summaries synthesize text to highlight core points.",
      "AI responses are subject to rate limiting and API credits.",
      "AI outputs do not represent guaranteed facts or official NextNews opinions.",
    ],
    categories: ["feature"],
  },
  {
    title: "News Explore and Live Discovery",
    icon: Radio,
    paragraphs: [
      "NextNews relies on external news and media providers such as Currents API, original article publishers, YouTube, and Dailymotion to retrieve fresh articles, metadata, images, videos, and live stream search results.",
      "Searches, category choices, country selections, region parameters, article URLs, and normalized video queries may be sent to external provider endpoints to retrieve relevant headlines, article text, thumbnails, embeds, or live videos.",
    ],
    bullets: [
      "Live-stream videos and headlines belong to respective publishers.",
      "Users are responsible for copyright compliance when referencing articles.",
      "Article pages may fetch original publisher URLs server-side to extract readable title, image, source, publish time, and article text.",
      "Remote news images may be retrieved through an image proxy so the app can show publisher images with fallback handling.",
    ],
    categories: ["feature"],
  },
  {
    title: "Support, Complaints, and Contact Forms",
    icon: HeadphonesIcon,
    paragraphs: [
      "When you submit a support or complaint form, NextNews collects the details you provide so the support team can understand and respond to the issue. This can include name, email address, issue subject, optional contact number, submission timestamp, and technical anti-spam signals.",
      "Support submissions are validated, rate-limited, screened for automated bot behavior, and may be appended to a Google Sheets spreadsheet used for support operations.",
    ],
    bullets: [
      "A hidden website field and minimum form-fill timing are used to reduce spam submissions.",
      "IP address and user-agent-derived identifiers may be used for short-term support form rate limiting.",
      "Do not include passwords, payment card numbers, government IDs, or highly sensitive personal information in support messages.",
    ],
    categories: ["account", "privacy-policies"],
  },
  {
    title: "Video Shorts Integration",
    icon: Radio,
    paragraphs: [
      "We integrate short-form video discovery using Dailymotion video feeds. Shorts are filtered based on India-focused topics and news category queries.",
      "Video streaming and playback are handled via the Dailymotion iframe player, which is governed by Dailymotion's privacy and cookie policies.",
    ],
    bullets: [
      "Shorts play inside native iframe embeds without account registrations.",
      "No personal search queries are passed to Dailymotion's server database.",
      "Shorts availability depends on external publisher uploads.",
    ],
    categories: ["feature"],
  },
  {
    title: "International Data Transfers",
    icon: Database,
    paragraphs: [
      "NextNews uses third-party infrastructure and APIs that may process data on servers located outside India, including the United States. This means personal data associated with your account, sessions, AI requests, or news queries may be transferred across borders depending on the provider involved.",
      "By using the service, you acknowledge these cross-border transfers. We rely on provider security controls and applicable contractual safeguards to protect data in transit and at rest.",
    ],
    bullets: [
      "Supabase, OpenRouter, and NewsAPI are currently operated by providers with infrastructure based in or routed through the United States.",
      "Where cross-border processing applies, NextNews aims to align with applicable Indian data-protection requirements, including DPDP Act 2023 obligations as they evolve.",
    ],
    categories: ["privacy-policies"],
  },
  {
    title: "Storage, Retention, and Security",
    icon: ShieldCheck,
    paragraphs: [
      "NextNews uses a combination of browser storage, cookies, authenticated API routes, database access controls, and third-party platform security features to reduce unauthorized access and preserve app functionality. While no internet-based product can guarantee absolute security, reasonable efforts are made to protect account-linked information and user-generated content.",
      "Data retention may vary by feature. Some data remains until the user updates or deletes it, some remains while the account is active, some may be kept for limited operational or legal reasons, and some browser-stored state may persist until cleared by the user or replaced by newer values.",
    ],
    bullets: [
      "Notes and saved personalization may remain available until the user edits, clears, deletes them, or requests applicable deletion.",
      "Session-related data may remain in browser storage and cookies until logout, expiration, invalidation, or manual clearing.",
      "Activity analytics may remain in Supabase until overwritten, deleted, or handled through account or privacy request workflows.",
      "Support records may remain in operational support tools for as long as needed to investigate, resolve, audit, or defend against abuse.",
      "Server-side request protection may include rate limiting and token verification for sensitive AI and account operations.",
    ],
    categories: ["privacy-policies"],
  },
  {
    title: "Governing Law and Compliance",
    icon: ShieldCheck,
    paragraphs: [
      "This Privacy Policy is governed by the laws of India. NextNews aims to comply with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 (DPDP Act), along with any applicable rules or guidance issued under those laws.",
      "If local regulations require additional disclosures, controls, or user rights, this policy may be updated accordingly and reflected with a revised effective date.",
    ],
    bullets: [
      "Policy aligns with Indian digital personal data laws.",
      "Statutory complaints can be sent to nextnews.co.in@gmail.com.",
    ],
    categories: ["privacy-policies", "events-plan"],
  },
  {
    title: "Children, Production Growth, and Policy Changes",
    icon: Baby,
    paragraphs: [
      "NextNews is designed as a general news application and is not intended for children under 13 years of age. We do not knowingly collect personal data from children under 13.",
      "As the application has moved toward full production readiness, this policy reflects active systems, billing providers, API credit mechanics, legal disclosures, and region-specific compliance requirements.",
    ],
    bullets: [
      "If you believe a child under 13 has registered, contact support to clear their database record.",
      "Changes will be published with a revised effective date on this page.",
    ],
    categories: ["privacy-policies", "events-plan"],
  },
];

const categoriesList = [
  {
    id: "billing",
    title: "Billing",
    desc: "Subscription, credit, payment and other issues",
    icon: CreditCard,
  },
  {
    id: "account",
    title: "Account",
    desc: "Account email, password, settings and other issues",
    icon: UserRound,
  },
  {
    id: "login-signup",
    title: "Login/Sign-up",
    desc: "Verification code, login error and other issues",
    icon: Key,
  },
  {
    id: "events-plan",
    title: "Events & Plan",
    desc: "Events and Team plan related questions",
    icon: Users,
  },
  {
    id: "privacy-policies",
    title: "Privacy and policies",
    desc: "Terms of service, privacy policy and other issues",
    icon: FileText,
  },
  {
    id: "feature",
    title: "Feature",
    desc: "Feature issues, task errors and other issues",
    icon: Lightbulb,
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

export default function PrivacyPolicyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getArticlesCount = (categoryId: string) => {
    return policySections.filter((section) =>
      section.categories.includes(categoryId),
    ).length;
  };

  const filteredSections = policySections.filter((section) => {
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
        <section className="overflow-hidden rounded-[20px] border border-[#e2e8f0] bg-[#ffffff] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:border-[#1e293b] dark:bg-[#0f172a]/90 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50/50 px-2.5 py-1 text-xs font-medium tracking-wide text-sky-700 dark:border-sky-950 dark:bg-sky-950/30 dark:text-sky-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                PRIVACY POLICY
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight leading-tight text-[#0f172a] dark:text-[#f8fafc] sm:text-4xl lg:text-4xl">
                NextNews Privacy Policy Overview
              </h1>

              <p className="mt-2 text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                Last updated: June, 2026
              </p>

              <p className="mt-5 max-w-4xl text-sm leading-7 text-[#475569] dark:text-[#cbd5e1] sm:text-base">
                NextNews is a platform for reading and discovering news. It
                offers headline browsing, category navigation, live updates,
                personalization, AI assistance, notes, settings, support tools,
                and subscription features. This policy explains how these areas
                use your information and how NextNews protects privacy in its
                production environment.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-[#64748b] dark:text-[#cbd5e1]">
                <span className="flex items-center gap-1.5">
                  <HeadphonesIcon className="h-3.5 w-3.5" />
                  Privacy contact: nextnews.co.in@gmail.com
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">
                  |
                </span>
                <span>
                  Policy reference for active systems and monetization.
                </span>
              </div>

              <div className="mt-6 rounded-[14px] border border-amber-200/50 bg-amber-50/35 px-5 py-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-[#b45309] dark:text-amber-400">
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#b45309] dark:text-[#f59e0b]">
                    Important Notice
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#334155] dark:text-[#cbd5e1]">
                  Account registration and use of authenticated NextNews
                  services are subject to acceptance of the platform&apos;s
                  governing terms, conditions, privacy practices, plan rules,
                  and related operational policies.
                </p>
                <div className="mt-3 border-t border-amber-200/40 pt-3 dark:border-amber-800/20">
                  <Link
                    href="/terms-and-conditions"
                    className="group inline-flex items-center gap-2 text-xs font-bold text-[#b45309] hover:text-[#92400e] dark:text-amber-400 dark:hover:text-amber-305 transition-colors duration-200"
                  >
                    Read our Terms &amp; Conditions
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
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

        {/* Category Cards Section */}
        <section className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-3">
          {categoriesList.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedCategory === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setSelectedCategory(isSelected ? null : item.id)}
                className={`group flex flex-col items-center justify-between rounded-[20px] sm:rounded-[24px] border p-4 sm:p-6 text-center shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer ${
                  isSelected
                    ? "border-sky-500 bg-sky-50/20 text-sky-955 dark:border-sky-500/80 dark:bg-sky-950/20 dark:text-sky-100 shadow-sky-100/50 dark:shadow-none"
                    : "border-slate-200/80 bg-white/92 hover:border-sky-200 dark:border-slate-700/80 dark:bg-slate-900/88 dark:hover:border-sky-900/60"
                }`}
              >
                <div
                  className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl transition-colors duration-300 ${
                    isSelected
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-[#0f172a] dark:text-[#f8fafc] group-hover:text-sky-600 dark:group-hover:text-sky-400"
                  }`}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.5} />
                </div>

                <h3
                  className={`mt-3 sm:mt-4 text-sm sm:text-base md:text-lg font-semibold transition-colors duration-300 ${
                    isSelected
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-[#0f172a] dark:text-[#f8fafc] group-hover:text-sky-600 dark:group-hover:text-sky-400"
                  }`}
                >
                  {item.title}
                </h3>

                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-[240px] flex-grow">
                  {item.desc}
                </p>

                <span className="mt-3 sm:mt-4 text-[10px] sm:text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {getArticlesCount(item.id)} articles
                </span>
              </button>
            );
          })}
        </section>

        {/* Results Info Bar */}
        {(selectedCategory || searchQuery) && (
          <div className="flex flex-row items-center justify-between gap-4 rounded-[14px] border border-slate-200 bg-slate-50/60 p-3 sm:px-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#475569] dark:text-[#cbd5e1] font-sans">
              <Filter
                className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0"
                strokeWidth={2}
              />
              <span>
                Found{" "}
                <span className="font-bold text-[#0f172a] dark:text-[#f8fafc]">
                  {filteredSections.length}
                </span>{" "}
                {filteredSections.length === 1 ? "article" : "articles"}{" "}
                {selectedCategory && (
                  <>
                    under{" "}
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {
                        categoriesList.find((c) => c.id === selectedCategory)
                          ?.title
                      }
                    </span>
                  </>
                )}
                {searchQuery && (
                  <>
                    {" "}
                    matching &ldquo;
                    <span className="italic font-bold text-sky-600 dark:text-sky-400">
                      {searchQuery}
                    </span>
                    &rdquo;
                  </>
                )}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 transition-colors duration-200 cursor-pointer shrink-0"
            >
              Reset Filters
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Detailed policy clauses */}
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
                  className="group rounded-[28px] border border-[#e2e8f0]/85 bg-[#ffffff]/92 p-6 shadow-sm hover:border-[#bae6fd] dark:border-[#334155]/85 dark:bg-[#1e293b]/92 dark:hover:border-[#0284c7]/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 sm:p-8"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 group-hover:bg-sky-105 group-hover:text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 dark:group-hover:bg-sky-900/40 dark:group-hover:text-sky-300 transition-colors duration-300">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-semibold tracking-tight text-[#0f172a] dark:text-[#f8fafc] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-300">
                        <HighlightText
                          text={section.title}
                          query={searchQuery}
                        />
                      </h2>

                      <div className="mt-4 space-y-4">
                        {section.paragraphs.map((paragraph, pIdx) => (
                          <p
                            key={pIdx}
                            className="text-sm leading-7 text-[#475569] dark:text-[#cbd5e1] sm:text-[15px]"
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
                              className="flex items-start gap-3 rounded-2xl border border-[#f1f5f9] bg-[#f8fafc]/50 dark:border-[#334155]/50 dark:bg-[#0f172a]/30 px-4 py-3"
                            >
                              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 dark:bg-sky-400" />
                              <p className="text-sm leading-6 text-[#334155] dark:text-[#cbd5e1]">
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
                No policy articles found
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                No clauses match your query &ldquo;
                <span className="italic">{searchQuery}</span>&rdquo;. Try
                searching for something else or clearing the filters.
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
                Questions or Requests
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-3xl">
                Contact NextNews for policy, account, or production questions
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                If you need help understanding this policy, want clarification
                about account data, notes, personalization, AI features,
                subscriptions, or billing plans, use the app support route to
                contact the project owner or support team.
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
                    Get help with account, privacy, or billing queries
                  </p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-sky-300" />
              </Link>
              <p className="px-1 text-xs leading-5 text-slate-400">
                Our support team can assist with policy questions, account data
                requests, and subscription or billing inquiries.
              </p>
            </div>
          </div>
        </section>
      </div>
    </motion.main>
  );
}
