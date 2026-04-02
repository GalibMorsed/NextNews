import { NextResponse } from "next/server";
import { EXPLORE_CATEGORY_OPTIONS, getExploreRegion, type ExploreArticle, type ExploreCategorySuggestion, type ExploreSourceSuggestion, type ExploreTrendingTopic } from "@/lib/explore";
import { enforceRateLimit, getClientIp } from "@/lib/apiSecurity";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 12;

type NewsApiResponse = {
  articles?: Array<{
    source?: { id?: string | null; name?: string | null };
    author?: string | null;
    title?: string | null;
    description?: string | null;
    url?: string | null;
    urlToImage?: string | null;
    publishedAt?: string | null;
    content?: string | null;
  }>;
};

type NewsApiArticle = NonNullable<NewsApiResponse["articles"]>[number];

type ExploreAiInsights = {
  regionBrief: string;
  heroSearchPrompt: string;
  trendingTopics: ExploreTrendingTopic[];
  moreStoryCategories: ExploreCategorySuggestion[];
  sourceSuggestions: ExploreSourceSuggestion[];
};

const FALLBACK_SOURCE_CATALOG: ExploreSourceSuggestion[] = [
  {
    name: "Reuters",
    regionHint: "Global",
    reason: "Reliable global coverage with fast breaking-news updates.",
  },
  {
    name: "BBC News",
    regionHint: "World",
    reason: "Broad international reporting with strong live coverage.",
  },
  {
    name: "Al Jazeera",
    regionHint: "Middle East",
    reason: "Useful for cross-region context and political developments.",
  },
  {
    name: "The Times of India",
    regionHint: "India",
    reason: "Helpful for South Asia coverage and domestic India updates.",
  },
  {
    name: "Associated Press",
    regionHint: "US",
    reason: "Wire-style reporting that surfaces major developments quickly.",
  },
  {
    name: "Bloomberg",
    regionHint: "Markets",
    reason: "Strong business, economy, and financial impact reporting.",
  },
  {
    name: "The Guardian",
    regionHint: "Europe",
    reason: "Useful for politics, society, and international reaction.",
  },
  {
    name: "France 24",
    regionHint: "Europe",
    reason: "Helpful for Europe, Africa, and diplomatic developments.",
  },
];

function safeTrim(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArticle(article: NewsApiArticle): ExploreArticle | null {
  const title = safeTrim(article?.title);
  const url = safeTrim(article?.url);
  const sourceName = safeTrim(article?.source?.name) || "Unknown source";
  if (!title || !url) return null;

  return {
    source: {
      id: article?.source?.id ?? null,
      name: sourceName,
    },
    author: safeTrim(article?.author) || null,
    title,
    description: safeTrim(article?.description) || null,
    url,
    urlToImage: safeTrim(article?.urlToImage) || null,
    publishedAt: safeTrim(article?.publishedAt) || new Date().toISOString(),
    content: safeTrim(article?.content) || null,
  };
}

function buildExploreNewsUrl(regionId: string, query: string) {
  const region = getExploreRegion(regionId);
  const baseUrl = process.env.NEWS_API_BASE_URL || "https://newsapi.org/v2";
  const apiKey = process.env.NEWS_API_KEY2 || process.env.NEWS_API_KEY;
  if (!apiKey) return null;

  const trimmedQuery = query.trim();
  const params = new URLSearchParams();

  if (trimmedQuery) {
    params.set(
      "q",
      region.id === "world"
        ? trimmedQuery
        : `(${trimmedQuery}) AND ${region.topicQuery}`,
    );
    params.set("sortBy", "publishedAt");
    params.set("page", "1");
    params.set("pageSize", "10");
    params.set("searchIn", "title,description");
    params.set("apiKey", apiKey);
    return `${baseUrl}/everything?${params.toString()}`;
  }

  if (region.country) {
    params.set("country", region.country);
    params.set("page", "1");
    params.set("pageSize", "10");
    params.set("apiKey", apiKey);
    return `${baseUrl}/top-headlines?${params.toString()}`;
  }

  params.set("q", region.topicQuery);
  params.set("sortBy", "publishedAt");
  params.set("page", "1");
  params.set("pageSize", "10");
  params.set("searchIn", "title,description");
  params.set("apiKey", apiKey);
  return `${baseUrl}/everything?${params.toString()}`;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function normalizeTrendingTopics(raw: unknown): ExploreTrendingTopic[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const tag = safeTrim((item as { tag?: string }).tag);
      const reason = safeTrim((item as { reason?: string }).reason);
      if (!tag) return null;
      return {
        tag: tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`,
        reason: reason || "Receiving strong recent attention in this region.",
      };
    })
    .filter((item): item is ExploreTrendingTopic => Boolean(item))
    .slice(0, 5);
}

function normalizeCategories(raw: unknown): ExploreCategorySuggestion[] {
  if (!Array.isArray(raw)) return [];

  const allowed = new Map(
    EXPLORE_CATEGORY_OPTIONS.map((item) => [item.slug, item]),
  );

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const slug = safeTrim((item as { slug?: string }).slug);
      const description = safeTrim((item as { description?: string }).description);
      const allowedCategory = allowed.get(slug);
      if (!allowedCategory) return null;
      return {
        slug: allowedCategory.slug,
        title: allowedCategory.title,
        description: description || allowedCategory.description,
      };
    })
    .filter((item): item is ExploreCategorySuggestion => Boolean(item))
    .slice(0, 3);
}

function normalizeSources(raw: unknown): ExploreSourceSuggestion[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const name = safeTrim((item as { name?: string }).name);
      const regionHint = safeTrim((item as { regionHint?: string }).regionHint);
      const reason = safeTrim((item as { reason?: string }).reason);
      const normalizedName = name.toLowerCase();
      if (!name || seen.has(normalizedName)) return null;
      seen.add(normalizedName);
      return {
        name,
        regionHint: regionHint || "Regional coverage",
        reason: reason || "Frequently appearing in the latest coverage.",
      };
    })
    .filter((item): item is ExploreSourceSuggestion => Boolean(item))
    .slice(0, 6);
}

function ensureSixSources(
  primarySources: ExploreSourceSuggestion[],
  regionLabel: string,
): ExploreSourceSuggestion[] {
  const results: ExploreSourceSuggestion[] = [];
  const seen = new Set<string>();

  const addSource = (source: ExploreSourceSuggestion) => {
    const normalizedName = source.name.trim().toLowerCase();
    if (!normalizedName || seen.has(normalizedName)) return;
    seen.add(normalizedName);
    results.push(source);
  };

  for (const source of primarySources) {
    addSource(source);
    if (results.length === 6) return results;
  }

  for (const source of FALLBACK_SOURCE_CATALOG) {
    addSource({
      ...source,
      regionHint:
        source.regionHint === "Global" || source.regionHint === "World"
          ? regionLabel
          : source.regionHint,
    });
    if (results.length === 6) return results;
  }

  return results.slice(0, 6);
}

function fallbackInsights(
  regionLabel: string,
  query: string,
  articles: ExploreArticle[],
): ExploreAiInsights {
  const sourceCounts = new Map<string, number>();

  for (const article of articles) {
    const name = article.source.name;
    sourceCounts.set(name, (sourceCounts.get(name) ?? 0) + 1);
  }

  const sourceSuggestions = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => ({
      name,
      regionHint: regionLabel,
      reason: "Appearing repeatedly across the current story mix.",
    }));

  const fallbackCategories = EXPLORE_CATEGORY_OPTIONS.slice(0, 3).map((item) => ({
    slug: item.slug,
    title: item.title,
    description: item.description,
  }));

  const baseTag = query.trim()
    ? query
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join("")
    : regionLabel.replace(/\s+/g, "");

  return {
    regionBrief: `Scan the latest ${regionLabel} coverage, then use the suggested paths below to go deeper into the most active themes.`,
    heroSearchPrompt: query.trim()
      ? `Search ${regionLabel} for ${query.trim()} and related angles`
      : `Search ${regionLabel} for politics, markets, diplomacy, or public reaction`,
    trendingTopics: [
      { tag: `#${baseTag}`, reason: `Core coverage cluster in ${regionLabel}.` },
      { tag: "#BreakingNews", reason: "Fresh headlines are updating quickly." },
      { tag: "#Markets", reason: "Economic impact keeps appearing in coverage." },
      { tag: "#PolicyWatch", reason: "Policy and government angles remain active." },
      { tag: "#GlobalPulse", reason: "Cross-border reaction is part of the story." },
    ],
    moreStoryCategories: fallbackCategories,
    sourceSuggestions,
  };
}

async function fetchAiInsights(
  regionLabel: string,
  query: string,
  articles: ExploreArticle[],
): Promise<ExploreAiInsights | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free";
  if (!apiKey || articles.length === 0) return null;

  const prompt = [
    "You are helping build a world news explore page.",
    `Region: ${regionLabel}`,
    `Search query: ${query || "none"}`,
    `Today: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "Available category slugs and titles:",
    EXPLORE_CATEGORY_OPTIONS.map((item) => `${item.slug}: ${item.title}`).join(", "),
    "",
    "Recent article signals:",
    ...articles.slice(0, 8).map((article, index) =>
      `${index + 1}. ${article.title} | ${article.description ?? "No description"} | source=${article.source.name}`,
    ),
    "",
    "Return ONLY valid JSON with this shape:",
    "{",
    '  "regionBrief": "2 concise sentences",',
    '  "heroSearchPrompt": "1 concise sentence users can search for",',
    '  "trendingTopics": [',
    '    { "tag": "#Topic", "reason": "short reason" }',
    "  ],",
    '  "moreStoryCategories": [',
    '    { "slug": "allowed-category-slug", "description": "short description tied to current region situation" }',
    "  ],",
    '  "sourceSuggestions": [',
    '    { "name": "Source name from current coverage if possible", "regionHint": "short region label", "reason": "why follow" }',
    "  ]",
    "}",
    "Rules:",
    "- 5 trending topics.",
    "- exactly 3 category suggestions.",
    "- up to 6 source suggestions.",
    "- Use only category slugs from the allowed list.",
    "- Keep all text concise and product-ready.",
  ].join("\n");

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.OPENROUTER_SITE_URL || "https://next-news-delta-brown.vercel.app",
      "X-Title": process.env.OPENROUTER_APP_NAME || "NextNews",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You summarize current news into compact product JSON. Output JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) return null;

  const parsed = extractJsonObject(content);
  if (!parsed) return null;

  return {
    regionBrief:
      safeTrim(parsed.regionBrief as string) ||
      `Explore the strongest ${regionLabel} storylines and use the suggested directions below to go deeper.`,
    heroSearchPrompt:
      safeTrim(parsed.heroSearchPrompt as string) ||
      `Search ${regionLabel} for the biggest developing angle right now`,
    trendingTopics: normalizeTrendingTopics(parsed.trendingTopics),
    moreStoryCategories: normalizeCategories(parsed.moreStoryCategories),
    sourceSuggestions: normalizeSources(parsed.sourceSuggestions),
  };
}

export async function GET(request: Request) {
  try {
    const rateLimit = enforceRateLimit(
      `${getClientIp(request)}:explore`,
      RATE_LIMIT_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many explore requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
        },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("region");
    const query = safeTrim(searchParams.get("q"));
    const region = getExploreRegion(regionId);
    const newsUrl = buildExploreNewsUrl(region.id, query);

    if (!newsUrl) {
      return NextResponse.json(
        { error: "Missing NEWS API configuration." },
        { status: 500 },
      );
    }

    const newsResponse = await fetch(newsUrl, { cache: "no-store" });
    const newsData = (await newsResponse.json()) as NewsApiResponse;
    const articles = Array.isArray(newsData.articles)
      ? newsData.articles.map(normalizeArticle).filter((item): item is ExploreArticle => Boolean(item))
      : [];

    const heroArticle = articles[0] ?? null;
    const sideArticles = articles.slice(1, 4);
    const fallback = fallbackInsights(region.label, query, articles);
    const aiInsights = await fetchAiInsights(region.label, query, articles);

    return NextResponse.json(
      {
        region: region.id,
        regionLabel: region.label,
        query,
        heroArticle,
        sideArticles,
        moreStoryCategories:
          aiInsights?.moreStoryCategories.length
            ? aiInsights.moreStoryCategories
            : fallback.moreStoryCategories,
        trendingTopics:
          aiInsights?.trendingTopics.length
            ? aiInsights.trendingTopics
            : fallback.trendingTopics,
        sourceSuggestions:
          ensureSixSources(
            aiInsights?.sourceSuggestions.length
              ? normalizeSources(aiInsights.sourceSuggestions)
              : fallback.sourceSuggestions,
            region.label,
          ),
        regionBrief: aiInsights?.regionBrief || fallback.regionBrief,
        heroSearchPrompt: aiInsights?.heroSearchPrompt || fallback.heroSearchPrompt,
        updatedAt: new Date().toISOString(),
      },
      { status: newsResponse.ok ? 200 : newsResponse.status },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected explore server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
