"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../../../lib/superbaseClient";

const REMINDER_INTERVAL_MS = 2 * 60 * 1000;

export default function RegisterReminder() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    const syncAuthState = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (!mounted) return;

      if (sessionUser) {
        setIsAuthenticated(true);
        setIsVisible(false);
        return;
      }

      const localToken = localStorage.getItem("auth_token");
      const hasLocalAuth = Boolean(localToken);
      setIsAuthenticated(hasLocalAuth);
      setIsVisible(!hasLocalAuth);
    };

    syncAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasSession = Boolean(session?.user);
      setIsAuthenticated(hasSession);
      setIsVisible(!hasSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) return;

    const interval = window.setInterval(() => {
      setIsVisible(true);
      setCycleKey((prev) => prev + 1);
    }, REMINDER_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <AnimatePresence>
      {!isAuthenticated && isVisible && (
        <motion.div
          key={`reminder-${cycleKey}`}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 right-4 z-40 w-[calc(100%-2rem)] max-w-sm md:right-6"
        >
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.16)] backdrop-blur">
            <motion.div
              key={`progress-${cycleKey}`}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{
                duration: REMINDER_INTERVAL_MS / 1000,
                ease: "linear",
              }}
              className="absolute inset-x-0 top-0 h-1 origin-left bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"
            />

            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-200/40 blur-2xl" />

            <motion.button
              type="button"
              onClick={() => setIsVisible(false)}
              aria-label="Close reminder"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="absolute right-2 top-2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={16} />
            </motion.button>

            <h3 className="pr-6 text-sm font-semibold text-slate-900">
              Create your account to unlock full access
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Register now to access advanced categories, save preferences, and
              explore personalized features.
            </p>

            <motion.div
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              className="mt-4"
            >
              <Link
                href="/auth/register"
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Register Now
              </Link>
              {/* Subtext */}
            </motion.div>
            <p className="mt-2 text-center text-xs text-slate-400">
              Takes less than a minute · No spam · Always free
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
