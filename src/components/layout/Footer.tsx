"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import {
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
  Linkedin,
  Youtube,
  MessageCircle,
  Link2,
} from "lucide-react";

import { SITE_NAME } from "@/lib/constants";
import { useTranslation } from "@/hooks/useTranslation";
import {
  DEFAULT_FOOTER_SETTINGS,
  FOOTER_SETTINGS_STORAGE_KEY,
  FOOTER_SETTINGS_UPDATED_EVENT,
  parseFooterSettings,
  sanitizeFooterSettings,
  toWhatsappUrl,
  type FooterSettings,
  type FooterSocialPlatform,
} from "@/lib/footer-config";

interface SiteSectionsApiResponse {
  footerSettings?: FooterSettings;
  persisted?: boolean;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.07a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.5z" />
    </svg>
  );
}

const SOCIAL_ICON_BY_PLATFORM: Record<
  FooterSocialPlatform,
  ComponentType<{ className?: string }>
> = {
  instagram: Instagram,
  tiktok: TikTokIcon,
  facebook: Facebook,
  x: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  custom: Link2,
};

function isSameSettings(a: FooterSettings, b: FooterSettings): boolean {
  if (
    a.contactEmail !== b.contactEmail ||
    a.whatsappNumber !== b.whatsappNumber ||
    a.whatsappMessage !== b.whatsappMessage ||
    a.socialLinks.length !== b.socialLinks.length
  ) {
    return false;
  }

  return a.socialLinks.every((link, index) => {
    const target = b.socialLinks[index];
    return (
      target &&
      link.id === target.id &&
      link.platform === target.platform &&
      link.label === target.label &&
      link.href === target.href
    );
  });
}

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
  const { t } = useTranslation();
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(
    DEFAULT_FOOTER_SETTINGS
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFooterSettings = () => {
      const parsed = parseFooterSettings(
        window.localStorage.getItem(FOOTER_SETTINGS_STORAGE_KEY)
      );
      setFooterSettings((prev) => (isSameSettings(prev, parsed) ? prev : parsed));
    };

    const syncFooterSettingsFromServer = async () => {
      try {
        const response = await fetch("/api/settings/site-sections", {
          method: "GET",
          cache: "no-store",
        });
        const data =
          (await response.json().catch(() => ({}))) as SiteSectionsApiResponse;
        if (!response.ok || !data.persisted) return;
        const persistedFooter = sanitizeFooterSettings(data.footerSettings);
        setFooterSettings((prev) =>
          isSameSettings(prev, persistedFooter) ? prev : persistedFooter
        );
        window.localStorage.setItem(
          FOOTER_SETTINGS_STORAGE_KEY,
          JSON.stringify(persistedFooter)
        );
      } catch {
        // Local storage fallback already applied.
      }
    };

    syncFooterSettings();
    void syncFooterSettingsFromServer();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FOOTER_SETTINGS_STORAGE_KEY) {
        syncFooterSettings();
      }
    };
    const handleFooterUpdated = () => syncFooterSettings();

    window.addEventListener("storage", handleStorage);
    window.addEventListener(FOOTER_SETTINGS_UPDATED_EVENT, handleFooterUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(FOOTER_SETTINGS_UPDATED_EVENT, handleFooterUpdated);
    };
  }, []);

  const infoLinks = [
    { key: "aboutUs", label: t("footer.infoAboutUs"), href: "/#nosotros" },
    { key: "shipping", label: t("footer.infoShippingReturns"), href: "/envios-devoluciones" },
    { key: "privacy", label: t("footer.infoPrivacyPolicy"), href: "/politica-privacidad" },
    { key: "terms", label: t("footer.infoTerms"), href: "/terminos-condiciones" },
  ];

  const whatsappHref = toWhatsappUrl(
    footerSettings.whatsappNumber,
    footerSettings.whatsappMessage
  );

  return (
    <footer className="relative">
      {/* Wave SVG Divider */}
      <div className="wave-divider">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-[60px] md:h-[80px] lg:h-[120px] text-rosa-dark"
        >
          <path
            d="M0 60L48 54C96 48 192 36 288 30C384 24 480 24 576 33C672 42 768 60 864 66C960 72 1056 66 1152 54C1248 42 1344 24 1392 15L1440 6V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z"
            fill="currentColor"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-8">
            {/* Brand Column */}
            <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-block">
                <h3 className="font-serif text-2xl font-bold text-white tracking-wide mb-2">
                  {SITE_NAME}
                </h3>
              </Link>
              <p className="font-script text-xl text-rosa-light mb-4">
                {t("footer.tagline")}
              </p>
              <p className="text-white/80 text-sm leading-relaxed max-w-xs">
                {t("footer.brandDescription")}
              </p>
            </motion.div>

            {/* Info Links Column */}
            <motion.div variants={itemVariants}>
              <h4 className="font-serif text-lg font-semibold text-white mb-4">
                {t("footer.infoHeading")}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {infoLinks.map((link) => (
                  <li key={link.key}>
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
                {t("footer.contactHeading")}
              </h4>
              <ul className="flex flex-col gap-3 mb-6">
                <li>
                  <a
                    href={`mailto:${footerSettings.contactEmail}`}
                    className="flex items-center gap-2 text-sm text-white/75 hover:text-white transition-colors duration-300"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    {footerSettings.contactEmail}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${footerSettings.whatsappNumber.replace(/[^+\d]/g, "")}`}
                    className="flex items-center gap-2 text-sm text-white/75 hover:text-white transition-colors duration-300"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    {footerSettings.whatsappNumber}
                  </a>
                </li>
              </ul>

              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white text-rosa-dark px-4 py-2 text-sm font-semibold hover:bg-rosa-light transition-colors duration-300 mb-6"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t("footer.whatsappButton")}
                </a>
              )}

              {/* Social Icons */}
              <div className="flex items-center gap-3">
                {footerSettings.socialLinks.map((social) => {
                  const Icon = SOCIAL_ICON_BY_PLATFORM[social.platform];
                  return (
                    <a
                      key={social.id}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/25 hover:scale-110 transition-all duration-300"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="border-t border-white/15">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/60">
              &copy; {currentYear} {SITE_NAME}. {t("footer.copyright")}
            </p>
            <div className="flex items-center gap-3">
              {/* Visa */}
              <svg className="h-8 w-auto opacity-60" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M293.2 348.73l33.36-195.76h53.34l-33.38 195.76H293.2zm246.11-191.54c-10.57-3.98-27.17-8.22-47.89-8.22-52.73 0-89.9 26.6-90.18 64.67-.28 28.17 26.51 43.89 46.75 53.27 20.76 9.58 27.73 15.71 27.64 24.27-.14 13.11-16.58 19.1-31.91 19.1-21.35 0-32.68-2.96-50.18-10.27l-6.88-3.11-7.49 43.96c12.46 5.48 35.52 10.23 59.47 10.47 56.07 0 92.5-26.29 92.92-66.92.21-22.3-14.01-39.28-44.79-53.27-18.64-9.08-30.07-15.13-29.95-24.32 0-8.15 9.66-16.87 30.53-16.87 17.43-.28 30.06 3.53 39.91 7.49l4.78 2.26 7.27-42.49zm138.78-4.22h-41.23c-12.77 0-22.33 3.49-27.94 16.26l-79.27 179.49h56.05s9.16-24.14 11.23-29.44l68.33.08c1.6 7.26 6.49 29.36 6.49 29.36h49.53l-43.19-195.75zm-65.15 126.41c4.41-11.28 21.26-54.71 21.26-54.71-.31.52 4.38-11.33 7.07-18.69l3.6 16.89s10.22 46.77 12.36 56.51h-44.29zM327.57 152.97L275.2 285.56l-5.58-27.12c-9.7-31.27-39.93-65.16-73.74-82.12l47.82 171.28 56.42-.06 83.93-195.57h-56.48z" fill="rgba(255,255,255,0.8)"/>
                <path d="M221.02 152.97h-85.95l-.68 4c66.94 16.21 111.24 55.37 129.6 102.39l-18.71-90.05c-3.22-12.35-12.58-16-24.26-16.34z" fill="rgba(255,255,255,0.5)"/>
              </svg>
              {/* Mastercard */}
              <svg className="h-8 w-auto opacity-60" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="312" cy="250" r="150" fill="rgba(255,255,255,0.4)"/>
                <circle cx="468" cy="250" r="150" fill="rgba(255,255,255,0.3)"/>
                <path d="M390 130.7c-30.93 24.36-50.81 62.15-50.81 104.3s19.88 79.94 50.81 104.3c30.93-24.36 50.81-62.15 50.81-104.3s-19.88-79.94-50.81-104.3z" fill="rgba(255,255,255,0.55)"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
