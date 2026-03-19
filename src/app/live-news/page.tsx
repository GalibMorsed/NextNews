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
      <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-2 text-3xl font-extrabold text-gray-900">
            🔴LiveNews
          </h1>
          <p className="text-gray-600">Loading live streams...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-extrabold text-gray-900">
          🔴LiveNews
        </h1>
        <p className="mb-6 text-gray-600">
          Watch active YouTube live news streams in real time.
        </p>

        {isAuthenticated && (
          <form onSubmit={handleSearch} className="relative mb-6">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search live feeds (e.g. BBC live, India news live, Sports etc.)"
              className="w-full rounded-xl bg-gray-100 py-2 pl-10 pr-10 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 -translate-y-1/2"
              >
                <X size={14} />
              </button>
            )}
          </form>
        )}

        {!isAuthenticated && (
          <div className="mx-auto mb-10 max-w-2xl">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center shadow-sm">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="p-2 bg-white rounded-full shadow-sm ring-1 ring-blue-50">
                  <span className="text-xl">🔑</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Unlock Custom Search
                  </h3>
                  <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
                    Register to start search for specific live feeds, with more unlocked videos. We&apos;ve
                    curated some popular live news streams for you below.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-white-50 px-4 py-4 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="mb-3 font-medium">{error}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
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
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
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
                  <h2 className="line-clamp-2 text-lg font-semibold text-gray-900">
                    {video.snippet.title}
                  </h2>
                  <p className="text-sm text-gray-600">
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
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-amber-100">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Unlock More Live Videos
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You&apos;re currently viewing 4 live video streams. Upgrade from
                the Plans page to unlock the remaining {hiddenVideoCount} live
                videos and enjoy full access here. Once your Selected plan is
                active, the complete set of available live streams will appear
                automatically.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/plans"
                  className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  Go to Plans
                </Link>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
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
