import RegisterReminder from "./components/registerReminder";
import TopHeadlinesContent from "./components/topHeadlinesContent";

// 1. Define types matching your API response
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

// 2. Create a data fetching function
async function getNews(): Promise<Article[]> {
  // Ensure you have this in your .env.local file
  const apiKey = process.env.NEWS_API_KEY2;

  if (!apiKey) {
    console.error("NEWS_API_KEY is missing");
    return []; // Or throw an error depending on desired behavior
  }

  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&page=1&pageSize=20&apiKey=${apiKey}`,
      {
        // Revalidate every hour (3600 seconds)
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch news: ${res.status} ${res.statusText}`);
    }

    const data: NewsResponse = await res.json();
    return data.articles;
  } catch (error) {
    console.error("Error fetching news:", error);
    // Return empty array or rethrow to trigger error.tsx
    return [];
  }
}

// 3. Async Server Component
export default async function Home() {
  const articles = await getNews();

  if (!articles || articles.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-gray-50">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">News Feed</h1>
          <p className="text-gray-600">
            No news available at the moment. Please check back later.
          </p>
        </div>
        <RegisterReminder />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8 lg:p-12">
      <RegisterReminder />
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">
            Top Headlines
          </h1>
          <p className="text-lg text-gray-600">
            Stay updated with the latest stories from around the world.
          </p>
        </header>

        <TopHeadlinesContent initialArticles={articles} pageSize={20} />
      </div>
    </main>
  );
}

