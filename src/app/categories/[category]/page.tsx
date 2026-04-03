import CategoryContent from "./CategoryContent";
import { getExploreRegion } from "@/lib/explore";
import {
  getCategoryDisplayName,
  getCategorySearchConfig,
} from "@/lib/newsCategories";

interface Article {
  source?: { id?: string | null; name?: string };
  author?: string | null;
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
}

async function getCategoryNews(category: string, regionId?: string) {
  const baseUrl = process.env.NEWS_API_BASE_URL || "https://newsapi.org/v2";
  const apiKey = process.env.NEWS_API_KEY2 || process.env.NEWS_API_KEY;

  if (!apiKey) {
    return { articles: [] };
  }

  const customCategory = getCategorySearchConfig(category);
  const region = regionId ? getExploreRegion(regionId) : null;
  let endpoint = "";

  if (customCategory) {
    const baseQuery = customCategory.query;
    const scopedQuery =
      region && region.id !== "world"
        ? `(${baseQuery}) AND ${region.topicQuery}`
        : baseQuery;
    endpoint = `${baseUrl}/everything?q=${encodeURIComponent(scopedQuery)}&page=1&pageSize=20&sortBy=publishedAt&apiKey=${apiKey}${customCategory.searchIn ? `&searchIn=${encodeURIComponent(customCategory.searchIn)}` : ""}`;
  } else if (region) {
    if (region.country) {
      endpoint = `${baseUrl}/top-headlines?country=${encodeURIComponent(region.country)}&category=${encodeURIComponent(category)}&page=1&pageSize=20&apiKey=${apiKey}`;
    } else {
      const categoryQuery = getCategoryDisplayName(category);
      const scopedQuery =
        region.id !== "world"
          ? `(${categoryQuery}) AND ${region.topicQuery}`
          : categoryQuery;
      endpoint = `${baseUrl}/everything?q=${encodeURIComponent(scopedQuery)}&page=1&pageSize=20&sortBy=publishedAt&apiKey=${apiKey}`;
    }
  } else {
    endpoint = `${baseUrl}/top-headlines?country=us&category=${encodeURIComponent(category)}&page=1&pageSize=20&apiKey=${apiKey}`;
  }

  const res = await fetch(endpoint, { next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error(`Failed to fetch news for category: ${category}`);
  }

  return res.json();
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ region?: string }>;
}) {
  const { category } = await params;
  const { region } = await searchParams;
  const data = await getCategoryNews(category, region);
  const articles: Article[] = data.articles ?? [];

  return (
    <main className="p-6">
      <CategoryContent
        category={category}
        initialArticles={articles}
        pageSize={20}
        regionId={region}
      />
    </main>
  );
}
