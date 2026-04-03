import { NextResponse } from "next/server";
import { getExploreRegion } from "@/lib/explore";
import { getCategoryDisplayName, getCategorySearchConfig } from "@/lib/newsCategories";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const date = searchParams.get("date");
  const category = searchParams.get("category");
  const regionId = searchParams.get("region");
  const region = regionId ? getExploreRegion(regionId) : null;
  const country = (region?.country ?? searchParams.get("country")) || "us";
  const rawPage = Number(searchParams.get("page") || "1");
  const rawPageSize = Number(searchParams.get("pageSize") || "20");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? Math.min(rawPageSize, 100)
      : 20;

  const baseUrl = process.env.NEWS_API_BASE_URL || "https://newsapi.org/v2";
  const apiKey = process.env.NEWS_API_KEY2 || process.env.NEWS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing NEWS API key in environment variables" },
      { status: 500 },
    );
  }

  let url = `${baseUrl}/top-headlines?country=${encodeURIComponent(country)}&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}`;

  if (region && !region.country && !category && !query) {
    url = `${baseUrl}/everything?q=${encodeURIComponent(region.topicQuery)}&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}&sortBy=publishedAt`;
  }

  if (category) {
    const customCategory = getCategorySearchConfig(category);
    if (customCategory) {
      const baseQuery = customCategory.query;
      const scopedQuery = region && region.id !== "world"
        ? `(${baseQuery}) AND ${region.topicQuery}`
        : baseQuery;
      url = `${baseUrl}/everything?q=${encodeURIComponent(scopedQuery)}&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}&sortBy=publishedAt`;
      if (customCategory.searchIn) {
        url += `&searchIn=${encodeURIComponent(customCategory.searchIn)}`;
      }
    } else if (region && !region.country) {
      const categoryQuery = getCategoryDisplayName(category);
      const scopedQuery = region.id !== "world"
        ? `(${categoryQuery}) AND ${region.topicQuery}`
        : categoryQuery;
      url = `${baseUrl}/everything?q=${encodeURIComponent(scopedQuery)}&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}&sortBy=publishedAt`;
    } else {
      url += `&category=${encodeURIComponent(category)}`;
    }
  }

  if (query) {
    const scopedQuery = region && region.id !== "world"
      ? `(${query}) AND ${region.topicQuery}`
      : query;
    url = `${baseUrl}/everything?q=${encodeURIComponent(scopedQuery)}&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}`;
    if (date) {
      url += `&from=${encodeURIComponent(date)}&sortBy=publishedAt`;
    }
  }

  const res = await fetch(url, { next: { revalidate: 60 } });
  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
