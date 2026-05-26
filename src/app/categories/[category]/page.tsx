import CategoryContent from "./CategoryContent";
import { fetchCategoryNews, type NewsApiArticle } from "@/lib/categoryNews";

async function getCategoryNews(category: string, regionId?: string) {
  try {
    return await fetchCategoryNews({ category, regionId, page: 1, pageSize: 20 });
  } catch (error) {
    console.error("Category page news fetch failed", {
      category,
      error: error instanceof Error ? error.message : String(error),
    });
    return { articles: [] };
  }
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
  const articles: NewsApiArticle[] = data.articles ?? [];

  return (
    <main className="p-6">
      <CategoryContent
        category={category}
        initialArticles={articles}
        pageSize={40}
        regionId={region}
      />
    </main>
  );
}
