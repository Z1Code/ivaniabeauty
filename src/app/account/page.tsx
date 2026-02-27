"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Package,
  MapPin,
  LogOut,
  Loader2,
  ShoppingBag,
  Check,
  Truck,
  Clock,
  Mail,
  Phone,
  Edit3,
  Save,
  ExternalLink,
  Shield,
  Key,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { formatPrice, cn } from "@/lib/utils";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

type Tab = "profile" | "orders" | "address";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: Date;
  trackingNumber: string | null;
  trackingUrlProvider: string | null;
  shippingMethod: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
  confirmed: { bg: "bg-blue-50", text: "text-blue-700" },
  processing: { bg: "bg-indigo-50", text: "text-indigo-700" },
  shipped: { bg: "bg-purple-50", text: "text-purple-700" },
  delivered: { bg: "bg-emerald-50", text: "text-emerald-700" },
  cancelled: { bg: "bg-gray-50", text: "text-gray-500" },
  refunded: { bg: "bg-red-50", text: "text-red-600" },
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  confirmed: Check,
  processing: Package,
  shipped: Truck,
  delivered: Check,
};

export default function AccountPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { user, profile, initialized, signOut, resetPassword, refreshProfile } =
    useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Address editing
  const [editingAddress, setEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savedAddress, setSavedAddress] = useState(false);
  const [zipLookedUp, setZipLookedUp] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState("");
  const [addressForm, setAddressForm] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  // Password reset
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login?redirect=/account");
    }
  }, [initialized, user, router]);

  // Sync form with profile
  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      });
      setAddressForm({
        addressLine1: profile.addressLine1,
        addressLine2: profile.addressLine2,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        country: profile.country,
      });
      if (profile.zipCode) setZipLookedUp(true);
    }
  }, [profile]);

  // ZIP code lookup via Zippopotam.us
  const lookupZip = useCallback(async (zip: string) => {
    if (zip.length !== 5 || !/^\d{5}$/.test(zip)) return;
    setZipLoading(true);
    setZipError("");
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) {
        setZipError(language === "es" ? "ZIP no encontrado" : "ZIP not found");
        setZipLoading(false);
        return;
      }
      const data = await res.json();
      const place = data.places?.[0];
      if (place) {
        setAddressForm((prev) => ({
          ...prev,
          city: place["place name"] || "",
          state: place["state abbreviation"] || place.state || "",
          country: "United States",
        }));
        setZipLookedUp(true);
      }
    } catch {
      setZipError(language === "es" ? "Error al buscar ZIP" : "ZIP lookup failed");
    } finally {
      setZipLoading(false);
    }
  }, [language]);

  // Fetch orders when tab switches
  const fetchOrders = useCallback(async () => {
    if (!user?.email || ordersLoaded) return;
    setOrdersLoading(true);
    try {
      const q = query(
        collection(db, "orders"),
        where("customerEmail", "==", user.email),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setOrders(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            orderNumber: data.orderNumber,
            status: data.status,
            total: data.total,
            itemCount: data.itemCount || 1,
            createdAt: data.createdAt?.toDate() || new Date(),
            trackingNumber: data.trackingNumber || null,
            trackingUrlProvider: data.trackingUrlProvider || null,
            shippingMethod: data.shippingMethod || "standard",
          };
        })
      );
      setOrdersLoaded(true);
    } catch {
      // silently fail
    } finally {
      setOrdersLoading(false);
    }
  }, [user?.email, ordersLoaded]);

  useEffect(() => {
    if (activeTab === "orders") fetchOrders();
  }, [activeTab, fetchOrders]);

  if (!initialized || !user) {
    return (
      <div className="min-h-screen bg-perla flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rosa" />
      </div>
    );
  }

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "userProfiles", user.uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        displayName: `${form.firstName} ${form.lastName}`.trim(),
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAddress() {
    if (!user) return;
    setSavingAddress(true);
    try {
      await updateDoc(doc(db, "userProfiles", user.uid), {
        ...addressForm,
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      setEditingAddress(false);
      setSavedAddress(true);
      setTimeout(() => setSavedAddress(false), 3000);
    } catch {
      // silently fail
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleResetPassword() {
    if (!user?.email) return;
    setResetLoading(true);
    try {
      await resetPassword(user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch {
      // silently fail
    } finally {
      setResetLoading(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
      router.replace("/");
    } catch {
      setLoggingOut(false);
    }
  }

  function getStatusLabel(status: string): string {
    const key = `auth.status${status.charAt(0).toUpperCase()}${status.slice(1)}`;
    const label = t(key);
    return label === key ? status : label;
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString(language === "es" ? "es-CO" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: "profile", label: t("auth.tabProfile"), icon: User },
    { key: "orders", label: t("auth.tabOrders"), icon: Package },
    { key: "address", label: t("auth.tabAddress"), icon: MapPin },
  ];

  const providerLabel =
    profile?.provider === "google"
      ? t("auth.googleProvider")
      : profile?.provider === "apple"
        ? t("auth.appleProvider")
        : t("auth.emailProvider");

  return (
    <div className="min-h-screen bg-perla">
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-12 sm:pt-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            {profile?.photoURL ? (
              <Image
                src={profile.photoURL}
                alt=""
                width={56}
                height={56}
                className="w-14 h-14 rounded-full border-2 border-rosa/20"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-rosa/10 flex items-center justify-center">
                <User className="w-6 h-6 text-rosa" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-2xl font-semibold text-gray-800 truncate">
                {profile?.displayName || user.email}
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                {t("auth.connectedWith")} {providerLabel}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer",
                activeTab === key
                  ? "bg-rosa/10 text-rosa-dark shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-serif text-lg font-semibold text-gray-800">
                    {t("auth.editProfile")}
                  </h2>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-sm text-rosa hover:text-rosa-dark transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {t("auth.editProfile")}
                    </button>
                  )}
                </div>

                {saved && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {t("auth.changesSaved")}
                  </motion.div>
                )}

                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {t("auth.firstName")}
                        </label>
                        <input
                          value={form.firstName}
                          onChange={(e) =>
                            setForm({ ...form, firstName: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {t("auth.lastName")}
                        </label>
                        <input
                          value={form.lastName}
                          onChange={(e) =>
                            setForm({ ...form, lastName: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t("auth.phone")}
                      </label>
                      <input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        type="tel"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rosa hover:bg-rosa-dark text-white text-sm font-medium transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saving ? t("auth.saving") : t("auth.saveChanges")}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          if (profile) {
                            setForm({
                              firstName: profile.firstName,
                              lastName: profile.lastName,
                              phone: profile.phone,
                            });
                          }
                        }}
                        className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        {language === "es" ? "Cancelar" : "Cancel"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">
                        {profile?.firstName && profile?.lastName
                          ? `${profile.firstName} ${profile.lastName}`
                          : language === "es"
                            ? "No configurado"
                            : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">
                        {profile?.phone ||
                          (language === "es" ? "No configurado" : "Not set")}
                      </span>
                    </div>
                    {profile?.createdAt && (
                      <div className="flex items-center gap-3 text-sm pt-1">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-400">
                          {t("auth.memberSince")} {formatDate(profile.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Password / Security Card */}
              {profile?.provider === "email" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="w-4.5 h-4.5 text-gray-600" />
                    <h2 className="font-serif text-lg font-semibold text-gray-800">
                      {t("auth.passwordSection")}
                    </h2>
                  </div>

                  {resetSent ? (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {t("auth.resetSent")}
                    </motion.div>
                  ) : (
                    <button
                      onClick={handleResetPassword}
                      disabled={resetLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {resetLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      {t("auth.changePassword")}
                    </button>
                  )}
                </div>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 hover:text-red-500 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                {t("auth.logout")}
              </button>
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="font-serif text-lg font-semibold text-gray-800">
                    {t("auth.orderHistory")}
                  </h2>
                </div>

                {ordersLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-rosa" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <ShoppingBag className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="text-gray-500 text-sm mb-4">
                      {t("auth.noOrders")}
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-rosa hover:bg-rosa-dark text-white text-sm font-medium transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {t("auth.startShopping")}
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {orders.map((order) => {
                      const colors =
                        STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                      const StatusIcon =
                        STATUS_ICONS[order.status] || Clock;
                      return (
                        <div
                          key={order.id}
                          className="p-5 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 text-sm">
                                {t("auth.orderNumber")} #{order.orderNumber}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatDate(order.createdAt)}
                                {" · "}
                                {order.itemCount}{" "}
                                {order.itemCount === 1
                                  ? t("auth.orderItem")
                                  : t("auth.orderItems")}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0",
                                colors.bg,
                                colors.text
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {getStatusLabel(order.status)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">
                              {formatPrice(order.total)}
                            </span>
                            <div className="flex items-center gap-2">
                              {order.trackingNumber &&
                                order.trackingUrlProvider && (
                                  <a
                                    href={order.trackingUrlProvider}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-rosa hover:text-rosa-dark transition-colors"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    {t("auth.trackOrder")}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              {order.trackingNumber &&
                                !order.trackingUrlProvider && (
                                  <span className="text-xs text-gray-400">
                                    {t("auth.trackingNumber")}:{" "}
                                    {order.trackingNumber}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "address" && (
            <motion.div
              key="address"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-serif text-lg font-semibold text-gray-800">
                    {t("auth.shippingAddress")}
                  </h2>
                  {!editingAddress && (
                    <button
                      onClick={() => setEditingAddress(true)}
                      className="flex items-center gap-1.5 text-sm text-rosa hover:text-rosa-dark transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {t("auth.editAddress")}
                    </button>
                  )}
                </div>

                {savedAddress && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {t("auth.changesSaved")}
                  </motion.div>
                )}

                {editingAddress ? (
                  <div className="space-y-4">
                    {/* Step 1: ZIP Code — prominent, first field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t("auth.zipCode")}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            value={addressForm.zipCode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                              setAddressForm({ ...addressForm, zipCode: val });
                              if (val.length === 5) lookupZip(val);
                              if (val.length < 5) {
                                setZipLookedUp(false);
                                setZipError("");
                              }
                            }}
                            placeholder="e.g. 33101"
                            maxLength={5}
                            inputMode="numeric"
                            autoFocus
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border text-lg font-medium tracking-widest text-gray-800 focus:outline-none focus:ring-2 transition-all",
                              zipError
                                ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                                : zipLookedUp
                                  ? "border-emerald-300 bg-emerald-50/30 focus:ring-emerald-200 focus:border-emerald-400"
                                  : "border-gray-200 bg-gray-50/50 focus:ring-rosa/30 focus:border-rosa"
                            )}
                          />
                          {zipLoading && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-rosa" />
                          )}
                          {zipLookedUp && !zipLoading && (
                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                      </div>
                      {zipError && (
                        <p className="text-xs text-red-500 mt-1">{zipError}</p>
                      )}
                      {!zipLookedUp && !zipError && (
                        <p className="text-xs text-gray-400 mt-1">
                          {language === "es"
                            ? "Ingresa tu ZIP code para autocompletar ciudad y estado"
                            : "Enter your ZIP code to auto-fill city and state"}
                        </p>
                      )}
                    </div>

                    {/* Auto-filled location summary */}
                    {zipLookedUp && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-sm text-emerald-700 flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {addressForm.city}, {addressForm.state} — {addressForm.country}
                        </span>
                      </motion.div>
                    )}

                    {/* Step 2: Street address — only shows after ZIP lookup */}
                    {zipLookedUp && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {t("auth.addressLine1")}
                          </label>
                          <input
                            value={addressForm.addressLine1}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                addressLine1: e.target.value,
                              })
                            }
                            placeholder={language === "es" ? "Ej: 123 Main Street" : "e.g. 123 Main Street"}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {t("auth.addressLine2")}
                          </label>
                          <input
                            value={addressForm.addressLine2}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                addressLine2: e.target.value,
                              })
                            }
                            placeholder={language === "es" ? "Apto, Suite, Unidad (opcional)" : "Apt, Suite, Unit (optional)"}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all"
                          />
                        </div>

                        {/* City / State — editable but pre-filled */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              {t("auth.city")}
                            </label>
                            <input
                              value={addressForm.city}
                              onChange={(e) =>
                                setAddressForm({
                                  ...addressForm,
                                  city: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              {t("auth.state")}
                            </label>
                            <input
                              value={addressForm.state}
                              onChange={(e) =>
                                setAddressForm({
                                  ...addressForm,
                                  state: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Save / Cancel */}
                    {zipLookedUp && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex gap-3 pt-2"
                      >
                        <button
                          onClick={handleSaveAddress}
                          disabled={savingAddress || !addressForm.addressLine1.trim()}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rosa hover:bg-rosa-dark text-white text-sm font-medium transition-all disabled:opacity-60 cursor-pointer"
                        >
                          {savingAddress ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {savingAddress
                            ? t("auth.saving")
                            : t("auth.saveChanges")}
                        </button>
                        <button
                          onClick={() => {
                            setEditingAddress(false);
                            setZipLookedUp(false);
                            setZipError("");
                            if (profile) {
                              setAddressForm({
                                addressLine1: profile.addressLine1,
                                addressLine2: profile.addressLine2,
                                city: profile.city,
                                state: profile.state,
                                zipCode: profile.zipCode,
                                country: profile.country,
                              });
                              if (profile.zipCode) setZipLookedUp(true);
                            }
                          }}
                          className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all cursor-pointer"
                        >
                          {language === "es" ? "Cancelar" : "Cancel"}
                        </button>
                      </motion.div>
                    )}
                  </div>
                ) : profile?.addressLine1 ? (
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{profile.addressLine1}</p>
                    {profile.addressLine2 && <p>{profile.addressLine2}</p>}
                    <p>
                      {[profile.city, profile.state, profile.zipCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {profile.country && <p>{profile.country}</p>}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <MapPin className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-gray-500 text-sm mb-3">
                      {t("auth.noAddress")}
                    </p>
                    <button
                      onClick={() => setEditingAddress(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rosa hover:bg-rosa-dark text-white text-sm font-medium transition-all cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      {t("auth.editAddress")}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
