import { NextResponse } from "next/server";
import { enforceRateLimit, getBearerToken, getClientIp, verifySupabaseAccessToken } from "@/lib/apiSecurity";
import { EXPLORE_REGIONS, type ExploreRegionId } from "@/lib/explore";
import { AI_FREE_LIMIT, evaluateAiUsageAccess } from "@/lib/aiUsageLimit";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 6;

type RegionSuggestion = {
  label: string;
  reason: string;
  query: string;
  countryCode: string;
  mappedRegionId?: ExploreRegionId;
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

  const knownRegions = new Map(
    EXPLORE_REGIONS.map((region) => [
      region.id,
      { id: region.id, label: region.label },
    ]),
  );
  const seen = new Set<string>();
  const normalized: RegionSuggestion[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    const id = safeTrim((item as { id?: unknown }).id) as ExploreRegionId;
    const label = safeTrim((item as { label?: unknown }).label);
    const reason = safeTrim((item as { reason?: unknown }).reason);
    const query = safeTrim((item as { query?: unknown }).query);
    const countryCode = safeTrim(
      (item as { countryCode?: unknown }).countryCode,
    ).toUpperCase();
    const mappedRegionId = safeTrim(
      (item as { mappedRegionId?: unknown }).mappedRegionId,
    ) as ExploreRegionId;
    const mappedRegion = knownRegions.get(mappedRegionId);
    const legacyRegion = knownRegions.get(id);
    const resolvedLabel = label || mappedRegion?.label || legacyRegion?.label;
    const resolvedQuery = query || resolvedLabel;

    if (
      !resolvedLabel ||
      !resolvedQuery ||
      !/^[A-Z]{2}$/.test(countryCode)
    ) {
      continue;
    }

    const dedupeKey = `${resolvedLabel.toLowerCase()}::${resolvedQuery.toLowerCase()}`;

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    normalized.push({
      label: resolvedLabel,
      reason:
        reason ||
        `Recent coverage suggests ${resolvedLabel} deserves attention right now.`,
      query: resolvedQuery,
      countryCode,
      mappedRegionId: mappedRegion?.id || legacyRegion?.id,
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

    const access = await evaluateAiUsageAccess(token);
    if (access.isLocked) {
      if (access.hasPaidPlan) {
        return NextResponse.json(
          { error: `You've reached your plan limit of ${access.limit} usages. Upgrade your plan to continue.` },
          { status: 403 },
        );
      }

      if (access.totalAIUsage >= 100) {
        return NextResponse.json(
          { error: "You've reached the total free limit of 100 AI usages. Activate a plan to unlock permanently." },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          error: `You've reached your free limit of ${access.limit} AI usages. Upgrade or wait for the cooldown to continue.`,
        },
        { status: 403 },
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
      "Known explore tabs you may optionally map to:",
      EXPLORE_REGIONS.map((region) => `${region.id}: ${region.label}`).join(", "),
      "",
      "Live headline signals:",
      signalText,
      "",
      "Pick exactly 3 regions, countries, or subregions that look most important or active right now.",
      "Do not limit yourself to the existing explore tabs.",
      "Base your answer on the live headline signals and choose the strongest current hotspots.",
      "Prefer specific places when the story is concentrated there, like a country, territory, or conflict zone.",
      "If one suggestion clearly belongs to an existing explore tab, include that tab in mappedRegionId. Otherwise use \"world\".",
      "For each suggestion include countryCode as a 2-letter uppercase code usable by a flag library.",
      "Use the most recognized flag for the named place. Examples: Ukraine=UA, Taiwan=TW, Gaza=PS, Kosovo=XK, Europe=EU, World=UN.",
      "Prefer variety and avoid repeating the currently selected region unless it is unusually dominant.",
      "Return ONLY valid JSON with this exact shape:",
      "{",
      '  "suggestions": [',
      '    { "label": "specific region name", "query": "search query for that region", "countryCode": "US", "mappedRegionId": "world", "reason": "1 concise sentence" }',
      "  ]",
      "}",
    ].join("\n");

    const upstreamResponse = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL || "https://www.nextnews.co.in",
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
        max_tokens: 500,
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
