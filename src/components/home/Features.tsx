"use client";

import Image from "next/image";
import { Wind, Sparkles, Eye, Heart } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useTranslation } from "@/hooks/useTranslation";

import type { LucideIcon } from "lucide-react";

interface FeatureCard {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  image: string;
}

const featureItems: FeatureCard[] = [
  { icon: Wind, titleKey: "features.breathableFabricsTitle", descKey: "features.breathableFabricsDesc", image: "/whychooseus/telastranspirables.png" },
  { icon: Sparkles, titleKey: "features.shapeWithoutCompressingTitle", descKey: "features.shapeWithoutCompressingDesc", image: "/whychooseus/moldeasincomprimir.png" },
  { icon: Eye, titleKey: "features.invisibleDesignTitle", descKey: "features.invisibleDesignDesc", image: "/whychooseus/disenoinvisible.png" },
  { icon: Heart, titleKey: "features.inclusiveSizesTitle", descKey: "features.inclusiveSizesDesc", image: "/whychooseus/tallasinclusivas.png" },
];

export default function Features() {
  const { t } = useTranslation();
  return (
    <section className="pt-14 pb-24 bg-white">
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
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featureItems.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <ScrollReveal
              key={feature.titleKey}
              direction="up"
              delay={index * 0.1}
              className="h-full"
            >
              <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.03] group hover:shadow-xl hover:shadow-black/20">
                {/* Background image */}
                <Image
                  src={feature.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Content — icon pinned at fixed offset, text fills below */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-left h-[12rem]">
                  {/* Icon circle */}
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110">
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-base font-bold text-white leading-tight">
                    {t(feature.titleKey)}
                  </h3>

                  {/* Description */}
                  <p className="mt-1.5 text-[13px] text-white/80 leading-relaxed line-clamp-3">
                    {t(feature.descKey)}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
        </div>
      </div>
    </section>
  );
}
