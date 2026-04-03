import { NextResponse } from "next/server";
import { enforceRateLimit, getBearerToken, getClientIp, verifySupabaseAccessToken } from "@/lib/apiSecurity";
import { EXPLORE_REGIONS, type ExploreRegionId } from "@/lib/explore";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 6;

type RegionSuggestion = {
  id: ExploreRegionId;
  reason: string;
};

type RegionSuggestionsPayload = {
  selectedRegion?: string;
};

function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

async function fetchHeadlineSignals(): Promise<string[]> {
  const baseUrl = process.env.NEWS_API_BASE_URL || "https://newsapi.org/v2";
  const apiKey = process.env.NEWS_API_KEY2 || process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const url =
    `${baseUrl}/top-headlines?language=en&page=1&pageSize=30&apiKey=${apiKey}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];

  const data = (await response.json()) as {
    articles?: Array<{ title?: string; description?: string }>;
  };

  return (data.articles ?? [])
    .map((article) => `${article.title ?? ""} ${article.description ?? ""}`.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeSuggestions(raw: unknown): RegionSuggestion[] {
  if (!Array.isArray(raw)) return [];

  const allowedRegions = new Map(
    EXPLORE_REGIONS.map((region) => [
      region.id,
      { id: region.id, label: region.label },
    ]),
  );
  const seen = new Set<ExploreRegionId>();
  const normalized: RegionSuggestion[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    const id = safeTrim((item as { id?: unknown }).id) as ExploreRegionId;
    const reason = safeTrim((item as { reason?: unknown }).reason);
    const region = allowedRegions.get(id);

    if (!region || seen.has(region.id)) continue;

    seen.add(region.id);
    normalized.push({
      id: region.id,
      reason:
        reason || `Recent coverage suggests ${region.label} deserves attention right now.`,
    });
  }

  return normalized.slice(0, 3);
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Login required to get AI region suggestions." },
        { status: 401 },
      );
    }

    const user = await verifySupabaseAccessToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired session. Please log in again." },
        { status: 401 },
      );
    }

    const rateLimit = enforceRateLimit(
      `${user.id}:${getClientIp(req)}:region-suggestions`,
      RATE_LIMIT_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many region suggestion requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
        },
        { status: 429 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY in environment variables." },
        { status: 500 },
      );
    }

    const body = (await req.json()) as RegionSuggestionsPayload;
    const selectedRegion = safeTrim(body.selectedRegion) || "world";

    const headlineSignals = await fetchHeadlineSignals();
    const signalText = headlineSignals.length
      ? headlineSignals.map((line, index) => `${index + 1}. ${line}`).join("\n")
      : "No live headline signals available.";

    const prompt = [
      "You are a news exploration assistant.",
      `Today is ${new Date().toISOString().slice(0, 10)}.`,
      `Current selected region: ${selectedRegion}.`,
      "",
      "Allowed regions:",
      EXPLORE_REGIONS.map((region) => `${region.id}: ${region.label}`).join(", "),
      "",
      "Live headline signals:",
      signalText,
      "",
      "Pick exactly 3 regions from the allowed list that look most important or active right now.",
      "Prefer variety and avoid repeating the currently selected region unless it is unusually dominant.",
      "Return ONLY valid JSON with this exact shape:",
      "{",
      '  "suggestions": [',
      '    { "id": "allowed-region-id", "reason": "1 concise sentence" }',
      "  ]",
      "}",
    ].join("\n");

    const upstreamResponse = await fetch(OPENROUTER_ENDPOINT, {
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
            content:
              "You produce concise, accurate region suggestions using current headline signals. JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    const data = await upstreamResponse.json();
    if (!upstreamResponse.ok) {
      const errorMessage =
        data?.error?.message || "Failed to get region suggestions from OpenRouter.";
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "OpenRouter returned an empty region suggestions response." },
        { status: 502 },
      );
    }

    const parsed = extractJsonObject(content);
    const suggestions = normalizeSuggestions(parsed?.suggestions);

    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: "Could not generate region suggestions at this time." },
        { status: 502 },
      );
    }

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
