import Parser from "rss-parser";
import { INDIAN_NEWS_FEEDS, SOURCE_NAMES } from "./indianTadkaFeeds";

const ROUNDUP_LOOKBACK_MS = 4 * 24 * 60 * 60 * 1000;
const MAX_ROUNDUP_ARTICLES = 8;

export interface WeeklyRoundupArticle {
  source?: { id?: string | null; name?: string };
  author?: string | null;
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
  content?: string | null;
}

interface NewsApiArticle {
  source?: { id?: string | null; name?: string };
  author?: string | null;
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
  content?: string | null;
}

interface CurrentsArticle {
  category?: string[];
  author?: string | null;
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
  author?: string;
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

function normalizeText(value?: string | null) {
  return value?.trim() ?? "";
}

function stripHtml(value?: string | null) {
  return normalizeText(value).replace(/<[^>]*>?/gm, "");
}

function dedupeArticles(articles: WeeklyRoundupArticle[]) {
  const seen = new Set<string>();

  return articles.filter((article) => {
    const key = normalizeText(article.url) || normalizeText(article.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortByPublishedAt(articles: WeeklyRoundupArticle[]) {
  return [...articles].sort((left, right) => {
    const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
    const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

function filterRecentArticles(articles: WeeklyRoundupArticle[]) {
  const cutoffTime = Date.now() - ROUNDUP_LOOKBACK_MS;

  return articles.filter((article) => {
    if (!article.publishedAt) return false;

    const publishedTime = new Date(article.publishedAt).getTime();
    return Number.isFinite(publishedTime) && publishedTime >= cutoffTime;
  });
}

function normalizeNewsApiArticle(article: NewsApiArticle): WeeklyRoundupArticle {
  return {
    source: article.source ?? { id: null, name: "NewsAPI" },
    author: article.author ?? null,
    title: article.title ?? "Untitled story",
    description: article.description ?? null,
    url: article.url ?? "",
    urlToImage: article.urlToImage ?? null,
    publishedAt: article.publishedAt ?? new Date().toISOString(),
    content: article.content ?? null,
  };
}

function normalizeCurrentsArticle(article: CurrentsArticle): WeeklyRoundupArticle {
  return {
    source: { id: null, name: article.category?.[0] ?? "Currents" },
    author: article.author ?? null,
    title: article.title ?? "Untitled story",
    description: article.description ?? null,
    url: article.url ?? "",
    urlToImage: article.image ?? null,
    publishedAt: article.published ?? new Date().toISOString(),
    content: article.description ?? null,
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    next: { revalidate: 2 * 24 * 60 * 60 },
  });
  if (!response.ok) return null;
  return response.json();
}

async function fetchNewsApiRoundup({
  category,
  country,
}: {
  category?: string;
  country?: string;
}) {
  const apiKey = process.env.NEWS_API_KEY4;
  if (!apiKey) return [];

  const to = new Date().toISOString();
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const baseUrl = process.env.NEWS_API_BASE_URL || "https://newsapi.org/v2";

  const params = new URLSearchParams({
    pageSize: "20",
    apiKey,
  });

  let path = "/everything";

  if (country) {
    path = "/top-headlines";
    params.set("country", country);
    if (category) params.set("category", category);
  } else {
    params.set("q", category ? category : "".trim());
    params.set("from", from);
    params.set("to", to);
    params.set("sortBy", "popularity");
  }

  const data = await fetchJson(`${baseUrl}${path}?${params.toString()}`);
  const articles = Array.isArray(data?.articles) ? data.articles : [];
  return articles.map(normalizeNewsApiArticle);
}

async function fetchCurrentsRoundup({
  category,
}: {
  category?: string;
}) {
  const apiKey = process.env.NEWS_API_KEY2;
  if (!apiKey) return [];

  const baseUrl = process.env.NEWS_API_BASE_URL || "https://api.currentsapi.services/v1";
  const params = new URLSearchParams({
    language: "en",
    page_number: "1",
    page_size: "20",
    apiKey,
  });

  if (category) {
    params.set("category", category);
  }

  const data = await fetchJson(`${baseUrl}/latest-news?${params.toString()}`);
  const articles = Array.isArray(data?.news) ? data.news : [];
  return articles.map((item: CurrentsArticle) => normalizeCurrentsArticle(item));
}

function cleanRssDescription(description?: string) {
  const cleaned = stripHtml(description);
  return cleaned ? `${cleaned.slice(0, 200).trim()}${cleaned.length > 200 ? "..." : ""}` : null;
}

async function fetchIndianTadkaRoundup() {
  const feeds = Object.entries(INDIAN_NEWS_FEEDS);
  const results = await Promise.all(
    feeds.map(async ([source, feedUrl]) => {
      try {
        const response = await fetch(feedUrl, {
          next: { revalidate: 900 },
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) return [] as WeeklyRoundupArticle[];

        const xml = await response.text();
        const feed = await rssParser.parseString(xml);

        return feed.items.map((rawItem) => {
          const item = rawItem as RSSItem;
          let imageUrl = "";

          if (item.mediaContent?.[0]?.$?.url) {
            imageUrl = item.mediaContent[0].$.url;
          } else if (item.enclosure?.url) {
            imageUrl = item.enclosure.url;
          } else if (item.description?.includes("<img")) {
            const match = item.description.match(/<img[^>]+src="([^">]+)"/);
            if (match) imageUrl = match[1];
          }

          const description = cleanRssDescription(item.description);

          return {
            source: { id: source, name: SOURCE_NAMES[source] },
            author: item.creator || item.author || SOURCE_NAMES[source],
            title: item.title || "Untitled story",
            description,
            content: item.contentSnippet || item.content || description,
            url: item.link || "",
            urlToImage: imageUrl || null,
            publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          } satisfies WeeklyRoundupArticle;
        });
      } catch {
        return [] as WeeklyRoundupArticle[];
      }
    }),
  );

  return results.flat();
}

export async function getWeeklyRoundup({
  category,
  country,
  section,
  source,
}: {
  category?: string;
  country?: string;
  section?: "general" | "indian-tadka";
  source?: string;
}) {
  if (section === "indian-tadka") {
    const articles = await fetchIndianTadkaRoundup();
    const recentArticles = dedupeArticles(articles);

    // Prefer source diversity first, but fall back to additional recent items so the
    // roundup still reaches the intended 5-8 stories when enough articles exist.
    const prioritized = sortByPublishedAt(recentArticles).sort((left, right) => {
      const leftIsSameSource = source ? left.source?.id === source : false;
      const rightIsSameSource = source ? right.source?.id === source : false;

      if (leftIsSameSource === rightIsSameSource) return 0;
      return leftIsSameSource ? 1 : -1;
    });

    const bySource = new Map<string, WeeklyRoundupArticle>();
    for (const article of prioritized) {
      const key = article.source?.id || article.source?.name || "unknown";
      if (!bySource.has(key)) {
        bySource.set(key, article);
      }
    }

    const unique = dedupeArticles([...bySource.values(), ...prioritized]);
    return sortByPublishedAt(unique).slice(0, MAX_ROUNDUP_ARTICLES);
  }

  const [newsApiArticles, currentsArticles] = await Promise.all([
    fetchNewsApiRoundup({ category, country }),
    fetchCurrentsRoundup({ category }),
  ]);

  return sortByPublishedAt(
    filterRecentArticles(dedupeArticles([...newsApiArticles, ...currentsArticles])),
  ).slice(0, MAX_ROUNDUP_ARTICLES);
}
