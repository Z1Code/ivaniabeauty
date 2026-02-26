import { FieldValue } from "firebase-admin/firestore";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import {
  DEFAULT_FOOTER_SETTINGS,
  sanitizeFooterSettings,
  type FooterSettings,
} from "@/lib/footer-config";
import {
  DEFAULT_HOME_SECTIONS_SETTINGS,
  sanitizeHomeSectionsSettings,
  type HomeSectionsSettings,
} from "@/lib/home-sections-config";

const STORE_SETTINGS_COLLECTION = "storeSettings";
const HOME_SECTIONS_DOC_ID = "homeSections";
const FOOTER_SETTINGS_DOC_ID = "footerSettings";

export interface SiteSectionsSettings {
  homeSections: HomeSectionsSettings;
  footerSettings: FooterSettings;
}

export interface UpsertSiteSectionsSettingsInput {
  homeSections?: unknown;
  footerSettings?: unknown;
  adminUid?: string;
}

interface FirestoreSettingDoc<T> {
  value?: T;
}

async function getStoreSettingValue<T>(docId: string): Promise<T | null> {
  const snap = await adminDb.collection(STORE_SETTINGS_COLLECTION).doc(docId).get();
  if (!snap.exists) return null;
  const data = snap.data() as FirestoreSettingDoc<T> | undefined;
  if (!data) return null;
  return (data.value ?? null) as T | null;
}

export async function readSiteSectionsSettings(): Promise<SiteSectionsSettings> {
  if (!isFirebaseConfigured()) {
    return {
      homeSections: DEFAULT_HOME_SECTIONS_SETTINGS,
      footerSettings: DEFAULT_FOOTER_SETTINGS,
    };
  }

  const [rawHomeSections, rawFooterSettings] = await Promise.all([
    getStoreSettingValue<unknown>(HOME_SECTIONS_DOC_ID),
    getStoreSettingValue<unknown>(FOOTER_SETTINGS_DOC_ID),
  ]);

  return {
    homeSections: sanitizeHomeSectionsSettings(rawHomeSections),
    footerSettings: sanitizeFooterSettings(rawFooterSettings),
  };
}

export async function upsertSiteSectionsSettings(
  input: UpsertSiteSectionsSettingsInput
): Promise<SiteSectionsSettings> {
  if (!isFirebaseConfigured()) {
    const error = new Error("Firebase no esta configurado en el servidor.");
    (error as Error & { status?: number }).status = 503;
    throw error;
  }

  const hasHomeSections = input.homeSections !== undefined;
  const hasFooterSettings = input.footerSettings !== undefined;

  if (hasHomeSections || hasFooterSettings) {
    const batch = adminDb.batch();
    const metadata: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (input.adminUid) {
      metadata.updatedBy = input.adminUid;
    }

    if (hasHomeSections) {
      batch.set(
        adminDb.collection(STORE_SETTINGS_COLLECTION).doc(HOME_SECTIONS_DOC_ID),
        {
          value: sanitizeHomeSectionsSettings(input.homeSections),
          ...metadata,
        },
        { merge: true }
      );
    }

    if (hasFooterSettings) {
      batch.set(
        adminDb.collection(STORE_SETTINGS_COLLECTION).doc(FOOTER_SETTINGS_DOC_ID),
        {
          value: sanitizeFooterSettings(input.footerSettings),
          ...metadata,
        },
        { merge: true }
      );
    }

    await batch.commit();
  }

  return readSiteSectionsSettings();
}
