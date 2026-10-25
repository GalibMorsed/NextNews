"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import {
  FaComments,
  FaEnvelope,
  FaPhoneAlt,
  FaQuestionCircle,
  FaTimes,
} from "react-icons/fa";

import FeedbackToast from "../components/feedbackToast";
import { SUPPORT_ISSUE_TYPES } from "@/lib/supportComplaintOptions";

export default function SupportPage() {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const CONTACT_REGEX = /^[0-9+()\-\s]{7,20}$/;

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [feedbackToastKey, setFeedbackToastKey] = useState(0);
  const [communityLikes, setCommunityLikes] = useState(2892);
  const [feedbackCount, setFeedbackCount] = useState(3240);
  const [formData, setFormData] = useState({
    issueType: "",
    name: "",
    email: "",
    contactNumber: "",
    website: "",
  });

  const faqs = [
    {
      q: "What should I do if I cannot log in or finish registration?",
      a: "Check your email and password. If your account is new, verify your email first.",
    },
    {
      q: "Where do the Shorts videos come from?",
      a: "Shorts are fetched from the Dailymotion API (news channel) and filtered by category plus India-related keywords. Playback uses the embedded Dailymotion player.",
    },
    {
      q: "Why does Shorts show no videos for a category?",
      a: "We only surface India-focused clips that match the selected category. If none are available at the moment, the feed can appear empty. Try another category or check back later.",
    },
    {
      q: "What if my saved notes are not loading?",
      a: "Refresh the Notes page and confirm you are using the correct account.",
    },
    {
      q: "Why are my personalized topics not updating?",
      a: "Save your preferences again, then reload the page once.",
    },
    {
      q: "Why is Live News or plan content not opening?",
      a: "Make sure you are logged in and the right plan is active on your account.",
    },
    {
      q: "What should I do if settings are not saving?",
      a: "Try one more time and wait for the success message before leaving the page.",
    },
    {
      q: "What if a page or article is not loading?",
      a: "Refresh once and check your internet connection. If it continues, contact support.",
    },
    {
      q: "How can I get faster help for any app error?",
      a: "Send the page name, feature name, and exact error message in the support form or Live Chat.",
    },
    {
      q: "What are AI credits and how do they work?",
      a: "AI credits are weighted points for using AI features like summaries and suggestions. Summaries cost 1 credit, personalized suggestions cost 2 credits, and region suggestions cost 2 credits.",
    },
    {
      q: "What's the free plan credit limit?",
      a: "Free users get a 16-day trial with 20 weighted AI credits. After using 20 credits or 16 days pass, you'll need to upgrade to a paid plan.",
    },
    {
      q: "What happens after my free 16 days end?",
      a: "Your free access expires after 16 days. You can then choose a paid plan (Pro or Pro+) to continue using AI features and access premium content.",
    },
    {
      q: "What is the 12-day cooldown after free credits run out?",
      a: "After using all 20 free AI credits, you enter a 12-day waiting period before you can use AI features again (unless you upgrade to a paid plan for immediate access).",
    },
    {
      q: "Can I use remaining credits after canceling my paid plan?",
      a: "Yes! If you cancel a paid plan, you can continue using any remaining credits until they're fully consumed or your plan access expires.",
    },
  ];

  const supportOptions = [
    {
      title: "FAQ",
      desc: "Browse common questions and quick solutions.",
      icon: (
        <FaQuestionCircle className="text-[17px] sm:text-[22px] text-black drop-shadow-sm transition-colors duration-300 dark:text-white" />
      ),
    },
    {
      title: "Live Chat",
      desc: "Chat with our support team in real time.",
      icon: (
        <FaComments className="text-[17px] sm:text-[22px] text-black drop-shadow-sm transition-colors duration-300 dark:text-white" />
      ),
    },
    {
      title: "Phone Support",
      desc: "Call us during business hours.",
      icon: (
        <FaPhoneAlt className="text-[15px] sm:text-[22px] text-black drop-shadow-sm transition-colors duration-300 dark:text-white" />
      ),
    },
    {
      title: "Email Support",
      desc: "Write us about any Assistance or Feedback.",
      icon: (
        <FaEnvelope className="text-[17px] sm:text-[22px] text-black drop-shadow-sm transition-colors duration-300 dark:text-white" />
      ),
    },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const name = formData.name.trim();
      const email = formData.email.trim();
      const contactNumber = formData.contactNumber.trim();

      if (name.length < 2 || name.length > 80) {
        throw new Error("Name must be between 2 and 80 characters");
      }

      if (!EMAIL_REGEX.test(email) || email.length > 120) {
        throw new Error("Please provide a valid email address");
      }

      if (contactNumber && !CONTACT_REGEX.test(contactNumber)) {
        throw new Error("Please provide a valid contact number");
      }

      const payload = {
        name,
        email,
        subject: formData.issueType,
        contactNumber,
        website: formData.website,
        formStartedAt,
      };

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit request");
      }

      setSubmitted(true);
      setFormData({
        issueType: "",
        name: "",
        email: "",
        contactNumber: "",
        website: "",
      });
      setFormStartedAt(Date.now());
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit request",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionClick = (title: string) => {
    if (title === "Live Chat") {
      window.open("https://wa.me/918100684108", "_blank");
      return;
    }

    setActiveModal(title);
  };

  const handleFeedback = (type: "up" | "down", reason?: string) => {
    setFeedbackCount((prev) => prev + 1);

    if (type === "up") {
      setCommunityLikes((prev) => prev + 1);
    }

    if (reason) {
      console.info("Support feedback reason:", reason);
    }
  };

  const openFeedbackToast = () => {
    setFeedbackToastKey((prev) => prev + 1);
    setIsFeedbackVisible(true);
  };

  const handleSubmitAnotherRequest = () => {
    setSubmitted(false);
    setSubmitError(null);
    setFormStartedAt(Date.now());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6 sm:py-12 lg:px-8"
    >
      <div className="mx-auto flex w-full max-w-6xl justify-center">
        <div className="w-full p-0">
          <div className="space-y-6 lg:space-y-8">
            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-teal-200/80 bg-gradient-to-r from-white via-teal-50/60 to-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black shadow-md shadow-teal-100/60 backdrop-blur dark:border-teal-800/50 dark:from-slate-900/90 dark:via-teal-950/30 dark:to-slate-900/90 dark:text-slate-100 dark:shadow-teal-900/20">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Proudly loved by the community
              </div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.45 }}
                className="group w-full max-w-3xl rounded-3xl bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/20 dark:to-slate-900/50 hover:from-teal-100/50 dark:hover:from-teal-900/30 transition-all duration-300 border-2 border-teal-200/60 dark:border-teal-900/40 hover:border-teal-300/80 dark:hover:border-teal-700/60 p-6 shadow-md shadow-teal-100/40 dark:shadow-none"
              >
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_140px] md:items-center">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full p-2.5 shadow-lg shadow-teal-500/30 border border-white/30 transition-transform group-hover:scale-110 w-fit shrink-0">
                        <Heart className="h-4 w-4 text-white fill-current" />
                      </div>
                      <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                        {communityLikes.toLocaleString()} likes and growing
                      </span>
                    </div>

                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      NextNews is earning real love, and we are proud of it.
                    </p>

                    <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {feedbackCount.toLocaleString()} readers have already
                      rated their experience with our app and support flow.
                    </p>
                  </div>

                  <motion.button
                    type="button"
                    onClick={openFeedbackToast}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex min-h-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 border border-white/20 transition-all duration-200 hover:from-teal-600 hover:to-cyan-600"
                  >
                    Leave quick feedback
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start">
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              >
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-3xl font-bold leading-tight text-gray-900 dark:text-slate-100 sm:text-4xl lg:text-5xl">
                    We&apos;re here{" "}
                    <span
                      style={{ fontFamily: "cursive" }}
                      className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-600 font-medium italic drop-shadow-sm"
                    >
                      to help,
                    </span>{" "}
                    anytime.
                  </h1>

                  <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                    Our support team is always ready to help you troubleshoot,
                    answer questions, and guide you toward solutions.
                  </p>
                </div>

                <div className="flex flex-row flex-wrap gap-3">
                  <motion.span
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="inline-flex w-fit max-w-full items-center justify-center rounded-full bg-teal-50 px-4 py-2 text-center text-sm font-medium text-teal-700 shadow-sm dark:bg-teal-950/40 dark:text-teal-300"
                  >
                    99% satisfaction rate
                  </motion.span>
                  <motion.span
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="inline-flex w-fit max-w-full items-center justify-center rounded-full bg-teal-50 px-4 py-2 text-center text-sm font-medium text-teal-700 shadow-sm dark:bg-teal-950/40 dark:text-teal-300"
                  >
                    Avg. response: &lt;24h
                  </motion.span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-5">
                  {supportOptions.map((item, index) => (
                    <motion.div
                      key={item.title}
                      className="group flex flex-col sm:flex-row cursor-pointer sm:items-start sm:gap-4 overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/70 bg-white/70 p-3 sm:p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-teal-300/80 hover:bg-gradient-to-br hover:from-white hover:to-teal-50/50 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:border-teal-700/60 dark:hover:from-slate-800 dark:hover:to-teal-950/40"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.15 + 0.08 * index,
                        ease: "easeOut",
                      }}
                      whileHover={{ y: -3, scale: 1.01 }}
                      onClick={() => handleOptionClick(item.title)}
                    >
                      <div className="flex items-center gap-2 sm:block sm:shrink-0">
                        <motion.div
                          className="flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 shadow-inner ring-1 ring-teal-100/80 transition-all duration-300 group-hover:from-teal-100 group-hover:to-cyan-100 dark:from-teal-950/40 dark:to-cyan-950/20 dark:ring-teal-900/50 dark:group-hover:from-teal-900/60 dark:group-hover:to-cyan-900/40"
                          whileHover={{ scale: 1.08, rotate: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          {item.icon}
                        </motion.div>

                        <h3 className="sm:hidden truncate text-xs font-bold text-slate-900 transition-colors duration-300 group-hover:text-teal-600 dark:text-slate-100 dark:group-hover:text-teal-400">
                          {item.title}
                        </h3>
                      </div>

                      <div className="min-w-0 flex-1 sm:pt-0.5">
                        <h3 className="hidden sm:block truncate text-base font-semibold text-slate-900 transition-colors duration-300 group-hover:text-teal-600 dark:text-slate-100 dark:group-hover:text-teal-400">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 sm:mt-1 line-clamp-2 text-[11px] sm:text-sm leading-snug sm:leading-relaxed text-slate-600 dark:text-slate-400">
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="flex h-full w-full self-stretch rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800 sm:p-8 lg:min-h-[35rem] lg:p-10"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                <div className="flex w-full flex-col justify-center">
                  <h2 className="mb-6 text-center text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl lg:text-left">
                    Contact Support
                  </h2>

                  {!submitted ? (
                    <form className="space-y-5" onSubmit={handleSubmit}>
                      <div className="hidden" aria-hidden="true">
                        <label htmlFor="support-website">Website</label>
                        <input
                          id="support-website"
                          type="text"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          tabIndex={-1}
                          autoComplete="off"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Select Issue Type
                        </label>
                        <select
                          name="issueType"
                          value={formData.issueType}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 shadow-sm outline-none transition-all duration-200 hover:shadow-md focus:border-teal-400 focus:ring-2 focus:ring-teal-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                          required
                        >
                          <option value="">Select an option...</option>
                          {SUPPORT_ISSUE_TYPES.map((issueType) => (
                            <option key={issueType} value={issueType}>
                              {issueType}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Your Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your name"
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 shadow-sm outline-none transition-all duration-200 hover:shadow-md focus:border-teal-400 focus:ring-2 focus:ring-teal-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="example@example.com"
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 shadow-sm outline-none transition-all duration-200 hover:shadow-md focus:border-teal-400 focus:ring-2 focus:ring-teal-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleChange}
                          placeholder="Enter your contact number"
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 shadow-sm outline-none transition-all duration-200 hover:shadow-md focus:border-teal-400 focus:ring-2 focus:ring-teal-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-teal-500 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-600 hover:shadow-lg active:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSubmitting ? "Submitting..." : "Submit request"}
                      </motion.button>

                      {submitError && (
                        <p className="text-sm font-medium text-rose-600">
                          {submitError}
                        </p>
                      )}
                    </form>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex flex-1 flex-col justify-center space-y-5 text-center"
                    >
                      <h3 className="text-2xl font-semibold text-teal-600">
                        Thank You!
                      </h3>
                      <p className="px-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                        Your support request has been submitted successfully.
                        Our team will review your inquiry and get back to you
                        within 24 hours via email or phone. If it&apos;s urgent,
                        consider using Live Chat or Phone Support for faster
                        assistance.
                      </p>
                      <div className="space-y-3">
                        <motion.button
                          type="button"
                          onClick={handleSubmitAnotherRequest}
                          className="w-full rounded-lg bg-slate-100 py-3 font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-md dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Submit Another Request
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={openFeedbackToast}
                          className="w-full rounded-lg border border-teal-200 bg-teal-50 py-3 font-semibold text-teal-700 transition-colors hover:bg-teal-100 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-300 dark:hover:bg-teal-950/50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Rate your support experience
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="relative max-h-[85vh] w-full max-w-md overflow-hidden rounded-t-2xl rounded-b-none bg-white p-6 shadow-2xl dark:bg-slate-800 sm:max-h-[90vh] sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 rounded-full p-1 text-gray-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              >
                <FaTimes size={18} />
              </button>

              <h3 className="mb-6 text-center text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                {activeModal}
              </h3>

              <div className="max-h-[50vh] -mr-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 sm:max-h-[60vh]">
                {activeModal === "FAQ" && (
                  <div className="space-y-4">
                    {faqs.map((faq, i) => (
                      <motion.div
                        key={faq.q}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i, duration: 0.2 }}
                        className="border-b border-slate-100 pb-4 last:border-b-0 dark:border-slate-700"
                      >
                        <p className="mb-2 font-semibold text-slate-800 dark:text-slate-100">
                          {faq.q}
                        </p>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {faq.a}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeModal === "Phone Support" && (
                  <div className="space-y-4 py-6 text-center">
                    <div className="mb-4 text-3xl">📞</div>
                    <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200">
                      +91 8100684108 <br />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Available Mon-Fri, 10AM-6PM
                      </span>
                    </p>
                    <motion.a
                      href="tel:+918100684108"
                      className="inline-block rounded-full bg-teal-500 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-teal-600 hover:shadow-xl active:translate-y-0 active:bg-teal-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Call Now
                    </motion.a>
                  </div>
                )}

                {activeModal === "Email Support" && (
                  <div className="space-y-4 py-6 text-center">
                    <div className="mb-4 text-3xl">✉️</div>
                    <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200">
                      nextnews.co.in@gmail.com <br />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Our support team typically responds within 24 hours
                      </span>
                    </p>
                    <motion.a
                      href="mailto:nextnews.co.in@gmail.com"
                      className="inline-block rounded-full bg-teal-500 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-teal-600 hover:shadow-xl active:translate-y-0 active:bg-teal-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Email Us
                    </motion.a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FeedbackToast
        key={feedbackToastKey}
        visible={isFeedbackVisible}
        onClose={() => setIsFeedbackVisible(false)}
        onFeedback={handleFeedback}
      />
    </motion.div>
  );
}
