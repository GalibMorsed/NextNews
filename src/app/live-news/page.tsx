"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowUpRight, Lock, Search, X } from "lucide-react";

interface YoutubeLiveItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
  };
}

interface YoutubeSearchResponse {
  items?: YoutubeLiveItem[];
}

const DEFAULT_QUERY = "live news";
const GUEST_VIDEO_LIMIT = 4;
const YOUTUBE_SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";

const normalizeApiKey = (rawKey: string | undefined) =>
  (rawKey ?? "").trim().replace(/^=+/, "");

const getYoutubeResultsUrl = (query: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

const hasLocalAuth = () => {
  if (typeof window === "undefined") return false;

  const authToken = localStorage.getItem("auth_token")?.trim();
  const authEmail = localStorage.getItem("auth_email")?.trim();

  return Boolean(authToken || authEmail);
};

const hasFreePlanAccess = () => {
  if (typeof window === "undefined") return false;

  return localStorage.getItem("nextnews-plan") === "Free";
};

export default function LiveNewsPage() {
  const [videos, setVideos] = useState<YoutubeLiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackQuery, setFallbackQuery] = useState(DEFAULT_QUERY);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasFreePlan, setHasFreePlan] = useState(false);
  const [searchQuery, setSearchQuery] = useState(DEFAULT_QUERY);

  useEffect(() => {
    const syncAccessState = () => {
      setIsAuthenticated(hasLocalAuth());
      setHasFreePlan(hasFreePlanAccess());
    };

    syncAccessState();
    window.addEventListener("storage", syncAccessState);
    window.addEventListener("focus", syncAccessState);

    return () => {
      window.removeEventListener("storage", syncAccessState);
      window.removeEventListener("focus", syncAccessState);
    };
  }, []);

  const fetchLiveNewsVideos = useCallback(async (query: string) => {
    const normalizedQuery = query.trim() || DEFAULT_QUERY;
    const apiKey = normalizeApiKey(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY);

    if (!apiKey) {
      setError(
        "API key is missing or invalid. Please check your configuration Developer.",
      );
      setFallbackQuery(normalizedQuery);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      part: "snippet",
      q: normalizedQuery,
      type: "video",
      eventType: "live",
      maxResults: "12",
      relevanceLanguage: "en",
      regionCode: "US",
      videoEmbeddable: "true",
      key: apiKey,
    });

    try {
      const response = await fetch(
        `${YOUTUBE_SEARCH_ENDPOINT}?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          `YouTube API request failed with status ${response.status}`,
        );
      }

      const data: YoutubeSearchResponse = await response.json();
      const nextVideos = (data.items ?? []).filter((item) =>
        Boolean(item.id?.videoId),
      );

      if (nextVideos.length === 0) {
        setError(
          "Oops! 📡 We're having trouble connecting to the live streams right now. Please try again later! 📺",
        );
        setFallbackQuery(normalizedQuery);
        setLoading(false);
        return;
      }

      setVideos(nextVideos);
      setError(null);
      setFallbackQuery(normalizedQuery);
      setLoading(false);
    } catch {
      setError(
        "Oops! 📡 We're having trouble connecting to the live streams right now. Please try again later! 📺",
      );
      setFallbackQuery(normalizedQuery);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLiveNewsVideos(DEFAULT_QUERY);
  }, [fetchLiveNewsVideos]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    void fetchLiveNewsVideos(searchQuery);
  };

  const handleVideoError = (videoId: string) => {
    window.location.assign(`https://www.youtube.com/watch?v=${videoId}`);
  };

  const canShowAllVideos = hasFreePlan;
  const visibleVideos = useMemo(
    () => (canShowAllVideos ? videos : videos.slice(0, GUEST_VIDEO_LIMIT)),
    [canShowAllVideos, videos],
  );
  const hiddenVideoCount = Math.max(videos.length - visibleVideos.length, 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            🔴LiveNews
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Loading live streams...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          🔴LiveNews
        </h1>
        <p className="mb-6 text-slate-600 dark:text-slate-400">
          Watch active YouTube live news streams in real time.
        </p>

        {isAuthenticated && (
          <form onSubmit={handleSearch} className="relative mb-6">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search live feeds (e.g. BBC live, India news live, Sports etc.)"
              className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 py-2 pl-10 pr-10 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 rounded-full p-1 text-gray-400 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 -translate-y-1/2"
              >
                <X size={14} />
              </button>
            )}
          </form>
        )}

        {!isAuthenticated && (
          <div className="mx-auto mb-10 max-w-2xl">
            <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 p-6 text-center shadow-sm">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm ring-1 ring-blue-100 dark:ring-blue-800">
                  <span className="text-xl">🔑</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Unlock Custom Search
                  </h3>
                  <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
                    Register to start search for specific live feeds, with more unlocked videos. We&apos;ve
                    curated some popular live news streams for you below.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-4 text-sm text-red-700 dark:text-red-400">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="mb-3 font-medium">{error}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-lg bg-black dark:bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:hover:bg-slate-600"
                  >
                    Go to Top Headlines
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      window.location.assign(
                        getYoutubeResultsUrl(fallbackQuery),
                      )
                    }
                    className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    Redirect to YouTube
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {visibleVideos.map((video) => {
            const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;

            return (
              <article
                key={video.id.videoId}
                className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="aspect-video w-full bg-black">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${video.id.videoId}?rel=0`}
                    title={video.snippet.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    onError={() => handleVideoError(video.id.videoId)}
                  />
                </div>

                <div className="space-y-3 p-4">
                  <h2 className="line-clamp-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {video.snippet.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {video.snippet.channelTitle}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(videoUrl, "_blank", "noopener,noreferrer")
                    }
                    className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    Play on YouTube
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {isAuthenticated && !hasFreePlan && hiddenVideoCount > 0 && (
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/60 p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm ring-1 ring-amber-100 dark:ring-amber-900">
                <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Unlock More Live Videos
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                You&apos;re currently viewing 4 live video streams. Upgrade from
                the Plans page to unlock the remaining {hiddenVideoCount} live
                videos and enjoy full access here. Once your Selected plan is
                active, the complete set of available live streams will appear
                automatically.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/plans"
                  className="inline-flex items-center justify-center rounded-xl bg-amber-500 dark:bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 dark:hover:bg-amber-500"
                >
                  Go to Plans
                </Link>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 px-5 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400 transition hover:bg-amber-50 dark:hover:bg-slate-700"
                >
                  Refresh Access
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
