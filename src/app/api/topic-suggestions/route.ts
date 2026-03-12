import { NextResponse } from "next/server";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

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
  availableTopics: string[],
): TopicSuggestion[] {
  if (!Array.isArray(raw)) return [];

  const allowedTopics = new Set(availableTopics.map((topic) => topic.trim()));
  const seen = new Set<string>();
  const normalized: TopicSuggestion[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    const topic = typeof (item as { topic?: unknown }).topic === "string"
      ? (item as { topic: string }).topic.trim()
      : "";
    const whyNow = typeof (item as { whyNow?: unknown }).whyNow === "string"
      ? (item as { whyNow: string }).whyNow.trim()
      : "";
    const whatToWatch =
      typeof (item as { whatToWatch?: unknown }).whatToWatch === "string"
        ? (item as { whatToWatch: string }).whatToWatch.trim()
        : "";

    if (!topic || !allowedTopics.has(topic) || seen.has(topic)) continue;

    seen.add(topic);
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
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY in environment variables." },
        { status: 500 },
      );
    }

    const body = (await req.json()) as TopicSuggestionsPayload;
    const availableTopics = Array.isArray(body.availableTopics)
      ? body.availableTopics.map((topic) => topic.trim()).filter(Boolean)
      : [];
    const selectedTopics = Array.isArray(body.selectedTopics)
      ? body.selectedTopics.map((topic) => topic.trim()).filter(Boolean)
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
      "Choose the best currently trending topics from ONLY this allowed list:",
      availableTopics.join(", "),
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
      '    { "topic": "Topic from allowed list", "whyNow": "Simple explanation (1-2 lines)", "whatToWatch": "Simple follow-up guidance (1 line)", "confidence": "high|medium|low" }',
      "  ]",
      "}",
      "Return 6 to 8 suggestions, easy to understand.",
    ].join("\n");

    const upstreamResponse = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "NextNews",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You produce concise, accurate topic suggestions using current headline signals. JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
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
    const suggestions = normalizeSuggestions(parsed?.suggestions, availableTopics);

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
