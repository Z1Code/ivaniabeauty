"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, ArrowRight, ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

export default function Hero() {
  const { t } = useTranslation();
  const { scrollY } = useScroll();

  const trustItems = [
    t("hero.trustFreeShipping"),
    t("hero.trust30DayReturns"),
    t("hero.trustSecurePayment"),
  ];

  // Parallax transforms for background decorative elements
  const y1 = useTransform(scrollY, [0, 600], [0, -120]);
  const y2 = useTransform(scrollY, [0, 600], [0, -80]);
  const y3 = useTransform(scrollY, [0, 600], [0, -180]);
  const y4 = useTransform(scrollY, [0, 600], [0, -60]);
  const y5 = useTransform(scrollY, [0, 600], [0, -140]);

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-perla via-rosa-light/20 to-arena">
      {/* ── Animated background decorative elements ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.5 }}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        {/* Large rosa-light circle - top right */}
        <motion.div
          style={{ y: y1 }}
          className="animate-float absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-rosa-light/30 blur-3xl"
        />

        {/* Medium turquesa blob - bottom left */}
        <motion.div
          style={{ y: y2 }}
          className="animate-float-slow absolute bottom-20 -left-16 w-[300px] h-[300px] rounded-full bg-turquesa/20 blur-2xl"
        />

        {/* Small coral circle - top left */}
        <motion.div
          style={{ y: y3 }}
          className="animate-float absolute top-32 left-[15%] w-[180px] h-[180px] rounded-full bg-coral/20 blur-xl"
        />

        {/* Tiny rosa-light dot - center right */}
        <motion.div
          style={{ y: y4 }}
          className="animate-float-slow absolute top-1/2 right-[10%] w-[100px] h-[100px] rounded-full bg-rosa-light/40 blur-lg"
        />

        {/* Medium arena/dorado glow - bottom right */}
        <motion.div
          style={{ y: y5 }}
          className="animate-float absolute bottom-[15%] right-[25%] w-[220px] h-[220px] rounded-full bg-dorado/10 blur-2xl"
        />

        {/* Extra small turquesa accent - mid left */}
        <motion.div
          style={{ y: y2 }}
          className="animate-float absolute top-[40%] left-[8%] w-[80px] h-[80px] rounded-full bg-turquesa/15 blur-md"
        />
      </motion.div>

      {/* ── Main content ── */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Tagline */}
        <motion.div
          variants={childVariants}
          className="flex items-center gap-2 mb-6"
        >
          <Sparkles className="w-4 h-4 text-rosa-dark" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-rosa-dark">
            {t("hero.seasonTag")}
          </span>
          <Sparkles className="w-4 h-4 text-rosa-dark" />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          variants={childVariants}
          className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
        >
          <span className="block">
            {t("hero.headlineLine1")}{" "}
            <span className="text-gradient-rosa">{t("hero.headlineHighlight")}</span>,
          </span>
          <span className="block mt-2">{t("hero.headlineLine2")}</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={childVariants}
          className="mt-6 text-lg text-gray-600 max-w-xl"
        >
          {t("hero.subtitle")}
        </motion.p>

        {/* CTA Button */}
        <motion.div variants={childVariants} className="mt-8">
          <Link
            href="/shop"
            className="btn-shimmer inline-flex items-center gap-2"
          >
            {t("hero.cta")}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          variants={childVariants}
          className="mt-6 flex flex-wrap justify-center gap-6"
        >
          {trustItems.map((item) => (
            <span key={item} className="text-sm text-gray-500">
              &#10003; {item}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
      >
        <div
          className="text-rosa/60"
          style={{ animation: "scrollBounce 2s ease-in-out infinite" }}
        >
          <ChevronDown className="w-6 h-6" />
        </div>
      </motion.div>
    </section>
  );
}
