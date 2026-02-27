"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Heart, MessageCircle, Music2 } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

const TIKTOK_PROFILE = "https://www.tiktok.com/@ivaniabeauty2";

interface TikTokVideo {
  id: string;
  thumbnail: string;
  title: string;
  views: string;
  likes: string;
  url: string;
}

const FALLBACK_GRADIENTS = [
  "from-rosa-dark to-rosa",
  "from-turquesa/70 to-rosa/50",
  "from-rosa to-coral/60",
  "from-rosa-dark/80 to-turquesa/40",
  "from-coral/70 to-rosa-light",
  "from-rosa/60 to-arena",
];

function VideoCard({
  video,
  fallbackGradient,
}: {
  video: TikTokVideo | null;
  fallbackGradient: string;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const showThumbnail = video && video.thumbnail && !imgError;
  const href = video ? video.url : TIKTOK_PROFILE;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
        className="aspect-[9/14] rounded-xl overflow-hidden relative group cursor-pointer shadow-md"
      >
        {showThumbnail ? (
          <>
            {/* Real TikTok Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnail}
              alt={video.title || "TikTok video"}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                imgLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
            {/* Rosa transparent overlay on thumbnail */}
            <div className="absolute inset-0 bg-rosa/20 mix-blend-multiply" />
            {/* Show gradient while image loads */}
            {!imgLoaded && (
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-b",
                  fallbackGradient
                )}
              />
            )}
          </>
        ) : (
          /* Gradient Fallback */
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-b",
              fallbackGradient
            )}
          />
        )}

        {/* Decorative Music Note */}
        <div className="absolute top-3 right-3 opacity-20">
          <Music2 className="w-6 h-6 text-white" />
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-colors duration-300">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Bottom Stats */}
        {video && (video.views || video.likes) && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex items-center gap-3 text-white text-xs font-medium">
              {video.views && (
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3 fill-white" />
                  {video.views}
                </span>
              )}
              {video.likes && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-white" />
                  {video.likes}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Play className="w-8 h-8 text-white fill-white mb-2" />
          <div className="flex items-center gap-3 text-white">
            <span className="flex items-center gap-1 text-sm">
              <Heart className="w-4 h-4 fill-white" />
            </span>
            <span className="flex items-center gap-1 text-sm">
              <MessageCircle className="w-4 h-4 fill-white" />
            </span>
          </div>
        </div>
      </motion.div>
    </a>
  );
}

export default function TikTokFeed() {
  const { t } = useTranslation();
  const [tiktokVideos, setTiktokVideos] = useState<TikTokVideo[]>([]);

  const fetchVideos = useCallback(() => {
    fetch("/api/tiktok")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTiktokVideos(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Build display items: real videos padded with null slots up to 6
  const displayCount = Math.max(tiktokVideos.length, 5);
  const displayItems = Array.from({ length: displayCount }, (_, i) =>
    tiktokVideos[i] ?? null
  );

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal direction="up">
          <h2 className="font-serif text-4xl text-center text-gray-800">
            {t("tiktok.heading")}
          </h2>
          <p className="font-script text-2xl text-rosa text-center mt-3">
            {t("tiktok.handle")}
          </p>
        </ScrollReveal>

        {/* TikTok Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-12">
          {displayItems.map((video, i) => (
            <ScrollReveal
              key={video?.id ?? `fallback-${i}`}
              direction="up"
              delay={i * 0.08}
            >
              <VideoCard
                video={video}
                fallbackGradient={FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length]}
              />
            </ScrollReveal>
          ))}
        </div>

        {/* Follow CTA */}
        <div className="mt-10 text-center">
          <ScrollReveal direction="up" delay={0.3}>
            <a
              href={TIKTOK_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-black transition-colors cursor-pointer shadow-lg"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.07a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.5z" />
                </svg>
                {t("tiktok.followButton")}
              </motion.button>
            </a>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
