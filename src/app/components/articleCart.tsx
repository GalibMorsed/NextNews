"use client";

import { ArrowUpRight } from "lucide-react";
import AddNoteButton from "./addNoteButton";
import AISummaryButton from "./aiSummaryButton";
import { getNewsImageSrc, getSourceLogoSrc } from "@/lib/newsImage";
import { trackActivityEvent } from "@/lib/activityAnalytics";
import Link from "next/link";
import { encodeArticleId } from "@/lib/articleUtils";
import ArticleViewsCounter from "./articleViewsCounter";
import SourceLogo from "./sourceLogo";

interface Article {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
  status?: string | null;
}

interface ArticleCardProps {
  article: Article;
  formattedDate: string;
  category?: string;
  showAiSummaryPromo?: boolean;
}

type PriorityLevel = "high" | "medium" | "low";

const PRIORITY_BADGE_STYLES: Record<PriorityLevel, { className: string }> = {
  high: { className: "text-red-600" },
  medium: { className: "text-blue-600" },
  low: { className: "text-slate-400" },
};

function getPriorityLevel(
  status?: string | null,
  publishedAt?: string | null,
  title?: string,
): PriorityLevel {
  const normalized = status?.toLowerCase().trim();

  if (normalized) {
    if (["high", "urgent", "critical", "breaking"].includes(normalized)) {
      return "high";
    }

    if (["medium", "normal", "moderate"].includes(normalized)) {
      return "medium";
    }

    if (["low", "minor"].includes(normalized)) {
      return "low";
    }
  }

  if (publishedAt) {
    const parsed = new Date(publishedAt);
    if (!Number.isNaN(parsed.getTime())) {
      const hoursSince = (Date.now() - parsed.getTime()) / 36e5;
      if (hoursSince <= 32) return "high";
      if (hoursSince <= 64) return "medium";
    }
  }

  if (title) {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const mod = Math.abs(hash) % 100;
    if (mod < 20) return "high";
    if (mod < 50) return "medium";
  }

  return "low";
}

function PriorityBadge({
  status,
  publishedAt,
  title,
}: {
  status?: string | null;
  publishedAt?: string | null;
  title?: string;
}) {
  const level = getPriorityLevel(status, publishedAt, title);
  const { className } = PRIORITY_BADGE_STYLES[level];

  return (
    <div className="absolute right-3 top-3 z-10">
      <svg
        viewBox="0 0 24 28"
        role="img"
        aria-label={`${level} priority`}
        className={`h-7 w-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)] ${className}`}
      >
        <g transform="translate(0 -2)">
          <path
            d="M12 3.2L13.9 5.6L16.9 5.2L17.8 8.1L20.6 9.1L20.2 12.1L22.6 13.9L20.2 15.7L20.6 18.7L17.8 19.7L16.9 22.6L13.9 22.2L12 24.8L10.1 22.2L7.1 22.6L6.2 19.7L3.4 18.7L3.8 15.7L1.4 13.9L3.8 12.1L3.4 9.1L6.2 8.1L7.1 5.2L10.1 5.6Z"
            fill="currentColor"
          />
          <circle
            cx="12"
            cy="12"
            r="4.6"
            fill="white"
          />
        </g>
        <path
          d="M7 16.2L4.4 23.8L8 22.9L9.6 26.2L12 19.9"
          fill="currentColor"
        />
        <path
          d="M17 16.2L19.6 23.8L16 22.9L14.4 26.2L12 19.9"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export default function ArticleCard({
  article,
  formattedDate,
  category,
  showAiSummaryPromo = false,
}: ArticleCardProps) {
  return (
    <article className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-visible group border border-gray-100">
      <Link 
        href={`/article/${encodeArticleId(article.url)}`}
        className="block flex-1 flex flex-col"
        onClick={() => {
          trackActivityEvent("article_open", {
            source: article.source?.name ?? "",
            category: category ?? "",
            articleTitle: article.title,
            articleUrl: article.url,
            articlePublishedAt: article.publishedAt,
          });
        }}
      >
        <div className="relative h-52 w-full overflow-hidden bg-gray-200 rounded-t-2xl">
          <img
            src={getNewsImageSrc(article.urlToImage)}
            alt={article.title || "News Article"}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "/news1.jpg";
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <PriorityBadge
            status={article.status}
            publishedAt={article.publishedAt}
            title={article.title}
          />
          <div className="absolute top-3 left-3 z-10">
            <div className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold pl-1 pr-2.5 py-1 rounded-full uppercase tracking-wide border border-white/10 shadow-sm">
              <SourceLogo
                src={getSourceLogoSrc(article.url)}
                alt={`${article.source?.name || "Source"} logo`}
                fallbackLabel={article.source?.name || "Unknown"}
                sizeClassName="h-4 w-4"
              />
              <span className="truncate max-w-[120px]">{article.source?.name || "Unknown Source"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 pb-3">
          <div
            suppressHydrationWarning
            className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 font-medium uppercase tracking-wider"
          >
            <span>{formattedDate || "Date Not Available"}</span>
            <span className="h-1 w-1 rounded-full bg-gray-300" aria-hidden />
            <ArticleViewsCounter
              key={article.url || article.title}
              articleKey={article.url || article.title}
              title={article.title}
              publishedAt={article.publishedAt}
              compact
              className="normal-case tracking-normal text-gray-500"
              iconClassName="text-blue-500"
            />
          </div>

          <h2 className="mb-3 text-lg font-bold text-gray-900 leading-snug line-clamp-3 group-hover:text-blue-600 transition-colors">
            {article.title || "No Title Available"}
          </h2>
          <p className="mb-2 text-sm text-gray-600 line-clamp-3">
            {article.description || "Click to read the full story."}
          </p>
        </div>
      </Link>

      <div className="p-5 pt-0 mt-auto">
        <div className="pt-3 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/article/${encodeArticleId(article.url)}`}
              className={`inline-flex items-center text-sm font-semibold transition-colors shrink-0 ${
                article.url
                  ? "text-blue-600 hover:text-blue-700 cursor-pointer"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              Continue Reading
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>

            <div className="flex flex-nowrap items-center gap-2">
              <AISummaryButton
                title={article.title}
                description={article.description}
                content={article.content}
                sourceName={article.source?.name}
                category={category}
                showPromo={showAiSummaryPromo}
              />
              <AddNoteButton
                title={article.title}
                link={article.url}
                publishedAt={article.publishedAt}
                sourceName={article.source?.name}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
