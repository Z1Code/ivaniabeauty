"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, WandSparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiGenerationFullscreenOverlayProps {
  open: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

const PILL_LABELS = ["Modelo", "Prenda", "Acabado"];

export default function AiGenerationFullscreenOverlay({
  open,
  className,
  title = "Creando imagen IA de estudio",
  subtitle = "Estamos preparando una composicion comercial premium con fondo transparente y acabado de catalogo.",
}: AiGenerationFullscreenOverlayProps) {
  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="ai-generation-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={cn(
            "fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6",
            className
          )}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <motion.div
            className="absolute inset-0 backdrop-blur-[10px] bg-white/66 dark:bg-[#0D101A]/72"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
          />

          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 16% 20%, rgba(255,184,208,0.68) 0%, rgba(255,184,208,0) 38%), radial-gradient(circle at 84% 78%, rgba(255,245,230,0.85) 0%, rgba(255,245,230,0) 44%), radial-gradient(circle at 50% 50%, rgba(255,107,157,0.16) 0%, rgba(255,107,157,0) 56%)",
            }}
            animate={{
              opacity: [0.52, 0.78, 0.58],
              scale: [1, 1.04, 1],
            }}
            transition={{
              duration: 6.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="relative mx-auto h-[min(80vh,760px)] w-[min(95vw,1100px)] rounded-[34px] border border-rosa/18 bg-white/88 dark:bg-[#121725]/88 shadow-[0_30px_90px_rgba(255,107,157,0.22)] dark:shadow-[0_30px_120px_rgba(0,0,0,0.55)] overflow-hidden"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.34, ease: "easeOut" }}
          >
            <motion.div
              className="absolute -inset-[28%] opacity-[0.22] dark:opacity-[0.18]"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(255,107,157,0) 0deg, rgba(255,107,157,0.75) 80deg, rgba(255,255,255,0) 170deg, rgba(255,184,208,0.62) 230deg, rgba(255,107,157,0) 360deg)",
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 16,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />

            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,107,157,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,107,157,0.08)_1px,transparent_1px)] bg-[size:36px_36px] opacity-[0.16] dark:opacity-[0.08]" />

            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-8 sm:px-10 sm:py-10 text-center">
              <motion.div
                className="relative mb-8 h-56 w-56 sm:h-64 sm:w-64 rounded-full"
                animate={{ scale: [1, 1.035, 1], y: [0, -3, 0] }}
                transition={{
                  duration: 2.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full border border-rosa/35 dark:border-rosa/45"
                  animate={{
                    opacity: [0.42, 0.95, 0.42],
                    scale: [0.86, 1.18, 0.86],
                  }}
                  transition={{
                    duration: 2.1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeOut",
                  }}
                />
                <motion.div
                  className="absolute inset-[16%] rounded-full border border-rosa-dark/35 dark:border-rosa-light/35"
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 9,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                />
                <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-white via-perla to-rosa-light/35 dark:from-[#2A2F45] dark:via-[#1D2335] dark:to-[#312341] border border-white/70 dark:border-white/12 shadow-[0_16px_40px_rgba(255,107,157,0.28)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.48)] flex items-center justify-center">
                  <motion.span
                    animate={{ rotate: [0, 12, -8, 0] }}
                    transition={{
                      duration: 2.2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    <WandSparkles className="h-10 w-10 text-rosa-dark dark:text-rosa-light" />
                  </motion.span>
                </div>
                <motion.span
                  className="absolute left-[9%] top-[18%] text-rosa-dark/80 dark:text-rosa-light/80"
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.36, 1, 0.36],
                    scale: [0.9, 1.15, 0.9],
                  }}
                  transition={{
                    duration: 2.6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.span>
                <motion.span
                  className="absolute right-[12%] bottom-[16%] text-rosa/80 dark:text-rosa-light/75"
                  animate={{
                    y: [0, 6, 0],
                    opacity: [0.3, 0.95, 0.3],
                    scale: [0.9, 1.2, 0.9],
                  }}
                  transition={{
                    duration: 2.9,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.span>
              </motion.div>

              <div className="max-w-3xl">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-rosa-dark dark:text-rosa-light">
                  {title}
                </h3>
                <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {subtitle}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                {PILL_LABELS.map((label, idx) => (
                  <motion.span
                    key={label}
                    className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-rosa/28 bg-white/78 text-rosa-dark dark:bg-[#1B2234]/84 dark:border-rosa/30 dark:text-rosa-light"
                    animate={{ opacity: [0.4, 1, 0.4], y: [0, -2, 0] }}
                    transition={{
                      duration: 1.65,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: idx * 0.16,
                      ease: "easeInOut",
                    }}
                  >
                    {label}
                  </motion.span>
                ))}
              </div>

              <div className="mt-7 w-[min(78vw,620px)] h-2.5 rounded-full bg-rosa/12 dark:bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full w-[36%] rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,107,157,0.98) 0%, rgba(255,184,208,0.98) 55%, rgba(255,245,230,0.98) 100%)",
                  }}
                  animate={{ x: ["-125%", "285%"] }}
                  transition={{
                    duration: 2.2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
