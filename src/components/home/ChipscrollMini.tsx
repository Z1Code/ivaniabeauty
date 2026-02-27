"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useInView } from "framer-motion";

interface ChipscrollMiniProps {
  /** Path prefix for frames, e.g. "/chipscroll-story/frame_" */
  framePath: string;
  totalFrames?: number;
  fps?: number;
  /** CSS aspect-ratio, e.g. "16 / 9" */
  aspectRatio?: string;
  /** Extra classes on the outer container */
  className?: string;
}

const BG_COLOR = "#f5f0eb";

export default function ChipscrollMini({
  framePath,
  totalFrames = 288,
  fps = 24,
  aspectRatio = "16 / 9",
  className = "",
}: ChipscrollMiniProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Only start preloading when in view
  const inViewRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(inViewRef, { once: true, margin: "200px" });

  // Preload images when in view
  useEffect(() => {
    if (!isInView) return;

    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.src = `${framePath}${String(i).padStart(4, "0")}.webp`;

      const onDone = () => {
        loadedCount++;
        setLoadProgress(loadedCount / totalFrames);
        if (loadedCount === totalFrames) {
          imagesRef.current = images;
          setIsLoading(false);
        }
      };

      img.onload = onDone;
      img.onerror = onDone;
      images[i] = img;
    }
  }, [isInView, framePath, totalFrames]);

  // Draw frame
  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const img = imagesRef.current[frameIndex];

      if (!canvas || !ctx || !img || !img.complete || img.naturalWidth === 0)
        return;

      const container = containerRef.current;
      const dpr = window.devicePixelRatio || 1;
      const width = container?.clientWidth || 400;
      const height = container?.clientHeight || 225;

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

      // Cover-fit
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = width / height;
      let srcX = 0,
        srcY = 0,
        srcW = img.naturalWidth,
        srcH = img.naturalHeight;

      if (imgAspect > canvasAspect) {
        srcW = img.naturalHeight * canvasAspect;
        srcX = (img.naturalWidth - srcW) / 2;
      } else {
        srcH = img.naturalWidth / canvasAspect;
        srcY = (img.naturalHeight - srcH) / 2;
      }

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height);
    },
    []
  );

  // Auto-play loop
  useEffect(() => {
    if (isLoading || imagesRef.current.length === 0) return;

    const frameDuration = 1000 / fps;
    let lastFrameTime = Date.now();

    drawFrame(0);

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastFrameTime;

      if (elapsed >= frameDuration) {
        lastFrameTime = now - (elapsed % frameDuration);
        const nextFrame = (frameRef.current + 1) % totalFrames;
        frameRef.current = nextFrame;
        drawFrame(nextFrame);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isLoading, fps, totalFrames, drawFrame]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => drawFrame(frameRef.current);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawFrame]);

  return (
    <div ref={inViewRef} className={className}>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{ aspectRatio, backgroundColor: BG_COLOR }}
      >
        {/* Loading */}
        {isLoading && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center"
            style={{ backgroundColor: BG_COLOR }}
          >
            <div className="relative w-[40%] max-w-48 h-1 bg-black/10 rounded-full overflow-hidden mb-2">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-rosa via-rosa-dark to-dorado rounded-full transition-all duration-100"
                style={{ width: `${loadProgress * 100}%` }}
              />
            </div>
            <p className="text-gray-400 text-xs font-medium">
              {Math.round(loadProgress * 100)}%
            </p>
          </div>
        )}

        {/* Canvas */}
        {!isLoading && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
        )}
      </div>
    </div>
  );
}
