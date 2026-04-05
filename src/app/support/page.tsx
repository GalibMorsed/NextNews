"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import {
  FaComments,
  FaPhoneAlt,
  FaQuestionCircle,
  FaTicketAlt,
  FaTimes,
} from "react-icons/fa";

import FeedbackToast from "../components/feedbackToast";

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [feedbackToastKey, setFeedbackToastKey] = useState(0);
  const [communityLikes, setCommunityLikes] = useState(24892);
  const [feedbackCount, setFeedbackCount] = useState(31240);
  const [formData, setFormData] = useState({
    issueType: "",
    name: "",
    email: "",
    contactNumber: "",
  });

  const faqs = [
    {
      q: "What should I do if I cannot log in or finish registration?",
      a: "Check your email and password. If your account is new, verify your email first.",
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
  ];

  const supportOptions = [
    {
      title: "FAQ",
      desc: "Browse common questions and quick solutions.",
      icon: <FaQuestionCircle className="text-2xl text-teal-400" />,
    },
    {
      title: "Live Chat",
      desc: "Chat with our support team in real time.",
      icon: <FaComments className="text-2xl text-teal-400" />,
    },
    {
      title: "Phone Support",
      desc: "Call us during business hours.",
      icon: <FaPhoneAlt className="text-2xl text-teal-400" />,
    },
    {
      title: "Track Ticket",
      desc: "Check the status of your requests.",
      icon: <FaTicketAlt className="text-2xl text-teal-400" />,
    },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
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
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 shadow-sm backdrop-blur dark:border-teal-900/60 dark:bg-slate-900/70 dark:text-teal-300">
                <Sparkles className="h-4 w-4" />
                Proudly loved by the community
              </div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.45 }}
                className="w-full max-w-3xl rounded-3xl border border-teal-100 bg-white/85 p-5 shadow-lg shadow-teal-100/60 backdrop-blur dark:border-teal-900/60 dark:bg-slate-900/80 dark:shadow-none"
              >
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_140px] md:items-center">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                      <Heart className="h-4 w-4 fill-current" />
                      <span>
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex min-h-0 items-center justify-center rounded-2xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-teal-600"
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
                    We&apos;re here to{" "}
                    <span className="text-teal-500">help</span>, anytime.
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {supportOptions.map((item, index) => (
                    <motion.div
                      key={item.title}
                      className="group flex cursor-pointer items-start gap-4 overflow-hidden rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-teal-100 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.2 + 0.1 * index,
                        ease: "easeOut",
                      }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => handleOptionClick(item.title)}
                    >
                      <motion.div
                        className="shrink-0"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.icon}
                      </motion.div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-slate-900 transition-colors duration-200 group-hover:text-teal-500 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2 dark:text-slate-300">
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
                          <option value="">Select issue type...</option>
                          <option value="Technical Issue">
                            Technical Issue
                          </option>
                          <option value="Payment Issue">Payment Issue</option>
                          <option value="Account Issue">Account Issue</option>
                          <option value="Registration Related Issue">
                            Registration Related Issue
                          </option>
                          <option value="Notes Issue">Notes Issue</option>
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
                        className="w-full rounded-lg bg-teal-500 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-600 hover:shadow-lg active:bg-teal-700"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Next
                      </motion.button>
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
                          onClick={() => setSubmitted(false)}
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

                {activeModal === "Track Ticket" && (
                  <div className="space-y-4 py-6 text-center">
                    <div className="mb-4 text-3xl">🎫</div>
                    <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                      Enter your ticket ID on the support dashboard to track
                      updates in real time.
                    </p>
                    <motion.button
                      onClick={() => setActiveModal(null)}
                      className="w-full rounded-lg bg-slate-100 py-2.5 font-semibold text-slate-900 transition-all duration-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      whileHover={{ scale: 1.02 }}
                    >
                      Go to Dashboard
                    </motion.button>
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
