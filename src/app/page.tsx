"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/home/Hero";
import { useTranslation } from "@/hooks/useTranslation";
import { motion } from "framer-motion";
import Features from "@/components/home/Features";
import Collections from "@/components/home/Collections";
import FeaturedProduct from "@/components/home/FeaturedProduct";
import BeforeAfter from "@/components/shared/BeforeAfter";
import Testimonials from "@/components/home/Testimonials";
import SizeQuiz from "@/components/home/SizeQuiz";
import InstagramFeed from "@/components/home/InstagramFeed";
import TikTokFeed from "@/components/home/TikTokFeed";
import {
  DEFAULT_HOME_SECTIONS_SETTINGS,
  HOME_SECTIONS_STORAGE_KEY,
  HOME_SECTIONS_UPDATED_EVENT,
  parseHomeSectionsSettings,
  type HomeSectionsSettings,
} from "@/lib/home-sections-config";

export default function Home() {
  const { t } = useTranslation();
  const [homeSections, setHomeSections] = useState<HomeSectionsSettings>(
    DEFAULT_HOME_SECTIONS_SETTINGS
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncHomeSections = () => {
      const parsed = parseHomeSectionsSettings(
        window.localStorage.getItem(HOME_SECTIONS_STORAGE_KEY)
      );
      setHomeSections((prev) =>
        prev.showTikTok === parsed.showTikTok &&
        prev.showInstagram === parsed.showInstagram
          ? prev
          : parsed
      );
    };

    syncHomeSections();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === HOME_SECTIONS_STORAGE_KEY) {
        syncHomeSections();
      }
    };
    const handleSectionsUpdated = () => syncHomeSections();

    window.addEventListener("storage", handleStorage);
    window.addEventListener(HOME_SECTIONS_UPDATED_EVENT, handleSectionsUpdated);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(HOME_SECTIONS_UPDATED_EVENT, handleSectionsUpdated);
    };
  }, []);

  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-perla via-[#fffbf7] to-arena">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-[32rem] h-96 w-96 rounded-full bg-rosa-light/24 blur-[110px]"
        animate={{ y: [0, -20, 0], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 top-[78rem] h-[32rem] w-[32rem] rounded-full bg-turquesa/16 blur-[120px]"
        animate={{ y: [0, 24, 0], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[20%] top-[138rem] h-72 w-72 rounded-full bg-dorado/16 blur-[90px]"
        animate={{ y: [0, -16, 0], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <div className="relative z-10">
        <Hero />
        <Features />
        <Collections />
        <FeaturedProduct />

        {/* Before & After Section */}
        <section className="py-24 bg-arena/80 backdrop-blur-[1px]">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-serif text-4xl text-center mb-4">
              {t("beforeAfter.headingPrefix")} <span className="text-gradient-rosa">{t("beforeAfter.headingHighlight")}</span> {t("beforeAfter.headingSuffix")}
            </h2>
            <p className="font-script text-xl text-rosa text-center mb-12">
              {t("beforeAfter.subtitle")}
            </p>
            <div className="max-w-2xl mx-auto">
              <BeforeAfter />
            </div>
          </div>
        </section>

        <Testimonials />
        <SizeQuiz />
        {homeSections.showTikTok && <TikTokFeed />}
        {homeSections.showInstagram && <InstagramFeed />}
      </div>
    </main>
  );
}
