"use client";

import { Wind, Sparkles, Eye, Heart } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useTranslation } from "@/hooks/useTranslation";

import type { LucideIcon } from "lucide-react";

interface FeatureCard {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

const featureItems: FeatureCard[] = [
  { icon: Wind, titleKey: "features.breathableFabricsTitle", descKey: "features.breathableFabricsDesc" },
  { icon: Sparkles, titleKey: "features.shapeWithoutCompressingTitle", descKey: "features.shapeWithoutCompressingDesc" },
  { icon: Eye, titleKey: "features.invisibleDesignTitle", descKey: "features.invisibleDesignDesc" },
  { icon: Heart, titleKey: "features.inclusiveSizesTitle", descKey: "features.inclusiveSizesDesc" },
];

export default function Features() {
  const { t } = useTranslation();
  return (
    <section className="py-24 bg-gradient-to-b from-perla to-arena">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section heading */}
        <div className="text-center">
          <h2 className="font-serif text-4xl font-bold">{t("features.heading")}</h2>
          <div className="w-20 h-1 bg-rosa mx-auto mt-4 rounded-full" />
          <p className="font-script text-xl text-rosa mt-2">
            {t("features.subtitle")}
          </p>
        </div>

        {/* Cards grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {featureItems.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <ScrollReveal
              key={feature.titleKey}
              direction="up"
              delay={index * 0.1}
            >
              <div className="glass-rosa p-8 text-center transition-transform duration-300 hover:scale-105 group hover:border-rosa/40 hover:shadow-lg hover:shadow-rosa/10">
                {/* Icon circle */}
                <div className="w-16 h-16 rounded-full bg-rosa/10 mx-auto flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-rosa/20">
                  <Icon className="w-7 h-7 text-rosa" />
                </div>

                {/* Title */}
                <h3 className="font-serif text-lg font-semibold mt-2">
                  {t(feature.titleKey)}
                </h3>

                {/* Description */}
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </div>
            </ScrollReveal>
          );
        })}
        </div>
      </div>
    </section>
  );
}
