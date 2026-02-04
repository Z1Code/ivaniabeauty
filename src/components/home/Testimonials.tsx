"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

interface Testimonial {
  name: string;
  rating: number;
  text: string;
  product: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Maria Garcia",
    rating: 5,
    text: "Increible! La faja es super comoda y no se nota bajo la ropa. La use en mi boda y me sentia espectacular.",
    product: "Faja Gala Sculpt",
  },
  {
    name: "Laura Martinez",
    rating: 5,
    text: "Perfecta para la playa. Se seca super rapido y moldea sin incomodar. No puedo salir de vacaciones sin ella.",
    product: "Faja Bikini Invisible",
  },
  {
    name: "Carolina Ruiz",
    rating: 4,
    text: "Despues del parto necesitaba soporte y esta faja fue mi salvacion. Muy comoda para usar todo el dia.",
    product: "Faja Recovery Mama",
  },
  {
    name: "Ana Sofia Lopez",
    rating: 5,
    text: "El waist trainer es increible. Resultados visibles desde la primera semana. 100% recomendado!",
    product: "Waist Trainer Deluxe",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [slideDirection, setSlideDirection] = useState(1);

  const goNext = useCallback(() => {
    setSlideDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  const goPrev = useCallback(() => {
    setSlideDirection(-1);
    setCurrent(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  }, []);

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      goNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered, goNext]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 400 : -400,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -400 : 400,
      opacity: 0,
    }),
  };

  const testimonial = testimonials[current];

  return (
    <section className="py-24 bg-rosa-light/20">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal direction="up">
          <h2 className="font-serif text-4xl text-center text-gray-800">
            Lo Que Dicen Nuestras Clientas
          </h2>
          <p className="font-script text-2xl text-rosa text-center mt-4">
            Historias reales de mujeres reales
          </p>
        </ScrollReveal>

        <div
          className="mt-12 relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Left Arrow */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-rosa-dark hover:bg-rosa-light/30 transition-colors cursor-pointer"
            aria-label="Anterior testimonio"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          {/* Right Arrow */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-rosa-dark hover:bg-rosa-light/30 transition-colors cursor-pointer"
            aria-label="Siguiente testimonio"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {/* Testimonial Card */}
          <div className="overflow-hidden min-h-[300px] flex items-center justify-center">
            <AnimatePresence custom={slideDirection} mode="wait">
              <motion.div
                key={current}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="glass-rosa p-8 text-center w-full"
              >
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rosa to-rosa-dark mx-auto flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">
                    {getInitials(testimonial.name)}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex items-center justify-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-5 h-5",
                        i < testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-transparent text-gray-300"
                      )}
                    />
                  ))}
                </div>

                {/* Quote */}
                <div className="relative max-w-lg mx-auto mb-6">
                  <Quote className="w-6 h-6 text-rosa-light/60 absolute -top-2 -left-2" />
                  <p className="italic text-gray-700 text-lg leading-relaxed px-6">
                    {testimonial.text}
                  </p>
                </div>

                {/* Name & Product */}
                <p className="font-semibold text-gray-800">
                  {testimonial.name}
                </p>
                <p className="text-rosa text-sm mt-1">{testimonial.product}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setSlideDirection(i > current ? 1 : -1);
                  setCurrent(i);
                }}
                className={cn(
                  "rounded-full transition-all duration-300 cursor-pointer",
                  i === current
                    ? "w-8 h-3 bg-rosa"
                    : "w-3 h-3 bg-rosa-light/50 hover:bg-rosa-light"
                )}
                aria-label={`Ir al testimonio ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
