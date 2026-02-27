"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useTranslation } from "@/hooks/useTranslation";

const ChipscrollMini = dynamic(
  () => import("@/components/home/ChipscrollMini"),
  { ssr: false }
);

interface Stat {
  value: string;
  labelKey: string;
}

const stats: Stat[] = [
  { value: "25,000+", labelKey: "brandStory.statClientsLabel" },
  { value: "30+", labelKey: "brandStory.statDesignsLabel" },
  { value: "98%", labelKey: "brandStory.statSatisfactionLabel" },
];

export default function BrandStory() {
  const { t } = useTranslation();

  return (
    <section id="nosotros" className="relative py-24 bg-white overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-rosa-light/5 via-transparent to-arena/10 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-start">
          {/* Left: Chipscroll animation — 16:9 */}
          <ScrollReveal direction="left">
            <div className="relative lg:sticky lg:top-24">
              <ChipscrollMini
                framePath="/chipscroll-story/frame_"
                aspectRatio="16 / 9"
                className="rounded-2xl overflow-hidden shadow-xl shadow-rosa/10"
              />
              {/* Decorative accent */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-rosa/10 -z-10" />
              <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-arena/30 -z-10" />
            </div>
          </ScrollReveal>

          {/* Right: Content — compact to match 16:9 height */}
          <div className="flex flex-col justify-center">
            <ScrollReveal direction="right">
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-rosa-dark bg-rosa-light/30 px-4 py-1.5 rounded-full">
                {t("brandStory.tag")}
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mt-4 leading-tight">
                {t("brandStory.heading")}
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={0.1}>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                {t("brandStory.paragraph1")}
              </p>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                {t("brandStory.paragraph2")}
              </p>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                {t("brandStory.paragraph3")}
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {stats.map((stat) => (
                  <div
                    key={stat.labelKey}
                    className="text-center p-3 rounded-xl bg-gradient-to-b from-rosa-light/15 to-rosa-light/5 border border-rosa/10"
                  >
                    <span className="block text-xl sm:text-2xl font-bold text-rosa-dark">
                      {stat.value}
                    </span>
                    <span className="block mt-0.5 text-[11px] sm:text-xs text-gray-500">
                      {t(stat.labelKey)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-rosa text-white text-sm font-medium transition-all duration-300 hover:bg-rosa-dark hover:shadow-lg hover:shadow-rosa/25 group"
              >
                <span>{t("brandStory.cta")}</span>
                <motion.span
                  className="inline-block"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </motion.span>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
