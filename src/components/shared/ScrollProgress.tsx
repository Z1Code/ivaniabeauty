"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  // Smooth the scroll progress so the bar doesn't jitter
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 right-0 left-0 z-[9998] h-[3px] origin-left"
      style={{
        scaleX,
        background:
          "linear-gradient(90deg, var(--color-rosa) 0%, var(--color-rosa-dark) 50%, var(--color-dorado) 100%)",
      }}
    />
  );
}
