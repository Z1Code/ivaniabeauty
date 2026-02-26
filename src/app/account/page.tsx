"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, LogOut, MapPin, ShoppingBag, Shield } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

const providerLabels: Record<string, string> = {
  email: "Email",
  google: "Google",
  apple: "Apple",
};

export default function AccountPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, profile, initialized, loading, signOut } = useAuth();

  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login?redirect=/account");
    }
  }, [initialized, user, router]);

  if (!initialized || loading || !user) {
    return (
      <div className="min-h-screen bg-perla flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rosa" />
      </div>
    );
  }

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim() || profile.displayName
    : user.displayName || "";

  const hasAddress = profile && profile.addressLine1;

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      })
    : "";

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-perla px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-lg mx-auto space-y-6"
      >
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-rosa/5 p-8 text-center">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            {profile?.photoURL || user.photoURL ? (
              <Image
                src={profile?.photoURL || user.photoURL || ""}
                alt={displayName}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-2 border-rosa/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-rosa/10 flex items-center justify-center text-rosa text-2xl font-serif font-semibold">
                {displayName.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>

          <h1 className="font-serif text-2xl font-semibold text-gray-800">
            {displayName || profile?.email || user.email}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{profile?.email || user.email}</p>

          {/* Provider badge + member since */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              {t("auth.provider")} {providerLabels[profile?.provider || "email"]}
            </span>
            {memberSince && (
              <span>
                {t("auth.memberSince")} {memberSince}
              </span>
            )}
          </div>
        </div>

        {/* Address Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-rosa/5 p-6">
          <h2 className="font-medium text-gray-800 flex items-center gap-2 mb-3">
            <MapPin className="w-4.5 h-4.5 text-rosa" />
            {t("auth.savedAddress")}
          </h2>
          {hasAddress ? (
            <div className="text-sm text-gray-600 space-y-0.5">
              <p>{profile.addressLine1}</p>
              {profile.addressLine2 && <p>{profile.addressLine2}</p>}
              <p>
                {profile.city}, {profile.state} {profile.zipCode}
              </p>
              <p>{profile.country}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">{t("auth.noAddress")}</p>
          )}
        </div>

        {/* Order History Link */}
        <Link
          href="/account"
          className="flex items-center justify-between bg-white rounded-2xl shadow-lg shadow-rosa/5 p-6 hover:shadow-md transition-shadow group"
        >
          <span className="font-medium text-gray-800 flex items-center gap-2">
            <ShoppingBag className="w-4.5 h-4.5 text-rosa" />
            {t("auth.orderHistory")}
          </span>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-rosa transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5" />
          {t("auth.logout")}
        </button>
      </motion.div>
    </div>
  );
}
