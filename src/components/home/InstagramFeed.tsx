"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Heart, Send } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

const gridGradients = [
  "from-rosa to-rosa-light",
  "from-turquesa/60 to-rosa/40",
  "from-arena to-coral/50",
  "from-rosa-dark/70 to-rosa-light",
  "from-coral/60 to-arena",
  "from-turquesa/40 to-rosa/60",
];

const gridLikes = ["1.2k", "856", "2.1k", "1.5k", "943", "1.8k"];

export default function InstagramFeed() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="py-24 bg-perla">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal direction="up">
          <h2 className="font-serif text-4xl text-center text-gray-800">
            Siguenos en Instagram
          </h2>
          <p className="font-script text-2xl text-rosa text-center mt-3">
            #IvaniaBeauty
          </p>
        </ScrollReveal>

        {/* Instagram Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-12">
          {gridGradients.map((gradient, i) => (
            <ScrollReveal
              key={i}
              direction="up"
              delay={i * 0.08}
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
                className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer"
              >
                {/* Gradient Placeholder Background */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br",
                    gradient
                  )}
                />

                {/* Decorative content inside the "image" */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <Camera className="w-10 h-10 text-white" />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-rosa-dark/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="w-6 h-6 text-white mb-2" />
                  <div className="flex items-center gap-1.5 text-white">
                    <Heart className="w-4 h-4 fill-white" />
                    <span className="text-sm font-semibold">
                      {gridLikes[i]}
                    </span>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* Newsletter Section */}
        <div id="contacto" className="mt-16">
          <ScrollReveal direction="up" delay={0.2}>
            <h3 className="font-serif text-3xl text-center text-gray-800">
              Unete al Club Ivania Beauty
            </h3>
            <p className="text-gray-600 text-center mt-3">
              Recibe ofertas exclusivas y tips de moda
            </p>

            <form
              onSubmit={handleSubscribe}
              className="flex max-w-md mx-auto mt-6"
            >
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-6 py-3 rounded-l-full border border-rosa-light focus:border-rosa focus:outline-none bg-white transition-colors"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-rosa text-white px-8 py-3 rounded-r-full hover:bg-rosa-dark transition-colors font-semibold flex items-center gap-2 cursor-pointer"
              >
                Suscribirse
                <Send className="w-4 h-4" />
              </motion.button>
            </form>

            {subscribed && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-rosa-dark font-semibold mt-4 text-sm"
              >
                Gracias por suscribirte!
              </motion.p>
            )}

            <p className="text-xs text-gray-400 text-center mt-4">
              Al suscribirte aceptas nuestra politica de privacidad
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
