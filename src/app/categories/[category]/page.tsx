import Link from "next/link";
import AddNoteButton from "@/app/components/addNoteButton";
import AISummaryButton from "@/app/components/aiSummaryButton";
import { getNewsImageSrc } from "@/lib/newsImage";

interface Article {
  source?: { id?: string | null; name?: string };
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
    `${baseUrl}/top-headlines?country=${encodeURIComponent(country)}&category=${encodeURIComponent(category)}&apiKey=${apiKey}`,
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
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {articles.map((article, index) => (
            <article
              key={`${article.url ?? "article"}-${index}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
            >
              <img
                src={getNewsImageSrc(article.urlToImage)}
                alt={article.title ?? "News image"}
                className="h-48 w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-5">
                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                  {article.title ?? "Untitled article"}
                </h2>
                <p className="mb-4 flex-1 text-sm text-gray-600 line-clamp-3">
                  {article.description ?? "No description available."}
                </p>
                <div className="mt-auto border-t border-gray-50 pt-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {article.url ? (
                      <Link
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 lg:flex-shrink-0"
                      >
                        Read Full Story
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-gray-400 lg:flex-shrink-0">
                        Link unavailable
                      </span>
                    )}
                    <div className="flex flex-nowrap items-center gap-2 lg:ml-auto">
                      <AISummaryButton
                        title={article.title ?? "Untitled article"}
                        description={article.description ?? null}
                        content={article.content ?? null}
                        sourceName={article.source?.name ?? "Unknown Source"}
                      />
                      <AddNoteButton
                        title={article.title ?? "Untitled article"}
                        link={article.url ?? ""}
                        publishedAt={article.publishedAt}
                        sourceName={article.source?.name ?? "Unknown Source"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>No articles found for this category.</p>
      )}
    </main>
  );
}
