"use client";

import { Users, Star, Palette, RotateCcw } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";

import type { LucideIcon } from "lucide-react";

// ── Stat definition ──────────────────────────────────────────────
interface StatItem {
  icon: LucideIcon;
  /** Numeric target to count up to */
  numericValue: number;
  /** Prefix before number (e.g. "") */
  prefix: string;
  /** Suffix after number (e.g. "+", "/5", " días") */
  suffix: string;
  /** Use decimals (for 4.9) */
  decimals: number;
  /** Use comma thousands separator */
  useComma: boolean;
  labelKey: string;
}

const statItems: StatItem[] = [
  {
    icon: Users,
    numericValue: 2500,
    prefix: "",
    suffix: "+",
    decimals: 0,
    useComma: true,
    labelKey: "socialProof.clientsLabel",
  },
  {
    icon: Star,
    numericValue: 4.9,
    prefix: "",
    suffix: "/5",
    decimals: 1,
    useComma: false,
    labelKey: "socialProof.ratingLabel",
  },
  {
    icon: Palette,
    numericValue: 30,
    prefix: "",
    suffix: "+",
    decimals: 0,
    useComma: false,
    labelKey: "socialProof.designsLabel",
  },
  {
    icon: RotateCcw,
    numericValue: 15,
    prefix: "",
    suffix: " días",
    decimals: 0,
    useComma: false,
    labelKey: "socialProof.returnPolicyLabel",
  },
];

// ── Number formatter ─────────────────────────────────────────────
function formatNumber(
  value: number,
  decimals: number,
  useComma: boolean
): string {
  const fixed = value.toFixed(decimals);
  if (!useComma) return fixed;
  const [intPart, decPart] = fixed.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${withCommas}.${decPart}` : withCommas;
}

// ── Count-up hook ────────────────────────────────────────────────
function useCountUp(
  target: number,
  isInView: boolean,
  duration = 1800,
  delay = 0
): number {
  const [current, setCurrent] = useState(0);
  const hasStarted = useRef(false);

  const animate = useCallback(() => {
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * target);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setCurrent(target);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  useEffect(() => {
    if (!isInView || hasStarted.current) return;
    hasStarted.current = true;

    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, [isInView, animate, delay]);

  return current;
}

// ── Single stat ──────────────────────────────────────────────────
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

  const countedValue = useCountUp(
    item.numericValue,
    isInView,
    1800,
    index * 150 + 300
  );

  const displayValue =
    item.prefix +
    formatNumber(countedValue, item.decimals, item.useComma) +
    item.suffix;

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
        className="w-12 h-12 rounded-full bg-rosa/10 flex items-center justify-center mb-4"
      >
        <Icon className="w-6 h-6 text-rosa-dark" />
      </motion.div>

      {/* Value — count-up */}
      <span className="text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums">
        {displayValue}
      </span>

      {/* Label */}
      <span className="mt-2 text-sm text-gray-500">
        {t(item.labelKey)}
      </span>
    </motion.div>
  );
}

export default function SocialProofBanner() {
  return (
    <section className="w-full py-16 bg-white">
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
