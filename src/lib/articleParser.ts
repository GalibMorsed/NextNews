/**
 * Server-side utility to extract article content from a URL.
 */

export interface ExtractedArticle {
  title: string;
  content: string;
  excerpt: string;
  byline?: string;
  dir?: string;
  siteName?: string;
  image?: string | null;
  length?: number;
  publishedTime?: string | null;
}

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  nbsp: " ",
  bull: " - ",
  ndash: "-",
  mdash: "-",
  hellip: "...",
  rsquo: "'",
  lsquo: "'",
  rdquo: "\"",
  ldquo: "\"",
  copy: "(c)",
};

function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === "#") {
      const isHex = entity[1]?.toLowerCase() === "x";
      const codePoint = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return HTML_ENTITY_MAP[entity] ?? match;
  });
}

function normalizeParagraph(input: string): string {
  return decodeHtmlEntities(input)
    .replace(/\u00a0/g, " ")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasReadableSentenceShape(text: string): boolean {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length < 8) return false;

  const alphaTokens = tokens.filter((token) => /[a-z]/i.test(token)).length;
  const longTokenCount = tokens.filter((token) => token.length >= 18).length;
  const sentenceLikeChunks = text
    .split(/[.!?]+/)
    .filter((chunk) => chunk.trim().split(/\s+/).length >= 5).length;

  if (alphaTokens / tokens.length < 0.65) return false;
  if (longTokenCount >= Math.ceil(tokens.length * 0.3)) return false;
  if (sentenceLikeChunks === 0 && text.length > 90) return false;

  return true;
}

function isLikelyNoiseParagraph(text: string): boolean {
  const lower = text.toLowerCase();
  const noisePhrases = [
    "privacy policy",
    "security policy",
    "terms of use",
    "terms and conditions",
    "cookie",
    "sitemap",
    "site map",
    "contact us",
    "corporate site",
    "disclaimer",
    "all rights reserved",
    "copyright",
    "advertise",
    "advertisement",
    "subscribe",
    "newsletter",
    "follow us",
    "share this",
    "related articles",
    "read more",
    "sign up",
    "sign in",
    "log in",
    "login",
    "register",
    "press",
    "archived",
    "worldchinajapan",
    "marketsmarkets",
    "tech#tech",
  ];

  if (noisePhrases.some((phrase) => lower.includes(phrase))) return true;
  if (/(^|\s)(©|\(c\)|copyright)(\s|$)/i.test(text)) return true;
  if (
    /(scriptoptions|_localizedstrings|redirect_overlay|window\.|document\.|\bfunction\s*\(|\bconst\s+|\blet\s+|\bvar\s+)/i.test(
      text
    )
  ) {
    return true;
  }

  if (/^\s*\.[a-z0-9_-]+\s*\{/.test(text)) return true;
  if (/[a-z][A-Z][a-z]/.test(text) && !/\s/.test(text.slice(0, 80))) return true;
  if (
    /(asia|china|japan|india|korea|taiwan){3,}/i.test(
      lower.replace(/\s+/g, "")
    )
  ) {
    return true;
  }

  const separatorCount =
    (text.match(/\s-\s/g) ?? []).length +
    (text.match(/\s\|\s/g) ?? []).length +
    (text.match(/\s>\s/g) ?? []).length +
    (text.match(/\s\/\s/g) ?? []).length;
  const itemCount = separatorCount + 1;
  if (itemCount >= 6 && text.length > 80) return true;

  const urlCount = (text.match(/https?:\/\//g) ?? []).length;
  if (urlCount >= 1 && text.length < 200) return true;

  const symbolCount = (text.match(/["'+=<>_]/g) ?? []).length;
  if (symbolCount > 12 && text.length < 200) return true;

  const hasSentencePunct = /[.!?]/.test(text);
  const tokens = text.split(/\s+/).filter(Boolean);
  const shortTokens = tokens.filter((token) => token.length <= 3).length;
  if (!hasSentencePunct && tokens.length >= 12 && shortTokens / tokens.length > 0.55) {
    return true;
  }

  if (/\b\d{4,6}\b/.test(text)) {
    if (/\b(no\.|street|road|avenue|jalan|st\.?|rd\.?|ave\.?|suite|floor|block|postcode|zip)\b/i.test(text)) {
      return true;
    }
  }

  if (!hasReadableSentenceShape(text)) return true;

  return false;
}

function sanitizeExcerpt(paragraphs: string[]): string {
  return paragraphs.find((paragraph) => paragraph.length >= 40) ?? "";
}

function dedupeParagraphs(paragraphs: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const paragraph of paragraphs) {
    const key = paragraph.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(paragraph);
  }

  return deduped;
}

/**
 * Attempts to extract the main content from an article URL.
 * Uses a basic regex-based approach to extract text from common article tags.
 */
export async function extractArticleContent(url: string): Promise<ExtractedArticle | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.statusText}`);
    }

    const html = await response.text();

    // Very basic extraction logic
    // 1. Try to find the title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                      html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const rawTitle = titleMatch ? titleMatch[1] : "Untitled";
    const title = normalizeParagraph(
      rawTitle.replace(/ - .*$/, "").replace(/ \| .*$/, "").trim()
    );

    // 2. Try to find image (OG image)
    const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                      html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i);
    const image = imageMatch ? imageMatch[1] : null;

    const sourceMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/i);
    const siteName = sourceMatch ? sourceMatch[1] : new URL(url).hostname.replace("www.", "");

    // 4. Try to find published date
    const dateMatch = html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/i) ||
                     html.match(/<meta[^>]*name="pubdate"[^>]*content="([^"]+)"/i) ||
                     html.match(/<meta[^>]*name="publish-date"[^>]*content="([^"]+)"/i) ||
                     html.match(/<time[^>]*datetime="([^"]+)"/i);
    const publishedTime = dateMatch ? dateMatch[1] : null;

    // 5. Extract content from <p> tags
    const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    
    if (!pMatches) {
      return { title, content: "", excerpt: "", siteName, image };
    }

    const cleanedParagraphs = pMatches
      .map((p) => normalizeParagraph(p.replace(/<[^>]*>?/gm, "")))
      .filter(Boolean)
      .filter((paragraph) => !isLikelyNoiseParagraph(paragraph));

    const longParagraphs = cleanedParagraphs.filter(text => text.length > 60);
    const candidateParagraphs = longParagraphs.length
      ? longParagraphs
      : cleanedParagraphs.filter(text => text.length > 20);
    const contentParts = dedupeParagraphs(candidateParagraphs);

    if (!contentParts.length) {
      return {
        title,
        content: "",
        excerpt: "",
        siteName,
        image,
      };
    }

    const fullContent = contentParts.join("\n\n");
    const excerpt = sanitizeExcerpt(contentParts);

    return {
      title,
      content: fullContent,
      excerpt,
      siteName,
      image,
      length: fullContent.length,
      publishedTime,
    };
  } catch (error) {
    console.error("Content extraction error:", error);
    return null;
  }
}
