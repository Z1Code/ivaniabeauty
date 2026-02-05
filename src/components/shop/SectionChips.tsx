"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { type SectionConfig } from "@/app/shop/sections";

interface SectionChipsProps {
  sections: SectionConfig[];
  activeSections: Set<string>;
  onToggle: (id: string) => void;
}

export default function SectionChips({ sections, activeSections, onToggle }: SectionChipsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {sections.map((section) => {
        const isActive = activeSections.has(section.id);
        return (
          <motion.button
            key={section.id}
            onClick={() => onToggle(section.id)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 cursor-pointer shrink-0",
              isActive
                ? "bg-rosa text-white shadow-md shadow-rosa/20"
                : "bg-white text-gray-600 border border-gray-200 hover:border-rosa/40 hover:text-rosa-dark"
            )}
          >
            {t(section.titleKey)}
          </motion.button>
        );
      })}
    </div>
  );
}
