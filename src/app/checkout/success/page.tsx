"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import useCart from "@/hooks/useCart";

interface OrderInfo {
  orderNumber: string;
  email: string;
  total: number;
}

function CheckoutSuccessContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setError(true);
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(
          `/api/checkout/verify?session_id=${encodeURIComponent(sessionId!)}`
        );
        if (!res.ok) throw new Error("Failed to verify");
        const data = await res.json();
        setOrderInfo({
          orderNumber: data.orderNumber,
          email: data.email,
          total: data.total,
        });
        clearCart();
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        <div className="bg-white rounded-xl p-8 sm:p-12 shadow-sm border border-rosa-light/20 text-center">
          <Loader2 className="w-12 h-12 text-rosa animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  if (error || !orderInfo) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        <div className="bg-white rounded-xl p-8 sm:p-12 shadow-sm border border-rosa-light/20 text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h1 className="font-serif text-2xl font-bold mb-3">
            No pudimos verificar tu pago
          </h1>
          <p className="text-gray-600 mb-8">
            Si realizaste el pago, no te preocupes. Tu orden será procesada
            automáticamente. Revisa tu correo electrónico.
          </p>
          <Link
            href="/shop"
            className="inline-block py-3 px-8 btn-shimmer text-white rounded-full text-base font-semibold"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl p-8 sm:p-12 shadow-sm border border-rosa-light/20 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        </motion.div>

        <h1 className="font-serif text-3xl font-bold mb-3">
          {t("checkout.successHeading")}
        </h1>

        <div className="inline-block bg-rosa/10 rounded-xl px-6 py-3 mb-6">
          <p className="text-sm text-gray-600">
            {t("checkout.successOrderNumber")}
          </p>
          <p className="text-xl font-bold text-rosa-dark tracking-wider">
            {orderInfo.orderNumber}
          </p>
        </div>

        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {t("checkout.successMessage")}{" "}
          <span className="font-medium text-rosa-dark">{orderInfo.email}</span>
        </p>

        <Link
          href="/shop"
          className="inline-block py-3 px-8 btn-shimmer text-white rounded-full text-base font-semibold"
        >
          {t("checkout.successContinueShopping")}
        </Link>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
          <div className="bg-white rounded-xl p-8 sm:p-12 shadow-sm border border-rosa-light/20 text-center">
            <Loader2 className="w-12 h-12 text-rosa animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
