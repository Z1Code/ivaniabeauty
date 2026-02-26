"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Truck,
  RefreshCw,
  ArrowRightLeft,
  Shield,
  XCircle,
  MessageCircle,
  ChevronRight,
  Mail,
  Phone,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const listItem: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
};

/* ------------------------------------------------------------------ */
/*  Reusable icon badge                                                */
/* ------------------------------------------------------------------ */
function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rosa/10 text-rosa">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable section card                                              */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Bullet list helper                                                 */
/* ------------------------------------------------------------------ */
function BulletList({ items }: { items: string[] }) {
  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="space-y-3 pl-1"
    >
      {items.map((text) => (
        <motion.li
          key={text}
          variants={listItem}
          className="flex items-start gap-3 text-gray-600"
        >
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-rosa" />
          <span>{text}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Non-eligible (X) list helper                                       */
/* ------------------------------------------------------------------ */
function XList({ items }: { items: string[] }) {
  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="space-y-3 pl-1"
    >
      {items.map((text) => (
        <motion.li
          key={text}
          variants={listItem}
          className="flex items-start gap-3 text-gray-600"
        >
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <span>{text}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

/* ================================================================== */
/*  Page component                                                     */
/* ================================================================== */
export default function ShippingReturnsPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-arena">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rosa/10 via-rosa-light/20 to-arena pb-16 pt-28 sm:pb-20 sm:pt-32">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rosa/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-rosa-light/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Link href="/" className="transition hover:text-rosa">
              {t("shipping.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-rosa">
              {t("shipping.breadcrumbShipping")}
            </span>
          </nav>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
          >
            {t("shipping.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg"
          >
            {t("shipping.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* ─── Content sections ─── */}
      <section className="mx-auto -mt-4 max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          {/* 1 ─ Shipping */}
          <SectionCard
            icon={<Truck className="h-7 w-7" />}
            title={t("shipping.shippingTitle")}
            index={0}
          >
            <BulletList
              items={[
                t("shipping.shippingFree"),
                t("shipping.shippingProcessing"),
                t("shipping.shippingDelivery"),
                t("shipping.shippingCarriers"),
              ]}
            />
          </SectionCard>

          {/* 2 ─ Returns & Exchanges */}
          <SectionCard
            icon={<RefreshCw className="h-7 w-7" />}
            title={t("shipping.returnsTitle")}
            index={1}
          >
            <BulletList
              items={[
                t("shipping.returnsWindow"),
                t("shipping.returnsCondition"),
                t("shipping.returnsTags"),
                t("shipping.returnsPackaging"),
                t("shipping.returnsContact"),
              ]}
            />
          </SectionCard>

          {/* 3 ─ Exchange Process (steps) */}
          <SectionCard
            icon={<ArrowRightLeft className="h-7 w-7" />}
            title={t("shipping.processTitle")}
            index={2}
          >
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {[1, 2, 3, 4].map((step) => (
                <motion.div
                  key={step}
                  variants={listItem}
                  className="flex items-start gap-4 rounded-xl bg-arena/80 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rosa text-sm font-bold text-white">
                    {step}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-rosa">
                      {t(`shipping.processStep${step}Label`)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {t(`shipping.processStep${step}`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </SectionCard>

          {/* 4 ─ Refund Policy  &  5 ─ Non-Eligible — side by side on md+ */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Refund Policy */}
            <SectionCard
              icon={<Shield className="h-7 w-7" />}
              title={t("shipping.refundTitle")}
              index={3}
            >
              <BulletList
                items={[
                  t("shipping.refundNoRefunds"),
                  t("shipping.refundExchangeOnly"),
                  t("shipping.refundNoOriginal"),
                  t("shipping.refundStoreCredit"),
                ]}
              />
            </SectionCard>

            {/* Non-eligible Items */}
            <SectionCard
              icon={<XCircle className="h-7 w-7" />}
              title={t("shipping.nonEligibleTitle")}
              index={4}
            >
              <XList
                items={[
                  t("shipping.nonEligibleUsed"),
                  t("shipping.nonEligibleTags"),
                  t("shipping.nonEligiblePackaging"),
                  t("shipping.nonEligibleWindow"),
                ]}
              />
            </SectionCard>
          </div>

          {/* 6 ─ Contact / Need Help */}
          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-xl bg-gradient-to-br from-rosa/5 via-white to-rosa-light/10 p-6 shadow-md shadow-rosa/5 sm:p-10"
          >
            <div className="mb-6 flex items-center gap-4">
              <IconBadge>
                <MessageCircle className="h-7 w-7" />
              </IconBadge>
              <div>
                <h2 className="font-serif text-xl font-semibold text-gray-900 sm:text-2xl">
                  {t("shipping.contactTitle")}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t("shipping.contactSubtitle")}
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {/* Email */}
              <div className="flex items-start gap-3 rounded-xl bg-white/80 p-4">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-rosa" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {t("shipping.contactEmail")}
                  </p>
                  <a
                    href={`mailto:${t("shipping.contactEmailValue")}`}
                    className="mt-1 block text-sm font-medium text-gray-700 transition hover:text-rosa"
                  >
                    {t("shipping.contactEmailValue")}
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-3 rounded-xl bg-white/80 p-4">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-rosa" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {t("shipping.contactWhatsApp")}
                  </p>
                  <a
                    href={`https://wa.me/${t("shipping.contactWhatsAppValue").replace(/[^+\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm font-medium text-gray-700 transition hover:text-rosa"
                  >
                    {t("shipping.contactWhatsAppValue")}
                  </a>
                </div>
              </div>

              {/* Response time */}
              <div className="flex items-start gap-3 rounded-xl bg-white/80 p-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-rosa" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {t("shipping.contactResponse")}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <a
                href={`mailto:${t("shipping.contactEmailValue")}`}
                className="btn-shimmer inline-block rounded-full px-8 py-3 text-sm font-semibold text-white transition"
              >
                {t("shipping.contactCta")}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
