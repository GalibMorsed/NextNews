import NewsFeedWithLoadMore from "../components/newsFeedWithLoadMore";

interface Article {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: Article[];
}

async function getSearchNews(query: string): Promise<Article[]> {
  const baseUrl = process.env.NEWS_API_BASE_URL || "https://newsapi.org/v2";
  const apiKey = process.env.NEWS_API_KEY2 || process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.error("NEWS_API_KEY is missing");
    return [];
  }

  try {
    const res = await fetch(
      `${baseUrl}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&page=1&pageSize=20&apiKey=${apiKey}`,
      { next: { revalidate: 300 } },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch search news: ${res.status} ${res.statusText}`);
    }

    const data: NewsResponse = await res.json();
    return data.articles ?? [];
  } catch (error) {
    console.error("Error fetching search news:", error);
    return [];
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const rawQuery = params.q ?? "";
  const query = rawQuery.trim();

  if (!query) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Search News
          </h1>
          <p className="text-gray-600">Enter a search term from the sidebar to see results.</p>
        </div>
      </main>
    );
  }

  const articles = await getSearchNews(query);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">
            Search Results
          </h1>
          <p className="text-lg text-gray-600">
            Showing results for{" "}
            <span className="font-semibold text-gray-800">&quot;{query}&quot;</span>
          </p>
        </header>

        {articles.length > 0 ? (
          <NewsFeedWithLoadMore
            key={query}
            initialArticles={articles}
            query={query}
            pageSize={20}
            emptyMessage={`No articles found for "${query}".`}
          />
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            No articles found for &quot;{query}&quot;.
          </div>
        )}
      </div>
    </main>
  );
}
