"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

function mapFirebaseError(code: string, t: (key: string) => string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return t("auth.errorEmailInUse");
    case "auth/weak-password":
      return t("auth.errorWeakPassword");
    case "auth/invalid-email":
      return t("auth.errorInvalidCredentials");
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return t("auth.errorPopupClosed");
    default:
      return t("auth.errorGeneric");
  }
}

/* ---------- inline SVGs ---------- */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { user, initialized, signUpWithEmail, signInWithGoogle, signInWithApple } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);

  const redirect = searchParams.get("redirect") || "/";
  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    if (initialized && user) {
      router.replace(redirect);
    }
  }, [initialized, user, router, redirect]);

  if (!initialized || user) {
    return (
      <div className="min-h-screen bg-perla flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rosa" />
      </div>
    );
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError(t("auth.errorWeakPassword"));
      return;
    }
    if (!passwordsMatch) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password, firstName, lastName);
      router.replace(redirect);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      setError(mapFirebaseError(code, t));
      setLoading(false);
    }
  }

  async function handleSocial(provider: "google" | "apple") {
    setError("");
    setSocialLoading(provider);
    try {
      if (provider === "google") await signInWithGoogle();
      else await signInWithApple();
      router.replace(redirect);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      setError(mapFirebaseError(code, t));
      setSocialLoading(null);
    }
  }

  const isSubmitting = loading || socialLoading !== null;

  return (
    <div className="min-h-screen bg-perla flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg shadow-rosa/5 p-8 md:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Ivania Beauty"
                width={48}
                height={48}
                className="w-12 h-12 mb-4"
                priority
              />
            </Link>
            <h1 className="font-serif text-2xl font-semibold text-gray-800">
              {t("auth.createYourAccount")}
            </h1>
            <p className="text-sm text-gray-500 mt-1 text-center">
              {t("auth.registerSubtitle")}
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("auth.firstName")}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full pl-11 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all disabled:opacity-60 text-sm"
                    placeholder="Maria"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("auth.lastName")}
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all disabled:opacity-60 text-sm"
                  placeholder="Garcia"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all disabled:opacity-60"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth.password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all disabled:opacity-60"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {/* Password requirement hint */}
              <p className={`text-xs mt-1.5 transition-colors ${password.length === 0 ? "text-gray-400" : passwordValid ? "text-green-600" : "text-red-500"}`}>
                {t("auth.passwordMin")}
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth.confirmPassword")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all disabled:opacity-60"
                  placeholder="********"
                />
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs mt-1.5 text-red-500">{t("auth.passwordMismatch")}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-rosa hover:bg-rosa-dark text-white font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                t("auth.register")
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">{t("auth.orContinueWith")}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSocial("google")}
              disabled={isSubmitting}
              className="w-full py-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
            >
              {socialLoading === "google" ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <>
                  <GoogleIcon />
                  {t("auth.continueWithGoogle")}
                </>
              )}
            </button>

            <button
              onClick={() => handleSocial("apple")}
              disabled={isSubmitting}
              className="w-full py-3 rounded-full border border-gray-900 bg-gray-900 hover:bg-black text-white font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
            >
              {socialLoading === "apple" ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <>
                  <AppleIcon />
                  {t("auth.signInWithApple")}
                </>
              )}
            </button>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {t("auth.hasAccount")}{" "}
            <Link
              href={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="text-rosa hover:text-rosa-dark font-medium transition-colors"
            >
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
