import Parser from "rss-parser";
import {
  getCategoryDisplayName,
  getCategorySearchConfig,
  isNewsApiTopHeadlineCategory,
} from "../src/lib/newsCategories";
import { INDIAN_NEWS_FEEDS, SOURCE_NAMES } from "./indianTadkaFeeds";

const MAX_BREAKING_ITEMS = 12;
const BREAKING_LOOKBACK_MS = 36 * 60 * 60 * 1000;

export interface BreakingNewsArticle {
  source?: { id?: string | null; name?: string };
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
  category?: string | null;
}

interface NewsApiArticle {
  source?: { id?: string | null; name?: string };
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
}

interface CurrentsArticle {
  category?: string[];
  title?: string | null;
  description?: string | null;
  url?: string | null;
  image?: string | null;
  published?: string | null;
}

interface RSSItem extends Parser.Item {
  mediaContent?: Array<{ $: { url: string } }>;
  enclosure?: { url: string };
  description?: string;
}

const rssParser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["enclosure", "enclosure"],
      ["description", "description"],
    ],
  },
});

function cleanText(value?: string | null) {
  return value?.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim() ?? "";
}

function buildCategoryQuery(category?: string | null) {
  if (!category) return "";

  const customCategory = getCategorySearchConfig(category);
  if (customCategory) return customCategory.query;

  return getCategoryDisplayName(category);
}

function isRecent(article: BreakingNewsArticle) {
  if (!article.publishedAt) return true;

  const publishedTime = new Date(article.publishedAt).getTime();
  return (
    Number.isFinite(publishedTime) &&
    publishedTime >= Date.now() - BREAKING_LOOKBACK_MS
  );
}

function dedupeArticles(articles: BreakingNewsArticle[]) {
  const seen = new Set<string>();

  return articles.filter((article) => {
    const key = cleanText(article.url) || cleanText(article.title).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreBreakingArticle(article: BreakingNewsArticle, category?: string) {
  const text = `${article.title ?? ""} ${article.description ?? ""}`.toLowerCase();
  const publishedTime = article.publishedAt
    ? new Date(article.publishedAt).getTime()
    : 0;
  const ageHours =
    publishedTime > 0 ? (Date.now() - publishedTime) / (60 * 60 * 1000) : 36;

  let score = Math.max(0, 48 - ageHours);

  if (/\bbreaking\b|\blive\b|\balert\b|\burgent\b/.test(text)) score += 28;
  if (/\bannounces?\b|\bannounced\b|\bdeclares?\b|\bapproves?\b|\blaunched?\b/.test(text)) {
    score += 20;
  }
  if (/\bindia\b|\bindian\b|\bnew delhi\b|\bcentre\b|\bmodi\b/.test(text)) {
    score += 18;
  }

  if (category) {
    const categoryWords = getCategoryDisplayName(category)
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (categoryWords.some((word) => text.includes(word))) score += 14;
  }

  return score;
}

function normalizeNewsApiArticle(
  article: NewsApiArticle,
  category?: string,
): BreakingNewsArticle {
  return {
    source: article.source ?? { id: null, name: "NewsAPI" },
    title: article.title ?? "Breaking update",
    description: article.description ?? null,
    url: article.url ?? "",
    urlToImage: article.urlToImage ?? null,
    publishedAt: article.publishedAt ?? new Date().toISOString(),
    category: category ?? null,
  };
}

function normalizeCurrentsArticle(
  article: CurrentsArticle,
  category?: string,
): BreakingNewsArticle {
  return {
    source: { id: null, name: article.category?.[0] ?? "Currents" },
    title: article.title ?? "Breaking update",
    description: article.description ?? null,
    url: article.url ?? "",
    urlToImage: article.image ?? null,
    publishedAt: article.published ?? new Date().toISOString(),
    category: category ?? article.category?.[0] ?? null,
  };
}

function getRssImageUrl(item: RSSItem) {
  if (item.mediaContent?.[0]?.$?.url) {
    return item.mediaContent[0].$.url;
  }

  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  if (item.description?.includes("<img")) {
    const match = item.description.match(/<img[^>]+src="([^">]+)"/);
    if (match) return match[1];
  }

  return null;
}

async function fetchJson(url: string, revalidate = 600) {
  const response = await fetch(url, {
    next: { revalidate },
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) return null;
  return response.json();
}

async function fetchNewsApiBreaking({
  category,
  country,
}: {
  category?: string;
  country?: string;
}) {
  const apiKey = process.env.NEWS_API_KEY4;
  if (!apiKey) return [] as BreakingNewsArticle[];

  const baseUrl = process.env.NEWS_API_BASE_URL || "https://newsapi.org/v2";
  const categoryQuery = buildCategoryQuery(category);
  const params = new URLSearchParams({
    apiKey,
    pageSize: "20",
  });
  let path = "/everything";

  if (category && isNewsApiTopHeadlineCategory(category)) {
    path = "/top-headlines";
    params.set("country", country || "in");
    params.set("category", category);
    params.set("q", "India");
  } else {
    const queryParts = [
      "India",
      "(breaking OR announces OR announced OR live OR alert OR launches OR approves OR declares)",
      categoryQuery,
    ].filter(Boolean);
    params.set("q", queryParts.join(" AND "));
    params.set("sortBy", "publishedAt");
    params.set(
      "from",
      new Date(Date.now() - BREAKING_LOOKBACK_MS).toISOString(),
    );
    params.set("searchIn", "title,description");
  }

  const data = await fetchJson(`${baseUrl}${path}?${params.toString()}`);
  const articles = Array.isArray(data?.articles) ? data.articles : [];
  return articles.map((article: NewsApiArticle) =>
    normalizeNewsApiArticle(article, category),
  );
}

async function fetchCurrentsBreaking({ category }: { category?: string }) {
  const apiKey = process.env.NEWS_API_KEY2;
  if (!apiKey) return [] as BreakingNewsArticle[];

  const baseUrl =
    process.env.CURRENTS_API_BASE_URL || "https://api.currentsapi.services/v1";
  const params = new URLSearchParams({
    apiKey,
    country: "IN",
    language: "en",
    page_size: "20",
  });

  if (category && isNewsApiTopHeadlineCategory(category)) {
    params.set("category", category);
  } else {
    const categoryQuery = buildCategoryQuery(category);
    params.set(
      "keywords",
      ["India breaking announce live latest", categoryQuery]
        .filter(Boolean)
        .join(" "),
    );
  }

  const data = await fetchJson(`${baseUrl}/latest-news?${params.toString()}`);
  const articles = Array.isArray(data?.news) ? data.news : [];
  return articles.map((article: CurrentsArticle) =>
    normalizeCurrentsArticle(article, category),
  );
}

async function fetchIndianTadkaBreaking({ category }: { category?: string }) {
  const categoryLabel = category ? getCategoryDisplayName(category).toLowerCase() : "";
  const feeds = Object.entries(INDIAN_NEWS_FEEDS);
  const results = await Promise.all(
    feeds.map(async ([source, feedUrl]) => {
      try {
        const response = await fetch(feedUrl, {
          next: { revalidate: 600 },
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) return [] as BreakingNewsArticle[];

        const xml = await response.text();
        const feed = await rssParser.parseString(xml);

        return feed.items.map((rawItem) => {
          const item = rawItem as RSSItem;
          return {
            source: { id: source, name: SOURCE_NAMES[source] },
            title: item.title || "Breaking update",
            description: cleanText(item.contentSnippet || item.description),
            url: item.link || "",
            urlToImage: getRssImageUrl(item),
            publishedAt:
              item.isoDate || item.pubDate || new Date().toISOString(),
            category: category ?? "indian-tadka",
          } satisfies BreakingNewsArticle;
        });
      } catch {
        return [] as BreakingNewsArticle[];
      }
    }),
  );

  const articles = results.flat();
  if (!categoryLabel) return articles;

  const categoryWords = categoryLabel.split(/\s+/).filter(Boolean);
  const matchingArticles = articles.filter((article) => {
    const text = `${article.title ?? ""} ${article.description ?? ""}`.toLowerCase();
    return categoryWords.some((word) => text.includes(word));
  });

  return matchingArticles.length >= 3 ? matchingArticles : articles;
}

export async function getBreakingNews({
  category,
  country,
}: {
  category?: string;
  country?: string;
}) {
  const [indianTadkaArticles, newsApiArticles, currentsArticles] =
    await Promise.all([
      fetchIndianTadkaBreaking({ category }),
      fetchNewsApiBreaking({ category, country }),
      fetchCurrentsBreaking({ category }),
    ]);

  return dedupeArticles([
    ...indianTadkaArticles,
    ...newsApiArticles,
    ...currentsArticles,
  ])
    .filter(isRecent)
    .sort((left, right) => {
      const scoreDelta =
        scoreBreakingArticle(right, category) -
        scoreBreakingArticle(left, category);
      if (scoreDelta !== 0) return scoreDelta;

      const rightTime = right.publishedAt
        ? new Date(right.publishedAt).getTime()
        : 0;
      const leftTime = left.publishedAt
        ? new Date(left.publishedAt).getTime()
        : 0;
      return rightTime - leftTime;
    })
    .slice(0, MAX_BREAKING_ITEMS);
}
