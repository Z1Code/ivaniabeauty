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
  Loader2,
  Tag,
  X,
  AlertCircle,
} from "lucide-react";

import useCart from "@/hooks/useCart";
import { formatPrice, getColorHex } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

type ShippingMethod = "standard" | "express";
type PaymentMethod = "card" | "paypal" | "transfer";

interface CouponData {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  description: string;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
}

interface OrderSuccess {
  orderNumber: string;
  email: string;
}

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { items, subtotal, clearCart } = useCart();

  // ── Form field state ──
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");

  // ── Shipping / Payment ──
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  // ── Coupon state ──
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // ── Order state ──
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const cartSubtotal = subtotal();
  const shippingCost = shippingMethod === "express" ? 12.99 : 0;
  const discountAmount = couponData?.discountAmount ?? 0;
  const total = Math.max(0, cartSubtotal + shippingCost - discountAmount);

  // ── Validate form ──
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!email.trim()) {
      errors.email = t("checkout.fieldRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = t("checkout.invalidEmail");
    }
    if (!firstName.trim()) errors.firstName = t("checkout.fieldRequired");
    if (!lastName.trim()) errors.lastName = t("checkout.fieldRequired");
    if (!addressLine1.trim()) errors.addressLine1 = t("checkout.fieldRequired");
    if (!city.trim()) errors.city = t("checkout.fieldRequired");
    if (!country.trim()) errors.country = t("checkout.fieldRequired");

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Apply coupon ──
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError("");
    setCouponData(null);

    try {
      const res = await fetch(
        `/api/coupons/validate?code=${encodeURIComponent(couponCode.trim())}&subtotal=${cartSubtotal}`
      );
      const data = await res.json();

      if (data.valid) {
        setCouponData({
          code: data.coupon.code,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          discountAmount: data.coupon.discountAmount,
          description: data.coupon.description,
        });
        setCouponError("");
      } else {
        setCouponError(data.message || t("checkout.couponInvalid"));
      }
    } catch {
      setCouponError(t("checkout.couponInvalid"));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCouponCode("");
    setCouponError("");
  };

  // ── Place order ──
  const handlePlaceOrder = async () => {
    setOrderError("");

    if (!validateForm()) return;
    if (items.length === 0) return;

    setIsPlacing(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            email: email.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            state: state.trim(),
            zipCode: zip.trim(),
            country: country.trim(),
          },
          items: items.map((item) => ({
            productId: item.id,
            productName: item.name,
            productImage: item.image,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          shippingMethod,
          paymentMethod,
          couponCode: couponData ? couponData.code : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("checkout.orderErrorGeneric"));
      }

      clearCart();
      setOrderSuccess({
        orderNumber: data.orderNumber,
        email: email.trim(),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("checkout.orderErrorGeneric");
      setOrderError(message);
    } finally {
      setIsPlacing(false);
    }
  };

  const inputClasses =
    "w-full p-3 rounded-xl border border-rosa-light/30 focus:border-rosa focus:ring-2 focus:ring-rosa/20 outline-none transition-all duration-200 text-sm";

  const inputErrorClasses =
    "w-full p-3 rounded-xl border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all duration-200 text-sm";

  // ── Order success view ──
  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-rosa-light/20 text-center"
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
              {orderSuccess.orderNumber}
            </p>
          </div>

          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {t("checkout.successMessage")}{" "}
            <span className="font-medium text-rosa-dark">
              {orderSuccess.email}
            </span>
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

      {/* Order-level error */}
      <AnimatePresence>
        {orderError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex items-center gap-3 bg-white border border-red-200 shadow-lg rounded-2xl px-6 py-4"
          >
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <span className="font-medium text-red-700 text-sm">
              {orderError}
            </span>
            <button
              onClick={() => setOrderError("")}
              className="ml-auto text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
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
              <div>
                <input
                  type="email"
                  placeholder={t("checkout.emailPlaceholder")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) setFormErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className={formErrors.email ? inputErrorClasses : inputClasses}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>
              <input
                type="tel"
                placeholder={t("checkout.phonePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                <div>
                  <input
                    type="text"
                    placeholder={t("checkout.firstNamePlaceholder")}
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (formErrors.firstName) setFormErrors((p) => ({ ...p, firstName: undefined }));
                    }}
                    className={formErrors.firstName ? inputErrorClasses : inputClasses}
                  />
                  {formErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={t("checkout.lastNamePlaceholder")}
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (formErrors.lastName) setFormErrors((p) => ({ ...p, lastName: undefined }));
                    }}
                    className={formErrors.lastName ? inputErrorClasses : inputClasses}
                  />
                  {formErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <input
                  type="text"
                  placeholder={t("checkout.addressLine1Placeholder")}
                  value={addressLine1}
                  onChange={(e) => {
                    setAddressLine1(e.target.value);
                    if (formErrors.addressLine1) setFormErrors((p) => ({ ...p, addressLine1: undefined }));
                  }}
                  className={formErrors.addressLine1 ? inputErrorClasses : inputClasses}
                />
                {formErrors.addressLine1 && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.addressLine1}</p>
                )}
              </div>
              <input
                type="text"
                placeholder={t("checkout.addressLine2Placeholder")}
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className={inputClasses}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder={t("checkout.cityPlaceholder")}
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (formErrors.city) setFormErrors((p) => ({ ...p, city: undefined }));
                    }}
                    className={formErrors.city ? inputErrorClasses : inputClasses}
                  />
                  {formErrors.city && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={t("checkout.statePlaceholder")}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={t("checkout.zipPlaceholder")}
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className={inputClasses}
                />
                <div>
                  <input
                    type="text"
                    placeholder={t("checkout.countryPlaceholder")}
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      if (formErrors.country) setFormErrors((p) => ({ ...p, country: undefined }));
                    }}
                    className={formErrors.country ? inputErrorClasses : inputClasses}
                  />
                  {formErrors.country && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.country}</p>
                  )}
                </div>
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

              {/* Coupon Code Input */}
              <div className="border-t border-rosa-light/20 pt-4 mb-4">
                {couponData ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {couponData.code}
                      </span>
                      <span className="text-xs text-green-600">
                        (-{formatPrice(couponData.discountAmount)})
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-green-600 hover:text-green-800 transition-colors text-xs font-medium"
                    >
                      {t("checkout.couponRemove")}
                    </button>
                  </motion.div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t("checkout.couponPlaceholder")}
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          if (couponError) setCouponError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleApplyCoupon();
                        }}
                        className="flex-1 p-3 rounded-xl border border-rosa-light/30 focus:border-rosa focus:ring-2 focus:ring-rosa/20 outline-none transition-all duration-200 text-sm uppercase"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-3 bg-rosa text-white rounded-xl text-sm font-medium hover:bg-rosa-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {couponLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">
                              {t("checkout.couponApplying")}
                            </span>
                          </>
                        ) : (
                          t("checkout.couponApply")
                        )}
                      </button>
                    </div>
                    {couponError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-500 text-xs mt-2"
                      >
                        {couponError}
                      </motion.p>
                    )}
                  </div>
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

                {/* Discount */}
                {discountAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-green-600">{t("checkout.discountLabel")}</span>
                    <span className="font-medium text-green-600">
                      -{formatPrice(discountAmount)}
                    </span>
                  </motion.div>
                )}

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
                disabled={isPlacing || items.length === 0}
                className="w-full py-4 btn-shimmer text-white rounded-full text-lg font-semibold mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isPlacing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("checkout.placingOrderButton")}
                  </>
                ) : (
                  t("checkout.placeOrderButton")
                )}
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
