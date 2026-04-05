"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ThumbsDown, ThumbsUp, X } from "lucide-react";

type FeedbackType = "up" | "down";

type FeedbackToastProps = {
  visible: boolean;
  onClose: () => void;
  onFeedback?: (type: FeedbackType, reason?: string) => void;
};

const FEEDBACK_CLOSE_DELAY = 1500;

export default function FeedbackToast({
  visible,
  onClose,
  onFeedback,
}: FeedbackToastProps) {
  const [selected, setSelected] = useState<FeedbackType | null>(null);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const closeAfterDelay = () => {
    window.setTimeout(onClose, FEEDBACK_CLOSE_DELAY);
  };

  const handleThumb = (type: FeedbackType) => {
    setSelected(type);

    if (type === "up") {
      onFeedback?.("up");
      setSubmitted(true);
      closeAfterDelay();
      return;
    }

    setShowReasonInput(true);
  };

  const handleSubmit = () => {
    onFeedback?.("down", reason);
    setSubmitted(true);
    closeAfterDelay();
  };

  const handleSkip = () => {
    onFeedback?.("down");
    setSubmitted(true);
    closeAfterDelay();
  };

  const handleBack = () => {
    setSelected(null);
    setShowReasonInput(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed right-4 bottom-4 z-50 w-[calc(100%-2rem)] max-w-sm sm:w-full"
        >
          <motion.div
            layout
            className="overflow-hidden rounded-2xl border border-teal-100 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            {!submitted ? (
              <>
                {selected === null && (
                  <motion.div
                    layout
                    className="flex items-center justify-between gap-3"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Was this helpful?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label="Thumbs up"
                        onClick={() => handleThumb("up")}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-green-50 dark:hover:bg-slate-800"
                      >
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                      </button>
                      <button
                        type="button"
                        aria-label="Thumbs down"
                        onClick={() => handleThumb("down")}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-red-50 dark:hover:bg-slate-800"
                      >
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {selected === "down" && showReasonInput && (
                  <motion.div layout className="mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        What could be better?
                      </p>
                      <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="cursor-pointer rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <textarea
                      placeholder="Share your reason (optional)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label="Back"
                          onClick={handleBack}
                          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleSkip}
                          className="cursor-pointer px-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          Skip
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                      >
                        Submit
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.p
                layout
                className="text-sm text-slate-900 dark:text-slate-100"
              >
                Thanks - we appreciate your feedback!
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
