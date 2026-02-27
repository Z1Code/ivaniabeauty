"use client";

import { useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";

interface HandwrittenRevealProps {
  text: string;
  className?: string;
}

export default function HandwrittenReveal({
  text,
  className = "font-script text-2xl text-rosa-dark mt-4",
}: HandwrittenRevealProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= text.length) clearInterval(interval);
    }, 45);

    return () => clearInterval(interval);
  }, [isInView, text.length]);

  return (
    <p
      ref={ref}
      className={`${className} h-[1.6em]`}
      aria-label={text}
    >
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block transition-opacity duration-150"
          style={{
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? "translateY(0)" : "translateY(4px)",
            transition: "opacity 0.15s ease-out, transform 0.15s ease-out",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
      {/* Blinking cursor */}
      <span
        className="inline-block w-[2px] h-[1.1em] bg-rosa-dark/60 ml-0.5 align-middle"
        style={{
          opacity: visibleCount < text.length ? 1 : 0,
          animation: "blink-cursor 0.8s steps(1) infinite",
          transition: "opacity 0.3s ease-out",
        }}
      />
      <style jsx>{`
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </p>
  );
}
