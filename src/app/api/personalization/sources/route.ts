import { NextResponse } from "next/server";

type PersonalizationSource = {
  id: string;
  name: string;
  url: string | null;
  description?: string | null;
  category?: string | null;
  language?: string | null;
  country?: string | null;
};

type NewsApiSource = {
  id?: string | null;
  name?: string | null;
  url?: string | null;
  description?: string | null;
  category?: string | null;
  language?: string | null;
  country?: string | null;
};

type NewsApiArticle = {
  source?: {
    id?: string | null;
    name?: string | null;
  } | null;
  url?: string | null;
};

type CurrentsArticle = {
  url?: string | null;
  author?: string | null;
};

const PINNED_SOURCE: PersonalizationSource = {
  id: "newsapi-top-headlines",
  name: "NewsAPI Top Headlines",
  url: "https://newsapi.org",
};

function cleanText(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function sourceKey(name: string) {
  return name.trim().toLowerCase();
}

function titleFromHostname(url?: string | null) {
  const trimmedUrl = cleanText(url);
  if (!trimmedUrl) return null;

  try {
    const hostname = new URL(trimmedUrl).hostname.replace(/^www\./, "");
    const [domain] = hostname.split(".");
    if (!domain) return null;

    return domain
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return null;
  }
}

function addSource(
  sources: Map<string, PersonalizationSource>,
  source: PersonalizationSource,
) {
  const name = cleanText(source.name);
  if (!name) return;

  const key = sourceKey(name);
  const existing = sources.get(key);
  const incomingDescription = cleanText(source.description);
  const prefersIncoming = Boolean(incomingDescription);

  sources.set(key, {
    id: existing?.id || cleanText(source.id) || key.replace(/\s+/g, "-"),
    name,
    url:
      (prefersIncoming ? cleanText(source.url) : "") ||
      existing?.url ||
      cleanText(source.url) ||
      null,
    description:
      existing?.description || incomingDescription || null,
    category:
      existing?.category || cleanText(source.category) || null,
    language:
      existing?.language || cleanText(source.language) || null,
    country:
      existing?.country || cleanText(source.country) || null,
  });
}

async function fetchNewsApiOrgSources() {
  const apiKey = process.env.NEWS_API_KEY2 || process.env.NEWS_API_KEY4;
  if (!apiKey) return [] as PersonalizationSource[];

  const params = new URLSearchParams({
    apiKey,
    language: "en",
  });

  const response = await fetch(`https://newsapi.org/v2/top-headlines/sources?${params}`, {
    next: { revalidate: 24 * 60 * 60 },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) return [];

  const data = await response.json().catch(() => null);
  const rawSources = Array.isArray(data?.sources) ? data.sources : [];

  return rawSources
    .map((source: NewsApiSource) => ({
      id: cleanText(source.id),
      name: cleanText(source.name),
      url: cleanText(source.url) || null,
      description: cleanText(source.description) || null,
      category: cleanText(source.category) || null,
      language: cleanText(source.language) || null,
      country: cleanText(source.country) || null,
    }))
    .filter((source: PersonalizationSource) => source.name);
}

async function fetchNewsApiOrgHeadlineSources() {
  const apiKey = process.env.NEWS_API_KEY || process.env.NEWS_API_KEY4;
  if (!apiKey) return [] as PersonalizationSource[];

  const params = new URLSearchParams({
    apiKey,
    country: "us",
    pageSize: "40",
  });

  const response = await fetch(`https://newsapi.org/v2/top-headlines?${params}`, {
    next: { revalidate: 60 * 60 },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) return [];

  const data = await response.json().catch(() => null);
  const articles = Array.isArray(data?.articles) ? data.articles : [];

  return articles
    .map((article: NewsApiArticle) => {
      const name = cleanText(article.source?.name);
      return {
        id: cleanText(article.source?.id) || name,
        name,
        url: cleanText(article.url) || null,
        description: null,
        category: null,
        language: null,
        country: null,
      };
    })
    .filter((source: PersonalizationSource) => source.name);
}

async function fetchCurrentsHeadlineSources() {
  const apiKey = process.env.NEWS_API_KEY2;
  if (!apiKey) return [] as PersonalizationSource[];

  const params = new URLSearchParams({
    apiKey,
    language: "en",
    page_number: "1",
    page_size: "40",
  });

  const response = await fetch(
    `https://api.currentsapi.services/v1/latest-news?${params}`,
    {
      next: { revalidate: 60 * 60 },
      signal: AbortSignal.timeout(10000),
    },
  );

  if (!response.ok) return [];

  const data = await response.json().catch(() => null);
  const articles = Array.isArray(data?.news) ? data.news : [];

  return articles
    .map((article: CurrentsArticle) => {
      const url = cleanText(article.url);
      const name = cleanText(article.author) || titleFromHostname(url);
      return {
        id: name || url,
        name: name || "",
        url: url || null,
        description: null,
        category: null,
        language: null,
        country: null,
      };
    })
    .filter((source: PersonalizationSource) => source.name);
}

export async function GET() {
  const sources = new Map<string, PersonalizationSource>();
  addSource(sources, PINNED_SOURCE);

  const results = await Promise.allSettled([
    fetchNewsApiOrgSources(),
    fetchNewsApiOrgHeadlineSources(),
    fetchCurrentsHeadlineSources(),
  ]);

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const source of result.value) {
      addSource(sources, source);
    }
  }

  return NextResponse.json(
    { sources: Array.from(sources.values()) },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
