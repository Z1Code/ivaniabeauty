"use client";

import Hero from "@/components/home/Hero";
import { useTranslation } from "@/hooks/useTranslation";
import Features from "@/components/home/Features";
import Collections from "@/components/home/Collections";
import FeaturedProduct from "@/components/home/FeaturedProduct";
import BeforeAfter from "@/components/shared/BeforeAfter";
import Testimonials from "@/components/home/Testimonials";
import SizeQuiz from "@/components/home/SizeQuiz";
import InstagramFeed from "@/components/home/InstagramFeed";
import TikTokFeed from "@/components/home/TikTokFeed";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Hero />
      <Features />
      <Collections />
      <FeaturedProduct />

      {/* Before & After Section */}
      <section className="py-24 bg-arena">
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
      <TikTokFeed />
      <InstagramFeed />
    </>
  );
}
