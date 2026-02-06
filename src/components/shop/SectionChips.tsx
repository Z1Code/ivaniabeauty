"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { type SectionConfig } from "@/app/shop/sections";

interface SectionChipsProps {
  sections: SectionConfig[];
  activeSectionId: string;
  onSelect: (id: string) => void;
}

export default function SectionChips({
  sections,
  activeSectionId,
  onSelect,
}: SectionChipsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {sections.map((section) => {
        const isActive = activeSectionId === section.id;
        return (
          <motion.button
            key={section.id}
            onClick={() => onSelect(section.id)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative rounded-full px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer",
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
