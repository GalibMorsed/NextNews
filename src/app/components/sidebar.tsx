"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  ChevronDown,
  Film,
  FlaskConical,
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
  Trophy,
  StickyNote,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/superbaseClient";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  applyAppearanceSettings,
} from "@/lib/appearance";
import { applyDarkMode } from "@/lib/accountSettings";

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const [query, setQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
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
      } else {
        setIsAuthenticated(false);
        setUserEmail("");
        clearSession();
      }
    });

    return () => {
      subscription.unsubscribe();
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

function SidebarContent({
  query,
  setQuery,
  handleSearch,
  pathname,
  navItemClass,
  onCloseMobile,
  isAuthenticated,
  userEmail,
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
  router: ReturnType<typeof useRouter>;
}) {
  const closeAndNavigate = () => onCloseMobile();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search news..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-gray-100 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none text-sm transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </form>

        <nav className="space-y-2">
          <Link
            href="/"
            className={navItemClass(pathname === "/")}
            onClick={closeAndNavigate}
          >
            <Home
              size={18}
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            />
            Top Headlines
          </Link>
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
          <Link
            href="/categories/technology"
            className={navItemClass(
              pathname.startsWith("/categories/technology"),
            )}
            onClick={closeAndNavigate}
          >
            <Laptop
              size={18}
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            />
            Technology
          </Link>
          <Link
            href="/categories/business"
            className={navItemClass(
              pathname.startsWith("/categories/business"),
            )}
            onClick={closeAndNavigate}
          >
            <Briefcase
              size={18}
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            />
            Business
          </Link>
          <Link
            href="/categories/entertainment"
            className={navItemClass(
              pathname.startsWith("/categories/entertainment"),
            )}
            onClick={closeAndNavigate}
          >
            <Film
              size={18}
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            />
            Entertainment
          </Link>
          <Link
            href="/categories/sports"
            className={navItemClass(pathname.startsWith("/categories/sports"))}
            onClick={closeAndNavigate}
          >
            <Trophy
              size={18}
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            />
            Sports
          </Link>
          {isAuthenticated && (
            <Link
              href="/categories/health"
              className={navItemClass(
                pathname.startsWith("/categories/health"),
              )}
              onClick={closeAndNavigate}
            >
              <Heart
                size={18}
                className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              />
              Health
            </Link>
          )}
          {isAuthenticated && (
            <Link
              href="/categories/science"
              className={navItemClass(
                pathname.startsWith("/categories/science"),
              )}
              onClick={closeAndNavigate}
            >
              <FlaskConical
                size={18}
                className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              />
              Science
            </Link>
          )}
          {isAuthenticated && (
            <Link
              href="/categories/politics"
              className={navItemClass(
                pathname.startsWith("/categories/politics"),
              )}
              onClick={closeAndNavigate}
            >
              <Landmark
                size={18}
                className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              />
              Politics
            </Link>
          )}
          {isAuthenticated && (
            <Link
              href="/categories/tourism"
              className={navItemClass(
                pathname.startsWith("/categories/tourism"),
              )}
              onClick={closeAndNavigate}
            >
              <Plane
                size={18}
                className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              />
              Tourism
            </Link>
          )}
          {isAuthenticated && (
            <Link
              href="/categories/crime"
              className={navItemClass(pathname.startsWith("/categories/crime"))}
              onClick={closeAndNavigate}
            >
              <ShieldAlert
                size={18}
                className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              />
              Crime
            </Link>
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
              href="/plans"
              className="block px-4 py-1 text-sm text-gray-600 hover:text-[var(--primary)] cursor-pointer transition-colors"
              onClick={closeAndNavigate}
            >
              Subscriptions
            </Link>
            <Link
              href="/appearance"
              className="block px-4 py-1 text-sm text-gray-600 hover:text-[var(--primary)] cursor-pointer transition-colors"
              onClick={closeAndNavigate}
            >
              Appearance
            </Link>
          </CollapsibleSection>
        )}

        <CollapsibleSection title="More Info">
          <Link
            href="/about"
            className="block px-4 py-1 text-sm text-gray-600 transition-colors hover:text-[var(--primary)]"
            onClick={closeAndNavigate}
          >
            About NextNews
          </Link>
          <Link
            href="/support"
            className="block px-4 py-1 text-sm text-gray-600 hover:text-[var(--primary)] cursor-pointer transition-colors"
            onClick={closeAndNavigate}
          >
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
          <Link
            href="/auth/register"
            className="block w-full text-center py-2 rounded-xl border border-[var(--primary)] bg-transparent text-[var(--primary)] text-sm font-medium transition-all duration-300 hover:bg-[var(--primary)] hover:text-white hover:shadow-lg hover:scale-105 active:scale-95"
            onClick={closeAndNavigate}
          >
            Register
          </Link>
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
