"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/superbaseClient";
import Image from "next/image";
import {
  BellRing,
  BookmarkCheck,
  BrainCircuit,
  FilePenLine,
  Newspaper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [signupCooldownUntil, setSignupCooldownUntil] = useState<number | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState(() => Date.now());
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
    if (signupCooldownUntil === null) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [signupCooldownUntil]);

  const isCooldownActive =
    signupCooldownUntil !== null && currentTime < signupCooldownUntil;

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          clearSession();
          return;
        }

        persistSession(session.user.email ?? "", session.access_token ?? "");
        router.replace("/");
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleRegister = async () => {
    const now = Date.now();
    if (signupCooldownUntil && now < signupCooldownUntil) {
      const remaining = Math.ceil((signupCooldownUntil - now) / 1000);
      setErrorMessage(
        `Too many signup attempts. Please wait ${remaining}s and try again.`,
      );
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const { data: loginData } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (loginData.session?.user) {
      setLoading(false);
      persistSession(
        loginData.session.user.email ?? trimmedEmail,
        loginData.session.access_token ?? "",
      );
      router.replace("/");
      return;
    }

    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      {
        email: trimmedEmail,
        password,
      },
    );

    if (signupError) {
      const isRateLimited =
        (typeof (signupError as { status?: number }).status === "number" &&
          (signupError as { status?: number }).status === 429) ||
        signupError.message.toLowerCase().includes("too many requests");

      if (isRateLimited) {
        setSignupCooldownUntil(Date.now() + 60_000);
        setLoading(false);
        setErrorMessage("Too many signup attempts. Please wait and try again.");
        return;
      }

      const isAlreadyRegistered = signupError.message
        .toLowerCase()
        .includes("already registered");
      if (isAlreadyRegistered) {
        const { data: existingLoginData, error: existingLoginError } =
          await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

        setLoading(false);

        if (existingLoginData.session?.user) {
          persistSession(
            existingLoginData.session.user.email ?? trimmedEmail,
            existingLoginData.session.access_token ?? "",
          );
          router.replace("/");
          return;
        }

        setErrorMessage(
          existingLoginError?.message ?? "Invalid login credentials.",
        );
        return;
      }

      setLoading(false);
      setErrorMessage(signupError.message);
      return;
    }

    if (signupData.session?.user) {
      setLoading(false);
      persistSession(
        signupData.session.user.email ?? trimmedEmail,
        signupData.session.access_token ?? "",
      );
      router.replace("/");
      return;
    }

    const { data: postSignupLoginData, error: postSignupLoginError } =
      await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

    setLoading(false);

    if (postSignupLoginData.session?.user) {
      persistSession(
        postSignupLoginData.session.user.email ?? trimmedEmail,
        postSignupLoginData.session.access_token ?? "",
      );
      router.replace("/");
      return;
    }

    setErrorMessage(
      postSignupLoginError?.message ??
        "Account created. Please verify your email, then login.",
    );
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/register`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("missing oauth secret")) {
        setErrorMessage(
          "Google auth is not fully configured in Supabase. Add Google Client ID and Client Secret in Supabase Auth Providers, then retry.",
        );
      } else {
        setErrorMessage(error.message);
      }
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-white to-sky-50 px-4 py-8 sm:px-6 md:py-10">
      <div className="pointer-events-none absolute -left-14 top-8 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl animate-float-soft motion-reduce:animate-none" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-44 w-44 rounded-full bg-sky-200/50 blur-3xl animate-float-soft-delayed motion-reduce:animate-none" />

      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <section className="animate-fade-up rounded-2xl border border-amber-100 bg-white/90 p-5 shadow-lg shadow-amber-100/50 backdrop-blur transition-transform duration-500 motion-reduce:animate-none motion-reduce:transition-none sm:p-7 lg:hover:-translate-y-0.5">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold tracking-wide text-amber-700">
            <Sparkles className="h-4 w-4" />
            Join NextNews
          </div>

          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            Create your account and personalize your next news flow.😉
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            Get curated categories, saved preferences, and faster access across
            devices in under a minute.
          </p>

          <div className="mt-5 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <div
              className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-center font-medium text-sky-700"
              style={{
                animation: "fade-up 0.5s ease-out both",
                animationDelay: "120ms",
              }}
            >
              Save and organize Notes
            </div>
            <div
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center font-medium text-amber-700"
              style={{
                animation: "fade-up 0.5s ease-out both",
                animationDelay: "60ms",
              }}
            >
              Personalized feed setup
            </div>
          </div>

          <div className="mt-5">
            <input
              type="email"
              placeholder="Email address"
              className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:-translate-y-0.5 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />

            <input
              type="password"
              placeholder="Password"
              className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:-translate-y-0.5 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />

            <button
              onClick={handleRegister}
              disabled={loading || isCooldownActive}
              className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-300/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating your account..."
                : isCooldownActive
                  ? "Please wait..."
                  : "Create My Account"}
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px w-full bg-slate-200" />
            <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
              or continue with
            </p>
            <div className="h-px w-full bg-slate-200" />
          </div>

          <button
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md hover:shadow-slate-200/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              width={18}
              height={18}
            />
            {googleLoading ? "Connecting..." : "Sign up with Google"}
          </button>

          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <p className="mt-4 text-center text-sm text-slate-600 underline">
            Already registered? Use the same credentials and register again.
          </p>
        </section>

        <section
          className="animate-fade-in rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 shadow-lg shadow-sky-100/60 transition-transform duration-500 motion-reduce:animate-none motion-reduce:transition-none sm:p-7 lg:hover:-translate-y-0.5"
          style={{ animationDelay: "120ms" }}
        >
          <div className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
            <Newspaper className="h-5 w-5 text-sky-700" />
            Why register with NextNews?⚡
          </div>

          <ul className="space-y-3">
            <li
              className="flex items-start gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-sky-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-sky-100/70"
              style={{
                animation: "fade-up 0.5s ease-out both",
                animationDelay: "140ms",
              }}
            >
              <BookmarkCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Save what matters
                </p>
                <p className="text-sm text-slate-600">
                  Bookmark key stories and revisit them anytime without losing
                  context.
                </p>
              </div>
            </li>
            <li
              className="flex items-start gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-sky-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-sky-100/70"
              style={{
                animation: "fade-up 0.5s ease-out both",
                animationDelay: "220ms",
              }}
            >
              <FilePenLine className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Notes with customization
                </p>
                <p className="text-sm text-slate-600">
                  Create and customize notes on articles to capture your
                  thoughts.
                </p>
              </div>
            </li>
            <li
              className="flex items-start gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-sky-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-sky-100/70"
              style={{
                animation: "fade-up 0.5s ease-out both",
                animationDelay: "300ms",
              }}
            >
              <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  AI Summary for every article
                </p>
                <p className="text-sm text-slate-600">
                  Get a quick summary of any news article with the power of AI.
                </p>
              </div>
            </li>
            <li
              className="flex items-start gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-sky-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-sky-100/70"
              style={{
                animation: "fade-up 0.5s ease-out both",
                animationDelay: "380ms",
              }}
            >
              <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Faster daily updates
                </p>
                <p className="text-sm text-slate-600">
                  Set your interests once and get news streams tuned to your
                  priorities.
                </p>
              </div>
            </li>
            <li
              className="flex items-start gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-sky-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-sky-100/70"
              style={{
                animation: "fade-up 0.5s ease-out both",
                animationDelay: "460ms",
              }}
            >
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Reliable and secure
                </p>
                <p className="text-sm text-slate-600">
                  Your account settings and reading preferences are protected
                  and portable.
                </p>
              </div>
            </li>
          </ul>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div
              className="group rounded-xl border border-amber-100 bg-amber-50/30 px-3 py-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:bg-amber-50 hover:shadow-lg hover:shadow-amber-100/40"
              style={{
                animation: "fade-up 0.5s ease-out both",
                animationDelay: "220ms",
              }}
            >
              <p className="text-xl font-bold text-amber-700 transition-transform duration-300 group-hover:scale-110">
                1 min
              </p>
              <p className="text-xs font-medium text-amber-600/80">
                Quick setup
              </p>
            </div>
            <div
              className="group rounded-xl border border-sky-100 bg-sky-50/30 px-3 py-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:bg-sky-50 hover:shadow-lg hover:shadow-sky-100/40"
              style={{
                animation: "fade-up 0.5s ease-out both",
                animationDelay: "300ms",
              }}
            >
              <p className="text-xl font-bold text-sky-700 transition-transform duration-300 group-hover:scale-110">
                24/7
              </p>
              <p className="text-xs font-medium text-sky-600/80">News access</p>
            </div>
            <div
              className="group rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-lg hover:shadow-emerald-100/40"
              style={{
                animation: "fade-up 0.5s ease-out both",
                animationDelay: "380ms",
              }}
            >
              <p className="text-xl font-bold text-emerald-700 transition-transform duration-300 group-hover:scale-110">
                100%
              </p>
              <p className="text-xs font-medium text-emerald-600/80">
                Mobile friendly
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
