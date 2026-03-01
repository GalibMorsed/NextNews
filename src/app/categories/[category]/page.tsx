import NewsFeedWithLoadMore from "@/app/components/newsFeedWithLoadMore";

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

  const res = await fetch(
    `${baseUrl}/top-headlines?country=${encodeURIComponent(country)}&category=${encodeURIComponent(category)}&page=1&pageSize=20&apiKey=${apiKey}`,
    { next: { revalidate: 300 } },
  );

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
      <h1 className="mb-6 text-4xl font-bold capitalize">{category}</h1>
      <NewsFeedWithLoadMore
        initialArticles={articles}
        category={category}
        country="us"
        pageSize={20}
        emptyMessage="No articles found for this category."
      />
    </main>
  );
}
