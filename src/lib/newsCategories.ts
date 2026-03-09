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
