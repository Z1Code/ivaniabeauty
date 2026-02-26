"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Shield,
  Lock,
  RefreshCw,
  ChevronRight,
  Loader2,
  Tag,
  X,
  AlertCircle,
  Check,
  MapPin,
} from "lucide-react";

import useCart from "@/hooks/useCart";
import { formatPrice, getColorHex, cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

type ShippingMethod = "standard" | "express";

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
  state?: string;
  zip?: string;
}

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

interface ZipLookupResult {
  city: string;
  state: string;
  stateFull: string;
}

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { items, subtotal } = useCart();

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

  // ── ZIP auto-fill state ──
  const [zipLoading, setZipLoading] = useState(false);
  const [zipLookupData, setZipLookupData] = useState<ZipLookupResult | null>(
    null
  );
  const [showAutoFilled, setShowAutoFilled] = useState(false);
  const autoFillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Shipping / Payment ──
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("standard");

  // ── Coupon state ──
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // ── Order state ──
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderFilling, setOrderFilling] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const cartSubtotal = subtotal();
  const shippingCost = shippingMethod === "express" ? 12.99 : 0;
  const discountAmount = couponData?.discountAmount ?? 0;
  const total = Math.max(0, cartSubtotal + shippingCost - discountAmount);

  // ── ZIP code auto-fill ──
  const lookupZip = useCallback(
    async (zipCode: string) => {
      if (!/^\d{5}$/.test(zipCode)) {
        setZipLookupData(null);
        return;
      }

      setZipLoading(true);
      try {
        const res = await fetch(
          `/api/zip-lookup?zip=${encodeURIComponent(zipCode)}`
        );

        if (!res.ok) {
          setZipLookupData(null);
          setFormErrors((p) => ({
            ...p,
            zip: t("checkout.zipNotFound"),
          }));
          setZipLoading(false);
          return;
        }

        const data: ZipLookupResult = await res.json();
        setZipLookupData(data);

        // Auto-fill city and state
        setCity(data.city);
        setState(data.state);

        // Clear related errors
        setFormErrors((p) => ({
          ...p,
          zip: undefined,
          city: undefined,
          state: undefined,
        }));

        // Show auto-fill indicator
        setShowAutoFilled(true);
        if (autoFillTimerRef.current) {
          clearTimeout(autoFillTimerRef.current);
        }
        autoFillTimerRef.current = setTimeout(() => {
          setShowAutoFilled(false);
        }, 2000);
      } catch {
        setZipLookupData(null);
        setFormErrors((p) => ({
          ...p,
          zip: t("checkout.zipLookupFailed"),
        }));
      } finally {
        setZipLoading(false);
      }
    },
    [t]
  );

  // Trigger ZIP lookup when zip reaches 5 digits
  useEffect(() => {
    if (/^\d{5}$/.test(zip)) {
      lookupZip(zip);
    } else {
      setZipLookupData(null);
    }
  }, [zip, lookupZip]);

  // Cleanup auto-fill timer
  useEffect(() => {
    return () => {
      if (autoFillTimerRef.current) {
        clearTimeout(autoFillTimerRef.current);
      }
    };
  }, []);

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
    if (!addressLine1.trim())
      errors.addressLine1 = t("checkout.fieldRequired");

    // ZIP validation
    if (!zip.trim()) {
      errors.zip = t("checkout.fieldRequired");
    } else if (!/^\d{5}$/.test(zip.trim())) {
      errors.zip = t("checkout.zipInvalid");
    }

    // City validation
    if (!city.trim()) {
      errors.city = t("checkout.fieldRequired");
    } else if (
      zipLookupData &&
      city.trim().toLowerCase() !== zipLookupData.city.toLowerCase()
    ) {
      errors.city = t("checkout.cityMismatch");
    }

    // State validation
    if (!state.trim()) {
      errors.state = t("checkout.fieldRequired");
    } else if (!US_STATES.some((s) => s.value === state)) {
      errors.state = t("checkout.stateInvalid");
    } else if (zipLookupData && state !== zipLookupData.state) {
      errors.state = t("checkout.stateMismatch");
    }

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

  // ── Handle ZIP input ──
  const handleZipChange = (value: string) => {
    // Only allow digits, max 5
    const cleaned = value.replace(/\D/g, "").slice(0, 5);
    setZip(cleaned);
    if (formErrors.zip) setFormErrors((p) => ({ ...p, zip: undefined }));
  };

  // ── Place order (redirect to Stripe Checkout) ──
  const handlePlaceOrder = () => {
    setOrderError("");

    if (!validateForm()) return;
    if (items.length === 0) return;
    if (orderFilling || isPlacing) return;

    // Start fill animation
    setOrderFilling(true);

    setTimeout(async () => {
      setOrderFilling(false);
      setIsPlacing(true);

      try {
        const res = await fetch("/api/checkout", {
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
              country: "US",
            },
            items: items.map((item) => ({
              productId: item.id,
              productName: item.name,
              productImage: item.image,
              color: item.color || "",
              size: item.size || "",
              quantity: item.quantity,
              unitPrice: item.price,
            })),
            shippingMethod,
            paymentMethod: "card",
            couponCode: couponData ? couponData.code : null,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || t("checkout.orderErrorGeneric"));
        }

        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL returned");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : t("checkout.orderErrorGeneric");
        setOrderError(message);
      } finally {
        setIsPlacing(false);
      }
    }, 500);
  };

  const inputClasses =
    "w-full p-3 rounded-xl border border-rosa-light/30 focus:border-rosa focus:ring-2 focus:ring-rosa/20 outline-none transition-all duration-200 text-sm";

  const inputErrorClasses =
    "w-full p-3 rounded-xl border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all duration-200 text-sm";

  const selectClasses =
    "w-full p-3 rounded-xl border border-rosa-light/30 focus:border-rosa focus:ring-2 focus:ring-rosa/20 outline-none transition-all duration-200 text-sm bg-white appearance-none";

  const selectErrorClasses =
    "w-full p-3 rounded-xl border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all duration-200 text-sm bg-white appearance-none";

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
        <span className="text-rosa-dark font-medium">
          {t("checkout.breadcrumbCheckout")}
        </span>
      </nav>

      {/* Title */}
      <h1 className="font-serif text-3xl font-bold mb-10">
        {t("checkout.pageTitle")}
      </h1>

      {/* Order-level error */}
      <AnimatePresence>
        {orderError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex items-center gap-3 bg-white border border-red-200 shadow-lg rounded-xl px-6 py-4"
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
          <section className="bg-white rounded-xl p-6 shadow-sm border border-rosa-light/20">
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
                    if (formErrors.email)
                      setFormErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className={
                    formErrors.email ? inputErrorClasses : inputClasses
                  }
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.email}
                  </p>
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
          <section className="bg-white rounded-xl p-6 shadow-sm border border-rosa-light/20">
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
                      if (formErrors.firstName)
                        setFormErrors((p) => ({
                          ...p,
                          firstName: undefined,
                        }));
                    }}
                    className={
                      formErrors.firstName ? inputErrorClasses : inputClasses
                    }
                  />
                  {formErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={t("checkout.lastNamePlaceholder")}
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (formErrors.lastName)
                        setFormErrors((p) => ({
                          ...p,
                          lastName: undefined,
                        }));
                    }}
                    className={
                      formErrors.lastName ? inputErrorClasses : inputClasses
                    }
                  />
                  {formErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.lastName}
                    </p>
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
                    if (formErrors.addressLine1)
                      setFormErrors((p) => ({
                        ...p,
                        addressLine1: undefined,
                      }));
                  }}
                  className={
                    formErrors.addressLine1 ? inputErrorClasses : inputClasses
                  }
                />
                {formErrors.addressLine1 && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.addressLine1}
                  </p>
                )}
              </div>
              <input
                type="text"
                placeholder={t("checkout.addressLine2Placeholder")}
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className={inputClasses}
              />

              {/* ZIP Code - triggers auto-fill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={t("checkout.zipPlaceholder")}
                      value={zip}
                      onChange={(e) => handleZipChange(e.target.value)}
                      maxLength={5}
                      className={
                        formErrors.zip ? inputErrorClasses : inputClasses
                      }
                    />
                    {zipLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-rosa" />
                      </div>
                    )}
                    {!zipLoading && zipLookupData && /^\d{5}$/.test(zip) && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                  {formErrors.zip && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.zip}
                    </p>
                  )}
                </div>

                {/* Country - locked to US */}
                <div className="flex items-center gap-2 p-3 rounded-xl border border-rosa-light/30 bg-gray-50 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-rosa flex-shrink-0" />
                  <span>{t("checkout.countryLocked")}</span>
                </div>
              </div>

              {/* City and State - with auto-fill indicator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t("checkout.cityPlaceholder")}
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (formErrors.city)
                          setFormErrors((p) => ({ ...p, city: undefined }));
                      }}
                      className={
                        formErrors.city ? inputErrorClasses : inputClasses
                      }
                    />
                  </div>
                  <AnimatePresence>
                    {formErrors.city && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.city}
                      </p>
                    )}
                    {!formErrors.city && showAutoFilled && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3 }}
                        className="text-green-500 text-xs mt-1 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        {t("checkout.autoFilled")}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <div className="relative">
                    <select
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        if (formErrors.state)
                          setFormErrors((p) => ({ ...p, state: undefined }));
                      }}
                      className={cn(
                        formErrors.state ? selectErrorClasses : selectClasses,
                        !state && "text-gray-400"
                      )}
                    >
                      <option value="" disabled>
                        {t("checkout.stateSelectPlaceholder")}
                      </option>
                      {US_STATES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label} ({s.value})
                        </option>
                      ))}
                    </select>
                  </div>
                  <AnimatePresence>
                    {formErrors.state && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.state}
                      </p>
                    )}
                    {!formErrors.state && showAutoFilled && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3 }}
                        className="text-green-500 text-xs mt-1 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        {t("checkout.autoFilled")}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Shipping Method */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-rosa-light/20">
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
                <span className="font-semibold text-sm">
                  {t("checkout.shippingExpressPrice")}
                </span>
              </label>
            </div>
          </section>

          {/* Section 4: Payment */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-rosa-light/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rosa text-white text-sm font-bold">
                4
              </span>
              <h2 className="font-serif text-lg font-semibold">
                {t("checkout.paymentMethodHeading")}
              </h2>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-rosa bg-rosa/5">
              <CreditCard className="w-5 h-5 text-rosa" />
              <span className="font-medium text-sm">
                {t("checkout.paymentCard")}
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {t("checkout.stripeRedirectNotice") ||
                "Seras redirigido a Stripe para ingresar tus datos de pago de forma segura."}
            </p>
          </section>
        </div>

        {/* RIGHT - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-rosa-light/20">
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
                  <span className="text-gray-600">
                    {t("checkout.subtotalLabel")}
                  </span>
                  <span className="font-medium">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {t("checkout.shippingLabel")}
                  </span>
                  <span className="font-medium">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">
                        {t("checkout.shippingFree")}
                      </span>
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
                    <span className="text-green-600">
                      {t("checkout.discountLabel")}
                    </span>
                    <span className="font-medium text-green-600">
                      -{formatPrice(discountAmount)}
                    </span>
                  </motion.div>
                )}

                {/* Total */}
                <div className="border-t border-rosa-light/20 pt-3 flex justify-between">
                  <span className="font-bold text-lg">
                    {t("checkout.totalLabel")}
                  </span>
                  <span className="font-bold text-lg text-rosa-dark">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Place Order Button */}
              <motion.button
                onClick={handlePlaceOrder}
                disabled={isPlacing || orderFilling || items.length === 0}
                animate={orderFilling ? { scale: 0.95 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                whileTap={
                  !orderFilling && !isPlacing ? { scale: 0.93 } : undefined
                }
                className={cn(
                  "group/btn relative w-full py-4 rounded-xl text-lg font-semibold mt-6 cursor-pointer overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                  "border border-rosa/30 bg-rosa/5 hover:border-rosa hover:shadow-md hover:shadow-rosa/15"
                )}
              >
                {/* Fill bar */}
                <motion.span
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-rosa to-rosa-dark"
                  initial={{ width: "0%" }}
                  animate={{ width: orderFilling ? "100%" : "0%" }}
                  transition={
                    orderFilling
                      ? { duration: 0.5, ease: "easeOut" }
                      : { duration: 0 }
                  }
                />
                {/* Label */}
                <AnimatePresence mode="wait">
                  {isPlacing ? (
                    <motion.span
                      key="placing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative z-10 flex items-center justify-center gap-3 text-rosa-dark"
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("checkout.placingOrderButton")}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "relative z-10 flex items-center justify-center gap-2 transition-colors duration-300",
                        orderFilling ? "text-white" : "text-rosa-dark"
                      )}
                    >
                      {t("checkout.placeOrderButton")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

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
