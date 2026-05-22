"use client";

import { useState } from "react";

interface SourceLogoProps {
  src?: string | null;
  alt: string;
  fallbackLabel: string;
  sizeClassName?: string;
}

export default function SourceLogo({
  src,
  alt,
  fallbackLabel,
  sizeClassName = "h-5 w-5",
}: SourceLogoProps) {
  const [hasError, setHasError] = useState(false);
  const showImage = Boolean(src) && !hasError;
  const fallbackText = fallbackLabel.slice(0, 3).toUpperCase();

  return (
    <div
      className={`${sizeClassName} shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white/90 shadow-sm dark:border-white/40 dark:bg-slate-900`}
    >
      {showImage ? (
        <img
          src={src ?? ""}
          alt={alt}
          onError={() => setHasError(true)}
          className="h-full w-full object-contain p-0.5"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-blue-50 text-[0.5rem] font-black uppercase text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          {fallbackText}
        </div>
      )}
    </div>
  );
}
