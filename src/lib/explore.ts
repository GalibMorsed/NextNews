import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  Building2,
  BookOpen,
  Briefcase,
  Cpu,
  Film,
  Globe2,
  HeartPulse,
  Landmark,
  Leaf,
  Newspaper,
  Radio,
  Tv,
} from "lucide-react";

export type ExploreRegionId =
  | "world"
  | "us"
  | "europe"
  | "asia"
  | "middle-east"
  | "africa"
  | "latin-america"
  | "india";

export type ExploreArticle = {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
};

export type ExploreTrendingTopic = {
  tag: string;
  reason: string;
};

export type ExploreCategorySuggestion = {
  slug: string;
  title: string;
  description: string;
};

export type ExploreSourceSuggestion = {
  name: string;
  regionHint: string;
  reason: string;
};

export type ExploreResponse = {
  region: ExploreRegionId;
  regionLabel: string;
  query: string;
  heroArticle: ExploreArticle | null;
  sideArticles: ExploreArticle[];
  moreStoryCategories: ExploreCategorySuggestion[];
  trendingTopics: ExploreTrendingTopic[];
  sourceSuggestions: ExploreSourceSuggestion[];
  regionBrief: string;
  heroSearchPrompt: string;
  updatedAt: string;
};

type ExploreRegionConfig = {
  id: ExploreRegionId;
  label: string;
  chipLabel: string;
  country?: string;
  topicQuery: string;
  searchContext: string;
};

export type ExploreCategoryIconStyle = {
  icon: LucideIcon;
  className: string;
  panelClassName: string;
  pillClassName: string;
};

export type ExploreSourceAccentStyle = {
  badge: string;
  panel: string;
  icon: LucideIcon;
};

export const EXPLORE_REGIONS: ExploreRegionConfig[] = [
  {
    id: "world",
    label: "World",
    chipLabel: "World",
    topicQuery:
      "(world OR global OR international OR diplomacy OR conflict OR economy OR climate OR summit)",
    searchContext: "global international news",
  },
  {
    id: "us",
    label: "United States",
    chipLabel: "US",
    country: "us",
    topicQuery:
      "(United States OR US OR America OR White House OR Congress OR Wall Street)",
    searchContext: "United States news",
  },
  {
    id: "europe",
    label: "Europe",
    chipLabel: "Europe",
    topicQuery:
      "(Europe OR European Union OR EU OR Brussels OR NATO OR Germany OR France OR Italy OR Spain)",
    searchContext: "Europe news",
  },
  {
    id: "asia",
    label: "Asia",
    chipLabel: "Asia",
    topicQuery:
      "(Asia OR ASEAN OR China OR Japan OR South Korea OR Southeast Asia OR Taiwan OR Singapore)",
    searchContext: "Asia news",
  },
  {
    id: "middle-east",
    label: "Middle East",
    chipLabel: "Middle East",
    topicQuery:
      "(Middle East OR Gulf OR Israel OR Palestine OR Iran OR Saudi Arabia OR UAE OR Qatar)",
    searchContext: "Middle East news",
  },
  {
    id: "africa",
    label: "Africa",
    chipLabel: "Africa",
    topicQuery:
      "(Africa OR African Union OR Nigeria OR Kenya OR South Africa OR Ethiopia OR Egypt)",
    searchContext: "Africa news",
  },
  {
    id: "latin-america",
    label: "Latin America",
    chipLabel: "Latin America",
    topicQuery:
      "(Latin America OR Brazil OR Mexico OR Argentina OR Colombia OR Chile OR Peru)",
    searchContext: "Latin America news",
  },
  {
    id: "india",
    label: "South Asia",
    chipLabel: "South Asia",
    topicQuery:
      "(South Asia OR India OR Pakistan OR Bangladesh OR Sri Lanka OR Nepal OR New Delhi)",
    searchContext: "South Asia news",
  },
] as const;

export const EXPLORE_CATEGORY_OPTIONS: ExploreCategorySuggestion[] = [
  {
    slug: "politics",
    title: "Politics",
    description: "Power shifts, elections, diplomacy, and policy moves.",
  },
  {
    slug: "business",
    title: "Business",
    description: "Corporate moves, trade signals, and executive decisions.",
  },
  {
    slug: "finance",
    title: "Finance",
    description: "Markets, inflation, oil, rates, and investor sentiment.",
  },
  {
    slug: "science",
    title: "Science",
    description: "Research breakthroughs, health signals, and discoveries.",
  },
  {
    slug: "health",
    title: "Health",
    description: "Public health updates, care guidance, and medical studies.",
  },
  {
    slug: "technology",
    title: "Technology",
    description: "AI, product launches, cyber signals, and platform shifts.",
  },
  {
    slug: "environment",
    title: "Environment",
    description: "Climate, energy, weather, and sustainability coverage.",
  },
  {
    slug: "defense-military",
    title: "Defense & Military",
    description: "Security moves, conflict updates, and strategic posture.",
  },
  {
    slug: "trade-economy",
    title: "Trade & Economy",
    description: "Regional growth, inflation, tariffs, and macro pressure.",
  },
  {
    slug: "travel",
    title: "Travel",
    description: "Mobility, tourism, visas, and movement across regions.",
  },
  {
    slug: "culture",
    title: "Culture",
    description: "Society, religion, identity, and cultural moments.",
  },
  {
    slug: "sports",
    title: "Sports",
    description: "Major tournaments, stars, and high-attention events.",
  },
] as const;

export const CATEGORY_ICON_STYLES: ExploreCategoryIconStyle[] = [
  {
    icon: Globe2,
    className:
      "bg-sky-100 text-sky-700 shadow-sky-100/70 dark:bg-sky-950/50 dark:text-sky-200",
    panelClassName:
      "bg-[#d9f0ee] dark:bg-sky-950/30",
    pillClassName:
      "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200",
  },
  {
    icon: Briefcase,
    className:
      "bg-amber-100 text-amber-700 shadow-amber-100/70 dark:bg-amber-950/50 dark:text-amber-200",
    panelClassName:
      "bg-[#f5e8c9] dark:bg-amber-950/30",
    pillClassName:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  },
  {
    icon: Cpu,
    className:
      "bg-violet-100 text-violet-700 shadow-violet-100/70 dark:bg-violet-950/50 dark:text-violet-200",
    panelClassName:
      "bg-[#e7e1fb] dark:bg-violet-950/30",
    pillClassName:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200",
  },
  {
    icon: HeartPulse,
    className:
      "bg-rose-100 text-rose-700 shadow-rose-100/70 dark:bg-rose-950/50 dark:text-rose-200",
    panelClassName:
      "bg-[#fde3ec] dark:bg-rose-950/30",
    pillClassName:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
  },
  {
    icon: Leaf,
    className:
      "bg-emerald-100 text-emerald-700 shadow-emerald-100/70 dark:bg-emerald-950/50 dark:text-emerald-200",
    panelClassName:
      "bg-[#dff5e8] dark:bg-emerald-950/30",
    pillClassName:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  {
    icon: Film,
    className:
      "bg-fuchsia-100 text-fuchsia-700 shadow-fuchsia-100/70 dark:bg-fuchsia-950/50 dark:text-fuchsia-200",
    panelClassName:
      "bg-[#f8dff1] dark:bg-fuchsia-950/30",
    pillClassName:
      "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-200",
  },
  {
    icon: Newspaper,
    className:
      "bg-indigo-100 text-indigo-700 shadow-indigo-100/70 dark:bg-indigo-950/50 dark:text-indigo-200",
    panelClassName:
      "bg-[#dfe8f9] dark:bg-indigo-950/30",
    pillClassName:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200",
  },
  {
    icon: BookOpen,
    className:
      "bg-orange-100 text-orange-700 shadow-orange-100/70 dark:bg-orange-950/50 dark:text-orange-200",
    panelClassName:
      "bg-[#fee7d6] dark:bg-orange-950/30",
    pillClassName:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200",
  },
  {
    icon: Landmark,
    className:
      "bg-teal-100 text-teal-700 shadow-teal-100/70 dark:bg-teal-950/50 dark:text-teal-200",
    panelClassName:
      "bg-[#d8f0ef] dark:bg-teal-950/30",
    pillClassName:
      "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-200",
  },
];

export const SOURCE_ACCENT_STYLES: ExploreSourceAccentStyle[] = [
  {
    badge:
      "bg-rose-100 text-rose-700 shadow-rose-100/70 dark:bg-rose-950/50 dark:text-rose-200",
    panel:
      "from-rose-50 via-white to-orange-50 dark:from-rose-950/25 dark:via-slate-900/70 dark:to-orange-950/20",
    icon: Newspaper,
  },
  {
    badge:
      "bg-sky-100 text-sky-700 shadow-sky-100/70 dark:bg-sky-950/50 dark:text-sky-200",
    panel:
      "from-sky-50 via-white to-cyan-50 dark:from-sky-950/25 dark:via-slate-900/70 dark:to-cyan-950/20",
    icon: Tv,
  },
  {
    badge:
      "bg-emerald-100 text-emerald-700 shadow-emerald-100/70 dark:bg-emerald-950/50 dark:text-emerald-200",
    panel:
      "from-emerald-50 via-white to-lime-50 dark:from-emerald-950/25 dark:via-slate-900/70 dark:to-lime-950/20",
    icon: Radio,
  },
  {
    badge:
      "bg-amber-100 text-amber-700 shadow-amber-100/70 dark:bg-amber-950/50 dark:text-amber-200",
    panel:
      "from-amber-50 via-white to-yellow-50 dark:from-amber-950/25 dark:via-slate-900/70 dark:to-yellow-950/20",
    icon: Building2,
  },
  {
    badge:
      "bg-violet-100 text-violet-700 shadow-violet-100/70 dark:bg-violet-950/50 dark:text-violet-200",
    panel:
      "from-violet-50 via-white to-indigo-50 dark:from-violet-950/25 dark:via-slate-900/70 dark:to-indigo-950/20",
    icon: BadgeDollarSign,
  },
];

export function getExploreRegion(regionId: string | null | undefined) {
  return EXPLORE_REGIONS.find((region) => region.id === regionId) ?? EXPLORE_REGIONS[0];
}

