"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  ChevronDown,
  Clapperboard,
  Palette,
  BookOpen,
  Car,
  Sprout,
  Shield,
  Gamepad2,
  Gem,
  GraduationCap,
  Info,
  Leaf,
  LifeBuoy,
  Map,
  Music2,
  Film,
  FlaskConical,
  Shirt,
  Heart,
  Home,
  Laptop,
  Landmark,
  LogOut,
  Plane,
  Radio,
  Search,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Trophy,
  UtensilsCrossed,
  Wallet,
  StickyNote,
  UserPlus,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/superbaseClient";
import {
  PERSONALIZATION_UPDATED_EVENT,
  getUserPersonalization,
} from "../services/personalizationService";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  applyAppearanceSettings,
} from "@/lib/appearance";
import { applyDarkMode } from "@/lib/accountSettings";

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

type CategoryNavItem = {
  topic: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const CATEGORY_NAV_ITEMS: CategoryNavItem[] = [
  { topic: "Top Headlines", href: "/", icon: Home },
  { topic: "Technology", href: "/categories/technology", icon: Laptop },
  { topic: "Business", href: "/categories/business", icon: Briefcase },
  { topic: "Entertainment", href: "/categories/entertainment", icon: Film },
  { topic: "Sports", href: "/categories/sports", icon: Trophy },
  { topic: "Health", href: "/categories/health", icon: Heart },
  { topic: "Science", href: "/categories/science", icon: FlaskConical },
  { topic: "Politics", href: "/categories/politics", icon: Landmark },
  { topic: "Tourism", href: "/categories/tourism", icon: Plane },
  { topic: "Crime", href: "/categories/crime", icon: ShieldAlert },
  { topic: "Environment", href: "/categories/environment", icon: Leaf },
  { topic: "Education", href: "/categories/education", icon: GraduationCap },
  { topic: "Travel", href: "/categories/travel", icon: Map },
  { topic: "Food", href: "/categories/food", icon: UtensilsCrossed },
  { topic: "Fashion", href: "/categories/fashion", icon: Shirt },
  { topic: "Finance", href: "/categories/finance", icon: Wallet },
  { topic: "Automotive", href: "/categories/automotive", icon: Car },
  { topic: "Music", href: "/categories/music", icon: Music2 },
  { topic: "Movies", href: "/categories/movies", icon: Clapperboard },
  { topic: "Books", href: "/categories/books", icon: BookOpen },
  { topic: "Art", href: "/categories/art", icon: Palette },
  { topic: "Culture", href: "/categories/culture", icon: Palette },
  { topic: "Gaming", href: "/categories/gaming", icon: Gamepad2 },
  {
    topic: "Spirituality & Religion",
    href: "/categories/spirituality-religion",
    icon: Gem,
  },
  { topic: "Mental Health", href: "/categories/mental-health", icon: Heart },
  {
    topic: "Artificial Intelligence",
    href: "/categories/artificial-intelligence",
    icon: Laptop,
  },
  { topic: "Cybersecurity", href: "/categories/cybersecurity", icon: ShieldAlert },
  { topic: "Space & Astronomy", href: "/categories/space-astronomy", icon: Info },
  { topic: "Stock Market", href: "/categories/stock-market", icon: Wallet },
  { topic: "Trade & Economy", href: "/categories/trade-economy", icon: Landmark },
  { topic: "Real Estate", href: "/categories/real-estate", icon: Home },
  { topic: "Defense & Military", href: "/categories/defense-military", icon: Shield },
  {
    topic: "Agriculture & Farming",
    href: "/categories/agriculture-farming",
    icon: Sprout,
  },
];

const DEFAULT_TOPIC_SELECTION = [
  "top headlines",
  "technology",
  "business",
  "entertainment",
  "sports",
  "health",
  "science",
];

export default function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const [query, setQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isPersonalizationLoaded, setIsPersonalizationLoaded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const persistSession = (emailValue: string, tokenValue: string) => {
    localStorage.setItem("auth_email", emailValue);
    localStorage.setItem("auth_token", tokenValue);
    document.cookie = `auth_token=${encodeURIComponent(tokenValue)}; path=/; max-age=604800; samesite=lax`;
  };

  const clearSession = () => {
    localStorage.removeItem("auth_email");
    localStorage.removeItem("auth_token");
    document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
  };

  useEffect(() => {
    const loadPersonalization = async () => {
      setIsPersonalizationLoaded(false);
      try {
        const { data } = await getUserPersonalization();
        setSelectedTopics(
          Array.isArray(data?.favorite_topics) ? data.favorite_topics : [],
        );
      } catch {
        setSelectedTopics([]);
      } finally {
        setIsPersonalizationLoaded(true);
      }
    };

    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setIsAuthenticated(true);
      document.cookie = `auth_token=${encodeURIComponent(storedToken)}; path=/; max-age=604800; samesite=lax`;
    }
    const storedEmail = localStorage.getItem("auth_email");
    if (storedEmail) setUserEmail(storedEmail);

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      if (sessionUser) {
        setIsAuthenticated(true);
        setUserEmail(sessionUser.email ?? "");
        persistSession(
          sessionUser.email ?? "",
          data.session?.access_token ?? "",
        );
        void loadPersonalization();
      } else {
        setSelectedTopics([]);
        setIsPersonalizationLoaded(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;

      if (nextUser) {
        setIsAuthenticated(true);
        setUserEmail(nextUser.email ?? "");
        persistSession(nextUser.email ?? "", session?.access_token ?? "");
        void loadPersonalization();
      } else {
        setIsAuthenticated(false);
        setUserEmail("");
        setSelectedTopics([]);
        setIsPersonalizationLoaded(true);
        clearSession();
      }
    });

    const handlePersonalizationUpdated = () => {
      void loadPersonalization();
    };
    window.addEventListener(
      PERSONALIZATION_UPDATED_EVENT,
      handlePersonalizationUpdated,
    );

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(
        PERSONALIZATION_UPDATED_EVENT,
        handlePersonalizationUpdated,
      );
    };
  }, []);

  useEffect(() => {
    if (isMobileOpen) onCloseMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    onCloseMobile();
  };

  const navItemClass = (active: boolean) =>
    `group flex items-center gap-3 px-4 py-2 rounded-xl transition text-sm font-medium ${
      active
        ? "bg-[var(--card)] text-[var(--primary)] border border-[var(--primary)]"
        : "text-gray-700 hover:bg-gray-100 hover:text-[var(--primary)]"
    }`;

  const content = (
    <SidebarContent
      query={query}
      setQuery={setQuery}
      handleSearch={handleSearch}
      pathname={pathname}
      navItemClass={navItemClass}
      onCloseMobile={onCloseMobile}
      isAuthenticated={isAuthenticated}
      userEmail={userEmail}
      selectedTopics={selectedTopics}
      isPersonalizationLoaded={isPersonalizationLoaded}
      router={router}
    />
  );

  return (
    <>
      <aside
        className="hidden md:flex fixed left-0 top-[65px] h-[calc(100vh-65px)] w-72 bg-white border-r border-[var(--border)] shadow-sm flex-col"
        style={{ backgroundColor: "var(--card)" }}
      >
        {content}
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.button
              aria-label="Close sidebar overlay"
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl md:hidden flex flex-col"
              style={{ backgroundColor: "var(--card)" }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Snake Register Button ────────────────────────────────────────────────────

function SnakeRegisterButton({ onClick }: { onClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const hoverRef = useRef(false);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const SEGMENTS = 28;
    const RADIUS = 4;

    // Perimeter path: top → right → bottom → left (clockwise)
    const perimeter = 2 * (W + H);

    function perimeterToXY(d: number): [number, number] {
      const p = ((d % perimeter) + perimeter) % perimeter;
      if (p < W) return [p, 0];
      if (p < W + H) return [W, p - W];
      if (p < 2 * W + H) return [W - (p - W - H), H];
      return [0, H - (p - 2 * W - H)];
    }

    function draw(timestamp: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      const speed = hoverRef.current ? 3.5 : 1.2;
      tRef.current += speed;
      const t = tRef.current;

      const SEG_GAP = 9;

      // Draw each segment from tail to head
      for (let i = SEGMENTS - 1; i >= 0; i--) {
        const dist = t - i * SEG_GAP;
        const [x, y] = perimeterToXY(dist);

        const progress = i / (SEGMENTS - 1); // 0=head, 1=tail
        const isHead = i === 0;

        // Color: vivid green gradient head→tail
        const green = Math.round(180 + (1 - progress) * 55);
        const alpha = hoverRef.current ? 1 : 0.85;

        if (isHead) {
          // HEAD — draw a slightly bigger circle + eyes + tongue on hover
          const [nx, ny] = perimeterToXY(dist + 1);
          const angle = Math.atan2(ny - y, nx - x);

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);

          // Head body
          ctx.beginPath();
          ctx.arc(0, 0, RADIUS + 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34,${green},34,${alpha})`;
          ctx.fill();

          // Eyes
          ctx.beginPath();
          ctx.arc(3, -2.5, 1.2, 0, Math.PI * 2);
          ctx.arc(3, 2.5, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,0,0,0.9)";
          ctx.fill();

          // Tongue on hover
          if (hoverRef.current) {
            const flick = Math.sin(timestamp / 80) > 0;
            ctx.strokeStyle = "#e53e3e";
            ctx.lineWidth = 1;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(RADIUS + 2, 0);
            ctx.lineTo(RADIUS + 7, 0);
            if (flick) {
              ctx.moveTo(RADIUS + 7, 0);
              ctx.lineTo(RADIUS + 10, -2.5);
              ctx.moveTo(RADIUS + 7, 0);
              ctx.lineTo(RADIUS + 10, 2.5);
            }
            ctx.stroke();
          }

          ctx.restore();
        } else {
          // BODY segment
          const r = RADIUS * (1 - progress * 0.45);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34,${green},34,${alpha})`;
          ctx.fill();

          // Scale pattern on body
          if (i % 3 === 0) {
            ctx.beginPath();
            ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(20,${Math.round(green * 0.75)},20,${alpha * 0.5})`;
            ctx.fill();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative w-full">
      {/* Snake canvas — sits on top of the button, pointer-events off so clicks pass through */}
      <canvas
        ref={canvasRef}
        width={224}
        height={40}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ borderRadius: "0.75rem" }}
      />
      <Link
        href="/auth/register"
        className="flex w-full items-center justify-center gap-2 py-2 rounded-xl border border-[var(--primary)] bg-transparent text-[var(--primary)] text-sm font-medium transition-all duration-300 hover:bg-transparent hover:text-[var(--primary)] hover:border-emerald-500/80 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_8px_20px_-12px_rgba(16,185,129,0.45)] hover:scale-105 active:scale-95"
        onClick={onClick}
        onMouseEnter={() => (hoverRef.current = true)}
        onMouseLeave={() => (hoverRef.current = false)}
      >
        <UserPlus size={16} />
        <span>Create Account</span>
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SidebarContent({
  query,
  setQuery,
  handleSearch,
  pathname,
  navItemClass,
  onCloseMobile,
  isAuthenticated,
  userEmail,
  selectedTopics,
  isPersonalizationLoaded,
  router,
}: {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: (e: React.FormEvent) => void;
  pathname: string;
  navItemClass: (active: boolean) => string;
  onCloseMobile: () => void;
  isAuthenticated: boolean;
  userEmail: string;
  selectedTopics: string[];
  isPersonalizationLoaded: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const closeAndNavigate = () => onCloseMobile();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const selectedTopicSet = new Set(
    selectedTopics.map((topic) => topic.trim().toLowerCase()),
  );
  const effectiveTopicSet = new Set<string>();
  effectiveTopicSet.add("top headlines");

  if (isAuthenticated) {
    if (selectedTopicSet.size > 0) {
      for (const topic of selectedTopicSet) effectiveTopicSet.add(topic);
    } else {
      for (const topic of DEFAULT_TOPIC_SELECTION) effectiveTopicSet.add(topic);
    }
  } else {
    for (const topic of DEFAULT_TOPIC_SELECTION) effectiveTopicSet.add(topic);
  }

  const visibleCategoryItems = CATEGORY_NAV_ITEMS.filter((item) =>
    effectiveTopicSet.has(item.topic.toLowerCase()),
  );
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
      localStorage.clear();
      applyDarkMode(false);
      applyAppearanceSettings(DEFAULT_APPEARANCE_SETTINGS);
      onCloseMobile();
      router.replace("/");
    }
  };

  return (
    <>
      <div className="p-6 flex-1 overflow-y-auto">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="text-3xl font-black mb-6 bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent cursor-default"
        >
          DailyScoop
        </motion.h2>

        <form onSubmit={handleSearch} className="mb-6 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-300"
            size={18}
          />
          <input
            type="text"
            placeholder="Search news..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-100 py-2 pl-10 pr-10 text-sm text-gray-800 placeholder:text-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-300 dark:focus:border-[var(--primary)] dark:focus:bg-slate-700"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </form>

        <nav className="space-y-2">
          <Link
            href="/live-news"
            className={navItemClass(pathname.startsWith("/live-news"))}
            onClick={closeAndNavigate}
          >
            <Radio
              size={18}
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            />
            Live News Streaming
          </Link>
          {visibleCategoryItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.topic}
                href={item.href}
                className={navItemClass(isActive)}
                onClick={closeAndNavigate}
              >
                <Icon
                  size={18}
                  className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                />
                {item.topic}
              </Link>
            );
          })}
          {isAuthenticated &&
            isPersonalizationLoaded &&
            visibleCategoryItems.length === 0 && (
              <p className="px-4 py-2 text-xs text-gray-500">
                No topics selected. Add topics in Personalization.
              </p>
            )}
          {isAuthenticated && (
            <div className="relative md:hidden my-2">
              {/* Animated border */}
              <div
                className={`
                  absolute -inset-px rounded-xl
                  ${
                    pathname === "/notes"
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }
                  transition-opacity duration-300
                  overflow-hidden
                `}
              >
                <span className="absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#e2e8f0_0%,#9333ea_50%,#e2e8f0_100%)] animate-[spin_4s_linear_infinite]" />
              </div>

              {/* Inner button */}
              <Link
                href="/notes"
                onClick={closeAndNavigate}
                className="relative group z-10 flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-800 border border-transparent hover:text-purple-700 transition-colors duration-300"
              >
                <StickyNote
                  size={18}
                  className="text-purple-600 group-hover:text-purple-700 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                />
                <span>Notes</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Collapsible Sections */}
        {isAuthenticated && (
          <CollapsibleSection title="Extra Options">
            <Link
              href="/personalization"
              className="inline-flex items-center gap-2 px-4 py-1 text-sm text-gray-600 hover:text-[var(--primary)] cursor-pointer transition-colors"
              onClick={closeAndNavigate}
            >
              <SlidersHorizontal size={14} />
              Personalization
            </Link>
            <Link
              href="/appearance"
              className="inline-flex items-center gap-2 px-4 py-1 text-sm text-gray-600 hover:text-[var(--primary)] cursor-pointer transition-colors"
              onClick={closeAndNavigate}
            >
              <Palette size={14} />
              Appearance
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 px-4 py-1 text-sm text-gray-600 hover:text-[var(--primary)] cursor-pointer transition-colors"
              onClick={closeAndNavigate}
            >
              <Gem size={14} />
              Subscriptions
            </Link>
          </CollapsibleSection>
        )}

        <CollapsibleSection title="More Info">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-4 py-1 text-sm text-gray-600 transition-colors hover:text-[var(--primary)]"
            onClick={closeAndNavigate}
          >
            <Info size={14} />
            About NextNews
          </Link>
          <Link
            href="/support"
            className="inline-flex items-center gap-2 px-4 py-1 text-sm text-gray-600 hover:text-[var(--primary)] cursor-pointer transition-colors"
            onClick={closeAndNavigate}
          >
            <LifeBuoy size={14} />
            Contact Support
          </Link>
        </CollapsibleSection>
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
            >
              <img
                src={
                  userEmail
                    ? `https://ui-avatars.com/api/?name=${userEmail}&background=random`
                    : `https://ui-avatars.com/api/?name=User&background=random`
                }
                alt="User Avatar"
                className="w-9 h-9 rounded-full border-2 border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm text-gray-700 block truncate">
                  {userEmail}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50">
                <div className="px-4 py-2 text-sm text-gray-500 border-b">
                  Signed in as <br />
                  <strong className="text-gray-800 truncate block">
                    {userEmail}
                  </strong>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={closeAndNavigate}
                >
                  <Settings size={16} className="text-gray-500" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut size={16} className="text-red-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <SnakeRegisterButton onClick={closeAndNavigate} />
        )}
      </div>
    </>
  );
}

function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition"
      >
        {title}
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="py-1 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
