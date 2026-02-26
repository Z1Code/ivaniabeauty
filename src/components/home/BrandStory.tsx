"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useTranslation } from "@/hooks/useTranslation";

interface Stat {
  value: string;
  labelKey: string;
}

const stats: Stat[] = [
  { value: "2,500+", labelKey: "brandStory.statClientsLabel" },
  { value: "30+", labelKey: "brandStory.statDesignsLabel" },
  { value: "98%", labelKey: "brandStory.statSatisfactionLabel" },
];

export default function BrandStory() {
  const { t } = useTranslation();

  return (
    <section className="relative py-24 bg-white overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-rosa-light/5 via-transparent to-arena/10 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Image */}
          <ScrollReveal direction="left">
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-rosa/10">
                <Image
                  src="/images/landing/brand-story.jpg"
                  alt={t("brandStory.heading")}
                  width={600}
                  height={720}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={false}
                />
              </div>
              {/* Decorative accent */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-rosa/10 -z-10" />
              <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-arena/30 -z-10" />
            </div>
          </ScrollReveal>

          {/* Right: Content */}
          <div>
            <ScrollReveal direction="right">
              {/* Tag */}
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-rosa-dark bg-rosa-light/30 px-4 py-1.5 rounded-full">
                {t("brandStory.tag")}
              </span>

              {/* Heading */}
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mt-5 leading-tight">
                {t("brandStory.heading")}
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={0.1}>
              {/* Paragraphs */}
              <p className="mt-6 text-gray-600 leading-relaxed">
                {t("brandStory.paragraph1")}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {t("brandStory.paragraph2")}
              </p>
            </ScrollReveal>

            {/* Stats */}
            <ScrollReveal direction="up" delay={0.2}>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.labelKey}
                    className="text-center p-4 rounded-xl bg-gradient-to-b from-rosa-light/15 to-rosa-light/5 border border-rosa/10"
                  >
                    <span className="block text-2xl sm:text-3xl font-bold text-rosa-dark">
                      {stat.value}
                    </span>
                    <span className="block mt-1 text-xs sm:text-sm text-gray-500">
                      {t(stat.labelKey)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* CTA */}
            <ScrollReveal direction="up" delay={0.3}>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-rosa text-white font-medium transition-all duration-300 hover:bg-rosa-dark hover:shadow-lg hover:shadow-rosa/25 group"
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
