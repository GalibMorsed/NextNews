// @ts-ignore Deno resolves remote modules at runtime in Edge Functions.
// @ts-nocheck
// Deno Edge Functions resolve remote imports and globals at runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
    env: {
        get(name: string): string | undefined;
    };
    serve(
        handler: (request: Request) => Response | Promise<Response>,
    ): void;
};

type NewsApiArticle = {
    source?: { name?: string | null } | null;
    title?: string | null;
    description?: string | null;
    url?: string | null;
    urlToImage?: string | null;
    publishedAt?: string | null;
};

type NewsApiResponse = {
    status?: string;
    message?: string;
    articles?: NewsApiArticle[];
};

type NormalizedArticle = {
    title: string;
    url: string;
    description: string;
    source: string;
    publishedAt: string;
    imageUrl: string;
    category: string;
    score: number;
};

type TrendingCategory = {
    name: string;
    reason: string;
};

const RESEND_BATCH_ENDPOINT = "https://api.resend.com/emails/batch";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_COUNTRY = "us";
const DEFAULT_MAX_ARTICLES = 4;
const DEFAULT_MAX_RECIPIENTS = 100;
const DEFAULT_CATEGORY_PAGE_SIZE = 6;
const DEFAULT_NEWS_CATEGORIES = [
    "general",
    "technology",
    "business",
    "entertainment",
    "health",
    "science",
    "sports",
];
const RESEND_BATCH_SIZE = 100;
const LIST_USERS_PER_PAGE = 100;
const MAX_USER_PAGES = 100;

function getEnv(name: string): string {
    const value = Deno.env.get(name)?.trim();
    if (!value) throw new Error(`Missing required env var: ${name}`);
    return value;
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number) {
    if (!value) return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(Math.floor(parsed), max);
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
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

function toTitleCase(value: string) {
    return value
        .split(/\s|-/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatCategoryLabel(category: string) {
    if (category === "general") return "Top";
    return toTitleCase(category);
}

function normalizeCategory(value: string, allowed: Set<string>) {
    const normalized = value.trim().toLowerCase();
    if (normalized === "top") return "general";
    if (allowed.has(normalized)) return normalized;
    for (const entry of allowed) {
        if (formatCategoryLabel(entry).toLowerCase() === normalized) return entry;
    }
    return null;
}

function parseCategoryList(value: string | undefined) {
    const allowed = new Set(DEFAULT_NEWS_CATEGORIES);
    const entries = (value || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

    const normalized = entries
        .map((entry) => normalizeCategory(entry, allowed))
        .filter((entry): entry is string => Boolean(entry));

    const unique = Array.from(new Set(normalized));
    return unique.length > 0 ? unique : DEFAULT_NEWS_CATEGORIES.slice();
}

function rotateByDay(items: string[], date = new Date()) {
    if (items.length <= 1) return items;
    const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
    const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
    const offset = dayOfYear % items.length;
    return items.slice(offset).concat(items.slice(0, offset));
}

function buildHeadlineSignals(articles: NormalizedArticle[], limit: number) {
    return articles
        .slice(0, limit)
        .map((article, index) => {
            const source = article.source || "Unknown";
            return `${index + 1}. ${article.title} (${source})`;
        })
        .join("\n");
}

function getBearerToken(request: Request): string | null {
    const authHeader = request.headers.get("authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
    const token = authHeader.slice(7).trim();
    return token || null;
}

function getApiKeyHeader(request: Request): string | null {
    const apiKeyHeader = request.headers.get("apikey")?.trim();
    return apiKeyHeader || null;
}

function getProjectRefFromSupabaseUrl(url: string): string | null {
    try {
        const host = new URL(url).hostname;
        return host.split(".")[0] || null;
    } catch {
        return null;
    }
}

function decodeBase64Url(value: string): string | null {
    try {
        const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
        const padLength = normalized.length % 4;
        const padded = padLength === 0 ? normalized : normalized + "=".repeat(4 - padLength);
        return atob(padded);
    } catch {
        return null;
    }
}

function isProjectAnonJwt(token: string, projectRef: string): boolean {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payloadRaw = decodeBase64Url(parts[1]);
    if (!payloadRaw) return false;

    try {
        const payload = JSON.parse(payloadRaw) as { role?: string; ref?: string };
        return payload.role === "anon" && payload.ref === projectRef;
    } catch {
        return false;
    }
}

function getNewsApiKey() {
    const apiKey =
        Deno.env.get("NEWS_API_KEY")?.trim() ||
        Deno.env.get("NEWS_API_KEY2")?.trim() ||
        Deno.env.get("NEWS_API_KEY3")?.trim();

    if (!apiKey) {
        throw new Error(
            "Missing NEWS API key. Set NEWS_API_KEY2 (or NEWS_API_KEY / NEWS_API_KEY3).",
        );
    }

    return apiKey;
}

function computeArticleScore(
    article: { publishedAt: string; description: string; title: string },
    nowMs: number,
) {
    const publishedMs = Date.parse(article.publishedAt);
    const ageHours = Number.isFinite(publishedMs)
        ? Math.max(0, (nowMs - publishedMs) / 3600000)
        : 24;
    const recencyScore = Math.max(0, 1 - ageHours / 48);
    const descriptionScore = Math.min(article.description.length / 140, 1);
    const titleScore = Math.min(article.title.length / 90, 1);
    return recencyScore * 0.6 + descriptionScore * 0.25 + titleScore * 0.15;
}

async function fetchCategoryHeadlines(
    country: string,
    category: string,
    pageSize: number,
    apiKey: string,
) {
    const baseUrl = Deno.env.get("NEWS_API_BASE_URL")?.trim() || "https://newsapi.org/v2";
    const endpoint =
        `${baseUrl}/top-headlines?country=${encodeURIComponent(country)}` +
        `&category=${encodeURIComponent(category)}` +
        `&page=1&pageSize=${pageSize}&apiKey=${apiKey}`;
    const response = await fetch(endpoint, { cache: "no-store" });
    const payload = (await response.json()) as NewsApiResponse;

    if (!response.ok) {
        throw new Error(payload.message || `Failed to fetch headlines (${response.status}).`);
    }

    const nowMs = Date.now();
    const normalized = Array.isArray(payload.articles)
        ? payload.articles
            .map((article) => {
                const title = (article.title ?? "").trim();
                const url = (article.url ?? "").trim();

                if (!title || !url) return null;

                const description = (article.description ?? "").trim();
                const publishedAt = (article.publishedAt ?? "").trim();
                const score = computeArticleScore({
                    publishedAt,
                    description,
                    title,
                }, nowMs);

                return {
                    title,
                    url,
                    description,
                    source: (article.source?.name ?? "Unknown source").trim() || "Unknown source",
                    publishedAt,
                    imageUrl: (article.urlToImage ?? "").trim(),
                    category,
                    score,
                };
            })
            .filter((article): article is NormalizedArticle => Boolean(article))
        : [];

    return normalized;
}

function computeCategoryHotness(articles: NormalizedArticle[]) {
    if (!articles.length) return 0;
    const top = [...articles]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    const average = top.reduce((sum, item) => sum + item.score, 0) / top.length;
    const volumeBoost = Math.min(articles.length / 6, 1) * 0.25;
    return average + volumeBoost;
}

function rankArticles(
    categoryScores: Record<string, number>,
    articles: NormalizedArticle[],
) {
    return articles
        .map((article) => ({
            ...article,
            score: article.score + (categoryScores[article.category] || 0) * 0.35,
        }))
        .sort((a, b) => b.score - a.score);
}

async function fetchTrendingHeadlines(
    country: string,
    categories: string[],
    pageSize: number,
) {
    const apiKey = getNewsApiKey();
    const requests = categories.map(async (category) => {
        try {
            const articles = await fetchCategoryHeadlines(country, category, pageSize, apiKey);
            return { category, articles };
        } catch {
            return { category, articles: [] };
        }
    });

    const results = await Promise.all(requests);
    const categoryScores: Record<string, number> = {};
    const allArticles: NormalizedArticle[] = [];

    for (const result of results) {
        categoryScores[result.category] = computeCategoryHotness(result.articles);
        allArticles.push(...result.articles);
    }

    return { categoryScores, allArticles };
}

async function suggestCategoriesWithOpenRouter(
    country: string,
    categories: string[],
    headlineSignals: string,
): Promise<TrendingCategory[] | null> {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY")?.trim();
    if (!apiKey) return null;
    const model = Deno.env.get("OPENROUTER_MODEL")?.trim() || "anthropic/claude-opus-5.5";

    try {
        const prompt = [
            "You are a news recommendation assistant.",
            `Today is ${new Date().toISOString().slice(0, 10)}.`,
            `Country: ${country.toUpperCase()}.`,
            "Based on the headlines provided, identify 4 to 5 highly specific real-world trending topics or situations (NOT generic categories).",
            "Example names: 'Global Chip Shortage', 'Fed Interest Rate Shift', 'Nvidia Stock Surge'.",
            "For each topic, provide a very short, catchy reason (max 6 words) explaining why it's trending.",
            "",
            "Live headline signals:",
            headlineSignals || "No headline signals available.",
            "",
            "Return ONLY valid JSON with this exact shape:",
            "{",
            '  "categories": [',
            '    { "name": "Topic Name", "reason": "Short catchy reason" }',
            '  ]',
            "}",
        ].join("\n");

        const response = await fetch(OPENROUTER_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer":
                    Deno.env.get("OPENROUTER_SITE_URL")?.trim() ||
                    "https://www.nextnews.co.in",
                "X-Title": Deno.env.get("OPENROUTER_APP_NAME")?.trim() || "NextNews",
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: "system",
                        content: "Return JSON only. Categories must be from the allowed list. Reasons must be catchy and informative.",
                    },
                    { role: "user", content: prompt },
                ],
                temperature: 0.3,
            }),
        });

        const data = await response.json();
        if (!response.ok) return null;
        const content = data?.choices?.[0]?.message?.content;
        if (!content) return null;

        const parsed = extractJsonObject(content);
        const raw = Array.isArray(parsed?.categories) ? parsed?.categories : [];
        const allowed = new Set(categories);

        const results: TrendingCategory[] = [];
        const seen = new Set<string>();

        for (const entry of raw) {
            if (typeof entry !== "object" || !entry) continue;
            const name = entry.name?.trim();
            const reason = entry.reason?.trim();
            if (!name || !reason) continue;

            if (!seen.has(name.toLowerCase())) {
                results.push({
                    name: name,
                    reason: reason,
                });
                seen.add(name.toLowerCase());
            }
        }

        return results.length ? results : null;
    } catch {
        return null;
    }
}

function buildDigestSubject() {
    const dateLabel = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    }).format(new Date());

    return `Your Morning Top Headlines - ${dateLabel}`;
}

function buildDigestHtml(
    articles: Array<{
        title: string;
        url: string;
        description: string;
        source: string;
        publishedAt: string;
        imageUrl: string;
        category: string;
    }>,
    categories: TrendingCategory[],
) {
    const appUrl = "https://www.nextnews.co.in/";
    const exploreUrl = `${appUrl}explore`;
    const logoUrl = "https://res.cloudinary.com/dyettbmfd/image/upload/v1778330835/logo1_nwshmu.png";
    const privacyUrl = "https://www.nextnews.co.in/privacy-policy";
    const termsUrl = "https://www.nextnews.co.in/terms-and-conditions";
    const supportUrl = "https://www.nextnews.co.in/support";

    const dateLabel = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date());

    const headlineItems = articles
        .map((article) => {
            const sourceText = escapeHtml(article.source);
            const titleText = escapeHtml(article.title);
            const descriptionText = escapeHtml(article.description || "Click to read the full story on NextNews.");
            const categoryText = escapeHtml(formatCategoryLabel(article.category));
            const storyUrl = /^https?:\/\//i.test(article.url) ? article.url : appUrl;
            const storyHref = escapeHtml(storyUrl);
            const publishedText = article.publishedAt
                ? `<span style="color: #6b7280; font-size: 11px; display: inline-block;">${escapeHtml(new Date(article.publishedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }))}</span>`
                : "";

            const imageHtml = article.imageUrl
                ? `<a href="${storyHref}" target="_blank" rel="noopener" style="display: block; text-decoration: none;">
                     <img src="${escapeHtml(article.imageUrl)}" alt="${titleText}" style="width: 100%; height: 220px; object-fit: cover; display: block;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';"/>
                   </a>`
                : `<a href="${storyHref}" target="_blank" rel="noopener" style="display: block; text-decoration: none;">
                     <div style="width: 100%; height: 120px; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center;">
                       <span style="color: #9ca3af; font-size: 14px; font-weight: 600;">NextNews</span>
                     </div>
                   </a>`;

            return `
            <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-bottom: 24px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                ${imageHtml}
                <div style="padding: 20px;">
                    <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <span style="background-color: #f3f4f6; color: #4b5563; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">${categoryText}</span>
                        <div style="flex-grow: 1; text-align: right;">${publishedText}</div>
                    </div>
                    <h2 style="margin: 0 0 10px; font-size: 20px; line-height: 1.3; font-weight: 800;">
                        <a href="${storyHref}" target="_blank" rel="noopener" style="color: #111827; text-decoration: none;">${titleText}</a>
                    </h2>
                    <p style="margin: 0 0 16px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                        ${descriptionText}
                    </p>
                    <div style="border-top: 1px solid #f3f4f6; padding-top: 16px;">
                        <a href="${storyHref}" target="_blank" rel="noopener" style="color: #2563eb; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center;">Read Full Story</a>
                    </div>
                </div>
            </div>`;
        })
        .join("\n");

    const categoriesHtml = categories.map((cat) => {
        const searchUrl = `${exploreUrl}?q=${encodeURIComponent(cat.name)}&context=${encodeURIComponent(cat.reason)}`;
        return `
        <a href="${escapeHtml(searchUrl)}" style="text-decoration: none; display: block;">
            <div style="text-align: left; padding: 12px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6; margin-bottom: 12px;">
                <div style="font-weight: 800; color: #111827; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 6px; height: 6px; background-color: #2563eb; border-radius: 50%;"></span>
                    ${escapeHtml(cat.name)}
                </div>
                <div style="color: #6b7280; font-size: 13px; line-height: 1.4;">${escapeHtml(cat.reason)}</div>
            </div>
        </a>
    `;
    }).join("");

    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NextNews Daily Digest</title>
    </head>
    <body style="margin:0;padding:20px 0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="width:100%;max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align:center;padding:48px 24px 24px;background-color:#ffffff;">
                <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Morning Digest For You</p>
                <h1 style="margin:0 0 10px;color:#111827;font-size:38px;font-weight:800;font-family:'Georgia',serif;letter-spacing:-1px;">NextNews Daily</h1>
                <p style="margin:0 0 32px;color:#64748b;font-size:14px;font-weight:500;">${dateLabel}</p>
                
                <hr style="border:0;border-top:1px solid #e2e8f0;margin:0 0 32px 0;">
                
                <h3 style="margin:0 0 16px;color:#64748b;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Today's Highlights</h3>
            </div>

            <div style="padding: 24px;">
                <!-- Articles -->
                <div style="margin-bottom: 32px;">
                    ${headlineItems}
                </div>

                <!-- Trending Categories -->
                <div style="background-color:#ffffff;border-radius:12px;padding:24px;border:2px solid #f1f5f9;text-align:center;margin-bottom:32px;">
                    <div style="margin-bottom: 20px;">
                        <h2 style="margin:0 0 6px;font-size:22px;color:#111827;font-weight:800;">🔥 Today's Recommendations</h2>
                        <p style="margin:0;color:#64748b;font-size:14px;font-weight:500;">AI-curated based on current global coverage.</p>
                    </div>
                    
                    <div style="margin-bottom:16px;">
                        ${categoriesHtml}
                    </div>
                    
                    <a href="${exploreUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 6px -1px rgba(37,99,235,0.2);">Explore Categories</a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #e0f2fe; padding: 50px 20px; text-align: center; border-top: 2px solid #bae6fd; border-radius: 0 0 16px 16px;">
                <a href="${appUrl}" style="display: inline-block; margin-bottom: 24px; text-decoration: none;">
                    <img src="${logoUrl}" alt="NextNews" style="height: 42px; width: auto; max-width: 100%; border-radius: 4px;" onerror="this.style.display='none';">
                </a>
                
                <p style="margin: 0 auto 28px; color: #64748b; font-size: 14px; line-height: 1.6; max-width: 480px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    NextNews delivers the world's most critical news updates with AI-powered recommendations. Stay informed, stay ahead, and make smarter decisions every day.
                </p>
                
                <div style="margin-bottom: 36px; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                    <a href="${privacyUrl}" style="color: #64748b; text-decoration: underline;">Policy</a>
                    <span style="margin: 0 10px; color: #94a3b8;">&middot;</span>
                    <a href="${termsUrl}" style="color: #64748b; text-decoration: underline;">T&C</a>
                    <span style="margin: 0 10px; color: #94a3b8;">&middot;</span>
                    <a href="${supportUrl}" style="color: #64748b; text-decoration: underline;">Support</a>
                </div>
                
                <div style="border-top: 1px solid #bae6fd; margin: 0 auto; padding-top: 28px; color: #64748b; font-size: 13px; font-weight: 500; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <p style="margin: 0 0 8px;">&copy; 2026 NextNews. All rights reserved.</p>
                    <p style="margin: 0;">You're receiving this email because you're a registered member of NextNews.</p>
                </div>
            </div>
        </div>
    </body>
</html>`;
}

function buildDigestText(
    articles: Array<{
        title: string;
        url: string;
        description: string;
        source: string;
        publishedAt: string;
        imageUrl: string;
        category: string;
    }>,
    categories: TrendingCategory[],
) {
    const appUrl = "https://www.nextnews.co.in/";
    const privacyUrl = "https://www.nextnews.co.in/privacy-policy";
    const termsUrl = "https://www.nextnews.co.in/terms-and-conditions";
    const supportUrl = "https://www.nextnews.co.in/support";
    const now = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date());

    const lines = [
        "NEXTNEWS MORNING BRIEF",
        "Your AI-Powered Daily News Update",
        "-----------------------------------------",
        `Date: ${now}`,
        "-----------------------------------------",
        "",
        "TOP STORIES",
        "===================",
        "",
    ];

    articles.forEach((article) => {
        const storyUrl = /^https?:\/\//i.test(article.url) ? article.url : appUrl;
        const categoryLabel = formatCategoryLabel(article.category).toUpperCase();
        lines.push(`[${categoryLabel}] ${article.title.toUpperCase()}`);

        if (article.description) {
            const desc = article.description.length > 200
                ? article.description.slice(0, 197) + "..."
                : article.description;
            lines.push(desc);
        }

        lines.push(`Go to story: ${storyUrl}`);
        lines.push("");
    });

    lines.push("-----------------------------------------");
    lines.push("🔥 TRENDING TOPICS TODAY");
    lines.push("-----------------------------------------");
    lines.push("");

    categories.forEach(cat => {
        lines.push(`• ${cat.name.toUpperCase()}`);
        lines.push(`  ${cat.reason}`);
        lines.push("");
    });

    lines.push(`Explore more in the app: ${appUrl}explore`);
    lines.push("");
    lines.push("-----------------------------------------");
    lines.push("NextNews - AI-powered news updates.");
    lines.push("Visit us: https://www.nextnews.co.in");
    lines.push("");
    lines.push("Legal Information:");
    lines.push(`- Privacy Policy: ${privacyUrl}`);
    lines.push(`- Terms & Conditions: ${termsUrl}`);
    lines.push(`- Support: ${supportUrl}`);
    lines.push("");
    lines.push("You are receiving this because you are a registered user of NextNews.");
    lines.push("© 2026 NextNews. All rights reserved.");

    return lines.join("\n");
}

async function listRegisteredEmails(
    adminClient: ReturnType<typeof createClient>,
    requireConfirmedEmail: boolean,
) {
    const recipients = new Set<string>();

    for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
        const { data, error } = await adminClient.auth.admin.listUsers({
            page,
            perPage: LIST_USERS_PER_PAGE,
        });

        if (error) {
            throw new Error(`Failed to list users: ${error.message}`);
        }

        const users = data?.users ?? [];
        if (!users.length) break;

        for (const user of users) {
            const email = user.email?.trim().toLowerCase();
            if (!email) continue;
            if (requireConfirmedEmail && !user.email_confirmed_at) continue;
            recipients.add(email);
        }

        if (users.length < LIST_USERS_PER_PAGE) break;
    }

    return Array.from(recipients);
}

async function sendDigestBatch(
    resendApiKey: string,
    fromAddress: string,
    subject: string,
    html: string,
    text: string,
    recipients: string[],
) {
    if (!recipients.length) return;

    const payload = recipients.map((email) => ({
        from: fromAddress,
        to: [email],
        subject,
        html,
        text,
    }));

    const response = await fetch(RESEND_BATCH_ENDPOINT, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend batch send failed (${response.status}): ${body}`);
    }
}

Deno.serve(async (request: Request) => {
    try {
        if (request.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405 });
        }

        const supabaseUrl = getEnv("SUPABASE_URL");
        const projectRef = getProjectRefFromSupabaseUrl(supabaseUrl);
        const anonKey = getEnv("SUPABASE_ANON_KEY");
        const bearerToken = getBearerToken(request);
        const apiKeyHeader = getApiKeyHeader(request);
        const providedToken = bearerToken || apiKeyHeader;
        const matchesAnonSecret = Boolean(providedToken && providedToken === anonKey);
        const matchesProjectAnon = Boolean(
            projectRef && providedToken && isProjectAnonJwt(providedToken, projectRef),
        );

        if (!matchesAnonSecret && !matchesProjectAnon) {
            return new Response(
                "Unauthorized. Use SUPABASE_ANON_KEY in Authorization Bearer header (or apikey header).",
                { status: 401 },
            );
        }

        const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
        const resendApiKey = getEnv("RESEND_API_KEY");
        const resendFromEmail = getEnv("RESEND_FROM_EMAIL");
        const resendFromName = Deno.env.get("RESEND_FROM_NAME")?.trim();

        const requireConfirmedEmail =
            (Deno.env.get("DAILY_DIGEST_REQUIRE_CONFIRMED_EMAIL") ?? "true")
                .trim()
                .toLowerCase() !== "false";
        const maxArticles = parsePositiveInt(
            Deno.env.get("DAILY_DIGEST_MAX_ARTICLES")?.trim(),
            DEFAULT_MAX_ARTICLES,
            20,
        );
        const categoryPageSize = parsePositiveInt(
            Deno.env.get("DAILY_DIGEST_CATEGORY_PAGE_SIZE")?.trim(),
            DEFAULT_CATEGORY_PAGE_SIZE,
            20,
        );
        const maxRecipients = parsePositiveInt(
            Deno.env.get("DAILY_DIGEST_MAX_RECIPIENTS")?.trim(),
            DEFAULT_MAX_RECIPIENTS,
            50000,
        );
        const categoryList = parseCategoryList(
            Deno.env.get("DAILY_DIGEST_NEWS_CATEGORIES")?.trim(),
        );
        const country =
            Deno.env.get("DAILY_DIGEST_NEWS_COUNTRY")?.trim().toLowerCase() ||
            DEFAULT_COUNTRY;

        const resendFromAddress = resendFromName
            ? `${resendFromName} <${resendFromEmail}>`
            : resendFromEmail;

        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        const allEmails = await listRegisteredEmails(
            adminClient,
            requireConfirmedEmail,
        );

        if (!allEmails.length) {
            return new Response(
                JSON.stringify({
                    ok: true,
                    message: "No registered users found for digest delivery.",
                    recipientsProcessed: 0,
                }),
                { headers: { "Content-Type": "application/json" } },
            );
        }

        const recipients = allEmails.slice(0, maxRecipients);
        const { categoryScores, allArticles } = await fetchTrendingHeadlines(
            country,
            categoryList,
            categoryPageSize,
        );

        const rankedArticles = rankArticles(categoryScores, allArticles);
        const deduped = new Map<string, NormalizedArticle>();
        for (const article of rankedArticles) {
            const existing = deduped.get(article.url);
            if (!existing || article.score > existing.score) {
                deduped.set(article.url, article);
            }
        }
        const headlines = Array.from(deduped.values()).slice(0, maxArticles);

        if (!headlines.length) {
            return new Response(
                JSON.stringify({ ok: false, error: "No headlines available." }),
                { status: 502, headers: { "Content-Type": "application/json" } },
            );
        }

        const headlineSignals = buildHeadlineSignals(rankedArticles, 25);
        const suggestedCategories = await suggestCategoriesWithOpenRouter(
            country,
            categoryList,
            headlineSignals,
        );
        const fallbackCategories: TrendingCategory[] = rotateByDay(categoryList)
            .slice(0, 5)
            .map(cat => ({
                name: formatCategoryLabel(cat),
                reason: `Discover the latest updates and trending stories in ${formatCategoryLabel(cat)}.`
            }));

        const trendingCategories = suggestedCategories || fallbackCategories;

        const subject = buildDigestSubject();
        const html = buildDigestHtml(headlines, trendingCategories);
        const text = buildDigestText(headlines, trendingCategories);

        for (let index = 0; index < recipients.length; index += RESEND_BATCH_SIZE) {
            const chunk = recipients.slice(index, index + RESEND_BATCH_SIZE);
            await sendDigestBatch(
                resendApiKey,
                resendFromAddress,
                subject,
                html,
                text,
                chunk,
            );
        }

        return new Response(
            JSON.stringify({
                ok: true,
                message: "Daily morning digest sent to registered users.",
                recipientsProcessed: recipients.length,
                recipientsSkippedByLimit: Math.max(0, allEmails.length - recipients.length),
                headlineCount: headlines.length,
                country,
                requireConfirmedEmail,
            }),
            { headers: { "Content-Type": "application/json" } },
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        return new Response(
            JSON.stringify({ ok: false, error: message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
});
