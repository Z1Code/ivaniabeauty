"use client";

import { create } from "zustand";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/firebase/types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

async function fetchOrCreateProfile(
  user: User,
  provider: "email" | "google" | "apple",
  extra?: { firstName?: string; lastName?: string }
): Promise<UserProfile> {
  const ref = doc(db, "userProfiles", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    return {
      uid: user.uid,
      email: data.email || user.email || "",
      displayName: data.displayName || user.displayName || "",
      photoURL: data.photoURL || user.photoURL || null,
      provider: data.provider || provider,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      phone: data.phone || "",
      addressLine1: data.addressLine1 || "",
      addressLine2: data.addressLine2 || "",
      city: data.city || "",
      state: data.state || "",
      zipCode: data.zipCode || "",
      country: data.country || "US",
      totalOrders: data.totalOrders || 0,
      totalSpent: data.totalSpent || 0,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  // Create new profile
  const nameParts = (user.displayName || "").split(" ");
  const firstName = extra?.firstName || nameParts[0] || "";
  const lastName = extra?.lastName || nameParts.slice(1).join(" ") || "";

  const profile: Omit<UserProfile, "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || `${firstName} ${lastName}`.trim(),
    photoURL: user.photoURL || null,
    provider,
    firstName,
    lastName,
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    totalOrders: 0,
    totalSpent: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, profile);

  return {
    ...profile,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserProfile;
}

const useAuth = create<AuthState>((set, get) => {
  // Listen to auth state changes
  if (typeof window !== "undefined" && auth) {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const providerData = user.providerData[0];
          const provider =
            providerData?.providerId === "google.com"
              ? "google"
              : providerData?.providerId === "apple.com"
                ? "apple"
                : "email";
          const profile = await fetchOrCreateProfile(user, provider);
          set({ user, profile, loading: false, initialized: true });
        } catch {
          set({ user, profile: null, loading: false, initialized: true });
        }
      } else {
        set({ user: null, profile: null, loading: false, initialized: true });
      }
    });
  } else {
    // SSR or auth not configured
    setTimeout(() => set({ loading: false, initialized: true }), 0);
  }

  return {
    user: null,
    profile: null,
    loading: true,
    initialized: false,

    signInWithEmail: async (email: string, password: string) => {
      set({ loading: true });
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    signUpWithEmail: async (
      email: string,
      password: string,
      firstName: string,
      lastName: string
    ) => {
      set({ loading: true });
      try {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await updateProfile(credential.user, {
          displayName: `${firstName} ${lastName}`.trim(),
        });
        await fetchOrCreateProfile(credential.user, "email", {
          firstName,
          lastName,
        });
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    signInWithGoogle: async () => {
      set({ loading: true });
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    signInWithApple: async () => {
      set({ loading: true });
      try {
        const provider = new OAuthProvider("apple.com");
        provider.addScope("email");
        provider.addScope("name");
        await signInWithPopup(auth, provider);
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    signOut: async () => {
      set({ loading: true });
      try {
        await firebaseSignOut(auth);
        set({ user: null, profile: null, loading: false });
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    resetPassword: async (email: string) => {
      await sendPasswordResetEmail(auth, email);
    },

    refreshProfile: async () => {
      const { user } = get();
      if (!user) return;
      const providerData = user.providerData[0];
      const provider =
        providerData?.providerId === "google.com"
          ? "google"
          : providerData?.providerId === "apple.com"
            ? "apple"
            : "email";
      const profile = await fetchOrCreateProfile(user, provider);
      set({ profile });
    },
  };
});

export default useAuth;
