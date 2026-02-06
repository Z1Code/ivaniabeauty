"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiMagicGenerateButtonProps {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  idleLabel?: string;
  loadingLabel?: string;
  className?: string;
}

function LoadingDots() {
  const dots = [0, 1, 2];
  return (
    <span className="inline-flex items-center gap-1">
      {dots.map((dot) => (
        <motion.span
          key={`dot-${dot}`}
          className="h-1.5 w-1.5 rounded-full bg-white/90"
          animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.08, 0.9] }}
          transition={{
            duration: 1.1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: dot * 0.13,
          }}
        />
      ))}
    </span>
  );
}

export default function AiMagicGenerateButton({
  loading,
  disabled = false,
  onClick,
  idleLabel = "Autogenerar imagen profesional",
  loadingLabel = "Generando imagen profesional",
  className,
}: AiMagicGenerateButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      aria-live="polite"
      className={cn(
        "group relative isolate inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-300 cursor-pointer overflow-hidden",
        loading
          ? "border-rosa-dark/40 text-white shadow-[0_12px_30px_rgba(233,30,99,0.33)] bg-gradient-to-r from-rosa via-rosa-dark to-rosa"
          : "border-rosa/25 bg-rosa/10 text-rosa hover:bg-rosa/20 hover:border-rosa/45 hover:shadow-[0_8px_20px_rgba(255,107,157,0.2)]",
        isDisabled && !loading && "opacity-50 cursor-not-allowed",
        className
      )}
      animate={loading ? { scale: [1, 0.988, 1], y: [0, 0.5, 0] } : { scale: 1, y: 0 }}
      transition={
        loading
          ? {
              duration: 1.6,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }
          : { duration: 0.18 }
      }
    >
      <span className="absolute inset-0 rounded-[inherit] pointer-events-none" />

      {loading && (
        <>
          <motion.span
            className="pointer-events-none absolute -inset-[40%] opacity-75 blur-2xl"
            style={{
              background:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0) 48%), radial-gradient(circle at 78% 74%, rgba(255,184,208,0.7) 0%, rgba(255,184,208,0) 50%)",
            }}
            animate={{
              x: ["-8%", "8%", "-5%"],
              y: ["-4%", "6%", "-3%"],
              opacity: [0.48, 0.75, 0.55],
            }}
            transition={{
              duration: 5.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          <motion.span
            className="pointer-events-none absolute inset-[-120%] opacity-45"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.78) 82deg, rgba(255,255,255,0) 160deg, rgba(255,184,208,0.58) 220deg, rgba(255,255,255,0) 360deg)",
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 7.4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />

          <motion.span
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={{
              background:
                "linear-gradient(104deg, rgba(255,255,255,0) 28%, rgba(255,255,255,0.78) 48%, rgba(255,255,255,0) 70%)",
            }}
            animate={{ x: ["-140%", "165%"] }}
            transition={{
              duration: 1.85,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </>
      )}

      <span className="relative z-10 inline-flex items-center gap-2">
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
          {loading ? (
            <>
              <motion.span
                className="absolute inline-flex h-4 w-4 rounded-full border border-white/80"
                animate={{ opacity: [0.65, 0, 0.65], scale: [0.85, 1.65, 0.85] }}
                transition={{
                  duration: 1.45,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeOut",
                }}
              />
              <motion.span
                animate={{ rotate: [0, 12, -10, 0] }}
                transition={{
                  duration: 1.6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.span>
            </>
          ) : (
            <Sparkles className="h-4 w-4 text-rosa" />
          )}
        </span>

        <span>{loading ? loadingLabel : idleLabel}</span>
        {loading && <LoadingDots />}
      </span>
    </motion.button>
  );
}
