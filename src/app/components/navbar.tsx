"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, ComponentProps } from "react";
import { StickyNote } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { supabase } from "../../../lib/superbaseClient";
import { getVerifiedAuthUser } from "@/lib/clientAuth";
import MemberDropdownMenu from "./memberDropdownMenu";

const Path = (props: ComponentProps<typeof motion.path>) => (
  <motion.path
    fill="transparent"
    strokeWidth="2.5"
    stroke="currentColor"
    strokeLinecap="round"
    {...props}
  />
);


interface NavbarProps {
  onMenuToggle: () => void;
  isMobileOpen: boolean;
}

export default function Navbar({ onMenuToggle, isMobileOpen }: NavbarProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // Use cached local token — avoids Supabase navigator-lock call
        if (localStorage.getItem("auth_token") || localStorage.getItem("auth_email")) {
          if (isMounted) setIsAuthenticated(true);
          return;
        }
        const { user } = await getVerifiedAuthUser();
        if (isMounted) setIsAuthenticated(Boolean(user));
      } catch {
        // silently ignore AbortError / navigator-lock timeout
      }
    };

    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isNotesActive = pathname === "/notes";

  return (
    <nav
      className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/50 backdrop-blur-xl px-4 py-4 md:px-6 dark:border-slate-800/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.15)] transition-all duration-300"
      style={{ backgroundColor: "var(--navbar-bg)" }}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span className="inline-flex rounded-xl bg-white/90 p-1.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800/80 dark:ring-slate-700">
            <Image
              src="/nav-logo.jpg"
              alt="NextNews logo"
              width={40}
              height={40}
              className="h-8 w-8 rounded-md object-cover dark:brightness-110 dark:contrast-110"
              priority
            />
          </span>
          <span className="truncate text-xl font-light italic tracking-wide text-[var(--foreground)] sm:text-2xl">
            NextNews
          </span>
        </Link>
      </div>

      <div className="hidden flex-1 justify-center px-2 md:flex">
        {isAuthenticated ? <MemberDropdownMenu /> : null}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {isAuthenticated ? <MemberDropdownMenu className="md:hidden" /> : null}

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              href="/notes"
              className={`
                group relative inline-flex items-center gap-2
                rounded-xl border border-slate-140
                px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300
                transition-all duration-300 ease-out
                hover:border-indigo-600 hover:text-indigo-600 hover:shadow-md dark:hover:border-indigo-400 dark:hover:text-indigo-400
                ${isNotesActive ? "border-indigo-600 text-indigo-600 shadow-sm dark:border-indigo-400 dark:text-indigo-400" : ""}
              `}
            >
              <StickyNote
                size={18}
                className={`
                  text-[var(--primary)] transition-transform duration-300
                  group-hover:scale-110 group-hover:rotate-6
                `}
              />
              Notes
              {/* Subtle underline indicator when active or hovered */}
              <span
                className={`
                  absolute bottom-0 left-4 right-4 h-0.5 
                  bg-indigo-600 dark:bg-indigo-400
                  scale-x-0 transform origin-center
                  transition-transform duration-300 ease-out
                  group-hover:scale-x-100
                  ${isNotesActive ? "scale-x-100" : ""}
                `}
              />
            </Link>
          ) : (
            <Link
              href="/auth/register"
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:shadow-md hover:brightness-110 hover:scale-[1.02]"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          type="button"
          onClick={onMenuToggle}
          animate={isMobileOpen ? "open" : "closed"}
          initial={false}
          aria-label="Toggle sidebar"
          className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] p-2 text-[var(--foreground)] md:hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm transition-all duration-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-slate-300/80 dark:hover:border-slate-700/80 focus:outline-none"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" className="w-[18px] h-[18px]">
            <Path
              variants={{
                closed: { d: "M 4 6 L 20 6" },
                open: { d: "M 6 6 L 18 18" }
              }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            />
            <Path
              d="M 4 12 L 20 12"
              variants={{
                closed: { opacity: 1, scale: 1 },
                open: { opacity: 0, scale: 0 }
              }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            />
            <Path
              variants={{
                closed: { d: "M 4 18 L 20 18" },
                open: { d: "M 6 18 L 18 6" }
              }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            />
          </svg>
        </motion.button>
      </div>
    </nav>
  );
}
