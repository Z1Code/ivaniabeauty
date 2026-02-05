"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";

import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import useCart from "@/hooks/useCart";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/shared/LanguageToggle";

// Pages with dark/colored hero banners where header text should be white
const DARK_HERO_PAGES = ["/shop"];

export default function Header() {
  const [scrolled, setScrolled] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > 50 : false
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openCart, totalItems } = useCart();
  const cartCount = totalItems();
  const { t } = useTranslation();
  const pathname = usePathname();

  // Show white text when on a page with a dark hero and not scrolled
  const heroWhite = DARK_HERO_PAGES.includes(pathname) && !scrolled;

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass-rosa shadow-lg shadow-rosa/10"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/logo.png"
                alt={SITE_NAME}
                width={36}
                height={36}
                className={`w-8 h-8 md:w-9 md:h-9 object-contain transition-all duration-500 ${
                  heroWhite ? "brightness-0 invert" : ""
                }`}
                priority
              />
              <span className={`font-serif text-xl md:text-2xl font-semibold tracking-wide transition-colors duration-500 ${
                heroWhite ? "text-white" : "text-rosa"
              }`}>
                {SITE_NAME}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <ul className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`relative text-sm font-medium transition-colors duration-500 group ${
                      heroWhite
                        ? "text-white/90 hover:text-white"
                        : "text-foreground/80 hover:text-rosa-dark"
                    }`}
                  >
                    {t(link.labelKey)}
                    <span className={`absolute -bottom-1 left-0 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-full ${
                      heroWhite ? "bg-white" : "bg-rosa"
                    }`} />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Right Icons */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Language Toggle */}
              <LanguageToggle />

              {/* Search */}
              <button
                aria-label={t("header.search")}
                className={`relative p-2 rounded-full transition-colors duration-500 ${
                  heroWhite
                    ? "text-white/80 hover:text-white hover:bg-white/20"
                    : "text-foreground/70 hover:text-rosa-dark hover:bg-rosa-light/40"
                }`}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                aria-label={t("header.wishlist")}
                className={`relative p-2 rounded-full transition-colors duration-500 ${
                  heroWhite
                    ? "text-white/80 hover:text-white hover:bg-white/20"
                    : "text-foreground/70 hover:text-rosa-dark hover:bg-rosa-light/40"
                }`}
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                aria-label={t("header.cart")}
                className={`relative p-2 rounded-full transition-colors duration-500 ${
                  heroWhite
                    ? "text-white/80 hover:text-white hover:bg-white/20"
                    : "text-foreground/70 hover:text-rosa-dark hover:bg-rosa-light/40"
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-rosa-dark rounded-full shadow-md"
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label={t("header.openMenu")}
                className={`lg:hidden p-2 rounded-full transition-colors duration-500 ${
                  heroWhite
                    ? "text-white/80 hover:text-white hover:bg-white/20"
                    : "text-foreground/70 hover:text-rosa-dark hover:bg-rosa-light/40"
                }`}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm bg-perla shadow-2xl flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 h-16 border-b border-rosa-light/50">
                <span className="font-serif text-xl font-semibold text-rosa tracking-wide">
                  {SITE_NAME}
                </span>
                <div className="flex items-center gap-2">
                  <LanguageToggle />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label={t("header.closeMenu")}
                    className="p-2 rounded-full text-foreground/70 hover:text-rosa-dark hover:bg-rosa-light/40 transition-colors duration-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Drawer Links */}
              <nav className="flex-1 overflow-y-auto px-6 py-8">
                <ul className="flex flex-col gap-2">
                  {NAV_LINKS.map((link, index) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.07 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium text-foreground/80 hover:bg-rosa-light/30 hover:text-rosa-dark transition-colors duration-300"
                      >
                        {t(link.labelKey)}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Drawer Footer */}
              <div className="px-6 py-6 border-t border-rosa-light/50">
                <p className="text-foreground/50 font-script text-center text-lg">
                  {t("site.tagline")}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
