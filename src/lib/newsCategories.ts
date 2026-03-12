interface CustomCategoryConfig {
  query: string;
  searchIn?: string;
}

export const CUSTOM_CATEGORY_SEARCH_CONFIG: Record<string, CustomCategoryConfig> = {
  politics: {
    query:
      "(politics OR government OR election OR parliament OR policy) AND NOT (tourism OR travel OR weather OR climate OR crime)",
    searchIn: "title,description",
  },
  tourism: {
    query:
      "(tourism OR travel OR destination OR hotel OR airline) AND NOT (politics OR election OR crime OR weather OR climate)",
    searchIn: "title,description",
  },
  crime: {
    query:
      "(crime OR police OR arrest OR court OR homicide OR fraud) AND NOT (tourism OR travel OR weather OR climate OR politics)",
    searchIn: "title,description",
  },
  environment: {
    query:
      "(environment OR climate OR pollution OR biodiversity OR sustainability OR renewable energy)",
    searchIn: "title,description",
  },
  education: {
    query:
      "(education OR school OR university OR college OR student OR curriculum OR exam)",
    searchIn: "title,description",
  },
  travel: {
    query:
      "(travel OR destination OR tourism OR airline OR visa OR hotel)",
    searchIn: "title,description",
  },
  food: {
    query:
      "(food OR cuisine OR restaurant OR recipe OR nutrition OR chef)",
    searchIn: "title,description",
  },
  fashion: {
    query:
      "(fashion OR style OR runway OR designer OR clothing OR apparel)",
    searchIn: "title,description",
  },
  finance: {
    query:
      "(finance OR market OR stock OR investing OR economy OR banking)",
    searchIn: "title,description",
  },
  automotive: {
    query:
      "(automotive OR car OR vehicle OR EV OR electric vehicle OR auto industry)",
    searchIn: "title,description",
  },
  music: {
    query:
      "(music OR album OR singer OR band OR concert OR streaming)",
    searchIn: "title,description",
  },
  movies: {
    query:
      "(movie OR film OR cinema OR box office OR actor OR director)",
    searchIn: "title,description",
  },
  books: {
    query:
      "(book OR novel OR author OR publishing OR literature OR bestseller)",
    searchIn: "title,description",
  },
  art: {
    query:
      "(art OR artist OR exhibition OR gallery OR painting OR sculpture)",
    searchIn: "title,description",
  },
  culture: {
    query:
      "(culture OR heritage OR festival OR tradition OR society OR cultural event)",
    searchIn: "title,description",
  },
  gaming: {
    query:
      "(gaming OR video game OR esports OR console OR game studio OR game release)",
    searchIn: "title,description",
  },
  "spirituality-religion": {
    query:
      "(spirituality OR religion OR faith OR meditation OR temple OR church OR mosque)",
    searchIn: "title,description",
  },
  "mental-health": {
    query:
      "(mental health OR anxiety OR depression OR therapy OR wellbeing OR mindfulness)",
    searchIn: "title,description",
  },
  "artificial-intelligence": {
    query:
      "(artificial intelligence OR AI OR machine learning OR generative AI OR LLM)",
    searchIn: "title,description",
  },
  cybersecurity: {
    query:
      "(cybersecurity OR cyber attack OR ransomware OR data breach OR phishing OR zero-day)",
    searchIn: "title,description",
  },
  "space-astronomy": {
    query:
      "(space OR astronomy OR NASA OR satellite OR telescope OR asteroid OR Mars)",
    searchIn: "title,description",
  },
  "stock-market": {
    query:
      "(stock market OR stocks OR equities OR share market OR market index OR Wall Street)",
    searchIn: "title,description",
  },
  "trade-economy": {
    query:
      "(trade OR economy OR GDP OR inflation OR import export OR economic policy)",
    searchIn: "title,description",
  },
  "real-estate": {
    query:
      "(real estate OR housing market OR property OR mortgage OR home prices OR commercial real estate)",
    searchIn: "title,description",
  },
  "defense-military": {
    query:
      "(defense OR military OR armed forces OR navy OR air force OR missile OR war strategy)",
    searchIn: "title,description",
  },
  "agriculture-farming": {
    query:
      "(agriculture OR farming OR farm policy OR crops OR irrigation OR agritech OR livestock)",
    searchIn: "title,description",
  },
};

export function getCategorySearchConfig(
  category: string,
): CustomCategoryConfig | null {
  return CUSTOM_CATEGORY_SEARCH_CONFIG[category] ?? null;
}

export function getCategoryDisplayName(category: string): string {
  return category
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
