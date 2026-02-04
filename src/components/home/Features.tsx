"use client";

import { Wind, Sparkles, Eye, Heart } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";

import type { LucideIcon } from "lucide-react";

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    icon: Wind,
    title: "Telas Transpirables",
    description:
      "Diseñadas para clima calido, nuestras telas permiten que tu piel respire todo el dia",
  },
  {
    icon: Sparkles,
    title: "Moldea sin Comprimir",
    description:
      "Tecnologia de compresion gradual que moldea tu silueta de forma natural y comoda",
  },
  {
    icon: Eye,
    title: "Diseño Invisible",
    description:
      "Costuras planas y tela ultradelgada que desaparece bajo cualquier prenda",
  },
  {
    icon: Heart,
    title: "Tallas Inclusivas",
    description:
      "Desde XS hasta 4XL, porque cada cuerpo merece sentirse increible",
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-gradient-to-b from-perla to-arena">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section heading */}
        <div className="text-center">
          <h2 className="font-serif text-4xl font-bold">Por Que Elegirnos</h2>
          <div className="w-20 h-1 bg-rosa mx-auto mt-4 rounded-full" />
          <p className="font-script text-xl text-rosa mt-2">
            La diferencia esta en los detalles
          </p>
        </div>

        {/* Cards grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <ScrollReveal
              key={feature.title}
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
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {feature.description}
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
