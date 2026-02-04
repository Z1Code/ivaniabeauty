"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Instagram, Facebook, Twitter, Mail, Phone } from "lucide-react";

import { SITE_NAME } from "@/lib/constants";

const shopLinks = [
  { label: "Todas las fajas", href: "/shop" },
  { label: "Playa & Piscina", href: "/shop?category=playa-piscina" },
  { label: "Dia a Dia", href: "/shop?category=dia-a-dia" },
  { label: "Eventos", href: "/shop?category=eventos" },
  { label: "Post-Parto", href: "/shop?category=post-parto" },
];

const infoLinks = [
  { label: "Sobre Nosotros", href: "/#nosotros" },
  { label: "Guia de Tallas", href: "/guia-tallas" },
  { label: "Envios y Devoluciones", href: "/envios-devoluciones" },
  { label: "Politica de Privacidad", href: "/privacidad" },
  { label: "Terminos y Condiciones", href: "/terminos" },
];

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative">
      {/* Wave SVG Divider */}
      <div className="wave-divider">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-[60px] md:h-[80px] lg:h-[120px]"
        >
          <path
            d="M0 60L48 54C96 48 192 36 288 30C384 24 480 24 576 33C672 42 768 60 864 66C960 72 1056 66 1152 54C1248 42 1344 24 1392 15L1440 6V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z"
            fill="#E91E63"
          />
        </svg>
      </div>

      {/* Main Footer */}
      <div className="bg-rosa-dark">
        <motion.div
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {/* Brand Column */}
            <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-block">
                <h3 className="font-sans text-2xl font-bold text-white tracking-tight uppercase mb-2">
                  {SITE_NAME}
                </h3>
              </Link>
              <p className="font-script text-xl text-rosa-light mb-4">
                Realza tu belleza natural
              </p>
              <p className="text-white/80 text-sm leading-relaxed max-w-xs">
                Fajas premium que moldean tu silueta con comodidad y estilo.
                Disenos exclusivos confeccionados con materiales de la mas
                alta calidad para realzar tu confianza.
              </p>
            </motion.div>

            {/* Shop Links Column */}
            <motion.div variants={itemVariants}>
              <h4 className="font-serif text-lg font-semibold text-white mb-4">
                Tienda
              </h4>
              <ul className="flex flex-col gap-2.5">
                {shopLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/75 hover:text-white hover:translate-x-1 transition-all duration-300 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Info Links Column */}
            <motion.div variants={itemVariants}>
              <h4 className="font-serif text-lg font-semibold text-white mb-4">
                Informacion
              </h4>
              <ul className="flex flex-col gap-2.5">
                {infoLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/75 hover:text-white hover:translate-x-1 transition-all duration-300 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Column */}
            <motion.div variants={itemVariants}>
              <h4 className="font-serif text-lg font-semibold text-white mb-4">
                Contacto
              </h4>
              <ul className="flex flex-col gap-3 mb-6">
                <li>
                  <a
                    href="mailto:hola@ivaniabeauty.com"
                    className="flex items-center gap-2 text-sm text-white/75 hover:text-white transition-colors duration-300"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    hola@ivaniabeauty.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+1234567890"
                    className="flex items-center gap-2 text-sm text-white/75 hover:text-white transition-colors duration-300"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    +1 (234) 567-890
                  </a>
                </li>
              </ul>

              {/* Social Icons */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/25 hover:scale-110 transition-all duration-300"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="border-t border-white/15">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/60">
              &copy; {currentYear} {SITE_NAME}. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/50 font-medium tracking-wide px-3 py-1 rounded-full border border-white/15">
                Visa
              </span>
              <span className="text-xs text-white/50 font-medium tracking-wide px-3 py-1 rounded-full border border-white/15">
                Mastercard
              </span>
              <span className="text-xs text-white/50 font-medium tracking-wide px-3 py-1 rounded-full border border-white/15">
                PayPal
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
