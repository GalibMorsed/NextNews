import { NextResponse } from "next/server";
import {
  enforceRateLimit,
  getBearerToken,
  getClientIp,
  verifySupabaseAccessToken,
} from "@/lib/apiSecurity";
import { AI_FREE_LIMIT, evaluateAiUsageAccess } from "@/lib/aiUsageLimit";
import {
  AVAILABLE_PERSONALIZATION_TOPICS,
  sanitizePersonalizationTopic,
} from "@/lib/personalizationTopics";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 6;

type TopicSuggestion = {
  topic: string;
  whyNow: string;
  whatToWatch: string;
  confidence: "high" | "medium" | "low";
};

type TopicSuggestionsPayload = {
  availableTopics: string[];
  selectedTopics: string[];
  country?: string;
};

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

function normalizeConfidence(value: unknown): "high" | "medium" | "low" {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}

function normalizeSuggestions(
  raw: unknown,
  selectedTopics: string[],
): TopicSuggestion[] {
  if (!Array.isArray(raw)) return [];

  const selectedTopicSet = new Set(
    selectedTopics.map((topic) => topic.toLowerCase()),
  );
  const seen = new Set<string>();
  const normalized: TopicSuggestion[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    const topic = typeof (item as { topic?: unknown }).topic === "string"
      ? sanitizePersonalizationTopic((item as { topic: string }).topic)
      : "";
    const whyNow = typeof (item as { whyNow?: unknown }).whyNow === "string"
      ? (item as { whyNow: string }).whyNow.trim()
      : "";
    const whatToWatch =
      typeof (item as { whatToWatch?: unknown }).whatToWatch === "string"
        ? (item as { whatToWatch: string }).whatToWatch.trim()
        : "";

    const topicKey = topic.toLowerCase();

    if (
      !topic ||
      topic.length < 3 ||
      selectedTopicSet.has(topicKey) ||
      seen.has(topicKey)
    ) {
      continue;
    }

    seen.add(topicKey);
    normalized.push({
      topic,
      whyNow: whyNow || "This topic is currently receiving notable coverage.",
      whatToWatch:
        whatToWatch ||
        "Watch for major updates, policy changes, and expert analysis.",
      confidence: normalizeConfidence((item as { confidence?: unknown }).confidence),
    });
  }

  return normalized.slice(0, 6);
}

function normalizeAllowedTopics(raw: unknown): string[] {
  const canonicalTopicSet = new Set<string>(AVAILABLE_PERSONALIZATION_TOPICS);
  const requestedTopics = Array.isArray(raw)
    ? raw.map((topic) => (typeof topic === "string" ? topic.trim() : ""))
    : [];

  const requestedTopicSet = new Set(
    requestedTopics.filter((topic) => canonicalTopicSet.has(topic)),
  );

  return AVAILABLE_PERSONALIZATION_TOPICS.filter((topic) =>
    requestedTopicSet.has(topic),
  );
}

async function fetchHeadlineSignals(country: string): Promise<string[]> {
  const baseUrl = process.env.NEWS_API_BASE_URL || "https://newsapi.org/v2";
  const apiKey = process.env.NEWS_API_KEY2 || process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const url =
    `${baseUrl}/top-headlines?country=${encodeURIComponent(country)}&page=1&pageSize=30&apiKey=${apiKey}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];

  const data = (await response.json()) as {
    articles?: Array<{ title?: string; description?: string }>;
  };

  return (data.articles ?? [])
    .map((article) => `${article.title ?? ""} ${article.description ?? ""}`.trim())
    .filter((line) => line.length > 0)
    .slice(0, 25);
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Login required to get AI topic suggestions." },
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
      `${user.id}:${getClientIp(req)}:topic-suggestions`,
      RATE_LIMIT_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many suggestion requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
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

    const body = (await req.json()) as TopicSuggestionsPayload;
    const availableTopics = normalizeAllowedTopics(body.availableTopics);
    const selectedTopics = Array.isArray(body.selectedTopics)
      ? body.selectedTopics
          .map((topic) =>
            typeof topic === "string" ? sanitizePersonalizationTopic(topic) : "",
          )
          .filter(Boolean)
      : [];
    const country = typeof body.country === "string" && body.country.trim()
      ? body.country.trim().toLowerCase()
      : "us";

    if (availableTopics.length === 0) {
      return NextResponse.json(
        { error: "No available topics were provided." },
        { status: 400 },
      );
    }

    const headlineSignals = await fetchHeadlineSignals(country);
    const signalText = headlineSignals.length
      ? headlineSignals.map((line, index) => `${index + 1}. ${line}`).join("\n")
      : "No live headline signals available.";

    const prompt = [
      "You are a news personalization advisor.",
      `Today is ${new Date().toISOString().slice(0, 10)}.`,
      `Country preference: ${country.toUpperCase()}`,
      "",
      "Start with these in-app topics:",
      availableTopics.join(", "),
      "You may also suggest a small number of new custom topics when live headline signals make them clearly useful right now.",
      "Custom topic rules: short news topic labels, 2 to 4 words when possible, no clickbait, no full article titles, no duplicates of the selected topics.",
      "",
      "User currently selected topics:",
      selectedTopics.length > 0 ? selectedTopics.join(", ") : "None",
      "",
      "Live headline signals:",
      signalText,
      "",
      "Return ONLY valid JSON with this exact shape:",
      "{",
      '  "suggestions": [',
      '    { "topic": "Existing or new topic label", "whyNow": "Simple explanation (1-2 lines)", "whatToWatch": "Simple follow-up guidance (1 line)", "confidence": "high|medium|low" }',
      "  ]",
      "}",
      "Return up to 6 suggestions, easy to understand.",
      "Prefer 3 to 4 existing in-app topics and up to 2 new custom topics when justified by the headline signals.",
      "Each whyNow and whatToWatch must be related to its exact topic.",
    ].join("\n");

    const upstreamResponse = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://www.nextnews.co.in",
        "X-Title": process.env.OPENROUTER_APP_NAME || "NextNews",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You produce concise, accurate news topic suggestions using current headline signals. You can suggest existing in-app topics and timely custom topic labels. JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    const data = await upstreamResponse.json();
    if (!upstreamResponse.ok) {
      const errorMessage =
        data?.error?.message || "Failed to get topic suggestions from OpenRouter.";
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "OpenRouter returned an empty suggestions response." },
        { status: 502 },
      );
    }

    const parsed = extractJsonObject(content);
    const suggestions = normalizeSuggestions(parsed?.suggestions, selectedTopics);

    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: "Could not generate topic suggestions at this time." },
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
