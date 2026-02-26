"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRef, useSyncExternalStore } from "react";
import type { HeroEffectIntensity } from "@/lib/home-sections-config";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

type HeroParticle = {
  id: string;
  left: string;
  top: string;
  size: number;
  color: string;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  glow: number;
};

type HeroReflection = {
  id: string;
  left: string;
  top: string;
  width: string;
  height: string;
  angle: number;
  opacity: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
};

type HeroEffectPreset = {
  background: {
    yEnd: number;
    xEnd: number;
    scaleEnd: number;
    rotateEnd: number;
  };
  layers: {
    hazeOpacityEnd: number;
    hazeYEnd: number;
    contentYEnd: number;
    gridYEnd: number;
    blob1YEnd: number;
    blob2YEnd: number;
    blob3YEnd: number;
    panelYEnd: number;
    sparkleYEnd: number;
  };
  particles: {
    visibleCount: number;
    driftMultiplier: number;
    opacityPeak: number;
    glowMultiplier: number;
    scalePeak: number;
  };
  reflections: {
    visibleCount: number;
    driftMultiplier: number;
    opacityMultiplier: number;
  };
};

type HeroProps = {
  effectIntensity?: HeroEffectIntensity;
};

const HERO_PARTICLES: HeroParticle[] = [
  { id: "p1", left: "8%", top: "20%", size: 2.4, color: "rgba(255,255,255,0.70)", driftX: 8, driftY: -14, duration: 6.4, delay: 0.2, glow: 10 },
  { id: "p2", left: "13%", top: "34%", size: 2.8, color: "rgba(255,214,235,0.78)", driftX: 10, driftY: -18, duration: 7.1, delay: 0.7, glow: 12 },
  { id: "p3", left: "21%", top: "16%", size: 2.2, color: "rgba(214,255,250,0.72)", driftX: 7, driftY: -12, duration: 5.9, delay: 1.1, glow: 10 },
  { id: "p4", left: "29%", top: "28%", size: 2.6, color: "rgba(255,255,255,0.74)", driftX: 9, driftY: -16, duration: 6.6, delay: 0.4, glow: 11 },
  { id: "p5", left: "38%", top: "14%", size: 1.9, color: "rgba(255,219,169,0.72)", driftX: 7, driftY: -11, duration: 6.8, delay: 1.5, glow: 9 },
  { id: "p6", left: "47%", top: "30%", size: 2.5, color: "rgba(255,255,255,0.68)", driftX: 10, driftY: -17, duration: 7.4, delay: 0.9, glow: 12 },
  { id: "p7", left: "57%", top: "18%", size: 2.1, color: "rgba(214,255,250,0.68)", driftX: 8, driftY: -13, duration: 6.2, delay: 1.3, glow: 10 },
  { id: "p8", left: "66%", top: "24%", size: 2.8, color: "rgba(255,218,235,0.76)", driftX: 11, driftY: -19, duration: 7.3, delay: 0.5, glow: 12 },
  { id: "p9", left: "74%", top: "15%", size: 2.2, color: "rgba(255,255,255,0.72)", driftX: 8, driftY: -12, duration: 6.7, delay: 1.8, glow: 10 },
  { id: "p10", left: "82%", top: "33%", size: 2.6, color: "rgba(255,214,235,0.72)", driftX: 10, driftY: -16, duration: 6.9, delay: 0.3, glow: 11 },
  { id: "p11", left: "89%", top: "21%", size: 2.3, color: "rgba(255,255,255,0.69)", driftX: 7, driftY: -13, duration: 6.1, delay: 1.2, glow: 10 },
  { id: "p12", left: "24%", top: "44%", size: 2.4, color: "rgba(214,255,250,0.66)", driftX: 9, driftY: -15, duration: 7.0, delay: 0.8, glow: 10 },
  { id: "p13", left: "53%", top: "46%", size: 2.1, color: "rgba(255,255,255,0.65)", driftX: 8, driftY: -12, duration: 6.3, delay: 1.4, glow: 10 },
  { id: "p14", left: "78%", top: "42%", size: 2.7, color: "rgba(255,219,169,0.70)", driftX: 10, driftY: -18, duration: 7.5, delay: 0.6, glow: 12 },
];

const HERO_REFLECTIONS: HeroReflection[] = [
  {
    id: "r1",
    left: "-12%",
    top: "8%",
    width: "48%",
    height: "20%",
    angle: 26,
    opacity: 0.22,
    driftX: 28,
    driftY: -10,
    duration: 12,
    delay: 0.2,
  },
  {
    id: "r2",
    left: "34%",
    top: "56%",
    width: "44%",
    height: "18%",
    angle: -18,
    opacity: 0.17,
    driftX: -24,
    driftY: -8,
    duration: 13.6,
    delay: 0.7,
  },
  {
    id: "r3",
    left: "66%",
    top: "10%",
    width: "42%",
    height: "16%",
    angle: 31,
    opacity: 0.16,
    driftX: 20,
    driftY: -7,
    duration: 11.4,
    delay: 1.1,
  },
];

const HERO_EFFECT_PRESETS: Record<HeroEffectIntensity, HeroEffectPreset> = {
  soft: {
    background: { yEnd: 230, xEnd: -16, scaleEnd: 1.14, rotateEnd: -0.8 },
    layers: {
      hazeOpacityEnd: 0.13,
      hazeYEnd: 52,
      contentYEnd: 56,
      gridYEnd: -82,
      blob1YEnd: -110,
      blob2YEnd: -70,
      blob3YEnd: -130,
      panelYEnd: -42,
      sparkleYEnd: -88,
    },
    particles: {
      visibleCount: 8,
      driftMultiplier: 0.72,
      opacityPeak: 0.56,
      glowMultiplier: 0.75,
      scalePeak: 1.09,
    },
    reflections: {
      visibleCount: 2,
      driftMultiplier: 0.66,
      opacityMultiplier: 0.68,
    },
  },
  medium: {
    background: { yEnd: 340, xEnd: -28, scaleEnd: 1.28, rotateEnd: -1.4 },
    layers: {
      hazeOpacityEnd: 0.22,
      hazeYEnd: 84,
      contentYEnd: 90,
      gridYEnd: -120,
      blob1YEnd: -180,
      blob2YEnd: -120,
      blob3YEnd: -240,
      panelYEnd: -70,
      sparkleYEnd: -140,
    },
    particles: {
      visibleCount: 14,
      driftMultiplier: 1,
      opacityPeak: 0.74,
      glowMultiplier: 1,
      scalePeak: 1.14,
    },
    reflections: {
      visibleCount: 3,
      driftMultiplier: 1,
      opacityMultiplier: 1,
    },
  },
  intense: {
    background: { yEnd: 470, xEnd: -38, scaleEnd: 1.42, rotateEnd: -2.1 },
    layers: {
      hazeOpacityEnd: 0.3,
      hazeYEnd: 108,
      contentYEnd: 112,
      gridYEnd: -162,
      blob1YEnd: -250,
      blob2YEnd: -170,
      blob3YEnd: -320,
      panelYEnd: -92,
      sparkleYEnd: -186,
    },
    particles: {
      visibleCount: 14,
      driftMultiplier: 1.36,
      opacityPeak: 0.84,
      glowMultiplier: 1.28,
      scalePeak: 1.2,
    },
    reflections: {
      visibleCount: 3,
      driftMultiplier: 1.42,
      opacityMultiplier: 1.22,
    },
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.2,
    },
  },
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE_OUT },
  },
};

export default function Hero({ effectIntensity = "medium" }: HeroProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const hasHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const reduceMotion = hasHydrated ? shouldReduceMotion : false;
  const sectionRef = useRef<HTMLElement>(null);
  const effectPreset = HERO_EFFECT_PRESETS[effectIntensity] ?? HERO_EFFECT_PRESETS.medium;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const trustItems = [
    { icon: Truck, label: t("hero.trustFreeShipping") },
    { icon: ShieldCheck, label: t("hero.trustSecurePayment") },
  ];

  const stats = [
    { value: "4.9/5", label: t("hero.statRating") },
    { value: "30k+", label: t("hero.statClients") },
    { value: "120+", label: t("hero.statProducts") },
  ];

  const fitHighlights = [
    t("hero.panelPoint1"),
    t("hero.panelPoint2"),
    t("hero.panelPoint3"),
  ];

  const bgY = useTransform(scrollYProgress, [0, 1], [0, effectPreset.background.yEnd]);
  const bgX = useTransform(scrollYProgress, [0, 1], [0, effectPreset.background.xEnd]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, effectPreset.background.scaleEnd]);
  const bgRotate = useTransform(scrollYProgress, [0, 1], [0, effectPreset.background.rotateEnd]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.34, 0.58]);
  const hazeOpacity = useTransform(scrollYProgress, [0, 1], [0.04, effectPreset.layers.hazeOpacityEnd]);
  const hazeY = useTransform(scrollYProgress, [0, 1], [0, effectPreset.layers.hazeYEnd]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, effectPreset.layers.contentYEnd]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, effectPreset.layers.gridYEnd]);
  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, effectPreset.layers.blob1YEnd]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, effectPreset.layers.blob2YEnd]);
  const blob3Y = useTransform(scrollYProgress, [0, 1], [0, effectPreset.layers.blob3YEnd]);
  const panelY = useTransform(scrollYProgress, [0, 1], [0, effectPreset.layers.panelYEnd]);
  const sparkleY = useTransform(scrollYProgress, [0, 1], [0, effectPreset.layers.sparkleYEnd]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate min-h-[94vh] overflow-hidden bg-perla"
    >
      <motion.div
        className="absolute inset-0 z-0"
        style={
          reduceMotion
            ? { willChange: "auto" }
            : {
                y: bgY,
                x: bgX,
                scale: bgScale,
                rotate: bgRotate,
                transformOrigin: "center center",
                willChange: "transform",
              }
        }
      >
        <Image
          src="/background4k.png"
          alt=""
          fill
          priority
          quality={80}
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 z-[1]"
        style={reduceMotion ? undefined : { opacity: overlayOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-perla/88 via-white/55 to-rosa-light/42" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_25%,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_65%)]" />
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/10 via-transparent to-black/20"
        style={reduceMotion ? undefined : { opacity: hazeOpacity, y: hazeY }}
      />

      <motion.div
        className="absolute inset-0 z-[3] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40"
        style={reduceMotion ? undefined : { y: gridY }}
      />

      <motion.div
        className="pointer-events-none absolute -top-32 -right-24 z-[3] h-[28rem] w-[28rem] rounded-full bg-rosa-light/30 blur-[90px]"
        style={reduceMotion ? undefined : { y: blob1Y }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 -left-20 z-[3] h-[22rem] w-[22rem] rounded-full bg-turquesa/20 blur-[80px]"
        style={reduceMotion ? undefined : { y: blob2Y }}
      />
      <motion.div
        className="pointer-events-none absolute top-24 left-[36%] z-[3] h-[14rem] w-[14rem] rounded-full bg-dorado/18 blur-[70px]"
        style={reduceMotion ? undefined : { y: blob3Y }}
      />

      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-24 bg-gradient-to-b from-white/45 to-transparent"
        style={reduceMotion ? undefined : { y: sparkleY }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-32 bg-gradient-to-t from-perla to-transparent" />

      <motion.div
        className="pointer-events-none absolute inset-0 z-[4]"
        style={reduceMotion ? undefined : { y: sparkleY }}
        aria-hidden="true"
      >
        {HERO_PARTICLES.slice(0, effectPreset.particles.visibleCount).map(
          (particle) => (
            <motion.span
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${Math.round(
                  particle.glow * effectPreset.particles.glowMultiplier
                )}px ${particle.color}`,
              }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      x: [0, particle.driftX * effectPreset.particles.driftMultiplier, 0],
                      y: [0, particle.driftY * effectPreset.particles.driftMultiplier, 0],
                      opacity: [0.16, effectPreset.particles.opacityPeak, 0.16],
                      scale: [1, effectPreset.particles.scalePeak, 1],
                    }
              }
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: particle.delay,
              }}
            />
          )
        )}
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-0 z-[5] overflow-hidden mix-blend-screen"
        style={reduceMotion ? undefined : { y: sparkleY }}
        aria-hidden="true"
      >
        {HERO_REFLECTIONS.slice(0, effectPreset.reflections.visibleCount).map(
          (reflection) => {
            const reflectionOpacity =
              reflection.opacity * effectPreset.reflections.opacityMultiplier;
            return (
              <motion.div
                key={reflection.id}
                className="absolute rounded-full"
                style={{
                  left: reflection.left,
                  top: reflection.top,
                  width: reflection.width,
                  height: reflection.height,
                  opacity: reflectionOpacity,
                  background: `linear-gradient(${reflection.angle}deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.88) 48%, rgba(255,255,255,0) 100%)`,
                  filter: "blur(1.2px)",
                }}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        x: [
                          0,
                          reflection.driftX * effectPreset.reflections.driftMultiplier,
                          0,
                        ],
                        y: [
                          0,
                          reflection.driftY * effectPreset.reflections.driftMultiplier,
                          0,
                        ],
                        opacity: [
                          reflectionOpacity * 0.42,
                          reflectionOpacity,
                          reflectionOpacity * 0.42,
                        ],
                      }
                }
                transition={{
                  duration: reflection.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: reflection.delay,
                }}
              />
            );
          }
        )}
      </motion.div>

      <motion.div
        className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-6 pb-14 pt-28 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:pt-32"
        style={reduceMotion ? undefined : { y: contentY }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center lg:text-left">
          <motion.div
            variants={childVariants}
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-4 py-2 shadow-lg shadow-rosa/10 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-rosa-dark" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rosa-dark">
              {t("hero.seasonTag")}
            </span>
          </motion.div>

          <motion.h1
            variants={childVariants}
            className="mt-6 font-serif text-5xl font-bold leading-[1.02] text-gray-900 md:text-6xl xl:text-7xl"
          >
            <span className="block">{t("hero.headlineLine1")}</span>
            <span className="mt-2 block text-gradient-rosa">
              {t("hero.headlineHighlight")}
            </span>
            <span className="mt-2 block text-gray-800">{t("hero.headlineLine2")}</span>
          </motion.h1>

          <motion.p
            variants={childVariants}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-700 md:text-lg lg:mx-0"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            variants={childVariants}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
          >
            <Link
              href="/shop"
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-3 text-base shadow-xl shadow-rosa/25"
            >
              {t("hero.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#colecciones"
              className="inline-flex items-center gap-2 rounded-full border border-rosa/30 bg-white/70 px-7 py-3 text-sm font-semibold text-rosa-dark transition-all hover:border-rosa hover:bg-white"
            >
              {t("hero.ctaSecondary")}
              <ChevronDown className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            variants={childVariants}
            className="mt-8 grid max-w-2xl grid-cols-3 gap-3"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/60 bg-white/58 px-3 py-3 text-left backdrop-blur-md"
              >
                <p className="text-lg font-bold text-gray-900 md:text-xl">
                  {stat.value}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-gray-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.div
            variants={childVariants}
            className="mt-7 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start"
          >
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1.5 text-xs font-medium text-gray-700 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-dorado" />
                  {item.label}
                </span>
              );
            })}
          </motion.div>
        </div>

        <motion.aside
          variants={childVariants}
          style={reduceMotion ? undefined : { y: panelY }}
          className="relative"
        >
          <div className="rounded-[28px] border border-white/65 bg-white/58 p-6 shadow-[0_25px_80px_rgba(232,30,99,0.16)] backdrop-blur-2xl md:p-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-rosa/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-rosa-dark">
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero.panelTag")}
            </div>

            <h2 className="mt-4 font-serif text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
              {t("hero.panelHeading")}
            </h2>

            <ul className="mt-5 space-y-2.5">
              {fitHighlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rosa-dark" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/70 bg-white/72 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t("hero.panelCardFastTitle")}
                </p>
                <p className="mt-1.5 text-sm font-medium text-gray-800">
                  {t("hero.panelCardFastText")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/72 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t("hero.panelCardSupportTitle")}
                </p>
                <p className="mt-1.5 text-sm font-medium text-gray-800">
                  {t("hero.panelCardSupportText")}
                </p>
              </div>
            </div>
          </div>

          <motion.div
            className="absolute -bottom-6 -right-4 rounded-2xl border border-white/65 bg-white/70 px-4 py-3 shadow-lg backdrop-blur-xl"
            animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-dorado text-dorado" />
              <p className="text-xs font-semibold text-gray-700">
                {t("hero.panelBadge")}
              </p>
            </div>
          </motion.div>
        </motion.aside>
      </motion.div>

      <motion.div
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gray-500">
            {t("hero.scrollIndicator")}
          </span>
          <motion.div className="flex h-9 w-5 items-start justify-center rounded-full border border-rosa/35 p-1">
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-rosa"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
