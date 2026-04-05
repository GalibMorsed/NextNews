"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        router.push(`/search?q=${query}`);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [query, router]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="relative flex-1 w-full">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-300"
          size={20}
        />
        <input
          type="text"
          value={query}
          placeholder="Search news..."
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              router.push(`/search?q=${query}`);
            }
          }}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-slate-700 placeholder:text-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-300 dark:focus:border-blue-400 dark:focus:bg-slate-700 dark:focus:ring-blue-400"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
