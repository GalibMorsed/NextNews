"use client";

import { ArrowUpRight } from "lucide-react";
import AddNoteButton from "./addNoteButton";
import AISummaryButton from "./aiSummaryButton";
import { getNewsImageSrc } from "@/lib/newsImage";
import { trackActivityEvent } from "@/lib/activityAnalytics";

interface Article {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface ArticleCardProps {
  article: Article;
  formattedDate: string;
  category?: string;
}

export default function ArticleCard({
  article,
  formattedDate,
  category,
}: ArticleCardProps) {
  return (
    <article className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100">
      <div className="relative h-52 w-full overflow-hidden bg-gray-200">
        <img
          src={getNewsImageSrc(article.urlToImage)}
          alt={article.title || "News Article"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/news1.jpg";
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-block bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            {article.source?.name || "Unknown Source"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div suppressHydrationWarning className="mb-3 flex items-center text-xs text-gray-500 font-medium uppercase tracking-wider">
          {formattedDate || "Date Not Available"}
        </div>

        <h2 className="mb-3 text-lg font-bold text-gray-900 leading-snug line-clamp-3 group-hover:text-blue-600 transition-colors">
          {article.title || "No Title Available"}
        </h2>
        <p className="mb-4 text-sm text-gray-600 line-clamp-3 flex-1">
          {article.description || "Click to read the full story."}
        </p>
        <div className="mt-auto pt-4 border-t border-gray-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={article.url || "#"}
              target={article.url ? "_blank" : "_self"}
              rel={article.url ? "noopener noreferrer" : ""}
              onClick={() => {
                if (!article.url) return;
                trackActivityEvent("article_open", {
                  source: article.source?.name ?? "",
                  category: category ?? "",
                });
              }}
              className={`inline-flex items-center text-sm font-semibold transition-colors sm:flex-shrink-0 ${
                article.url
                  ? "text-blue-600 hover:text-blue-700 cursor-pointer"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              {article.url ? "Read Full Story" : "Link Not Available"}
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </a>

            <div className="flex flex-nowrap items-center gap-2 sm:ml-auto">
              <AISummaryButton
                title={article.title}
                description={article.description}
                content={article.content}
                sourceName={article.source?.name}
                category={category}
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
