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
  const apiKey = process.env.NEWS_API_KEY2 || process.env.NEWS_API_KEY3;

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
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-[#0B0F19]">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">News Feed</h1>
          <p className="text-slate-600">
            No news available at the moment. Please check back later.
          </p>
        </div>
        <RegisterReminder />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-slate-50 p-6 md:p-8 lg:p-12 dark:bg-[#0B0F19] overflow-hidden">
      {/* Decorative Orbs */}
      <div className="pointer-events-none absolute left-[10%] top-[4%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px] mix-blend-multiply dark:bg-indigo-500/20" />
      <div className="pointer-events-none absolute right-[10%] top-[15%] -z-10 h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-[120px] mix-blend-multiply dark:bg-violet-500/20" />
      
      <RegisterReminder />
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 bg-clip-text text-transparent dark:from-white dark:via-indigo-100 dark:to-violet-200">
            Top Headlines
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Stay updated with the latest stories from around the world.
          </p>
        </header>

        <TopHeadlinesContent initialArticles={articles} pageSize={20} />
      </div>
    </main>
  );
}

