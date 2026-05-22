"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import LottiePlayer from "@/app/components/LottiePlayer";

interface ListenToDescriptionButtonProps {
  text: string;
  title?: string;
  className?: string;
}

const HINDI_LANGUAGE = "hi-IN" as const;

function normalizeSpeechText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

function getBestVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  language: string,
) {
  const normalizedLanguage = language.toLowerCase();
  const languagePrefix = normalizedLanguage.split("-")[0];

  return (
    voices.find((voice) => voice.lang?.toLowerCase() === normalizedLanguage) ??
    voices.find((voice) =>
      voice.lang?.toLowerCase().startsWith(languagePrefix),
    ) ??
    voices.find((voice) => voice.default) ??
    voices[0] ??
    null
  );
}

export default function ListenToDescriptionButton({
  text,
  title,
  className,
}: ListenToDescriptionButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const speechText = useMemo(() => {
    const normalized = normalizeSpeechText(text);
    if (!normalized) return "";
    return title ? `${title}. ${normalized}` : normalized;
  }, [text, title]);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        "SpeechSynthesisUtterance" in window,
    );
  }, []);

  useEffect(() => {
    if (!isSupported || typeof window === "undefined") {
      return undefined;
    }

    const speechSynthesis = window.speechSynthesis;

    const updateVoices = () => {
      setVoices(speechSynthesis.getVoices());
    };

    updateVoices();
    speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (speechSynthesis.onvoiceschanged === updateVoices) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopReading = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const startReading = () => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window) ||
      !speechText
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(speechText);
    const selectedVoice = getBestVoiceForLanguage(voices, HINDI_LANGUAGE);
    utterance.lang = HINDI_LANGUAGE;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || HINDI_LANGUAGE;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const togglePlayback = () => {
    if (!isSupported || !speechText) {
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      } else {
        stopReading();
      }
      return;
    }

    startReading();
  };

  if (!speechText) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={togglePlayback}
      disabled={!isSupported}
      aria-pressed={isPlaying}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-black shadow-sm shadow-cyan-500/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-white dark:hover:border-cyan-300 dark:hover:bg-cyan-500 dark:focus-visible:ring-offset-slate-950"
      }
      title={isSupported ? "Listen news" : "Unavailable"}
    >
      {isPlaying ? (
        isPaused ? (
          <Play size={16} />
        ) : (
          <Pause size={16} />
        )
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center pointer-events-none">
          <LottiePlayer
            src="/explore/Listen.json"
            className="h-full w-full"
            loop
            autoplay
          />
        </span>
      )}
      <span>
        {isPlaying
          ? isPaused
            ? "Resume Reading"
            : "Pause Reading"
          : "Listen News"}
      </span>
    </button>
  );
}
