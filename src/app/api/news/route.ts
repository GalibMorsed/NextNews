import { NextResponse } from "next/server";
import { getCategorySearchConfig } from "@/lib/newsCategories";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const date = searchParams.get("date");
  const category = searchParams.get("category");
  const country = searchParams.get("country") || "us";
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

  if (category) {
    const customCategory = getCategorySearchConfig(category);
    if (customCategory) {
      url = `${baseUrl}/everything?q=${encodeURIComponent(customCategory.query)}&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}&sortBy=publishedAt`;
      if (customCategory.searchIn) {
        url += `&searchIn=${encodeURIComponent(customCategory.searchIn)}`;
      }
    } else {
      url += `&category=${encodeURIComponent(category)}`;
    }
  }

  if (query) {
    url = `${baseUrl}/everything?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}`;
    if (date) {
      url += `&from=${encodeURIComponent(date)}&sortBy=publishedAt`;
    }
  }

  const res = await fetch(url, { next: { revalidate: 60 } });
  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
