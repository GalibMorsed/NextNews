"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Crown,
  LifeBuoy,
  LogOut,
  Search,
  Settings,
  SlidersHorizontal,
  StickyNote,
  UserPlus,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Info,
  Sparkles,
  HelpCircle,
  PlayCircle,
  Sun,
  Moon,
} from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import LottiePlayer from "./LottiePlayer";
import { supabase } from "../../../lib/superbaseClient";
import {
  PERSONALIZATION_UPDATED_EVENT,
  getUserPersonalization,
} from "../services/personalizationService";
import {
  readActivityAnalytics,
  readGoalTrackerState,
  ACTIVITY_DATA_EVENT,
  GOAL_TRACKER_EVENT,
  type ActivityAnalytics,
} from "@/lib/activityAnalytics";
import {
  ACCOUNT_SETTINGS_EVENT,
  DARK_MODE_STORAGE_KEY,
  applyDarkMode,
  broadcastAccountSettings,
  persistDarkModeSetting,
  readDarkModeSetting,
  type StoredAccountSettings,
} from "@/lib/accountSettings";
import { loadUserSubscriptionPlan } from "../services/subscriptionPlanService";
import {
  clearClientSession,
  getVerifiedAuthUser,
  persistClientSession,
} from "@/lib/clientAuth";
import {
  DEFAULT_PERSONALIZATION_TOPICS,
  sanitizePersonalizationTopic,
  slugifyPersonalizationTopic,
} from "@/lib/personalizationTopics";

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isDesktopCollapsed?: boolean;
  onToggleDesktop?: () => void;
}

type CategoryNavItem = {
  topic: string;
  href: string;
  iconName: IconName;
};

const CATEGORY_NAV_ITEMS: CategoryNavItem[] = [
  { topic: "Top Headlines", href: "/", iconName: "home" },
  { topic: "Technology", href: "/categories/technology", iconName: "laptop" },
  { topic: "Business", href: "/categories/business", iconName: "briefcase" },
  {
    topic: "Entertainment",
    href: "/categories/entertainment",
    iconName: "film",
  },
  { topic: "Sports", href: "/categories/sports", iconName: "trophy" },
  { topic: "Health", href: "/categories/health", iconName: "heart" },
  { topic: "Science", href: "/categories/science", iconName: "flask-conical" },
  { topic: "Politics", href: "/categories/politics", iconName: "landmark" },
  { topic: "Tourism", href: "/categories/tourism", iconName: "plane" },
  { topic: "Crime", href: "/categories/crime", iconName: "shield-alert" },
  { topic: "Environment", href: "/categories/environment", iconName: "leaf" },
  {
    topic: "Education",
    href: "/categories/education",
    iconName: "graduation-cap",
  },
  { topic: "Travel", href: "/categories/travel", iconName: "map" },
  { topic: "Food", href: "/categories/food", iconName: "utensils-crossed" },
  { topic: "Fashion", href: "/categories/fashion", iconName: "shirt" },
  { topic: "Finance", href: "/categories/finance", iconName: "wallet" },
  { topic: "Automotive", href: "/categories/automotive", iconName: "car" },
  { topic: "Music", href: "/categories/music", iconName: "music-2" },
  { topic: "Movies", href: "/categories/movies", iconName: "clapperboard" },
  { topic: "Books", href: "/categories/books", iconName: "book-open" },
  { topic: "Art", href: "/categories/art", iconName: "palette" },
  { topic: "Culture", href: "/categories/culture", iconName: "palette" },
  { topic: "Gaming", href: "/categories/gaming", iconName: "gamepad-2" },
  {
    topic: "Spirituality & Religion",
    href: "/categories/spirituality-religion",
    iconName: "gem",
  },
  {
    topic: "Mental Health",
    href: "/categories/mental-health",
    iconName: "heart",
  },
  {
    topic: "Artificial Intelligence",
    href: "/categories/artificial-intelligence",
    iconName: "bot",
  },
  {
    topic: "Cybersecurity",
    href: "/categories/cybersecurity",
    iconName: "shield-alert",
  },
  {
    topic: "Space & Astronomy",
    href: "/categories/space-astronomy",
    iconName: "telescope",
  },
  {
    topic: "Stock Market",
    href: "/categories/stock-market",
    iconName: "chart-candlestick",
  },
  {
    topic: "Trade & Economy",
    href: "/categories/trade-economy",
    iconName: "trending-up",
  },
  {
    topic: "Real Estate",
    href: "/categories/real-estate",
    iconName: "building-2",
  },
  {
    topic: "Defense & Military",
    href: "/categories/defense-military",
    iconName: "shield",
  },
  {
    topic: "Agriculture & Farming",
    href: "/categories/agriculture-farming",
    iconName: "sprout",
  },
  { topic: "World News", href: "/categories/world-news", iconName: "globe-2" },
  { topic: "Weather", href: "/categories/weather", iconName: "cloud-sun" },
  { topic: "Energy", href: "/categories/energy", iconName: "zap" },
  { topic: "Startups", href: "/categories/startups", iconName: "rocket" },
  {
    topic: "Law & Justice",
    href: "/categories/law-justice",
    iconName: "scale",
  },
  {
    topic: "Social Media",
    href: "/categories/social-media",
    iconName: "share-2",
  },
  {
    topic: "Personal Finance",
    href: "/categories/personal-finance",
    iconName: "piggy-bank",
  },
];

const INDIAN_TADKA_SOURCES = [
  {
    name: "India Today",
    id: "india-today",
    href: "/news/indian-tadka/india-today",
    icon: "/indianTadka/indiaToday.png",
  },
  {
    name: "Times of India",
    id: "times-of-india",
    href: "/news/indian-tadka/times-of-india",
    icon: "/indianTadka/timesofIndia.jpg",
  },
  {
    name: "Hindustan Times",
    id: "hindustan-times",
    href: "/news/indian-tadka/hindustan-times",
    icon: "/indianTadka/hindustanTimes.jpg",
  },
  {
    name: "Indian Express",
    id: "indian-express",
    href: "/news/indian-tadka/indian-express",
    icon: "/indianTadka/indianExpress.jpg",
  },
  {
    name: "The Hindu",
    id: "the-hindu",
    href: "/news/indian-tadka/the-hindu",
    icon: "/indianTadka/theHindu.jpg",
  },
];

const CATEGORY_NAV_BY_TOPIC = new Map(
  CATEGORY_NAV_ITEMS.map((item) => [item.topic.toLowerCase(), item]),
);

function SidebarIcon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <DynamicIcon
      name={name}
      size={size}
      className={className}
      fallback={() => null}
    />
  );
}

const TOPIC_ICON_RULES: Array<[RegExp, IconName]> = [
  [
    /\b(ai|artificial intelligence|machine learning|generative|llm|chatbot|robot|automation)\b/,
    "bot",
  ],
  [/\b(chip|semiconductor|processor|cpu|gpu|hardware|quantum|device)\b/, "cpu"],
  [
    /\b(neural|brain|cognitive|mental health|psychology|therapy)\b/,
    "brain-circuit",
  ],
  [
    /\b(cyber|cybersecurity|hack|hacker|ransomware|malware|phishing|breach|password|privacy|encryption)\b/,
    "lock-keyhole",
  ],
  [/\b(bug|vulnerability|zero-day|exploit|patch)\b/, "bug"],
  [
    /\b(software|app|apps|platform|internet|cloud|database|data|server|saas|code|developer)\b/,
    "database",
  ],
  [
    /\b(phone|smartphone|mobile|ios|android|telecom|5g|network)\b/,
    "smartphone",
  ],
  [/\b(startup|startups|founder|venture|funding|ipo|entrepreneur)\b/, "rocket"],
  [
    /\b(election|vote|voting|poll|campaign|ballot|democrat|republican)\b/,
    "vote",
  ],
  [
    /\b(politic|government|parliament|congress|senate|policy|minister|president|diplomacy)\b/,
    "landmark",
  ],
  [/\b(court|law|justice|legal|judge|lawsuit|trial|ruling)\b/, "gavel"],
  [
    /\b(war|defense|military|army|navy|air force|missile|weapon|border|conflict|troop)\b/,
    "shield",
  ],
  [/\b(crime|police|arrest|fraud|murder|homicide|theft)\b/, "siren"],
  [
    /\b(health|medical|medicine|doctor|hospital|patient|disease|virus|vaccine|covid|flu|wellness)\b/,
    "stethoscope",
  ],
  [/\b(biotech|biology|genetic|dna|pharma|drug|clinical)\b/, "dna"],
  [/\b(science|research|lab|physics|chemistry|discovery|experiment)\b/, "atom"],
  [/\b(space|astronomy|nasa|satellite|moon|mars|rocket|planet)\b/, "telescope"],
  [
    /\b(stock|stocks|market|trading|wall street|invest|investment|shares|equity)\b/,
    "chart-candlestick",
  ],
  [
    /\b(economy|inflation|gdp|recession|growth|trade|export|import|tariff)\b/,
    "trending-up",
  ],
  [
    /\b(finance|bank|money|tax|loan|mortgage|credit|debt|retirement|savings)\b/,
    "banknote",
  ],
  [/\b(crypto|bitcoin|blockchain|ethereum|web3|token)\b/, "bitcoin"],
  [/\b(real estate|housing|property|rent|home price|mortgage)\b/, "building-2"],
  [
    /\b(business|company|corporate|earnings|retail|consumer|brand|industry)\b/,
    "briefcase",
  ],
  [/\b(energy|oil|gas|fuel|petrol|diesel|electricity|power grid)\b/, "fuel"],
  [/\b(solar|wind|renewable|battery|ev charging)\b/, "solar-panel"],
  [
    /\b(weather|storm|rain|heatwave|temperature|forecast|snow)\b/,
    "thermometer",
  ],
  [/\b(climate|environment|pollution|forest|wildfire|carbon)\b/, "tree-pine"],
  [/\b(flood|ocean|sea|water|hurricane|cyclone|tsunami)\b/, "waves"],
  [/\b(fire|wildfire|heat|volcano)\b/, "flame"],
  [
    /\b(farm|farming|agriculture|crop|wheat|rice|livestock|irrigation|food security)\b/,
    "wheat",
  ],
  [/\b(food|restaurant|recipe|chef|cuisine|nutrition)\b/, "chef-hat"],
  [/\b(travel|tourism|tourist|hotel|airline|visa|destination)\b/, "plane"],
  [/\b(car|auto|automotive|vehicle|ev|tesla|transport)\b/, "car"],
  [/\b(train|rail|metro|subway)\b/, "train"],
  [/\b(bus|transit|public transport)\b/, "bus"],
  [/\b(ship|shipping|port|supply chain|cargo|freight|logistics)\b/, "ship"],
  [/\b(truck|delivery|warehouse)\b/, "truck"],
  [/\b(movie|film|cinema|box office|actor|director)\b/, "clapperboard"],
  [/\b(music|album|song|singer|concert|band)\b/, "music-2"],
  [/\b(tv|television|streaming|netflix|series|show)\b/, "tv"],
  [/\b(celebrity|entertainment|influencer|creator)\b/, "camera"],
  [/\b(social media|tiktok|instagram|youtube|x|twitter|facebook)\b/, "share-2"],
  [/\b(media|press|journalism|headline|news)\b/, "newspaper"],
  [/\b(book|author|publishing|literature|novel)\b/, "book-marked"],
  [/\b(art|artist|gallery|museum|painting|design)\b/, "palette"],
  [/\b(fashion|style|clothing|designer|runway)\b/, "shirt"],
  [/\b(game|gaming|esports|console|playstation|xbox)\b/, "gamepad-2"],
  [
    /\b(sport|sports|cricket|football|soccer|tennis|basketball|nba|nfl|olympic)\b/,
    "trophy",
  ],
  [/\b(school|education|university|college|student|exam)\b/, "graduation-cap"],
  [/\b(religion|faith|spirituality|church|temple|mosque)\b/, "gem"],
  [/\b(shopping|commerce|ecommerce|store|consumer)\b/, "shopping-cart"],
  [/\b(community|society|people|labor|workers|migration)\b/, "users"],
  [/\b(world|global|international|geopolitics|foreign)\b/, "globe-2"],
  [/\b(live|breaking|alert|urgent)\b/, "activity"],
  [/\b(factory|manufacturing|industrial|supply)\b/, "factory"],
  [/\b(public|announcement|campaign|communication)\b/, "megaphone"],
  [/\b(chart|analytics|trend|statistics|data)\b/, "chart-line"],
];

function getDynamicTopicIcon(topic: string): IconName {
  const normalized = topic.toLowerCase();

  for (const [pattern, iconName] of TOPIC_ICON_RULES) {
    if (pattern.test(normalized)) return iconName;
  }

  return "newspaper";
}

const DEFAULT_TOPIC_SELECTION = DEFAULT_PERSONALIZATION_TOPICS.map((topic) =>
  topic.toLowerCase(),
);

const SIDEBAR_SEARCH_EVENT = "sidebar-search";

export default function Sidebar({
  isMobileOpen,
  onCloseMobile,
  isDesktopCollapsed,
  onToggleDesktop,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isPersonalizationLoaded, setIsPersonalizationLoaded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const loadPersonalization = async () => {
      if (!isMounted) return;
      setIsPersonalizationLoaded(false);
      try {
        const { data } = await getUserPersonalization();
        if (!isMounted) return;
        setSelectedTopics(
          Array.isArray(data?.favorite_topics) ? data.favorite_topics : [],
        );
      } catch {
        if (!isMounted) return;
        setSelectedTopics([]);
      } finally {
        if (isMounted) {
          setIsPersonalizationLoaded(true);
        }
      }
    };

    getVerifiedAuthUser().then(({ user }) => {
      if (!isMounted) return;
      if (user) {
        setIsAuthenticated(true);
        setUserEmail(user.email ?? "");
        void loadPersonalization();
      } else {
        setIsAuthenticated(false);
        setUserEmail("");
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
        persistClientSession(nextUser.email ?? "", session?.access_token ?? "");
        void loadPersonalization();
      } else {
        setIsAuthenticated(false);
        setUserEmail("");
        setSelectedTopics([]);
        setIsPersonalizationLoaded(true);
        clearClientSession();
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
      isMounted = false;
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

  const runSearch = useCallback(
    (nextQuery: string) => {
      const trimmed = nextQuery.trim();
      if (!trimmed) return;
      setQuery(trimmed);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      onCloseMobile();
    },
    [onCloseMobile, router],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  useEffect(() => {
    const handleSidebarSearch = (event: Event) => {
      const detail = (event as CustomEvent<{ query?: string }>).detail;
      if (!detail?.query) return;
      runSearch(detail.query);
    };

    window.addEventListener(SIDEBAR_SEARCH_EVENT, handleSidebarSearch);
    return () => {
      window.removeEventListener(SIDEBAR_SEARCH_EVENT, handleSidebarSearch);
    };
  }, [runSearch]);

  const desktopContent = (
    <SidebarContent
      query={query}
      setQuery={setQuery}
      handleSearch={handleSearch}
      pathname={pathname}
      onCloseMobile={onCloseMobile}
      isAuthenticated={isAuthenticated}
      userEmail={userEmail}
      selectedTopics={selectedTopics}
      isPersonalizationLoaded={isPersonalizationLoaded}
      router={router}
      isDesktopCollapsed={isDesktopCollapsed}
      onToggleDesktop={onToggleDesktop}
      isMobile={false}
    />
  );

  const mobileContent = (
    <SidebarContent
      query={query}
      setQuery={setQuery}
      handleSearch={handleSearch}
      pathname={pathname}
      onCloseMobile={onCloseMobile}
      isAuthenticated={isAuthenticated}
      userEmail={userEmail}
      selectedTopics={selectedTopics}
      isPersonalizationLoaded={isPersonalizationLoaded}
      router={router}
      isDesktopCollapsed={false}
      isMobile={true}
    />
  );

  return (
    <>
      <aside
        className={`hidden md:flex fixed left-0 top-[65px] h-[calc(100vh-65px)] ${isDesktopCollapsed ? "w-20" : "w-72"} transition-[width] duration-300 bg-white/95 backdrop-blur border-r border-slate-200/80 shadow-sm flex-col dark:bg-slate-900/95 dark:border-slate-700/80 z-10`}
      >
        {/* Floating Toggle Button */}
        {!isMobileOpen && onToggleDesktop && (
          <button
            onClick={onToggleDesktop}
            className="absolute -right-4 top-15 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md hover:bg-slate-50 hover:scale-110 transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 group"
            title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpen
                size={18}
                className="text-slate-500 group-hover:text-indigo-600 transition-colors"
              />
            ) : (
              <PanelLeftClose
                size={18}
                className="text-slate-500 group-hover:text-indigo-600 transition-colors"
              />
            )}
          </button>
        )}
        {desktopContent}
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
              {mobileContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  query,
  setQuery,
  handleSearch,
  pathname,
  onCloseMobile,
  isAuthenticated,
  userEmail,
  selectedTopics,
  isPersonalizationLoaded,
  router,
  isDesktopCollapsed,
  onToggleDesktop,
  isMobile,
}: {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: (e: React.FormEvent) => void;
  pathname: string;
  onCloseMobile: () => void;
  isAuthenticated: boolean;
  userEmail: string;
  selectedTopics: string[];
  isPersonalizationLoaded: boolean;
  router: ReturnType<typeof useRouter>;
  isDesktopCollapsed?: boolean;
  onToggleDesktop?: () => void;
  isMobile?: boolean;
}) {
  const closeAndNavigate = () => onCloseMobile();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [realGoal, setRealGoal] = useState({ current: 0, target: 15 });
  const [planName, setPlanName] = useState("FREE");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(readDarkModeSetting());
  }, []);

  useEffect(() => {
    const syncDarkMode = (nextValue: boolean) => {
      setIsDarkMode((prev) => (prev === nextValue ? prev : nextValue));
      applyDarkMode(nextValue);
    };

    const handleAccountSettings = (event: Event) => {
      const detail = (event as CustomEvent<StoredAccountSettings>).detail;
      if (typeof detail?.darkMode !== "boolean") return;
      syncDarkMode(detail.darkMode);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== DARK_MODE_STORAGE_KEY) return;
      if (event.newValue === null) return;
      syncDarkMode(event.newValue === "true");
    };

    window.addEventListener(ACCOUNT_SETTINGS_EVENT, handleAccountSettings);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(ACCOUNT_SETTINGS_EVENT, handleAccountSettings);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggleDarkMode = () => {
    const nextValue = !isDarkMode;
    setIsDarkMode(nextValue);
    applyDarkMode(nextValue);
    persistDarkModeSetting(nextValue);
    broadcastAccountSettings({ darkMode: nextValue });
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      // Load Subscription
      const planResult = await loadUserSubscriptionPlan();
      if (planResult.data) {
        setPlanName(planResult.data.plan_name.toUpperCase());
      }

      // Load Analytics & Goal
      const analytics = await readActivityAnalytics();
      const goalState = await readGoalTrackerState();

      // Calculate Weekly Progress
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const mondayTime = monday.getTime();

      const weekEvents = (analytics.events || []).filter(
        (e) => new Date(e.timestamp).getTime() >= mondayTime,
      );

      const aiUsage = weekEvents.filter((e) =>
        [
          "ai_summary",
          "personalization_suggestion",
          "region_suggestion",
        ].includes(e.type),
      ).length;
      const articles = weekEvents.filter(
        (e) => e.type === "article_open",
      ).length;

      setRealGoal({
        current: aiUsage + articles,
        target: goalState.weeklyGoal || 15,
      });
    };

    void loadData();

    // Listen for updates
    window.addEventListener(ACTIVITY_DATA_EVENT, loadData);
    window.addEventListener(GOAL_TRACKER_EVENT, loadData);
    return () => {
      window.removeEventListener(ACTIVITY_DATA_EVENT, loadData);
      window.removeEventListener(GOAL_TRACKER_EVENT, loadData);
    };
  }, [isAuthenticated]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchClick = () => {
    if (isDesktopCollapsed && onToggleDesktop) {
      onToggleDesktop();
    }
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };
  const navItemClass = (active: boolean) =>
    `group flex items-center ${isDesktopCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "gap-3 px-4 py-2"} transition-all duration-300 text-sm font-medium ${
      active
        ? "text-[var(--primary)] dark:text-sky-400 font-bold relative rounded-xl bg-indigo-50/30 dark:bg-sky-400/10 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-5 before:bg-[var(--primary)] dark:before:bg-sky-400 before:rounded-full before:shadow-[0_0_12px_var(--primary)] dark:before:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
        : "rounded-xl text-gray-700 hover:bg-gray-100 hover:text-[var(--primary)] dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  const selectedTopicLabels = selectedTopics
    .map((topic) => sanitizePersonalizationTopic(topic))
    .filter(Boolean);
  const selectedTopicSet = new Set(
    selectedTopicLabels.map((topic) => topic.toLowerCase()),
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
  const customCategoryItems: CategoryNavItem[] = [];
  const customTopicSet = new Set<string>();

  for (const topic of selectedTopicLabels) {
    const topicKey = topic.toLowerCase();
    if (
      CATEGORY_NAV_BY_TOPIC.has(topicKey) ||
      customTopicSet.has(topicKey) ||
      !effectiveTopicSet.has(topicKey)
    ) {
      continue;
    }

    customTopicSet.add(topicKey);
    customCategoryItems.push({
      topic,
      href: `/categories/${slugifyPersonalizationTopic(topic)}`,
      iconName: getDynamicTopicIcon(topic),
    });
  }

  const visibleNavigationItems = [
    ...visibleCategoryItems,
    ...customCategoryItems,
  ];
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      clearClientSession(userEmail);
      onCloseMobile();
      router.replace("/");
    }
  };

  return (
    <>
      <div
        className={`flex-1 overflow-y-auto sidebar-scrollbar ${isDesktopCollapsed ? "p-3 overflow-x-hidden" : "p-6"}`}
      >
        <div
          className={`flex items-center ${isDesktopCollapsed ? "flex-col gap-4" : "gap-3"} mb-8`}
        >
          {/* Header Action Row Removed */}

          {isMobile ? (
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              transition={{
                type: "spring",
                stiffness: 600,
                damping: 12,
                bounce: 0.4,
                duration: 0.4,
              }}
              className="text-3xl font-bold italic tracking-tight bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-default overflow-hidden whitespace-nowrap drop-shadow-sm"
              style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}
            >
              NextSpace
            </motion.h2>
          ) : (
            <>
              {!isDesktopCollapsed ? (
                <div className="flex-1">
                  <form onSubmit={handleSearch} className="relative group">
                    <Search
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none"
                      size={18}
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search news..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/60 bg-slate-100/40 py-2.5 pl-11 pr-10 text-sm font-semibold text-slate-800 placeholder:text-slate-400/60 transition-all duration-300 hover:bg-slate-100/60 hover:border-slate-300/80 focus:outline-none focus:bg-white focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100 dark:placeholder:text-slate-500/50 dark:hover:bg-slate-800/60 dark:hover:border-slate-600/50 dark:focus:bg-slate-900"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-400 shadow-sm pointer-events-none group-focus-within:opacity-0 transition-opacity dark:bg-slate-800 dark:border-slate-700/80 dark:text-slate-500">
                      <span className="text-[12px] leading-none mt-0.5">⌘</span>
                      <span>/</span>
                    </div>
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </form>
                </div>
              ) : (
                <button
                  onClick={handleSearchClick}
                  className="flex items-center justify-center w-12 h-12 mx-auto rounded-xl bg-slate-50/80 shadow-sm border border-slate-200/60 hover:bg-slate-100 hover:scale-105 transition-all dark:bg-slate-800/80 dark:border-slate-700/60 dark:hover:bg-slate-700 dark:hover:border-slate-600"
                  title="Search"
                >
                  <Search
                    size={20}
                    className="text-slate-500 dark:text-slate-400"
                  />
                </button>
              )}
            </>
          )}

          {/* Toggle Button Removed */}
        </div>

        {isMobile && (
          <div className="relative mb-6">
            <form onSubmit={handleSearch} className="relative group">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[var(--primary)]"
                size={19}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search news..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/92 pl-12 pr-16 text-[15px] font-semibold text-slate-800 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.65)] transition-all duration-300 placeholder:text-slate-400 focus:outline-none focus:border-[var(--primary)]/30 focus:ring-4 focus:ring-[var(--primary)]/8 dark:border-slate-700/80 dark:bg-slate-900/88 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <X size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  aria-label="Search news"
                  className="absolute right-3 top-1/2 inline-flex h-8 min-w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 text-slate-500 shadow-sm transition-all hover:bg-slate-100 hover:text-[var(--primary)] dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <span className="text-sm font-semibold leading-none">/</span>
                </button>
              )}
            </form>
          </div>
        )}

        <nav className="space-y-2">
          <CollapsibleSection
            title="Streamings"
            isDesktopCollapsed={isDesktopCollapsed}
            onToggleDesktop={onToggleDesktop}
            defaultOpen={
              pathname.startsWith("/live-news") ||
              pathname.startsWith("/shorts")
            }
            icon={
              <LottiePlayer
                src="/indianTadka/play button animation.json"
                className="w-6 h-6 -ml-1"
              />
            }
          >
            <Link
              href="/live-news"
              className={`flex items-center ${isDesktopCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-2"} transition-all duration-300 text-sm font-medium ${
                pathname.startsWith("/live-news")
                  ? "text-[var(--primary)] dark:text-sky-400 font-bold relative rounded-xl bg-indigo-50/30 dark:bg-sky-400/10 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-5 before:bg-[var(--primary)] dark:before:bg-sky-400 before:rounded-full before:shadow-[0_0_12px_var(--primary)] dark:before:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                  : "rounded-xl text-gray-600 hover:bg-gray-100 hover:text-[var(--primary)] dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
              onClick={closeAndNavigate}
              title={isDesktopCollapsed ? "News Streaming" : undefined}
            >
              <SidebarIcon
                name="radio"
                size={isDesktopCollapsed ? 18 : 14}
                className="shrink-0 text-red-500"
              />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isDesktopCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}
              >
                News Streaming
              </span>
              {!isDesktopCollapsed && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  LIVE
                </span>
              )}
            </Link>
            <Link
              href="/shorts"
              className={`flex items-center ${isDesktopCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-2"} transition-all duration-300 text-sm font-medium ${
                pathname.startsWith("/shorts")
                  ? "text-[var(--primary)] dark:text-sky-400 font-bold relative rounded-xl bg-indigo-50/30 dark:bg-sky-400/10 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-5 before:bg-[var(--primary)] dark:before:bg-sky-400 before:rounded-full before:shadow-[0_0_12px_var(--primary)] dark:before:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                  : "rounded-xl text-gray-600 hover:bg-gray-100 hover:text-[var(--primary)] dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
              onClick={closeAndNavigate}
              title={isDesktopCollapsed ? "Shorts" : undefined}
            >
              <PlayCircle
                size={isDesktopCollapsed ? 18 : 14}
                className="shrink-0 text-purple-500"
              />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isDesktopCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}
              >
                Shorts
              </span>
            </Link>
          </CollapsibleSection>

          <CollapsibleSection
            title={
              <span className="bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 bg-clip-text text-transparent font-bold">
                Indian Tadka
              </span>
            }
            isDesktopCollapsed={isDesktopCollapsed}
            onToggleDesktop={onToggleDesktop}
            defaultOpen={INDIAN_TADKA_SOURCES.some((s) => pathname === s.href)}
            icon={
              <LottiePlayer
                src="/indianTadka/fire.json"
                className="w-6 h-6 -ml-1"
              />
            }
          >
            {INDIAN_TADKA_SOURCES.map((source) => (
              <Link
                key={source.id}
                href={source.href}
                className={`flex items-center ${isDesktopCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-2"} transition-all duration-300 text-sm font-medium ${
                  pathname === source.href
                    ? "text-[var(--primary)] dark:text-sky-400 font-bold relative rounded-xl bg-indigo-50/30 dark:bg-sky-400/10 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-5 before:bg-[var(--primary)] dark:before:bg-sky-400 before:rounded-full before:shadow-[0_0_12px_var(--primary)] dark:before:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                    : "rounded-xl text-gray-600 hover:bg-gray-100 hover:text-[var(--primary)] dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
                onClick={closeAndNavigate}
                title={isDesktopCollapsed ? source.name : undefined}
              >
                <img
                  src={source.icon}
                  alt={source.name}
                  className={`shrink-0 rounded-md object-cover border border-slate-200 dark:border-slate-700 ${isDesktopCollapsed ? "w-6 h-6" : "w-5 h-5"}`}
                />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isDesktopCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}
                >
                  {source.name}
                </span>
              </Link>
            ))}
          </CollapsibleSection>
          <CollapsibleSection
            title="Catagories"
            isDesktopCollapsed={isDesktopCollapsed}
            onToggleDesktop={onToggleDesktop}
            defaultOpen={true}
            icon={
              <SidebarIcon
                name="layout-grid"
                size={16}
                className="text-indigo-500"
              />
            }
          >
            {visibleNavigationItems.map((item) => {
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
                  title={isDesktopCollapsed ? item.topic : undefined}
                >
                  <SidebarIcon
                    name={item.iconName}
                    size={18}
                    className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shrink-0"
                  />
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isDesktopCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}
                  >
                    {item.topic}
                  </span>
                </Link>
              );
            })}
          </CollapsibleSection>
          <div
            className={`overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? "max-h-0 opacity-0" : "max-h-20 opacity-100"}`}
          >
            {isAuthenticated &&
              isPersonalizationLoaded &&
              visibleNavigationItems.length === 0 && (
                <p className="px-4 py-2 text-xs text-slate-500">
                  No topics selected. Add topics in Personalization.
                </p>
              )}
          </div>
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
                className="relative group z-10 flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-800 border border-transparent hover:text-indigo-700 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-indigo-400"
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

        {/* Divider */}
        <div className="h-px bg-slate-400/40 dark:bg-slate-600/40 my-6 mx-4 transition-all duration-300" />

        {/* Dark Mode Toggle */}
        {isAuthenticated && (
          <div className={`${isDesktopCollapsed ? "px-0" : "px-4"} mb-2`}>
            <button
              onClick={toggleDarkMode}
              className={`group flex items-center ${
                isDesktopCollapsed
                  ? "justify-center w-12 h-12 mx-auto bg-slate-50/80 shadow-sm border border-slate-200/60 dark:bg-slate-800/80 dark:border-slate-700/60"
                  : "gap-3 px-4 py-2.5 w-full hover:bg-slate-50 dark:hover:bg-slate-800/60"
              } rounded-xl transition-all duration-300 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400`}
              title={isDesktopCollapsed ? "Toggle Theme" : undefined}
            >
              <div
                className={`transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 shrink-0 ${isDarkMode ? "text-indigo-500" : "text-amber-500"}`}
              >
                {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              {!isDesktopCollapsed && (
                <>
                  <span className="text-sm font-semibold flex-1 text-left">
                    Dark Mode
                  </span>
                  <div
                    className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isDarkMode ? "bg-indigo-500/80" : "bg-slate-200 dark:bg-slate-700"}`}
                  >
                    <motion.div
                      layout
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm ${isDarkMode ? "right-0.5" : "left-0.5"}`}
                    />
                  </div>
                </>
              )}
            </button>
          </div>
        )}

        {/* Collapsible Sections */}
        <div className="overflow-hidden transition-all duration-300">
          {isAuthenticated && (
            <CollapsibleSection
              title="Extra Options"
              isDesktopCollapsed={isDesktopCollapsed}
              onToggleDesktop={onToggleDesktop}
              defaultOpen={
                pathname.startsWith("/personalization") ||
                pathname.startsWith("/appearance") ||
                pathname.startsWith("/plans")
              }
              showTreeLines={true}
              icon={<Sparkles size={16} className="text-amber-500" />}
            >
              <Link
                href="/personalization"
                className={`inline-flex items-center ${isDesktopCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-1.5 w-full"} text-sm font-medium transition-all duration-300 rounded-xl ${
                  pathname.startsWith("/personalization")
                    ? "text-[var(--primary)] dark:text-sky-400 font-bold relative rounded-xl bg-indigo-50/30 dark:bg-sky-400/10 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-5 before:bg-[var(--primary)] dark:before:bg-sky-400 before:rounded-full before:shadow-[0_0_12px_var(--primary)] dark:before:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                    : "text-slate-600 hover:text-[var(--primary)] hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={closeAndNavigate}
                title={isDesktopCollapsed ? "Personalization" : undefined}
              >
                <SlidersHorizontal
                  className="shrink-0"
                  size={isDesktopCollapsed ? 18 : 14}
                />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isDesktopCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}
                >
                  Personalization
                </span>
              </Link>
              <Link
                href="/appearance"
                className={`inline-flex items-center ${isDesktopCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-1.5 w-full"} text-sm font-medium transition-all duration-300 rounded-xl ${
                  pathname.startsWith("/appearance")
                    ? "text-[var(--primary)] dark:text-sky-400 font-bold relative rounded-xl bg-indigo-50/30 dark:bg-sky-400/10 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-5 before:bg-[var(--primary)] dark:before:bg-sky-400 before:rounded-full before:shadow-[0_0_12px_var(--primary)] dark:before:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                    : "text-slate-600 hover:text-[var(--primary)] hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={closeAndNavigate}
                title={isDesktopCollapsed ? "Appearance" : undefined}
              >
                <SidebarIcon
                  className="shrink-0"
                  name="palette"
                  size={isDesktopCollapsed ? 18 : 14}
                />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isDesktopCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}
                >
                  Appearance
                </span>
              </Link>
              <Link
                href="/plans"
                className={`inline-flex items-center ${isDesktopCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-1.5 w-full"} text-sm font-medium transition-all duration-300 rounded-xl ${
                  pathname.startsWith("/plans")
                    ? "text-[var(--primary)] dark:text-sky-400 font-bold relative rounded-xl bg-indigo-50/30 dark:bg-sky-400/10 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-5 before:bg-[var(--primary)] dark:before:bg-sky-400 before:rounded-full before:shadow-[0_0_12px_var(--primary)] dark:before:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                    : "text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800"
                }`}
                onClick={closeAndNavigate}
                title={isDesktopCollapsed ? "Subscriptions" : undefined}
              >
                <SidebarIcon
                  className="shrink-0"
                  name="gem"
                  size={isDesktopCollapsed ? 18 : 14}
                />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isDesktopCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}
                >
                  Subscriptions
                </span>
              </Link>
            </CollapsibleSection>
          )}

          <CollapsibleSection
            title="More Info"
            isDesktopCollapsed={isDesktopCollapsed}
            onToggleDesktop={onToggleDesktop}
            defaultOpen={
              pathname.startsWith("/about") ||
              pathname.startsWith("/support") ||
              pathname.startsWith("/privacy-policy")
            }
            showTreeLines={true}
            icon={<HelpCircle size={16} className="text-blue-500" />}
          >
            <Link
              href="/about"
              className={`inline-flex items-center ${isDesktopCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-1.5 w-full"} text-sm font-medium transition-all duration-300 rounded-xl ${
                pathname.startsWith("/about")
                  ? "text-[var(--primary)] dark:text-sky-400 font-bold relative rounded-xl bg-indigo-50/30 dark:bg-sky-400/10 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-5 before:bg-[var(--primary)] dark:before:bg-sky-400 before:rounded-full before:shadow-[0_0_12px_var(--primary)] dark:before:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                  : "text-slate-600 hover:text-[var(--primary)] hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              onClick={closeAndNavigate}
              title={isDesktopCollapsed ? "About NextNews" : undefined}
            >
              <SidebarIcon
                className="shrink-0"
                name="info"
                size={isDesktopCollapsed ? 18 : 14}
              />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isDesktopCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}
              >
                About NextNews
              </span>
            </Link>
            <Link
              href="/support"
              className={`inline-flex items-center ${isDesktopCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-1.5 w-full"} text-sm font-medium transition-all duration-300 rounded-xl ${
                pathname.startsWith("/support")
                  ? "text-[var(--primary)] dark:text-sky-400 font-bold relative rounded-xl bg-indigo-50/30 dark:bg-sky-400/10 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-5 before:bg-[var(--primary)] dark:before:bg-sky-400 before:rounded-full before:shadow-[0_0_12px_var(--primary)] dark:before:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                  : "text-slate-600 hover:text-[var(--primary)] hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              onClick={closeAndNavigate}
              title={isDesktopCollapsed ? "Contact Support" : undefined}
            >
              <LifeBuoy
                className="shrink-0"
                size={isDesktopCollapsed ? 18 : 14}
              />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isDesktopCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}
              >
                Contact Support
              </span>
            </Link>
            <Link
              href="/privacy-policy"
              className={`inline-flex items-center ${isDesktopCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-1.5 w-full"} text-sm font-medium transition-all duration-300 rounded-xl ${
                pathname.startsWith("/privacy-policy")
                  ? "text-[var(--primary)] dark:text-sky-400 font-bold relative rounded-xl bg-indigo-50/30 dark:bg-sky-400/10 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-5 before:bg-[var(--primary)] dark:before:bg-sky-400 before:rounded-full before:shadow-[0_0_12px_var(--primary)] dark:before:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                  : "text-slate-600 hover:text-[var(--primary)] hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              onClick={closeAndNavigate}
              title={isDesktopCollapsed ? "Privacy Policy" : undefined}
            >
              <SidebarIcon
                className="shrink-0"
                name="shield"
                size={isDesktopCollapsed ? 18 : 14}
              />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isDesktopCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}
              >
                Privacy Policy
              </span>
            </Link>
          </CollapsibleSection>
        </div>
      </div>

      <div
        className={`p-4 border-t border-[var(--border)] ${isDesktopCollapsed ? "flex justify-center p-3" : ""}`}
      >
        {isAuthenticated ? (
          <div className={`relative ${isDesktopCollapsed ? "" : "w-full"}`}>
            <button
              onClick={() => {
                if (isDesktopCollapsed) {
                  onToggleDesktop?.();
                  setUserMenuOpen(true);
                } else {
                  setUserMenuOpen(!userMenuOpen);
                }
              }}
              className={`flex items-center ${
                isDesktopCollapsed
                  ? "justify-center w-12 h-12 mx-auto bg-slate-50/80 shadow-sm border border-slate-200/60 dark:bg-slate-800/80 dark:border-slate-700/60"
                  : "gap-3 px-2 w-full"
              } py-2 rounded-xl hover:bg-slate-100 transition-all text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] dark:hover:bg-slate-800`}
              title={
                isDesktopCollapsed ? `Signed in as ${userEmail}` : undefined
              }
            >
              <img
                src={
                  userEmail
                    ? `https://ui-avatars.com/api/?name=${userEmail}&background=random`
                    : `https://ui-avatars.com/api/?name=User&background=random`
                }
                alt="User Avatar"
                width={36}
                height={36}
                className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700/80 shrink-0"
              />
              <div
                className={`flex items-center overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100 flex-1 min-w-0"}`}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-slate-700 block truncate dark:text-slate-200">
                    {userEmail}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-500 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            <AnimatePresence>
              {userMenuOpen && !isDesktopCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className="absolute bottom-full left-0 mb-4 w-full rounded-2xl shadow-2xl bg-white border border-slate-100 p-2 z-50 backdrop-blur-xl ring-1 ring-slate-200/70 origin-bottom dark:bg-slate-900/95 dark:border-slate-700/80 dark:ring-slate-700/60 dark:shadow-slate-950/60"
                >
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 p-3 mb-2">
                    <img
                      src={`https://ui-avatars.com/api/?name=${userEmail}&background=random`}
                      className="w-10 h-10 rounded-full border-2 border-indigo-50 dark:border-indigo-900/40"
                      alt="Avatar"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        Signed in as
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {userEmail}
                      </p>
                    </div>
                  </div>

                  {/* Unique Membership Widget */}
                  <Link
                    href="/my-activity"
                    aria-label="Open My Activity"
                    className="mx-1 mb-2 block rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-100/60 p-3 transition hover:border-indigo-200/80 hover:shadow-sm dark:from-indigo-500/20 dark:to-purple-500/20 dark:border-indigo-500/40 dark:hover:border-indigo-400/60"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                        Subscription
                      </span>
                      <div
                        className={`flex items-center gap-1 ${planName === "FREE" ? "bg-slate-400" : "bg-indigo-500 animate-pulse"} px-2 py-0.5 rounded-full shadow-lg shadow-indigo-500/20`}
                      >
                        <Crown size={10} className="text-white" />
                        <span className="text-[10px] font-black text-white">
                          {planName}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <span>Weekly Goal</span>
                        <span>
                          {realGoal.current}/{realGoal.target} Activities
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, (realGoal.current / realGoal.target) * 100)}%`,
                          }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>
                  </Link>

                  {/* Menu Items Group */}
                  <div className="bg-slate-50/90 rounded-xl p-1 border border-slate-100/80 dark:bg-slate-800/70 dark:border-slate-700/60 mb-2">
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-indigo-300"
                      onClick={closeAndNavigate}
                    >
                      <Settings size={18} className="text-slate-400" />
                      Settings
                    </Link>
                  </div>

                  {/* Footer Action */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-bold text-red-600 rounded-xl bg-red-50/50 hover:bg-red-100 transition-colors dark:text-red-300 dark:bg-red-950/40 dark:hover:bg-red-950/70 dark:border dark:border-red-900/50 group"
                  >
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900/80 shadow-sm transition-transform group-hover:scale-110">
                      <LogOut size={16} />
                    </div>
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link
            href="/auth/register"
            onClick={closeAndNavigate}
            className={`flex w-full items-center justify-center ${isDesktopCollapsed ? "px-0" : "gap-2 px-4"} rounded-xl border border-[var(--primary)] bg-transparent py-2 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10`}
            title={isDesktopCollapsed ? "Create Account" : undefined}
          >
            <UserPlus size={isDesktopCollapsed ? 20 : 16} />
            {!isDesktopCollapsed && <span>Create Account</span>}
          </Link>
        )}
      </div>
    </>
  );
}

function CollapsibleSection({
  title,
  children,
  isDesktopCollapsed,
  icon,
  defaultOpen = false,
  showTreeLines = false,
  onToggleDesktop,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  isDesktopCollapsed?: boolean;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  showTreeLines?: boolean;
  onToggleDesktop?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen && !isDesktopCollapsed) {
      setIsOpen(true);
    }
  }, [defaultOpen, isDesktopCollapsed]);

  const flattenedChildren = (Array.isArray(children) ? children : [children])
    .flat()
    .filter(Boolean);

  return (
    <div className="mt-2">
      <div
        className={`transition-all duration-300 ${isDesktopCollapsed ? "w-12 h-12 mx-auto" : "max-h-12 opacity-100"}`}
      >
        <button
          onClick={() => {
            if (isDesktopCollapsed) {
              onToggleDesktop?.();
              setIsOpen(true);
            } else {
              setIsOpen(!isOpen);
            }
          }}
          className={`flex items-center ${isDesktopCollapsed ? "justify-center p-0 h-12 w-12 bg-slate-50/80 shadow-sm border border-slate-200/60 dark:bg-slate-800/80 dark:border-slate-700/60" : "justify-between w-full px-4 py-2.5"} text-sm font-semibold rounded-xl transition-all duration-200 group ${
            isOpen && !isDesktopCollapsed
              ? "bg-slate-50 text-slate-900 shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-800/50 dark:text-slate-100 dark:ring-slate-700/50"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          }`}
          title={
            isDesktopCollapsed && typeof title === "string" ? title : undefined
          }
        >
          <div
            className={`flex items-center ${isDesktopCollapsed ? "justify-center" : "gap-3"} min-w-0`}
          >
            {icon && (
              <div className="shrink-0 flex items-center justify-center">
                {icon}
              </div>
            )}
            {!isDesktopCollapsed && (
              <span className="whitespace-nowrap truncate">{title}</span>
            )}
          </div>
          {!isDesktopCollapsed && (
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : "opacity-60 group-hover:opacity-100"}`}
            />
          )}
        </button>
      </div>
      <AnimatePresence>
        {isOpen && !isDesktopCollapsed && (
          <motion.div
            key="content"
            initial="closed"
            animate={isOpen && !isDesktopCollapsed ? "open" : "closed"}
            exit="closed"
            variants={{
              open: {
                height: "auto",
                opacity: 1,
                y: 0,
                transition: {
                  height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
                  opacity: { duration: 0.3, delay: 0.1 },
                  y: { duration: 0.4, ease: "easeOut" },
                  staggerChildren: 0.1,
                  delayChildren: 0.05,
                },
              },
              closed: {
                height: 0,
                opacity: 0,
                y: -4,
                transition: {
                  height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                  opacity: { duration: 0.2 },
                  y: { duration: 0.2 },
                  staggerChildren: 0.05,
                  staggerDirection: -1,
                },
              },
            }}
            className="overflow-hidden"
          >
            <div
              className={`mt-1 ${showTreeLines ? "relative ml-6" : "space-y-1"}`}
            >
              {showTreeLines && (
                <motion.div
                  variants={{
                    open: { height: "calc(100% - 22px)", opacity: 1 },
                    closed: { height: 0, opacity: 0 },
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute left-0 -top-2 w-px bg-slate-300 dark:bg-slate-700"
                />
              )}

              <div className="space-y-1">
                {flattenedChildren.map((child, index) => (
                  <motion.div
                    key={index}
                    variants={{
                      open: { opacity: 1, y: 0, scale: 1 },
                      closed: { opacity: 0, y: 20, scale: 0.98 },
                    }}
                    className={`relative ${showTreeLines ? "pl-6 group/item" : ""}`}
                  >
                    {showTreeLines && (
                      <motion.div
                        variants={{
                          open: { width: 16, opacity: 1 },
                          closed: { width: 0, opacity: 0 },
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-5 border-l border-b border-slate-300 dark:border-slate-700 rounded-bl-xl -mt-2.5"
                      />
                    )}
                    {child}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
