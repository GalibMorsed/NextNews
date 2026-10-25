import FifaPageContent from "./FifaPageContent";
import { fetchFifaNews } from "@/lib/fifaNews";

export const metadata = {
  title: "FIFA Live Scores & Football News",
  description:
    "Follow FIFA World Cup live scores, fixtures, and football news in real time.",
};

export default async function FifaPage() {
  let articles: Awaited<ReturnType<typeof fetchFifaNews>>["articles"] = [];

  try {
    const data = await fetchFifaNews(1, 20);
    articles = data.articles;
  } catch (error) {
    console.error("Failed to load FIFA news during prerender:", error);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-0 py-6 md:px-8 md:py-8 lg:px-12 lg:py-12 dark:bg-[#0B0F19]">
      <div className="pointer-events-none absolute left-[8%] top-[3%] -z-10 h-[480px] w-[480px] rounded-full bg-indigo-500/10 blur-[100px] mix-blend-multiply dark:bg-indigo-500/20" />
      <div className="pointer-events-none absolute right-[6%] top-[12%] -z-10 h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-[120px] mix-blend-multiply dark:bg-violet-500/20" />

      <header className="mx-auto mb-10 max-w-7xl px-4 md:px-0">
        <h1 className="mb-2 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 bg-clip-text text-transparent dark:from-white dark:via-indigo-100 dark:to-violet-200">
          FIFA World Cup
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 md:text-base dark:text-slate-400">
          Live scores, fixtures, and football news.⚽ 
        </p>
      </header>

      <FifaPageContent initialArticles={articles} />
    </main>
  );
}
