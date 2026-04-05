"use client";

export default function CategoryError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <main className="p-6">
      <h2 className="text-2xl font-bold text-red-600 mb-2">
        Failed to load category news
      </h2>
      <p className="text-slate-700">{error.message}</p>
    </main>
  );
}
