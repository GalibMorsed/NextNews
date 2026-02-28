import { NextResponse } from "next/server";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

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

    const body = await req.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const source = typeof body?.source === "string" ? body.source.trim() : "";

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
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
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
