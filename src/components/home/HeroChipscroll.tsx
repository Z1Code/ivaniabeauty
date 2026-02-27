"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";

// ── Configuration ────────────────────────────────────────────────
const BG_COLOR = "#f5f0eb";
const TOTAL_FRAMES = 288;
const FPS = 24;
const FRAME_PATH = "/chipscroll/frame_";
const FRAME_EXT = ".webp";

// ── Text Overlays ────────────────────────────────────────────────
interface TextOverlay {
  lines: { key: string; gradient?: string }[];
  position: "center" | "bottom-left" | "bottom-right";
  size: "default" | "large";
  startFrame: number;
  endFrame: number;
}

// 24fps: sec0=0, sec3=72, sec5=120, sec8=192
const textOverlays: TextOverlay[] = [
  {
    lines: [
      {
        key: "chipscroll.overlay1Line1",
        gradient:
          "linear-gradient(90deg, #f5e6d8, #e8c4b8, #f5f0eb, #dbb5a0, #f5e6d8)",
      },
      { key: "chipscroll.overlay1Line2" },
    ],
    position: "center",
    size: "default",
    startFrame: 0,
    endFrame: 58,
  },
  {
    lines: [
      {
        key: "chipscroll.overlay2",
        gradient:
          "linear-gradient(90deg, #e8d5f0, #d4b5e8, #f0e6f5, #c9a5db, #e8d5f0)",
      },
    ],
    position: "bottom-left",
    size: "large",
    startFrame: 72,
    endFrame: 106,
  },
  {
    lines: [
      {
        key: "chipscroll.overlay3",
        gradient:
          "linear-gradient(90deg, #f0d6e0, #e8b5c8, #f5e6ed, #dba5b8, #f0d6e0)",
      },
    ],
    position: "center",
    size: "default",
    startFrame: 120,
    endFrame: 168,
  },
  {
    lines: [
      {
        key: "chipscroll.overlay4",
        gradient:
          "linear-gradient(90deg, #e0d0f0, #c8b0e0, #ede4f5, #bfa0d8, #e0d0f0)",
      },
    ],
    position: "bottom-right",
    size: "large",
    startFrame: 192,
    endFrame: 240,
  },
];

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';

// ── Position class maps ──────────────────────────────────────────
const positionClasses: Record<TextOverlay["position"], string> = {
  center: "items-center justify-center",
  "bottom-left":
    "items-start justify-end pb-[22%] pl-[5%] md:pb-[16%] md:pl-[4%]",
  "bottom-right":
    "items-end justify-end pb-[22%] pr-[5%] md:pb-[16%] md:pr-[4%]",
};

const textAlignClasses: Record<TextOverlay["position"], string> = {
  center: "text-center",
  "bottom-left": "text-left",
  "bottom-right": "text-right",
};

// ── Font sizes using cqw (container-query-width) for true responsiveness
// The container has @container, so these scale proportionally to the
// canvas width — works identically in fullbleed and windowed modes.
const sizeFontStyles: Record<TextOverlay["size"], string> = {
  default: "clamp(1.5rem, 5.5cqw, 7rem)",
  large: "clamp(1.8rem, 6.5cqw, 8.5rem)",
};

// ── Text Overlay Renderer ────────────────────────────────────────
function TextOverlayItem({
  overlay,
  currentFrame,
}: {
  overlay: TextOverlay;
  currentFrame: number;
}) {
  const { t } = useTranslation();
  const isVisible =
    currentFrame >= overlay.startFrame && currentFrame <= overlay.endFrame;

  const fadeRange = 8;
  let opacity = 0;

  if (isVisible) {
    if (currentFrame < overlay.startFrame + fadeRange) {
      opacity = (currentFrame - overlay.startFrame) / fadeRange;
    } else if (currentFrame > overlay.endFrame - fadeRange) {
      opacity = (overlay.endFrame - currentFrame) / fadeRange;
    } else {
      opacity = 1;
    }
  }

  if (opacity <= 0) return null;

  const frameProgress =
    (currentFrame - overlay.startFrame) /
    (overlay.endFrame - overlay.startFrame);
  const gradientPosition = frameProgress * 200;

  return (
    <div
      className={`absolute inset-0 flex flex-col px-[4%] pointer-events-none z-10 ${positionClasses[overlay.position]}`}
      style={{ opacity, transition: "opacity 0.15s ease-out" }}
    >
      <div className={`max-w-[90%] ${textAlignClasses[overlay.position]}`}>
        {overlay.lines.map((line, i) => (
          <h2
            key={i}
            className={`font-semibold leading-[1.2] pb-[0.1em] ${
              i > 0 ? "mt-[0.15em]" : ""
            } ${line.gradient ? "text-transparent" : "text-white/90"}`}
            style={{
              fontSize: sizeFontStyles[overlay.size],
              fontFamily: FONT_FAMILY,
              letterSpacing: "-0.03em",
              WebkitBackgroundClip: line.gradient ? "text" : undefined,
              backgroundClip: line.gradient ? "text" : undefined,
              WebkitTextFillColor: line.gradient ? "transparent" : undefined,
              filter: line.gradient
                ? "drop-shadow(0 4px 24px rgba(0,0,0,0.5))"
                : "none",
              textShadow: line.gradient
                ? undefined
                : "0 2px 40px rgba(0,0,0,0.7)",
              ...(line.gradient && {
                backgroundImage: line.gradient,
                backgroundSize: "300% 100%",
                backgroundPosition: `${gradientPosition}% 0`,
              }),
            }}
          >
            {t(line.key)}
          </h2>
        ))}
      </div>
    </div>
  );
}

// ── Brand Overlay (logo + name at the end) ───────────────────────
const BRAND_START = 240;
const BRAND_END = 287;
const BRAND_GRADIENT =
  "linear-gradient(90deg, #f0d6e0, #e8c4b8, #f5f0eb, #d4b5e8, #f0d6e0)";

function BrandOverlay({ currentFrame }: { currentFrame: number }) {
  const isVisible = currentFrame >= BRAND_START && currentFrame <= BRAND_END;

  const fadeRange = 8;
  let opacity = 0;

  if (isVisible) {
    if (currentFrame < BRAND_START + fadeRange) {
      opacity = (currentFrame - BRAND_START) / fadeRange;
    } else if (currentFrame > BRAND_END - fadeRange) {
      opacity = (BRAND_END - currentFrame) / fadeRange;
    } else {
      opacity = 1;
    }
  }

  if (opacity <= 0) return null;

  const frameProgress =
    (currentFrame - BRAND_START) / (BRAND_END - BRAND_START);
  const gradientPosition = frameProgress * 200;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
      style={{ opacity, transition: "opacity 0.15s ease-out" }}
    >
      <div className="flex items-center">
        <span
          className="font-semibold leading-[1.2] text-transparent"
          style={{
            fontSize: "clamp(1.8rem, 5cqw, 5rem)",
            fontFamily: FONT_FAMILY,
            letterSpacing: "-0.03em",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundImage: BRAND_GRADIENT,
            backgroundSize: "300% 100%",
            backgroundPosition: `${gradientPosition}% 0`,
            filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.5))",
          }}
        >
          Ivania Beauty
        </span>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export type ChipscrollMode = "fullbleed" | "windowed";

interface HeroChipscrollProps {
  mode?: ChipscrollMode;
}

export default function HeroChipscroll({
  mode = "fullbleed",
}: HeroChipscrollProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Preload all images
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `${FRAME_PATH}${String(i).padStart(4, "0")}${FRAME_EXT}`;

      img.onload = () => {
        loadedCount++;
        setLoadProgress(loadedCount / TOTAL_FRAMES);
        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = images;
          setIsLoading(false);
        }
      };

      img.onerror = () => {
        loadedCount++;
        setLoadProgress(loadedCount / TOTAL_FRAMES);
        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = images;
          setIsLoading(false);
        }
      };

      images[i] = img;
    }
  }, []);

  // Draw frame to canvas — cover mode
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const images = imagesRef.current;
    const img = images[frameIndex];

    if (!canvas || !ctx || !img || !img.complete || img.naturalWidth === 0)
      return;

    const container = canvasContainerRef.current;
    const dpr = window.devicePixelRatio || 1;
    const width = container?.clientWidth || 800;
    const height = container?.clientHeight || 600;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    // Cover-fit the image
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;

    let srcX = 0;
    let srcY = 0;
    let srcW = img.naturalWidth;
    let srcH = img.naturalHeight;

    if (imgAspect > canvasAspect) {
      srcW = img.naturalHeight * canvasAspect;
      srcX = (img.naturalWidth - srcW) / 2;
    } else {
      srcH = img.naturalWidth / canvasAspect;
      srcY = (img.naturalHeight - srcH) / 2;
    }

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height);

    // Vignette
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.35,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.7, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, []);

  // Auto-play loop
  useEffect(() => {
    if (isLoading || imagesRef.current.length === 0) return;

    let animationFrame: number;
    const frameDuration = 1000 / FPS;
    let lastFrameTime = Date.now();

    drawFrame(0);

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastFrameTime;

      if (elapsed >= frameDuration) {
        lastFrameTime = now - (elapsed % frameDuration);
        const nextFrame = (frameRef.current + 1) % TOTAL_FRAMES;
        frameRef.current = nextFrame;
        setCurrentFrame(nextFrame);
        drawFrame(nextFrame);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isLoading, drawFrame]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => drawFrame(frameRef.current);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawFrame]);

  const isWindowed = mode === "windowed";

  return (
    <section
      className={`relative isolate ${
        isWindowed
          ? "bg-white px-6 pt-28 md:pt-32 pb-6"
          : ""
      }`}
    >
      {/* Outer wrapper — constrains width + adds border in windowed mode */}
      <div
        className={
          isWindowed
            ? "mx-auto max-w-6xl overflow-hidden rounded-2xl border border-black/15 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
            : ""
        }
      >
        {/* Canvas container with @container for cqw units */}
        <div
          ref={canvasContainerRef}
          className={`relative w-full ${
            isWindowed ? "" : "border-b border-white/20"
          }`}
          style={{
            containerType: "inline-size",
            aspectRatio: "21 / 9",
            backgroundColor: BG_COLOR,
          }}
        >
          {/* Loading State */}
          {isLoading && (
            <div
              className="absolute inset-0 z-50 flex flex-col items-center justify-center"
              style={{ backgroundColor: BG_COLOR }}
            >
              <div className="relative w-[30%] max-w-64 h-1.5 bg-black/10 rounded-full overflow-hidden mb-3">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-rosa via-rosa-dark to-dorado rounded-full transition-all duration-100"
                  style={{ width: `${loadProgress * 100}%` }}
                />
              </div>
              <p className="text-gray-500 text-sm font-medium tracking-wide">
                {Math.round(loadProgress * 100)}%
              </p>
            </div>
          )}

          {/* Canvas + overlays */}
          {!isLoading && (
            <div className="absolute inset-0">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Text overlays */}
              {textOverlays.map((overlay, i) => (
                <TextOverlayItem
                  key={i}
                  overlay={overlay}
                  currentFrame={currentFrame}
                />
              ))}

              {/* Brand overlay at the end */}
              <BrandOverlay currentFrame={currentFrame} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
