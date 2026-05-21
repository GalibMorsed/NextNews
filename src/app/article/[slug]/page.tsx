import { decodeArticleId } from "@/lib/articleUtils";
import { extractArticleContent } from "@/lib/articleParser";
import AddNoteButton from "@/app/components/addNoteButton";
import ListenToDescriptionButton from "@/app/article/[slug]/component/listenToDescriptionButton";
import Topbar from "@/app/article/[slug]/component/topbar";
import SourceLogo from "@/app/components/sourceLogo";
import { getSourceLogoSrc } from "@/lib/newsImage";
import { ExternalLink, Calendar, Clock, BadgeCheck } from "lucide-react";
import { Metadata } from "next";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function normalizeForComparison(value: string) {
  return value
    .toLowerCase()
    .replace(/\.\.\.$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isDuplicateDescription(description: string, content: string) {
  const normalizedDescription = normalizeForComparison(description);
  const normalizedContent = normalizeForComparison(content);

  return (
    normalizedDescription.length > 0 &&
    (normalizedContent === normalizedDescription ||
      normalizedContent.startsWith(normalizedDescription) ||
      normalizedDescription.startsWith(normalizedContent))
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const url = decodeArticleId(slug);

  if (!url) {
    return {
      title: "Article | Antigravity News",
      description: "Read the full story on Antigravity News.",
    };
  }

  const article = await extractArticleContent(url);
  const description =
    article?.excerpt || "Read the full story on Antigravity News.";
  const title = article?.title;
  const image = article?.image;

  return {
    title: title ? `${title} | Antigravity News` : "Article | Antigravity News",
    description,
    openGraph: {
      images: image ? [image] : [],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const url = decodeArticleId(slug);

  if (!url) {
    redirect("/");
  }

  const extractedArticle = await extractArticleContent(url);

  if (!extractedArticle) {
    redirect(url);
  }

  const extractedContent = extractedArticle?.content?.trim() || "";
  const articleContent =
    extractedContent &&
    extractedContent !== "Content not available for this article."
      ? extractedContent
      : extractedArticle?.excerpt?.trim() ||
        "Open the original source to read the full story.";
  const articleTitle = extractedArticle?.title || "Article";
  const articleDescription = extractedArticle?.excerpt?.trim() || "";
  const shouldShowDescription =
    articleDescription &&
    !isDuplicateDescription(articleDescription, articleContent);
  const articleImage = extractedArticle?.image || null;
  const articlePublishedAt = extractedArticle?.publishedTime || null;
  const sourceName =
    extractedArticle?.siteName || new URL(url).hostname.replace(/^www\./, "");
  const wordCount = articleContent.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const sourceLogoSrc = getSourceLogoSrc(url);

  const articleDate = articlePublishedAt
    ? new Date(articlePublishedAt)
    : new Date();
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(articleDate)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-white dark:bg-[#0B0F19] selection:bg-blue-100 selection:text-blue-900">
      <article className="w-full px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {!articleImage && (
            <div className="mb-6">
              <Topbar
                isOverlay={false}
                article={{
                  title: articleTitle,
                  url: url,
                  publishedTime: articlePublishedAt ?? undefined,
                  siteName: sourceName,
                }}
              />
            </div>
          )}

          {articleImage && (
            <div className="relative w-full aspect-[4/3] md:aspect-[21/9] rounded-3xl overflow-hidden mb-8 shadow-2xl">
              <img
                src={articleImage}
                alt={articleTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
              <div className="absolute top-4 left-0 right-0 z-10">
                <Topbar
                  isOverlay={true}
                  article={{
                    title: articleTitle,
                    url: url,
                    publishedTime: articlePublishedAt ?? undefined,
                    siteName: sourceName,
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-8 w-full">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:bg-blue-500/10 dark:hover:bg-blue-500 dark:text-blue-400 dark:hover:text-white rounded-full text-sm font-semibold transition-colors duration-200 group"
            >
              <ExternalLink
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
              Open Real Journal
            </a>
            <ListenToDescriptionButton
              title={articleTitle}
              text={articleDescription || articleContent}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-full text-sm font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <AddNoteButton
              title={articleTitle}
              link={url}
              publishedAt={articlePublishedAt ?? undefined}
              sourceName={sourceName}
              buttonLabel="Add Notes"
              buttonIcon="pencil"
              buttonClassName="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-full text-sm font-semibold transition-colors duration-200 group"
            />
          </div>
        </div>

        <div className="w-full">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2.5 px-1 py-1 group">
              <SourceLogo
                src={sourceLogoSrc}
                alt={`${sourceName} logo`}
                fallbackLabel={sourceName}
                sizeClassName="h-7 w-7"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {sourceName}
                </span>
                <BadgeCheck
                  size={18}
                  className="text-blue-500 fill-blue-500/10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Calendar size={14} />
              <span className="font-medium tracking-tight">
                {formattedDate}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Clock size={14} />
              <span>{readTime} min read</span>
            </div>
          </div>

          {/* Title */}
          <h5 className="w-full text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tight">
            {articleTitle}
          </h5>

          {shouldShowDescription && (
            <p className="mb-8 text-lg md:text-xl font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              {articleDescription}
            </p>
          )}

          {/* Content */}
          <div className="w-full prose prose-slate dark:prose-invert max-w-none font-sans">
            {articleContent.split("\n\n").map((para, i) => (
              <p
                key={i}
                className="text-lg md:text-xl text-slate-700 dark:text-slate-300 leading-relaxed mb-6"
              >
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* Source Attribution Section */}
        <div className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-md">
            <div className="shrink-0 p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <SourceLogo
                src={sourceLogoSrc}
                alt={sourceName}
                fallbackLabel={sourceName}
                sizeClassName="h-10 w-10"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">
                Original Source
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-2xl">
                This content was distilled for a focused reading experience. All
                rights belong to{" "}
                <span className="font-bold text-slate-900 dark:text-slate-200">
                  {sourceName}
                </span>
                .
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
              >
                Read original publication
                <ExternalLink
                  size={14}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </a>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
