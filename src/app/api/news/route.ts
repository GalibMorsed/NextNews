import { NextResponse } from "next/server";
import { getExploreRegion } from "@/lib/explore";
import { enforceRateLimit, getClientIp } from "@/lib/apiSecurity";

interface CurrentsNewsItem {
  title?: string;
  description?: string | null;
  url?: string;
  author?: string | null;
  image?: string | null;
  published?: string;
  category?: string[];
}

interface NewsResponse {
  status?: string;
  page?: number;
  news?: CurrentsNewsItem[];
}

const CANONICAL_CATEGORY_MAP: Record<string, string> = {
  business: "economy_business_finance",
  entertainment: "arts_culture_entertainment",
  general: "general",
  health: "health",
  science: "science_technology",
  sports: "sport",
  technology: "science_technology",
  politics: "politics_government",
  tourism: "lifestyle_leisure",
  travel: "lifestyle_leisure",
  crime: "crime_law_justice",
  environment: "environment",
  education: "education",
  food: "lifestyle_leisure",
  fashion: "lifestyle_leisure",
  finance: "economy_business_finance",
  automotive: "automotive",
  music: "arts_culture_entertainment",
  movies: "arts_culture_entertainment",
  books: "arts_culture_entertainment",
  art: "arts_culture_entertainment",
  culture: "arts_culture_entertainment",
  gaming: "lifestyle_leisure",
  "spirituality-religion": "human_interest",
  "mental-health": "health",
  "artificial-intelligence": "science_technology",
  cybersecurity: "science_technology",
  "space-astronomy": "science_technology",
  "stock-market": "economy_business_finance",
  "trade-economy": "economy_business_finance",
  "real-estate": "real_estate",
  "defense-military": "society",
  "agriculture-farming": "environment",
  "world-news": "general",
  weather: "environment",
  energy: "environment",
  startups: "economy_business_finance",
  "law-justice": "crime_law_justice",
  "social-media": "society",
  "personal-finance": "economy_business_finance",
};

function mapCategoryToCurrents(category: string) {
  const canonicalCategory = CANONICAL_CATEGORY_MAP[category];
  if (canonicalCategory) return canonicalCategory;

  const alreadyCanonical = new Set([
    "general",
    "society",
    "science_technology",
    "politics_government",
    "economy_business_finance",
    "arts_culture_entertainment",
    "lifestyle_leisure",
    "human_interest",
    "sport",
    "crime_law_justice",
    "education",
    "environment",
    "labour",
    "health",
    "automotive",
    "real_estate",
  ]);

  return alreadyCanonical.has(category) ? category : "general";
}

function mapCurrentsNewsItem(item: CurrentsNewsItem) {
  return {
    source: { id: null, name: item.category?.[0] ?? "Currents" },
    author: item.author ?? null,
    title: item.title ?? "Untitled story",
    description: item.description ?? null,
    url: item.url ?? "",
    urlToImage: item.image ?? null,
    publishedAt: item.published ?? new Date().toISOString(),
    content: item.description ?? null,
  };
}

const TOP_HEADLINES_LOOKBACK_MS = 4 * 24 * 60 * 60 * 1000;

function isRecentHeadline(article: ReturnType<typeof mapCurrentsNewsItem>) {
  const publishedAt = new Date(article.publishedAt).getTime();
  if (Number.isNaN(publishedAt)) return false;

  return publishedAt >= Date.now() - TOP_HEADLINES_LOOKBACK_MS;
}

function sortNewestFirst(
  left: ReturnType<typeof mapCurrentsNewsItem>,
  right: ReturnType<typeof mapCurrentsNewsItem>,
) {
  return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
}

export async function GET(req: Request) {
  try {
    // 1. Rate Limiting (60 requests per minute per IP)
    const ip = getClientIp(req);
    const ratelimit = enforceRateLimit(`news_api_${ip}`, 60, 60 * 1000);
    if (!ratelimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ratelimit.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const regionId = searchParams.get("region");
    const region = regionId ? getExploreRegion(regionId) : null;
    const country = region?.country ?? searchParams.get("country");
    const rawPage = Number(searchParams.get("page") || "1");
    const rawPageSize = Number(searchParams.get("pageSize") || "20");
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const pageSize =
      Number.isFinite(rawPageSize) && rawPageSize > 0
        ? Math.min(rawPageSize, 100)
        : 20;

    const baseUrl =
      process.env.NEWS_API_BASE_URL || "https://api.currentsapi.services/v2";
    const apiKey = process.env.NEWS_API_KEY2 || process.env.NEWS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing NEWS API key in environment variables" },
        { status: 500 },
      );
    }

    const params = new URLSearchParams({
      language: "en",
      page_number: String(page),
      page_size: String(pageSize),
      apiKey,
    });

    if (country) {
      params.set("country", country);
    }

    if (category) {
      params.set("category", mapCategoryToCurrents(category));
    }

    const url = `${baseUrl}/latest-news?${params.toString()}`;
    const res = await fetch(url, { 
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message || "Failed to fetch news from provider" },
        { status: res.status }
      );
    }

    const data: NewsResponse = await res.json();

    const articles = (data.news ?? [])
      .map(mapCurrentsNewsItem)
      .filter(isRecentHeadline)
      .sort(sortNewestFirst);

    return NextResponse.json(
      {
        ...data,
        articles,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error: any) {
    console.error("News API Internal Error:", error);
    const status = error.name === "TimeoutError" ? 504 : 500;
    const message = error.name === "TimeoutError" 
      ? "News provider took too long to respond. Please try again."
      : "An unexpected error occurred while fetching news.";
    
    return NextResponse.json({ error: message }, { status });
  }
}
