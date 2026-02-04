"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sun, Coffee, Sparkles, Heart } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface CollectionItem {
  name: string;
  icon: React.ElementType;
  gradient: string;
  slug: string;
}

const collections: CollectionItem[] = [
  {
    name: "Playa & Piscina",
    icon: Sun,
    gradient: "from-turquesa/40 to-rosa-light/40",
    slug: "playa",
  },
  {
    name: "Dia a Dia",
    icon: Coffee,
    gradient: "from-rosa-light/40 to-arena",
    slug: "diario",
  },
  {
    name: "Eventos Especiales",
    icon: Sparkles,
    gradient: "from-dorado/30 to-rosa/30",
    slug: "eventos",
  },
  {
    name: "Post-Parto",
    icon: Heart,
    gradient: "from-rosa-light/40 to-coral/30",
    slug: "postparto",
  },
];

function CollectionCard({ collection, index }: { collection: CollectionItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotX = -(mouseY / (rect.height / 2)) * 12;
    const rotY = (mouseX / (rect.width / 2)) * 12;

    setRotateX(rotX);
    setRotateY(rotY);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setIsHovering(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const Icon = collection.icon;

  return (
    <ScrollReveal direction="up" delay={index * 0.15}>
      <Link href={`/shop?category=${collection.slug}`}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          className="relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group"
          style={{
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: isHovering ? "none" : "transform 0.5s ease-out",
          }}
        >
          {/* Gradient background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${collection.gradient}`}
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Centered icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-16 h-16 text-white/80 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Bottom text */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="font-serif text-xl text-white font-bold">
              {collection.name}
            </h3>
            <span className="text-sm text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 inline-block mt-1">
              Ver Coleccion &rarr;
            </span>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}

export default function Collections() {
  return (
    <section id="colecciones" className="py-24 bg-perla">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <ScrollReveal direction="up">
            <h2 className="font-serif text-4xl text-center">
              Nuestras Colecciones
            </h2>
            {/* Decorative line */}
            <div className="mx-auto mt-4 w-24 h-1 bg-gradient-to-r from-rosa-light via-rosa to-rosa-dark rounded-full" />
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1}>
            <p className="font-script text-2xl text-rosa-dark mt-4">
              Encuentra la faja perfecta para cada momento
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
        {collections.map((collection, index) => (
          <CollectionCard
            key={collection.slug}
            collection={collection}
            index={index}
          />
        ))}
        </div>
      </div>
    </section>
  );
}
