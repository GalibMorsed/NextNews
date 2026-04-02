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

export function getExploreRegion(regionId: string | null | undefined) {
  return EXPLORE_REGIONS.find((region) => region.id === regionId) ?? EXPLORE_REGIONS[0];
}

