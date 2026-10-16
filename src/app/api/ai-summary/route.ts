import { NextResponse } from "next/server";
import {
  enforceRateLimit,
  getBearerToken,
  getClientIp,
  verifySupabaseAccessToken,
} from "@/lib/apiSecurity";
import { AI_FREE_LIMIT, evaluateAiUsageAccess } from "@/lib/aiUsageLimit";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MAX_FIELD_LENGTH = 4000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 8;

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Login required to use AI summaries." },
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
      `${user.id}:${getClientIp(req)}:ai-summary`,
      RATE_LIMIT_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many AI summary requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
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

    const body = await req.json();
    const title = typeof body?.title === "string"
      ? body.title.trim().slice(0, MAX_FIELD_LENGTH)
      : "";
    const description =
      typeof body?.description === "string"
        ? body.description.trim().slice(0, MAX_FIELD_LENGTH)
        : "";
    const content = typeof body?.content === "string"
      ? body.content.trim().slice(0, MAX_FIELD_LENGTH)
      : "";
    const source = typeof body?.source === "string"
      ? body.source.trim().slice(0, 200)
      : "";

    if (!title && !description && !content) {
      return NextResponse.json(
        { error: "No article content provided for summarization." },
        { status: 400 },
      );
    }

    const prompt = [
      `Title: ${title || "N/A"}`,
      `Source: ${source || "N/A"}`,
      `Description: ${description || "N/A"}`,
      `Content: ${content || "N/A"}`,
      "",
      "Summarize this news article in 4 to 5 concise bullet points.",
      "Focus only on key facts and avoid speculation.",
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
              "You are a strict news summarizer. Return plain text bullet points only.",
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
        data?.error?.message || "Failed to get summary from OpenRouter.";
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    const summary = data?.choices?.[0]?.message?.content;
    if (typeof summary !== "string" || !summary.trim()) {
      return NextResponse.json(
        { error: "OpenRouter returned an empty summary." },
        { status: 502 },
      );
    }

    return NextResponse.json({ summary: summary.trim() }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
