"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Building,
  Shield,
  Lock,
  RefreshCw,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

import useCart from "@/hooks/useCart";
import { formatPrice, getColorHex } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

type ShippingMethod = "standard" | "express";
type PaymentMethod = "card" | "paypal" | "transfer";

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { items, subtotal, clearCart } = useCart();

  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const cartSubtotal = subtotal();
  const shippingCost = shippingMethod === "express" ? 12.99 : 0;
  const total = cartSubtotal + shippingCost;

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    setTimeout(() => {
      setOrderPlaced(false);
    }, 5000);
  };

  const inputClasses =
    "w-full p-3 rounded-xl border border-rosa-light/30 focus:border-rosa focus:ring-2 focus:ring-rosa/20 outline-none transition-all duration-200 text-sm";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-rosa-dark transition-colors">
          {t("checkout.breadcrumbHome")}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/shop" className="hover:text-rosa-dark transition-colors">
          {t("checkout.breadcrumbCart")}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-rosa-dark font-medium">{t("checkout.breadcrumbCheckout")}</span>
      </nav>

      {/* Title */}
      <h1 className="font-serif text-3xl font-bold mb-10">{t("checkout.pageTitle")}</h1>

      {/* Success Toast */}
      <AnimatePresence>
        {orderPlaced && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-xl rounded-2xl px-6 py-4"
          >
            <CheckCircle className="w-6 h-6 text-green-500" />
            <span className="font-semibold text-green-700">
              {t("checkout.successToast")}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LEFT - Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Contact Information */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-rosa-light/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rosa text-white text-sm font-bold">
                1
              </span>
              <h2 className="font-serif text-lg font-semibold">
                {t("checkout.contactInfoHeading")}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder={t("checkout.emailPlaceholder")}
                className={inputClasses}
              />
              <input
                type="tel"
                placeholder={t("checkout.phonePlaceholder")}
                className={inputClasses}
              />
            </div>
          </section>

          {/* Section 2: Shipping Address */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-rosa-light/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rosa text-white text-sm font-bold">
                2
              </span>
              <h2 className="font-serif text-lg font-semibold">
                {t("checkout.shippingAddressHeading")}
              </h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={t("checkout.firstNamePlaceholder")}
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder={t("checkout.lastNamePlaceholder")}
                  className={inputClasses}
                />
              </div>
              <input
                type="text"
                placeholder={t("checkout.addressLine1Placeholder")}
                className={inputClasses}
              />
              <input
                type="text"
                placeholder={t("checkout.addressLine2Placeholder")}
                className={inputClasses}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={t("checkout.cityPlaceholder")}
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder={t("checkout.statePlaceholder")}
                  className={inputClasses}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={t("checkout.zipPlaceholder")}
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder={t("checkout.countryPlaceholder")}
                  className={inputClasses}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Shipping Method */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-rosa-light/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rosa text-white text-sm font-bold">
                3
              </span>
              <h2 className="font-serif text-lg font-semibold">
                {t("checkout.shippingMethodHeading")}
              </h2>
            </div>
            <div className="space-y-3">
              {/* Standard Shipping */}
              <label
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  shippingMethod === "standard"
                    ? "border-rosa bg-rosa/5"
                    : "border-rosa-light/30 hover:border-rosa-light"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    value="standard"
                    checked={shippingMethod === "standard"}
                    onChange={() => setShippingMethod("standard")}
                    className="accent-rosa w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">
                      {t("checkout.shippingStandard")}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-sm text-green-600">
                  {t("checkout.shippingStandardPrice")}
                </span>
              </label>

              {/* Express Shipping */}
              <label
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  shippingMethod === "express"
                    ? "border-rosa bg-rosa/5"
                    : "border-rosa-light/30 hover:border-rosa-light"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    value="express"
                    checked={shippingMethod === "express"}
                    onChange={() => setShippingMethod("express")}
                    className="accent-rosa w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">
                      {t("checkout.shippingExpress")}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-sm">{t("checkout.shippingExpressPrice")}</span>
              </label>
            </div>
          </section>

          {/* Section 4: Payment Method */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-rosa-light/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rosa text-white text-sm font-bold">
                4
              </span>
              <h2 className="font-serif text-lg font-semibold">
                {t("checkout.paymentMethodHeading")}
              </h2>
            </div>
            <div className="space-y-3">
              {/* Credit Card */}
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  paymentMethod === "card"
                    ? "border-rosa bg-rosa/5"
                    : "border-rosa-light/30 hover:border-rosa-light"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  className="accent-rosa w-4 h-4"
                />
                <CreditCard className="w-5 h-5 text-rosa" />
                <span className="font-medium text-sm">
                  {t("checkout.paymentCard")}
                </span>
              </label>

              {/* PayPal */}
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  paymentMethod === "paypal"
                    ? "border-rosa bg-rosa/5"
                    : "border-rosa-light/30 hover:border-rosa-light"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="paypal"
                  checked={paymentMethod === "paypal"}
                  onChange={() => setPaymentMethod("paypal")}
                  className="accent-rosa w-4 h-4"
                />
                <span className="text-sm font-bold text-blue-600">{t("checkout.paymentPaypal")}</span>
              </label>

              {/* Bank Transfer */}
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  paymentMethod === "transfer"
                    ? "border-rosa bg-rosa/5"
                    : "border-rosa-light/30 hover:border-rosa-light"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="transfer"
                  checked={paymentMethod === "transfer"}
                  onChange={() => setPaymentMethod("transfer")}
                  className="accent-rosa w-4 h-4"
                />
                <Building className="w-5 h-5 text-rosa" />
                <span className="font-medium text-sm">
                  {t("checkout.paymentTransfer")}
                </span>
              </label>
            </div>

            {/* Credit Card Fields (visual only) */}
            <AnimatePresence>
              {paymentMethod === "card" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-4 pt-4 border-t border-rosa-light/20">
                    <input
                      type="text"
                      placeholder={t("checkout.cardNumberPlaceholder")}
                      className={inputClasses}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder={t("checkout.cardExpiryPlaceholder")}
                        className={inputClasses}
                      />
                      <input
                        type="text"
                        placeholder={t("checkout.cardCvvPlaceholder")}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* RIGHT - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-rosa-light/20">
              <h2 className="font-serif text-lg font-semibold mb-6">
                {t("checkout.orderSummaryHeading")}
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.color}-${item.size}`}
                    className="flex items-start gap-3"
                  >
                    {/* Item Image Placeholder */}
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-rosa-light/30 to-arena flex-shrink-0 overflow-hidden">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-gray-200"
                          style={{
                            backgroundColor: getColorHex(item.color),
                          }}
                        />
                        <span className="text-xs text-gray-500 capitalize">
                          {item.color}
                        </span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-500 uppercase">
                          {item.size}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-rosa-dark flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {t("checkout.emptyCartMessage")}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-rosa-light/20 pt-4 space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("checkout.subtotalLabel")}</span>
                  <span className="font-medium">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("checkout.shippingLabel")}</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">{t("checkout.shippingFree")}</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>

                {/* Total */}
                <div className="border-t border-rosa-light/20 pt-3 flex justify-between">
                  <span className="font-bold text-lg">{t("checkout.totalLabel")}</span>
                  <span className="font-bold text-lg text-rosa-dark">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 btn-shimmer text-white rounded-full text-lg font-semibold mt-6"
              >
                {t("checkout.placeOrderButton")}
              </button>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <Shield className="w-5 h-5 text-rosa" />
                  <span className="text-[10px] text-gray-500 leading-tight">
                    {t("checkout.trustSecurePayment")}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <Lock className="w-5 h-5 text-rosa" />
                  <span className="text-[10px] text-gray-500 leading-tight">
                    {t("checkout.trustSslEncryption")}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <RefreshCw className="w-5 h-5 text-rosa" />
                  <span className="text-[10px] text-gray-500 leading-tight">
                    {t("checkout.trustReturnGuarantee")}
                  </span>
                </div>
              </div>

              {/* Terms */}
              <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
                {t("checkout.termsNotice")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
