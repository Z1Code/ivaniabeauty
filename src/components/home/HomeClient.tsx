"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Hero from "@/components/home/Hero";
import HandwrittenReveal from "@/components/ui/HandwrittenReveal";
import { useTranslation } from "@/hooks/useTranslation";
import { motion } from "framer-motion";
import Features from "@/components/home/Features";
import Collections from "@/components/home/Collections";
import BrandStory from "@/components/home/BrandStory";
import SocialProofBanner from "@/components/home/SocialProofBanner";
import Testimonials from "@/components/home/Testimonials";
import {
  DEFAULT_HOME_SECTIONS_SETTINGS,
  HOME_SECTIONS_STORAGE_KEY,
  HOME_SECTIONS_UPDATED_EVENT,
  parseHomeSectionsSettings,
  sanitizeHomeSectionsSettings,
  type HomeSectionsSettings,
} from "@/lib/home-sections-config";

const BeforeAfter = dynamic(() => import("@/components/shared/BeforeAfter"), {
  ssr: false,
});
const SizeQuiz = dynamic(() => import("@/components/home/SizeQuiz"), {
  ssr: false,
});
const TikTokFeed = dynamic(() => import("@/components/home/TikTokFeed"), {
  ssr: false,
});
const InstagramFeed = dynamic(
  () => import("@/components/home/InstagramFeed"),
  { ssr: false }
);
const HeroChipscroll = dynamic(
  () => import("@/components/home/HeroChipscroll"),
  { ssr: false }
);

interface SiteSectionsApiResponse {
  homeSections?: HomeSectionsSettings;
  persisted?: boolean;
}

function isSameHomeSections(
  current: HomeSectionsSettings,
  next: HomeSectionsSettings
): boolean {
  return (
    current.showCollections === next.showCollections &&
    current.showFeaturedProduct === next.showFeaturedProduct &&
    current.showSizeQuiz === next.showSizeQuiz &&
    current.showTikTok === next.showTikTok &&
    current.showInstagram === next.showInstagram &&
    current.heroEffectIntensity === next.heroEffectIntensity &&
    current.heroVariant === next.heroVariant
  );
}

export default function HomeClient() {
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
        isSameHomeSections(prev, parsed) ? prev : parsed
      );
    };

    const syncHomeSectionsFromServer = async () => {
      try {
        const response = await fetch("/api/settings/site-sections", {
          method: "GET",
          cache: "no-store",
        });
        const data =
          (await response.json().catch(() => ({}))) as SiteSectionsApiResponse;
        if (!response.ok || !data.persisted) return;

        const persistedSections = sanitizeHomeSectionsSettings(
          data.homeSections
        );
        setHomeSections((prev) =>
          isSameHomeSections(prev, persistedSections) ? prev : persistedSections
        );
        window.localStorage.setItem(
          HOME_SECTIONS_STORAGE_KEY,
          JSON.stringify(persistedSections)
        );
      } catch {
        // Local storage fallback already applied.
      }
    };

    syncHomeSections();
    void syncHomeSectionsFromServer();

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
      window.removeEventListener(
        HOME_SECTIONS_UPDATED_EVENT,
        handleSectionsUpdated
      );
    };
  }, []);

  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-perla via-[#fffbf7] to-arena">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-[32rem] h-96 w-96 rounded-full bg-rosa-light/24 blur-[110px] animate-blob-float-1"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 top-[78rem] h-[32rem] w-[32rem] rounded-full bg-turquesa/16 blur-[120px] animate-blob-float-2"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[20%] top-[138rem] h-72 w-72 rounded-full bg-dorado/16 blur-[90px] animate-blob-float-3"
      />

      <div className="relative z-10">
        {homeSections.heroVariant === "chipscroll" ? (
          <HeroChipscroll mode="fullbleed" />
        ) : homeSections.heroVariant === "chipscroll-windowed" ? (
          <HeroChipscroll mode="windowed" />
        ) : (
          <Hero effectIntensity={homeSections.heroEffectIntensity} />
        )}
        <Features />
        <SocialProofBanner />
        {homeSections.showCollections && <Collections />}
        <BrandStory />

        {/* Before & After Section */}
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-serif text-4xl text-center mb-4">
              {t("beforeAfter.headingPrefix")}{" "}
              <span className="text-gradient-rosa">
                {t("beforeAfter.headingHighlight")}
              </span>{" "}
              {t("beforeAfter.headingSuffix")}
            </h2>
            <div className="text-center mb-12">
              <HandwrittenReveal
                text={t("beforeAfter.subtitle")}
                className="font-script text-xl text-rosa"
              />
            </div>
            <div className="max-w-[42rem] mx-auto">
              <BeforeAfter />
            </div>
          </div>
        </section>

        <Testimonials />
        {homeSections.showSizeQuiz && <SizeQuiz />}
        {homeSections.showTikTok && <TikTokFeed />}
        {homeSections.showInstagram && <InstagramFeed />}
      </div>
    </main>
  );
}
