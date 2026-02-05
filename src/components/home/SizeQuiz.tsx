"use client";

import React, { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Circle,
  Maximize2,
  Footprints,
  Heart,
  Feather,
  Layers,
  Shield,
  Coffee,
  Activity,
  Star,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

type AreaOption = "abdomen" | "cintura" | "piernas" | "gluteos";
type CompressionOption = "suave" | "media" | "firme";
type OccasionOption = "diario" | "deporte" | "evento";

interface Selections {
  area: AreaOption | null;
  compression: CompressionOption | null;
  occasion: OccasionOption | null;
}

interface Measurements {
  cintura: string;
  cadera: string;
}

const areaOptions = [
  { id: "abdomen" as AreaOption, labelKey: "sizeQuiz.areaAbdomen", icon: Circle },
  { id: "cintura" as AreaOption, labelKey: "sizeQuiz.areaCintura", icon: Maximize2 },
  { id: "piernas" as AreaOption, labelKey: "sizeQuiz.areaPiernas", icon: Footprints },
  { id: "gluteos" as AreaOption, labelKey: "sizeQuiz.areaGluteos", icon: Heart },
];

const compressionOptions = [
  { id: "suave" as CompressionOption, labelKey: "sizeQuiz.compressionSuave", icon: Feather },
  { id: "media" as CompressionOption, labelKey: "sizeQuiz.compressionMedia", icon: Layers },
  { id: "firme" as CompressionOption, labelKey: "sizeQuiz.compressionFirme", icon: Shield },
];

const occasionOptions = [
  { id: "diario" as OccasionOption, labelKey: "sizeQuiz.occasionDiario", icon: Coffee },
  { id: "deporte" as OccasionOption, labelKey: "sizeQuiz.occasionDeporte", icon: Activity },
  { id: "evento" as OccasionOption, labelKey: "sizeQuiz.occasionEvento", icon: Star },
];

function calculateSize(cintura: number, cadera: number): string {
  const avg = (cintura + cadera) / 2;
  if (avg < 70) return "XS";
  if (avg < 78) return "S";
  if (avg < 88) return "M";
  if (avg < 98) return "L";
  if (avg < 108) return "XL";
  return "XXL";
}

function getRecommendedProduct(
  area: AreaOption | null,
  occasion: OccasionOption | null
): { nameKey: string; descKey: string } {
  if (occasion === "deporte") {
    return {
      nameKey: "sizeQuiz.recommendedWaistTrainer",
      descKey: "sizeQuiz.recommendedWaistTrainerDesc",
    };
  }
  if (occasion === "evento") {
    return {
      nameKey: "sizeQuiz.recommendedGalaSculpt",
      descKey: "sizeQuiz.recommendedGalaSculptDesc",
    };
  }
  if (area === "gluteos") {
    return {
      nameKey: "sizeQuiz.recommendedLevantaGluteos",
      descKey: "sizeQuiz.recommendedLevantaGluteosDesc",
    };
  }
  if (area === "piernas") {
    return {
      nameKey: "sizeQuiz.recommendedLeggingSculpt",
      descKey: "sizeQuiz.recommendedLeggingSculptDesc",
    };
  }
  return {
    nameKey: "sizeQuiz.recommendedRecoveryMama",
    descKey: "sizeQuiz.recommendedRecoveryMamaDesc",
  };
}

const confettiColors = ["#FF6B9D", "#D4AF37", "#40E0D0", "#FF7F7F"];

export default function SizeQuiz() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({
    area: null,
    compression: null,
    occasion: null,
  });
  const [measurements, setMeasurements] = useState<Measurements>({
    cintura: "",
    cadera: "",
  });
  const [direction, setDirection] = useState(1);

  const totalSteps = 4;
  const showResult = currentStep === 4;

  // Pre-compute random values for confetti to avoid Math.random() during render
  const [confettiRandom] = useState(() =>
    Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      x: (Math.random() - 0.5) * 100,
      rotate: Math.random() * 720,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 1.5,
    }))
  );

  const computedSize = calculateSize(
    parseFloat(measurements.cintura) || 84,
    parseFloat(measurements.cadera) || 96
  );

  const recommendedProduct = getRecommendedProduct(
    selections.area,
    selections.occasion
  );

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return selections.area !== null;
      case 1:
        return selections.compression !== null;
      case 2:
        return selections.occasion !== null;
      case 3:
        return measurements.cintura !== "" && measurements.cadera !== "";
      default:
        return false;
    }
  }, [currentStep, selections, measurements]);

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <section className="py-24 bg-gradient-to-b from-perla to-arena">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal direction="up">
          <h2 className="font-serif text-4xl text-center text-gray-800">
            {t("sizeQuiz.heading")}
          </h2>
          <p className="font-script text-2xl text-rosa text-center mt-4">
            {t("sizeQuiz.subtitle")}
          </p>
        </ScrollReveal>

        <div className="max-w-2xl mx-auto mt-12 px-6">
          {/* Progress Bar */}
          {!showResult && (
            <ScrollReveal direction="up" delay={0.1}>
              <div className="flex items-center justify-center mb-12">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <React.Fragment key={i}>
                    <div className="relative">
                      <motion.div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 z-10 relative",
                          i < currentStep
                            ? "bg-rosa-dark text-white"
                            : i === currentStep
                              ? "bg-rosa text-white"
                              : "bg-rosa-light/50 text-gray-400"
                        )}
                        animate={
                          i === currentStep ? { scale: [1, 1.1, 1] } : {}
                        }
                        transition={{ duration: 0.4 }}
                      >
                        {i + 1}
                      </motion.div>
                    </div>
                    {i < totalSteps - 1 && (
                      <div className="w-16 h-1 bg-rosa-light/30 mx-1 rounded-full overflow-hidden relative">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-rosa-dark rounded-full"
                          initial={{ width: "0%" }}
                          animate={{
                            width: i < currentStep ? "100%" : "0%",
                          }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </ScrollReveal>
          )}

          {/* Step Content */}
          <div className="relative min-h-[340px]">
            <AnimatePresence custom={direction} mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="step-0"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <h3 className="font-serif text-xl text-center text-gray-700 mb-6">
                    {t("sizeQuiz.step1Title")}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {areaOptions.map((opt) => {
                      const Icon = opt.icon;
                      const selected = selections.area === opt.id;
                      return (
                        <motion.div
                          key={opt.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() =>
                            setSelections((s) => ({ ...s, area: opt.id }))
                          }
                          className={cn(
                            "glass-rosa p-6 text-center cursor-pointer rounded-xl transition-all duration-200",
                            selected && "ring-2 ring-rosa bg-rosa/20"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-8 h-8 mx-auto mb-3",
                              selected ? "text-rosa-dark" : "text-rosa"
                            )}
                          />
                          <span
                            className={cn(
                              "font-semibold",
                              selected ? "text-rosa-dark" : "text-gray-700"
                            )}
                          >
                            {t(opt.labelKey)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <h3 className="font-serif text-xl text-center text-gray-700 mb-6">
                    {t("sizeQuiz.step2Title")}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {compressionOptions.map((opt) => {
                      const Icon = opt.icon;
                      const selected = selections.compression === opt.id;
                      return (
                        <motion.div
                          key={opt.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() =>
                            setSelections((s) => ({
                              ...s,
                              compression: opt.id,
                            }))
                          }
                          className={cn(
                            "glass-rosa p-6 text-center cursor-pointer rounded-xl transition-all duration-200",
                            selected && "ring-2 ring-rosa bg-rosa/20"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-8 h-8 mx-auto mb-3",
                              selected ? "text-rosa-dark" : "text-rosa"
                            )}
                          />
                          <span
                            className={cn(
                              "font-semibold",
                              selected ? "text-rosa-dark" : "text-gray-700"
                            )}
                          >
                            {t(opt.labelKey)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <h3 className="font-serif text-xl text-center text-gray-700 mb-6">
                    {t("sizeQuiz.step3Title")}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {occasionOptions.map((opt) => {
                      const Icon = opt.icon;
                      const selected = selections.occasion === opt.id;
                      return (
                        <motion.div
                          key={opt.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() =>
                            setSelections((s) => ({ ...s, occasion: opt.id }))
                          }
                          className={cn(
                            "glass-rosa p-6 text-center cursor-pointer rounded-xl transition-all duration-200",
                            selected && "ring-2 ring-rosa bg-rosa/20"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-8 h-8 mx-auto mb-3",
                              selected ? "text-rosa-dark" : "text-rosa"
                            )}
                          />
                          <span
                            className={cn(
                              "font-semibold",
                              selected ? "text-rosa-dark" : "text-gray-700"
                            )}
                          >
                            {t(opt.labelKey)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <h3 className="font-serif text-xl text-center text-gray-700 mb-6">
                    {t("sizeQuiz.step4Title")}
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        {t("sizeQuiz.waistLabel")}
                      </label>
                      <input
                        type="number"
                        placeholder={t("sizeQuiz.waistPlaceholder")}
                        value={measurements.cintura}
                        onChange={(e) =>
                          setMeasurements((m) => ({
                            ...m,
                            cintura: e.target.value,
                          }))
                        }
                        className="w-full p-4 rounded-xl border border-rosa-light focus:border-rosa focus:ring-2 focus:ring-rosa/20 outline-none transition-all bg-white/80"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        {t("sizeQuiz.hipLabel")}
                      </label>
                      <input
                        type="number"
                        placeholder={t("sizeQuiz.hipPlaceholder")}
                        value={measurements.cadera}
                        onChange={(e) =>
                          setMeasurements((m) => ({
                            ...m,
                            cadera: e.target.value,
                          }))
                        }
                        className="w-full p-4 rounded-xl border border-rosa-light focus:border-rosa focus:ring-2 focus:ring-rosa/20 outline-none transition-all bg-white/80"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {showResult && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center relative overflow-hidden"
                >
                  {/* Confetti */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {confettiRandom.map((rand, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 rounded-sm"
                        style={{
                          left: `${rand.left}%`,
                          backgroundColor:
                            confettiColors[i % confettiColors.length],
                        }}
                        initial={{
                          y: -20,
                          x: 0,
                          rotate: 0,
                          opacity: 1,
                        }}
                        animate={{
                          y: 500,
                          x: rand.x,
                          rotate: rand.rotate,
                          opacity: 0,
                        }}
                        transition={{
                          duration: rand.duration,
                          delay: rand.delay,
                          ease: "easeIn",
                        }}
                      />
                    ))}
                  </div>

                  <Sparkles className="w-10 h-10 text-dorado mx-auto mb-4" />
                  <p className="text-lg text-gray-600 mb-2">
                    {t("sizeQuiz.resultIntro")}
                  </p>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.3,
                    }}
                    className="text-6xl font-serif font-bold text-rosa-dark my-6"
                  >
                    {computedSize}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-rosa p-6 rounded-xl mt-8 max-w-sm mx-auto"
                  >
                    <p className="text-sm text-gray-500 mb-1">
                      {t("sizeQuiz.recommendedProductLabel")}
                    </p>
                    <h4 className="font-serif text-xl font-semibold text-gray-800 mb-2">
                      {t(recommendedProduct.nameKey)}
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      {t(recommendedProduct.descKey)}
                    </p>
                    <Link
                      href="/shop"
                      className="btn-shimmer inline-block text-sm px-6 py-3"
                    >
                      {t("sizeQuiz.viewProduct")}
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Link
                      href="/shop"
                      className="inline-block mt-6 text-rosa-dark font-semibold hover:underline transition-all"
                    >
                      {t("sizeQuiz.viewAllProducts")}
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          {!showResult && (
            <div className="flex items-center justify-between mt-10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all cursor-pointer",
                  currentStep === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-rosa-dark hover:bg-rosa-light/30"
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                {t("sizeQuiz.prevButton")}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!canProceed()}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all cursor-pointer",
                  canProceed()
                    ? "btn-shimmer text-white text-sm"
                    : "bg-rosa-light/40 text-gray-400 cursor-not-allowed"
                )}
              >
                {currentStep === 3 ? t("sizeQuiz.viewResultButton") : t("sizeQuiz.nextButton")}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
