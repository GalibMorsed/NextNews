import CategoryContent from "./CategoryContent";
import { getCategorySearchConfig } from "@/lib/newsCategories";

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

async function getCategoryNews(category: string, country = "us") {
  const baseUrl = process.env.NEWS_API_BASE_URL || "https://newsapi.org/v2";
  const apiKey = process.env.NEWS_API_KEY2 || process.env.NEWS_API_KEY;

  if (!apiKey) {
    return { articles: [] };
  }

  const customCategory = getCategorySearchConfig(category);
  const endpoint = customCategory
    ? `${baseUrl}/everything?q=${encodeURIComponent(customCategory.query)}&page=1&pageSize=20&sortBy=publishedAt&apiKey=${apiKey}${customCategory.searchIn ? `&searchIn=${encodeURIComponent(customCategory.searchIn)}` : ""}`
    : `${baseUrl}/top-headlines?country=${encodeURIComponent(country)}&category=${encodeURIComponent(category)}&page=1&pageSize=20&apiKey=${apiKey}`;

  const res = await fetch(endpoint, { next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error(`Failed to fetch news for category: ${category}`);
  }

  return res.json();
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const data = await getCategoryNews(category);
  const articles: Article[] = data.articles ?? [];

  return (
    <main className="p-6">
      <CategoryContent category={category} initialArticles={articles} pageSize={20} />
    </main>
  );
}
