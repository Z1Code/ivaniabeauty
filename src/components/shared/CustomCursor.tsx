"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Raw mouse position tracked via motion values for performance
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smoothed spring values for the outer ring
  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  // Faster spring for the inner dot (tighter follow)
  const dotSpringConfig = { damping: 30, stiffness: 400, mass: 0.2 };
  const dotX = useSpring(cursorX, dotSpringConfig);
  const dotY = useSpring(cursorY, dotSpringConfig);

  // Check if we are on a desktop viewport
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkDesktop = () => {
      setIsDesktop(window.innerWidth > 1024);
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Track mouse movement
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    },
    [cursorX, cursorY]
  );

  useEffect(() => {
    if (!isDesktop || typeof window === "undefined") return;

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isDesktop, handleMouseMove]);

  // Detect hoverable / clickable elements
  useEffect(() => {
    if (!isDesktop || typeof window === "undefined") return;

    const hoverableSelector =
      'a, button, [role="button"], input[type="submit"], input[type="button"], [data-cursor-hover]';

    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(hoverableSelector)) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(hoverableSelector)) {
        setIsHovering(false);
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [isDesktop]);

  // Don't render on mobile / SSR
  if (!isDesktop) return null;

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full border-2 border-rosa mix-blend-difference"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovering ? 48 : 32,
          height: isHovering ? 48 : 32,
          opacity: isHovering ? 0.6 : 1,
        }}
        transition={{
          width: { type: "spring", stiffness: 300, damping: 20 },
          height: { type: "spring", stiffness: 300, damping: 20 },
          opacity: { duration: 0.2 },
        }}
      />

      {/* Inner dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full bg-rosa mix-blend-difference"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovering ? 6 : 8,
          height: isHovering ? 6 : 8,
          opacity: isHovering ? 0.4 : 1,
        }}
        transition={{
          width: { type: "spring", stiffness: 300, damping: 20 },
          height: { type: "spring", stiffness: 300, damping: 20 },
          opacity: { duration: 0.2 },
        }}
      />
    </>
  );
}
