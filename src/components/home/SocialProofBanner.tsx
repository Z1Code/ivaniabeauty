"use client";

import { Users, Star, Palette, RotateCcw } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";

import type { LucideIcon } from "lucide-react";

interface StatItem {
  icon: LucideIcon;
  value: string;
  labelKey: string;
}

const statItems: StatItem[] = [
  { icon: Users, value: "2,500+", labelKey: "socialProof.clientsLabel" },
  { icon: Star, value: "4.9/5", labelKey: "socialProof.ratingLabel" },
  { icon: Palette, value: "30+", labelKey: "socialProof.designsLabel" },
  { icon: RotateCcw, value: "15 días", labelKey: "socialProof.returnPolicyLabel" },
];

function AnimatedStat({
  item,
  index,
}: {
  item: StatItem;
  index: number;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const Icon = item.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
      className="flex flex-col items-center text-center px-4"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{
          duration: 0.4,
          delay: index * 0.15 + 0.2,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4"
      >
        <Icon className="w-6 h-6 text-rosa-light" />
      </motion.div>

      {/* Value */}
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={
          isInView
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 0.5 }
        }
        transition={{ duration: 0.4, delay: index * 0.15 + 0.3 }}
        className="text-3xl sm:text-4xl font-bold text-white"
      >
        {item.value}
      </motion.span>

      {/* Label */}
      <span className="mt-2 text-sm text-gray-400">
        {t(item.labelKey)}
      </span>
    </motion.div>
  );
}

export default function SocialProofBanner() {
  return (
    <section className="w-full py-16 bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {statItems.map((item, index) => (
            <AnimatedStat key={item.labelKey} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
