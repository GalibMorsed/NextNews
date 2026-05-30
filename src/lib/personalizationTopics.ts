import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Book,
  Bot,
  Brain,
  Car,
  Coins,
  Compass,
  FlaskConical,
  Film,
  Fingerprint,
  Gamepad2,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  Landmark,
  Leaf,
  Lock,
  Music,
  Newspaper,
  Palette,
  Plane,
  Rocket,
  Scale,
  Shield,
  Shirt,
  Share2,
  Sprout,
  Sun,
  TrendingUp,
  Trophy,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";

export const AVAILABLE_PERSONALIZATION_TOPICS = [
  "Top Headlines",
  "Technology",
  "Business",
  "Entertainment",
  "Sports",
  "Health",
  "Science",
  "Politics",
  "Tourism",
  "Crime",
  "Environment",
  "Education",
  "Travel",
  "Food",
  "Fashion",
  "Finance",
  "Automotive",
  "Music",
  "Movies",
  "Books",
  "Art",
  "Culture",
  "Gaming",
  "Spirituality & Religion",
  "Mental Health",
  "Artificial Intelligence",
  "Cybersecurity",
  "Space & Astronomy",
  "Stock Market",
  "Trade & Economy",
  "Real Estate",
  "Defense & Military",
  "Agriculture & Farming",
  "World News",
  "Weather",
  "Energy",
  "Startups",
  "Law & Justice",
  "Social Media",
  "Personal Finance",
] as const;

export const DEFAULT_PERSONALIZATION_TOPICS = [
  "Top Headlines",
  "Technology",
  "Business",
  "Politics",
  "Entertainment",
  "Sports",
  "Health",
  "Science",
] as const;

export const MAX_PERSONALIZATION_TOPICS = 10;

export type PersonalizationTopicMetadata = {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  darkBgColor: string;
};

export const PERSONALIZATION_TOPIC_METADATA: Record<
  string,
  PersonalizationTopicMetadata
> = {
  "Top Headlines": {
    icon: Newspaper,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50",
    darkBgColor: "dark:bg-slate-900/40",
  },
  Technology: {
    icon: Laptop,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50/50",
    darkBgColor: "dark:bg-blue-950/20",
  },
  Business: {
    icon: TrendingUp,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50/50",
    darkBgColor: "dark:bg-indigo-950/20",
  },
  Entertainment: {
    icon: Film,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50/50",
    darkBgColor: "dark:bg-violet-950/20",
  },
  Sports: {
    icon: Trophy,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50/50",
    darkBgColor: "dark:bg-orange-950/20",
  },
  Health: {
    icon: Heart,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50/50",
    darkBgColor: "dark:bg-emerald-950/20",
  },
  Science: {
    icon: FlaskConical,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50/50",
    darkBgColor: "dark:bg-blue-950/20",
  },
  Politics: {
    icon: Landmark,
    color: "text-indigo-900 dark:text-indigo-300",
    bgColor: "bg-indigo-50/50",
    darkBgColor: "dark:bg-indigo-950/20",
  },
  Tourism: {
    icon: Compass,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50/50",
    darkBgColor: "dark:bg-amber-950/20",
  },
  Crime: {
    icon: Fingerprint,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50/50",
    darkBgColor: "dark:bg-rose-950/20",
  },
  Environment: {
    icon: Leaf,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50/50",
    darkBgColor: "dark:bg-emerald-950/20",
  },
  Education: {
    icon: GraduationCap,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-50/50",
    darkBgColor: "dark:bg-sky-950/20",
  },
  Travel: {
    icon: Plane,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-50/50",
    darkBgColor: "dark:bg-sky-950/20",
  },
  Food: {
    icon: Utensils,
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-50/50",
    darkBgColor: "dark:bg-amber-950/20",
  },
  Fashion: {
    icon: Shirt,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50/50",
    darkBgColor: "dark:bg-pink-950/20",
  },
  Finance: {
    icon: Coins,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50/50",
    darkBgColor: "dark:bg-emerald-950/20",
  },
  Automotive: {
    icon: Car,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50",
    darkBgColor: "dark:bg-slate-900/40",
  },
  Music: {
    icon: Music,
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bgColor: "bg-fuchsia-50/50",
    darkBgColor: "dark:bg-fuchsia-950/20",
  },
  Movies: {
    icon: Film,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50/50",
    darkBgColor: "dark:bg-red-950/20",
  },
  Books: {
    icon: Book,
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50/50",
    darkBgColor: "dark:bg-amber-950/20",
  },
  Art: {
    icon: Palette,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50/50",
    darkBgColor: "dark:bg-violet-950/20",
  },
  Culture: {
    icon: Globe,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50/50",
    darkBgColor: "dark:bg-emerald-950/20",
  },
  Gaming: {
    icon: Gamepad2,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50/50",
    darkBgColor: "dark:bg-rose-950/20",
  },
  "Spirituality & Religion": {
    icon: Sun,
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-50/50",
    darkBgColor: "dark:bg-amber-950/20",
  },
  "Mental Health": {
    icon: Brain,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50/50",
    darkBgColor: "dark:bg-pink-950/20",
  },
  "Artificial Intelligence": {
    icon: Bot,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50/50",
    darkBgColor: "dark:bg-purple-950/20",
  },
  Cybersecurity: {
    icon: Lock,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50/50",
    darkBgColor: "dark:bg-red-950/20",
  },
  "Space & Astronomy": {
    icon: Rocket,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50/50",
    darkBgColor: "dark:bg-indigo-950/20",
  },
  "Stock Market": {
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50/50",
    darkBgColor: "dark:bg-emerald-950/20",
  },
  "Trade & Economy": {
    icon: ArrowLeftRight,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50/50",
    darkBgColor: "dark:bg-blue-950/20",
  },
  "Real Estate": {
    icon: Home,
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50/50",
    darkBgColor: "dark:bg-amber-950/20",
  },
  "Defense & Military": {
    icon: Shield,
    color: "text-zinc-600 dark:text-zinc-400",
    bgColor: "bg-zinc-50",
    darkBgColor: "dark:bg-zinc-900/40",
  },
  "Agriculture & Farming": {
    icon: Sprout,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50/50",
    darkBgColor: "dark:bg-green-950/20",
  },
  "World News": {
    icon: Globe,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-50/50",
    darkBgColor: "dark:bg-sky-950/20",
  },
  Weather: {
    icon: Sun,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50/50",
    darkBgColor: "dark:bg-yellow-950/20",
  },
  Energy: {
    icon: Zap,
    color: "text-yellow-500 dark:text-yellow-400",
    bgColor: "bg-yellow-50/50",
    darkBgColor: "dark:bg-yellow-950/20",
  },
  Startups: {
    icon: Rocket,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50/50",
    darkBgColor: "dark:bg-amber-950/20",
  },
  "Law & Justice": {
    icon: Scale,
    color: "text-stone-600 dark:text-stone-400",
    bgColor: "bg-stone-50",
    darkBgColor: "dark:bg-stone-900/40",
  },
  "Social Media": {
    icon: Share2,
    color: "text-sky-500 dark:text-sky-400",
    bgColor: "bg-sky-50/50",
    darkBgColor: "dark:bg-sky-950/20",
  },
  "Personal Finance": {
    icon: Wallet,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50/50",
    darkBgColor: "dark:bg-green-950/20",
  },
};

export function getPersonalizationTopicMetadata(
  topic: string,
): PersonalizationTopicMetadata {
  return (
    PERSONALIZATION_TOPIC_METADATA[topic] || {
      icon: Newspaper,
      color: "text-[var(--primary)] dark:text-indigo-400",
      bgColor: "bg-slate-50",
      darkBgColor: "dark:bg-slate-900/40",
    }
  );
}

export function sanitizePersonalizationTopic(topic: string): string {
  return topic
    .replace(/[^\w\s&/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export function slugifyPersonalizationTopic(topic: string): string {
  const slug = sanitizePersonalizationTopic(topic)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "top-headlines";
}
