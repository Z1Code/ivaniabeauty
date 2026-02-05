"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type Unit = "cm" | "inches";

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
  className?: string;
}

export default function UnitToggle({
  unit,
  onChange,
  className,
}: UnitToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center bg-gray-100 rounded-full p-0.5",
        className
      )}
    >
      <button
        onClick={() => onChange("cm")}
        className={cn(
          "relative px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 cursor-pointer",
          unit === "cm" ? "text-white" : "text-gray-600 hover:text-gray-800"
        )}
      >
        {unit === "cm" && (
          <motion.span
            layoutId="unit-toggle-bg"
            className="absolute inset-0 bg-rosa rounded-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10">cm</span>
      </button>
      <button
        onClick={() => onChange("inches")}
        className={cn(
          "relative px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 cursor-pointer",
          unit === "inches" ? "text-white" : "text-gray-600 hover:text-gray-800"
        )}
      >
        {unit === "inches" && (
          <motion.span
            layoutId="unit-toggle-bg"
            className="absolute inset-0 bg-rosa rounded-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10">in</span>
      </button>
    </div>
  );
}
