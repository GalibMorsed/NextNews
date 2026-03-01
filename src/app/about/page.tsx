"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Clock,
  BookOpen,
  Users,
  Shield,
  Zap,
  Star,
  Code,
  Github,
  Linkedin,
  Instagram,
  Mail,
} from "lucide-react";

/* ------------------ Motion Variants ------------------ */

const pageVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const sectionVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

/* ------------------ Page ------------------ */

export default function AboutPage() {
  return (
    <motion.main
      className="bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200 min-h-screen"
      variants={pageVariant}
      initial="hidden"
      animate="visible"
    >
      {/* HERO */}
      <motion.section
        variants={sectionVariant}
        className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      >
        <div className="mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Image
              src="/logo1.png"
              alt="NextNews Logo"
              width={64}
              height={64}
              className="mx-auto mb-6 h-29 w-auto"
            />
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl md:text-6xl">
              About NextNews
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              NextNews is a modern, intelligent news platform built to help
              users stay informed with accurate, relevant, and real-time content
              — all in one place.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* PRODUCT VISION */}
      <motion.section
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl grid gap-12 lg:gap-20 lg:grid-cols-2 lg:items-center">
          <motion.div variants={itemVariant}>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              A Smarter Way to Consume News
            </h2>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300 text-base">
              In today’s fast-paced digital world, information is everywhere —
              but clarity is not. NextNews was created to cut through the noise
              and deliver news that actually matters.
            </p>
            <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300 text-base">
              By organizing content across meaningful categories and surfacing
              trending stories, the platform helps readers stay updated without
              feeling overwhelmed.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              "Curated and category-based news",
              "Clean, distraction-free reading experience",
              "Built for speed and accessibility",
            ].map((item, index) => (
              <motion.div
                key={item}
                variants={itemVariant}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 dark:from-slate-800 dark:to-slate-700 dark:border-slate-600"
              >
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">
                  {item}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* FEATURES */}
      <motion.section
        className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="mx-auto max-w-6xl">
          <motion.h2
            variants={itemVariant}
            className="text-center text-3xl font-bold text-slate-900 dark:text-slate-100 mb-12"
          >
            Key Features
          </motion.h2>
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: Clock,
                title: "Real-Time Updates",
                desc: "News is fetched and updated dynamically, ensuring users always have access to the latest developments.",
              },
              {
                icon: BookOpen,
                title: "Organized by Categories",
                desc: "Content is structured to make discovery intuitive and efficient across topics.",
              },
              {
                icon: Users,
                title: "Notes & Personalization",
                desc: "Users can save notes and interact with content beyond passive reading.",
              },
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={itemVariant}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow"
                >
                  <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-slate-800 dark:to-slate-700 dark:group-hover:opacity-90" />
                  <IconComponent className="h-10 w-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* CORE PRINCIPLES */}
      <motion.section
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <motion.h2
            variants={itemVariant}
            className="text-center text-3xl font-bold text-slate-900 dark:text-slate-100 mb-12"
          >
            Our Core Principles
          </motion.h2>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                icon: Shield,
                title: "Accuracy First",
                desc: "Reliable sources over sensationalism.",
              },
              {
                icon: Users,
                title: "User-Centered Design",
                desc: "Clarity, usability, accessibility.",
              },
              {
                icon: Zap,
                title: "Performance & Security",
                desc: "Fast, scalable, and safe systems.",
              },
              {
                icon: Star,
                title: "Continuous Improvement",
                desc: "Constant learning and iteration.",
              },
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={itemVariant}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-md border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all"
                >
                  <IconComponent className="h-8 w-8 text-indigo-600 mb-3" />
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* ABOUT YOU */}
      <motion.section
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-slate-100 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
          >
            <Code className="mx-auto h-12 w-12 text-blue-400 mb-6" />
            <h2 className="text-3xl font-bold mb-6">Built by Galib Morsed</h2>
          </motion.div>

          <motion.p
            variants={itemVariant}
            className="text-lg leading-relaxed text-slate-300 mb-6 max-w-3xl mx-auto"
          >
            I’m Galib Morsed, a passionate Software developer focused on
            building modern, scalable, and user-centric web applications.
            NextNews reflects my approach to clean architecture and thoughtful
            UI design.
          </motion.p>

          <motion.p
            variants={itemVariant}
            className="text-lg leading-relaxed text-slate-300 mb-8 max-w-3xl mx-auto"
          >
            This project combines real-world product thinking with strong
            technical foundations — for developers, designers, and users alike.
          </motion.p>

          <motion.p
            variants={itemVariant}
            className="text-sm text-slate-400 italic"
          >
            A project built with purpose, precision, and professionalism.
          </motion.p>

          <motion.div
            variants={itemVariant}
            className="mt-12 flex justify-center items-center gap-8"
          >
            <a
              href="https://github.com/GalibMorsed"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-400 transition-colors duration-300"
              aria-label="GitHub"
            >
              <Github className="h-6 w-6" />
            </a>
            <a
              href="https://www.linkedin.com/in/galib-morsed"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-400 transition-colors duration-300"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-6 w-6" />
            </a>
            <a
              href="https://www.instagram.com/galib_morsed/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-400 transition-colors duration-300"
              aria-label="Instagram"
            >
              <Instagram className="h-6 w-6" />
            </a>
            <a
              href="mailto:morsedgalib982@gmail.com"
              className="text-slate-400 hover:text-blue-400 transition-colors duration-300"
              aria-label="Email"
            >
              <Mail className="h-6 w-6" />
            </a>
          </motion.div>
        </div>
      </motion.section>
    </motion.main>
  );
}
