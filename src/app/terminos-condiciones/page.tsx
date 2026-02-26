"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  FileText,
  Globe,
  ShoppingBag,
  Truck,
  Scale,
  Shield,
  Gavel,
  Mail,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rosa/10 text-rosa">
      {children}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="rounded-xl bg-white p-6 shadow-md shadow-rosa/5 sm:p-8"
    >
      <div className="mb-5 flex items-center gap-4">
        <IconBadge>{icon}</IconBadge>
        <h2 className="font-serif text-xl font-semibold text-gray-900 sm:text-2xl">
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}

export default function TermsConditionsPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-arena">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rosa/10 via-rosa-light/20 to-arena pb-16 pt-28 sm:pb-20 sm:pt-32">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rosa/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-rosa-light/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <nav className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Link href="/" className="transition hover:text-rosa">
              {t("shipping.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-rosa">
              {t("terms.title")}
            </span>
          </nav>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
          >
            {t("terms.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg"
          >
            {t("terms.intro")}
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto -mt-4 max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          <SectionCard
            icon={<FileText className="h-7 w-7" />}
            title={t("terms.acceptance")}
            index={0}
          >
            <p className="text-gray-600 leading-relaxed">
              {t("terms.acceptanceDesc")}
            </p>
          </SectionCard>

          <SectionCard
            icon={<Globe className="h-7 w-7" />}
            title={t("terms.useOfWebsite")}
            index={1}
          >
            <p className="text-gray-600 leading-relaxed">
              {t("terms.useOfWebsiteDesc")}
            </p>
          </SectionCard>

          <SectionCard
            icon={<ShoppingBag className="h-7 w-7" />}
            title={t("terms.purchases")}
            index={2}
          >
            <p className="text-gray-600 leading-relaxed">
              {t("terms.purchasesDesc")}
            </p>
          </SectionCard>

          <SectionCard
            icon={<Truck className="h-7 w-7" />}
            title={t("terms.shippingReturns")}
            index={3}
          >
            <p className="text-gray-600 leading-relaxed">
              {t("terms.shippingReturnsDesc")}{" "}
              <Link
                href="/envios-devoluciones"
                className="font-medium text-rosa underline underline-offset-2 transition hover:text-rosa-dark"
              >
                {t("footer.infoShippingReturns")}
              </Link>
            </p>
          </SectionCard>

          <SectionCard
            icon={<Scale className="h-7 w-7" />}
            title={t("terms.intellectualProperty")}
            index={4}
          >
            <p className="text-gray-600 leading-relaxed">
              {t("terms.intellectualPropertyDesc")}
            </p>
          </SectionCard>

          <SectionCard
            icon={<Shield className="h-7 w-7" />}
            title={t("terms.liability")}
            index={5}
          >
            <p className="text-gray-600 leading-relaxed">
              {t("terms.liabilityDesc")}
            </p>
          </SectionCard>

          <SectionCard
            icon={<Gavel className="h-7 w-7" />}
            title={t("terms.governingLaw")}
            index={6}
          >
            <p className="text-gray-600 leading-relaxed">
              {t("terms.governingLawDesc")}
            </p>
          </SectionCard>

          <SectionCard
            icon={<Mail className="h-7 w-7" />}
            title={t("terms.contact")}
            index={7}
          >
            <p className="text-gray-600 leading-relaxed">
              {t("terms.contactDesc")}
            </p>
          </SectionCard>

          <motion.p
            custom={8}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center text-sm text-gray-400"
          >
            {t("terms.lastUpdated")}
          </motion.p>
        </div>
      </section>
    </main>
  );
}
