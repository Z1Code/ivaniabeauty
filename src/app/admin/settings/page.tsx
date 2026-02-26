"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store,
  Truck,
  CreditCard,
  Shield,
  Save,
  Info,
  Palette,
  Moon,
  Sun,
  Check,
  SlidersHorizontal,
  Instagram,
  Video,
  Sparkles,
  KeyRound,
  Link2,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import useAdminTheme from "@/hooks/useAdminTheme";
import { ADMIN_THEMES } from "@/lib/admin-themes";
import { ADMIN_FONTS } from "@/lib/admin-fonts";
import {
  DEFAULT_SHOP_SECTION_IDS,
  SECTIONS,
  SHOP_SECTIONS_STORAGE_KEY,
  SHOP_SECTIONS_UPDATED_EVENT,
  sanitizeShopSectionIds,
} from "@/app/shop/sections";
import {
  DEFAULT_HOME_SECTIONS_SETTINGS,
  HERO_EFFECT_INTENSITY_OPTIONS,
  HOME_SECTIONS_STORAGE_KEY,
  HOME_SECTIONS_UPDATED_EVENT,
  sanitizeHomeSectionsSettings,
  type HeroEffectIntensity,
  type HomeSectionsSettings,
} from "@/lib/home-sections-config";
import {
  createFooterSocialLink,
  DEFAULT_FOOTER_SETTINGS,
  FOOTER_SETTINGS_STORAGE_KEY,
  FOOTER_SETTINGS_UPDATED_EVENT,
  FOOTER_SOCIAL_PLATFORM_OPTIONS,
  getFooterSocialDefaultLabel,
  sanitizeFooterSettings,
  type FooterSettings,
  type FooterSocialPlatform,
} from "@/lib/footer-config";

interface StoreSettings {
  storeName: string;
  contactEmail: string;
  phone: string;
}

interface ShippingSettings {
  standardRate: number;
  expressRate: number;
  freeShippingThreshold: number;
}

interface PaymentSettings {
  cardEnabled: boolean;
  paypalEnabled: boolean;
  transferEnabled: boolean;
}

interface ShopSectionsSettings {
  enabledSectionIds: string[];
}

interface AiProviderRowStatus {
  hasEnv: boolean;
  hasFirestore: boolean;
  source: "env" | "firestore" | "none";
}

interface AiProvidersApiResponse {
  configured: boolean;
  providerOrder: string[];
  configuredProviders: string[];
  providers: {
    removebg: AiProviderRowStatus;
    clipdrop: AiProviderRowStatus;
  };
  success?: boolean;
  error?: string;
}

interface SiteSectionsApiResponse {
  homeSections?: HomeSectionsSettings;
  footerSettings?: FooterSettings;
  persisted?: boolean;
  success?: boolean;
  error?: string;
}

const STORAGE_KEY_STORE = "ivania_settings_store";
const STORAGE_KEY_SHIPPING = "ivania_settings_shipping";
const STORAGE_KEY_PAYMENTS = "ivania_settings_payments";

function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

const inputClasses =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-colors";

const HERO_INTENSITY_LABELS: Record<
  HeroEffectIntensity,
  { title: string; description: string }
> = {
  soft: {
    title: "Suave",
    description: "Movimiento ligero y menos particulas.",
  },
  medium: {
    title: "Medio",
    description: "Balance visual recomendado.",
  },
  intense: {
    title: "Intenso",
    description: "Parallax, reflejos y particulas mas marcados.",
  },
};

export default function SettingsPage() {
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const { isDark, toggleDark, themeId, setTheme, fontId, setFont } = useAdminTheme();

  // Store settings
  const [store, setStore] = useState<StoreSettings>({
    storeName: "Ivania Beauty",
    contactEmail: "",
    phone: "",
  });

  // Shipping settings
  const [shipping, setShipping] = useState<ShippingSettings>({
    standardRate: 5.99,
    expressRate: 12.99,
    freeShippingThreshold: 75,
  });

  // Payment settings
  const [payments, setPayments] = useState<PaymentSettings>({
    cardEnabled: true,
    paypalEnabled: false,
    transferEnabled: false,
  });
  const [shopSections, setShopSections] = useState<ShopSectionsSettings>({
    enabledSectionIds: DEFAULT_SHOP_SECTION_IDS,
  });
  const [homeSections, setHomeSections] = useState<HomeSectionsSettings>(
    DEFAULT_HOME_SECTIONS_SETTINGS
  );
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(
    DEFAULT_FOOTER_SETTINGS
  );
  const [aiProviders, setAiProviders] = useState<AiProvidersApiResponse>({
    configured: false,
    providerOrder: ["removebg", "clipdrop"],
    configuredProviders: [],
    providers: {
      removebg: { hasEnv: false, hasFirestore: false, source: "none" },
      clipdrop: { hasEnv: false, hasFirestore: false, source: "none" },
    },
  });
  const [removebgApiKeyInput, setRemovebgApiKeyInput] = useState("");
  const [clipdropApiKeyInput, setClipdropApiKeyInput] = useState("");
  const [providerOrderInput, setProviderOrderInput] = useState("removebg,clipdrop");
  const [savingAiProviders, setSavingAiProviders] = useState(false);
  const [aiProvidersMessage, setAiProvidersMessage] = useState<string | null>(null);
  const [aiProvidersError, setAiProvidersError] = useState<string | null>(null);
  const [siteSectionsMessage, setSiteSectionsMessage] = useState<string | null>(null);
  const [siteSectionsError, setSiteSectionsError] = useState<string | null>(null);

  // Admin info (read-only)
  const [adminEmail] = useState("admin@ivaniabeauty.com");
  const [adminRole] = useState("Administrador");

  useEffect(() => {
    setStore(
      getStoredValue(STORAGE_KEY_STORE, {
        storeName: "Ivania Beauty",
        contactEmail: "",
        phone: "",
      })
    );
    setShipping(
      getStoredValue(STORAGE_KEY_SHIPPING, {
        standardRate: 5.99,
        expressRate: 12.99,
        freeShippingThreshold: 75,
      })
    );
    setPayments(
      getStoredValue(STORAGE_KEY_PAYMENTS, {
        cardEnabled: true,
        paypalEnabled: false,
        transferEnabled: false,
      })
    );
    const storedShopSections = getStoredValue<ShopSectionsSettings>(
      SHOP_SECTIONS_STORAGE_KEY,
      { enabledSectionIds: DEFAULT_SHOP_SECTION_IDS }
    );
    setShopSections({
      enabledSectionIds: sanitizeShopSectionIds(
        storedShopSections.enabledSectionIds
      ),
    });
    const storedHomeSections = getStoredValue<HomeSectionsSettings>(
      HOME_SECTIONS_STORAGE_KEY,
      DEFAULT_HOME_SECTIONS_SETTINGS
    );
    setHomeSections(sanitizeHomeSectionsSettings(storedHomeSections));
    const storedFooterSettings = getStoredValue<FooterSettings>(
      FOOTER_SETTINGS_STORAGE_KEY,
      DEFAULT_FOOTER_SETTINGS
    );
    setFooterSettings(sanitizeFooterSettings(storedFooterSettings));
  }, []);

  const toggleShopSection = useCallback((sectionId: string) => {
    setShopSections((prev) => {
      const isEnabled = prev.enabledSectionIds.includes(sectionId);
      if (isEnabled && prev.enabledSectionIds.length === 1) {
        return prev;
      }

      const nextSet = new Set(prev.enabledSectionIds);
      if (isEnabled) {
        nextSet.delete(sectionId);
      } else {
        nextSet.add(sectionId);
      }

      return {
        enabledSectionIds: sanitizeShopSectionIds([...nextSet]),
      };
    });
  }, []);

  const getShopSectionLabel = useCallback((sectionId: string) => {
    switch (sectionId) {
      case "shampoo-fragrance":
        return "Cabello y Cuerpo";
      case "fajas":
        return "Fajas";
      case "cinturillas":
        return "Cinturillas";
      case "tops-shorts":
        return "Tops y Shorts";
      default:
        return sectionId;
    }
  }, []);

  const toggleHomeSection = useCallback(
    (
      key:
        | "showCollections"
        | "showFeaturedProduct"
        | "showSizeQuiz"
        | "showTikTok"
        | "showInstagram"
    ) => {
      setHomeSections((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    },
    []
  );

  const setHomeHeroIntensity = useCallback((intensity: HeroEffectIntensity) => {
    setHomeSections((prev) => ({
      ...prev,
      heroEffectIntensity: intensity,
    }));
  }, []);

  const persistHomeSectionsLocally = useCallback((value: HomeSectionsSettings) => {
    localStorage.setItem(
      HOME_SECTIONS_STORAGE_KEY,
      JSON.stringify(sanitizeHomeSectionsSettings(value))
    );
    window.dispatchEvent(new Event(HOME_SECTIONS_UPDATED_EVENT));
  }, []);

  const persistFooterSettingsLocally = useCallback((value: FooterSettings) => {
    localStorage.setItem(
      FOOTER_SETTINGS_STORAGE_KEY,
      JSON.stringify(sanitizeFooterSettings(value))
    );
    window.dispatchEvent(new Event(FOOTER_SETTINGS_UPDATED_EVENT));
  }, []);

  const loadSiteSectionsFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/site-sections", {
        method: "GET",
      });
      const data = (await res.json().catch(() => ({}))) as SiteSectionsApiResponse;
      if (!res.ok) {
        throw new Error(data.error || "No se pudo cargar configuracion de secciones.");
      }
      if (!data.persisted) {
        setSiteSectionsMessage(null);
        setSiteSectionsError(
          "Firestore no esta configurado. Se usara persistencia local para Home y Footer."
        );
        return;
      }

      const nextHomeSections = sanitizeHomeSectionsSettings(data.homeSections);
      const nextFooterSettings = sanitizeFooterSettings(data.footerSettings);

      setHomeSections(nextHomeSections);
      setFooterSettings(nextFooterSettings);
      persistHomeSectionsLocally(nextHomeSections);
      persistFooterSettingsLocally(nextFooterSettings);
      // Sync contactEmail from Firestore footer settings into store state
      if (nextFooterSettings.contactEmail) {
        setStore((prev) => ({ ...prev, contactEmail: nextFooterSettings.contactEmail }));
      }
      setSiteSectionsError(null);
    } catch (error) {
      setSiteSectionsMessage(null);
      setSiteSectionsError(
        error instanceof Error
          ? error.message
          : "No se pudo sincronizar configuracion desde Firestore."
      );
    }
  }, [persistFooterSettingsLocally, persistHomeSectionsLocally]);

  useEffect(() => {
    void loadSiteSectionsFromServer();
  }, [loadSiteSectionsFromServer]);

  const updateFooterSocialLink = useCallback(
    (
      linkId: string,
      field: "platform" | "label" | "href",
      value: string | FooterSocialPlatform
    ) => {
      setFooterSettings((prev) => {
        const nextSocialLinks = prev.socialLinks.map((link) => {
          if (link.id !== linkId) return link;

          if (field === "platform") {
            const nextPlatform = value as FooterSocialPlatform;
            return {
              ...link,
              platform: nextPlatform,
              label:
                link.label.trim() ||
                getFooterSocialDefaultLabel(nextPlatform),
            };
          }

          return {
            ...link,
            [field]: String(value),
          };
        });

        return {
          ...prev,
          socialLinks: nextSocialLinks,
        };
      });
    },
    []
  );

  const addFooterSocialLink = useCallback(() => {
    setFooterSettings((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, createFooterSocialLink("instagram", prev.socialLinks.length)],
    }));
  }, []);

  const removeFooterSocialLink = useCallback((linkId: string) => {
    setFooterSettings((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((link) => link.id !== linkId),
    }));
  }, []);

  const normalizeProviderOrderInput = useCallback((value: string): string[] => {
    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const token of value.split(",")) {
      const item = token.trim().toLowerCase();
      if (!item) continue;
      if (item !== "removebg" && item !== "clipdrop") continue;
      if (seen.has(item)) continue;
      seen.add(item);
      normalized.push(item);
    }
    return normalized.length ? normalized : ["removebg", "clipdrop"];
  }, []);

  const loadAiProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/ai-providers", {
        method: "GET",
      });
      const data = (await res.json().catch(() => ({}))) as AiProvidersApiResponse;
      if (!res.ok) {
        throw new Error(data.error || "No se pudo cargar configuracion IA.");
      }
      setAiProviders({
        configured: Boolean(data.configured),
        providerOrder: Array.isArray(data.providerOrder)
          ? data.providerOrder
          : ["removebg", "clipdrop"],
        configuredProviders: Array.isArray(data.configuredProviders)
          ? data.configuredProviders
          : [],
        providers: {
          removebg: data.providers?.removebg || {
            hasEnv: false,
            hasFirestore: false,
            source: "none",
          },
          clipdrop: data.providers?.clipdrop || {
            hasEnv: false,
            hasFirestore: false,
            source: "none",
          },
        },
      });
      setProviderOrderInput(
        Array.isArray(data.providerOrder) && data.providerOrder.length
          ? data.providerOrder.join(",")
          : "removebg,clipdrop"
      );
      setAiProvidersError(null);
    } catch (error) {
      setAiProvidersError(
        error instanceof Error
          ? error.message
          : "Error cargando providers de IA."
      );
    }
  }, []);

  const saveAiProviders = useCallback(async () => {
    setSavingAiProviders(true);
    setAiProvidersMessage(null);
    setAiProvidersError(null);
    try {
      const payload: Record<string, unknown> = {
        providerOrder: normalizeProviderOrderInput(providerOrderInput),
      };
      if (removebgApiKeyInput.trim()) {
        payload.removebgApiKey = removebgApiKeyInput.trim();
      }
      if (clipdropApiKeyInput.trim()) {
        payload.clipdropApiKey = clipdropApiKeyInput.trim();
      }

      const res = await fetch("/api/admin/settings/ai-providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as AiProvidersApiResponse;
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar configuracion IA.");
      }

      setAiProviders({
        configured: Boolean(data.configured),
        providerOrder: Array.isArray(data.providerOrder)
          ? data.providerOrder
          : ["removebg", "clipdrop"],
        configuredProviders: Array.isArray(data.configuredProviders)
          ? data.configuredProviders
          : [],
        providers: {
          removebg: data.providers?.removebg || {
            hasEnv: false,
            hasFirestore: false,
            source: "none",
          },
          clipdrop: data.providers?.clipdrop || {
            hasEnv: false,
            hasFirestore: false,
            source: "none",
          },
        },
      });
      setRemovebgApiKeyInput("");
      setClipdropApiKeyInput("");
      setAiProvidersMessage("Configuracion IA guardada.");
    } catch (error) {
      setAiProvidersError(
        error instanceof Error
          ? error.message
          : "Error guardando providers de IA."
      );
    } finally {
      setSavingAiProviders(false);
    }
  }, [
    clipdropApiKeyInput,
    normalizeProviderOrderInput,
    providerOrderInput,
    removebgApiKeyInput,
  ]);

  const clearAiProviderKey = useCallback(async (provider: "removebg" | "clipdrop") => {
    setSavingAiProviders(true);
    setAiProvidersMessage(null);
    setAiProvidersError(null);
    try {
      const payload =
        provider === "removebg"
          ? { removebgApiKey: null }
          : { clipdropApiKey: null };
      const res = await fetch("/api/admin/settings/ai-providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as AiProvidersApiResponse;
      if (!res.ok) {
        throw new Error(data.error || "No se pudo limpiar la key.");
      }

      setAiProviders({
        configured: Boolean(data.configured),
        providerOrder: Array.isArray(data.providerOrder)
          ? data.providerOrder
          : ["removebg", "clipdrop"],
        configuredProviders: Array.isArray(data.configuredProviders)
          ? data.configuredProviders
          : [],
        providers: {
          removebg: data.providers?.removebg || {
            hasEnv: false,
            hasFirestore: false,
            source: "none",
          },
          clipdrop: data.providers?.clipdrop || {
            hasEnv: false,
            hasFirestore: false,
            source: "none",
          },
        },
      });
      setAiProvidersMessage(`Key de ${provider} limpiada.`);
    } catch (error) {
      setAiProvidersError(
        error instanceof Error ? error.message : "No se pudo limpiar la key."
      );
    } finally {
      setSavingAiProviders(false);
    }
  }, []);

  useEffect(() => {
    void loadAiProviders();
  }, [loadAiProviders]);

  const saveSection = useCallback(
    async (section: string) => {
      setSavingSection(section);
      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 400));

      try {
        switch (section) {
          case "store":
            localStorage.setItem(STORAGE_KEY_STORE, JSON.stringify(store));
            // Also sync contactEmail to footer settings in Firestore
            if (store.contactEmail) {
              const updatedFooter = sanitizeFooterSettings({
                ...footerSettings,
                contactEmail: store.contactEmail,
              });
              setFooterSettings(updatedFooter);
              try {
                const storeRes = await fetch("/api/admin/settings/site-sections", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ footerSettings: updatedFooter }),
                });
                if (storeRes.ok) {
                  persistFooterSettingsLocally(updatedFooter);
                }
              } catch {
                persistFooterSettingsLocally(updatedFooter);
              }
            }
            break;
          case "shipping":
            localStorage.setItem(
              STORAGE_KEY_SHIPPING,
              JSON.stringify(shipping)
            );
            break;
          case "payments":
            localStorage.setItem(
              STORAGE_KEY_PAYMENTS,
              JSON.stringify(payments)
            );
            break;
          case "shop":
            localStorage.setItem(
              SHOP_SECTIONS_STORAGE_KEY,
              JSON.stringify({
                enabledSectionIds: sanitizeShopSectionIds(
                  shopSections.enabledSectionIds
                ),
              })
            );
            window.dispatchEvent(new Event(SHOP_SECTIONS_UPDATED_EVENT));
            break;
          case "home":
            try {
              const response = await fetch("/api/admin/settings/site-sections", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  homeSections: sanitizeHomeSectionsSettings(homeSections),
                }),
              });
              const data =
                (await response.json().catch(() => ({}))) as SiteSectionsApiResponse;
              if (!response.ok) {
                throw new Error(
                  data.error || "No se pudo guardar secciones del home en Firestore."
                );
              }

              const nextHomeSections = sanitizeHomeSectionsSettings(
                data.homeSections
              );
              const nextFooterSettings = sanitizeFooterSettings(
                data.footerSettings
              );
              setHomeSections(nextHomeSections);
              setFooterSettings(nextFooterSettings);
              persistHomeSectionsLocally(nextHomeSections);
              persistFooterSettingsLocally(nextFooterSettings);
              setSiteSectionsMessage(
                "Secciones del Home guardadas en Firestore."
              );
              setSiteSectionsError(null);
            } catch (error) {
              const localHomeSections = sanitizeHomeSectionsSettings(homeSections);
              persistHomeSectionsLocally(localHomeSections);
              setSiteSectionsMessage(null);
              setSiteSectionsError(
                error instanceof Error
                  ? `${error.message} Se guardo localmente en este navegador.`
                  : "No se pudo guardar en Firestore. Se guardo localmente en este navegador."
              );
            }
            break;
          case "footer":
            try {
              const response = await fetch("/api/admin/settings/site-sections", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  footerSettings: sanitizeFooterSettings(footerSettings),
                }),
              });
              const data =
                (await response.json().catch(() => ({}))) as SiteSectionsApiResponse;
              if (!response.ok) {
                throw new Error(
                  data.error ||
                    "No se pudo guardar ajustes de footer/redes en Firestore."
                );
              }

              const nextHomeSections = sanitizeHomeSectionsSettings(
                data.homeSections
              );
              const nextFooterSettings = sanitizeFooterSettings(
                data.footerSettings
              );
              setHomeSections(nextHomeSections);
              setFooterSettings(nextFooterSettings);
              persistHomeSectionsLocally(nextHomeSections);
              persistFooterSettingsLocally(nextFooterSettings);
              setSiteSectionsMessage(
                "Ajustes de Footer y Redes guardados en Firestore."
              );
              setSiteSectionsError(null);
            } catch (error) {
              const localFooterSettings = sanitizeFooterSettings(footerSettings);
              persistFooterSettingsLocally(localFooterSettings);
              setSiteSectionsMessage(null);
              setSiteSectionsError(
                error instanceof Error
                  ? `${error.message} Se guardo localmente en este navegador.`
                  : "No se pudo guardar en Firestore. Se guardo localmente en este navegador."
              );
            }
            break;
        }
      } catch (error) {
        console.error("Error saving settings:", error);
      } finally {
        setSavingSection(null);
      }
    },
    [
      store,
      shipping,
      payments,
      shopSections.enabledSectionIds,
      homeSections,
      footerSettings,
      persistFooterSettingsLocally,
      persistHomeSectionsLocally,
    ]
  );

  return (
    <>
      <AdminPageHeader
        title="Configuracion"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Configuracion" },
        ]}
      />

      {/* Settings persistence notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl mb-6 text-sm">
        <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-300">
            Persistencia de configuracion
          </p>
          <p className="text-amber-600 dark:text-amber-400 mt-0.5">
            Secciones Home y Footer/Redes ya sincronizan con Firestore.
            Ajustes de tienda/envio/pagos siguen guardandose localmente.
          </p>
        </div>
      </div>

      {siteSectionsMessage && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {siteSectionsMessage}
        </div>
      )}
      {siteSectionsError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {siteSectionsError}
        </div>
      )}

      <div className="space-y-6">
        {/* AI Provider Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Providers IA (Background Removal)
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Configura remove.bg y clipdrop para usarlos desde cualquier despliegue web.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                remove.bg
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Estado: {aiProviders.providers.removebg.source}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                clipdrop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Estado: {aiProviders.providers.clipdrop.source}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Key remove.bg (opcional)
              </label>
              <input
                type="password"
                value={removebgApiKeyInput}
                onChange={(e) => setRemovebgApiKeyInput(e.target.value)}
                placeholder="Pega nueva key para actualizar"
                className={inputClasses}
              />
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => void clearAiProviderKey("removebg")}
                  disabled={savingAiProviders}
                  className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                >
                  Limpiar key remove.bg guardada
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Key clipdrop (opcional)
              </label>
              <input
                type="password"
                value={clipdropApiKeyInput}
                onChange={(e) => setClipdropApiKeyInput(e.target.value)}
                placeholder="Pega nueva key para actualizar"
                className={inputClasses}
              />
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => void clearAiProviderKey("clipdrop")}
                  disabled={savingAiProviders}
                  className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                >
                  Limpiar key clipdrop guardada
                </button>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Orden de fallback
            </label>
            <input
              type="text"
              value={providerOrderInput}
              onChange={(e) => setProviderOrderInput(e.target.value)}
              placeholder="removebg,clipdrop"
              className={inputClasses}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Usa valores separados por coma. Permitidos: removebg, clipdrop.
            </p>
          </div>

          {aiProvidersMessage && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">
              {aiProvidersMessage}
            </p>
          )}
          {aiProvidersError && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              {aiProvidersError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void saveAiProviders()}
              disabled={savingAiProviders}
              className="flex items-center gap-2 px-5 py-2.5 bg-rosa text-white rounded-xl hover:bg-rosa-dark transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingAiProviders ? "Guardando..." : "Guardar Providers IA"}
            </button>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
              <Palette className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Apariencia
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Personaliza el tema del panel
              </p>
            </div>
          </div>

          {/* Theme Picker */}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Tema del panel lateral
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {ADMIN_THEMES.map((t) => {
              const isSelected = themeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-rosa ring-2 ring-rosa/30 scale-[1.02]"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {/* Gradient preview */}
                  <div
                    className="h-16 w-full"
                    style={{
                      background: `linear-gradient(to bottom, ${t.accent}, ${t.accentDark})`,
                    }}
                  />
                  {/* Label */}
                  <div className="px-3 py-2 bg-white dark:bg-gray-800 text-center">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t.label}
                    </span>
                  </div>
                  {/* Check mark overlay */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-rosa" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Font Picker */}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            <Type className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            Fuente de titulos
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
            {ADMIN_FONTS.map((f) => {
              const isSelected = fontId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFont(f.id)}
                  className={`relative rounded-xl p-3 border-2 transition-all duration-200 cursor-pointer text-center ${
                    isSelected
                      ? "border-rosa ring-2 ring-rosa/30 bg-rosa/5 dark:bg-rosa/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                  }`}
                >
                  <span
                    className="block text-base font-semibold text-gray-800 dark:text-gray-100 leading-tight mb-1 truncate"
                    style={{ fontFamily: f.fallback }}
                  >
                    Ivania
                  </span>
                  <span className="block text-[10px] text-gray-400 dark:text-gray-500 truncate">
                    {f.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rosa flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Modo Oscuro
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Reduce el brillo para menos cansancio visual
                </p>
              </div>
            </div>
            <label className="relative cursor-pointer">
              <input
                type="checkbox"
                checked={isDark}
                onChange={toggleDark}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        </div>

        {/* Store Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-rosa-light/30 dark:bg-rosa/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-rosa" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Tienda
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Informacion general de la tienda
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Nombre de la Tienda
              </label>
              <input
                type="text"
                value={store.storeName}
                onChange={(e) =>
                  setStore((prev) => ({ ...prev, storeName: e.target.value }))
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Email de Contacto
              </label>
              <input
                type="email"
                value={store.contactEmail}
                onChange={(e) =>
                  setStore((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
                placeholder="contacto@ivaniabeauty.com"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Telefono
              </label>
              <input
                type="tel"
                value={store.phone}
                onChange={(e) =>
                  setStore((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+57 300 000 0000"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => saveSection("store")}
              disabled={savingSection === "store"}
              className="flex items-center gap-2 px-5 py-2.5 bg-rosa text-white rounded-xl hover:bg-rosa-dark transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingSection === "store" ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        {/* Shipping Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Envio
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Tarifas y umbrales de envio
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Tarifa Estandar (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shipping.standardRate}
                onChange={(e) =>
                  setShipping((prev) => ({
                    ...prev,
                    standardRate: parseFloat(e.target.value) || 0,
                  }))
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Tarifa Express (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shipping.expressRate}
                onChange={(e) =>
                  setShipping((prev) => ({
                    ...prev,
                    expressRate: parseFloat(e.target.value) || 0,
                  }))
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Envio Gratis Desde (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shipping.freeShippingThreshold}
                onChange={(e) =>
                  setShipping((prev) => ({
                    ...prev,
                    freeShippingThreshold: parseFloat(e.target.value) || 0,
                  }))
                }
                className={inputClasses}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => saveSection("shipping")}
              disabled={savingSection === "shipping"}
              className="flex items-center gap-2 px-5 py-2.5 bg-rosa text-white rounded-xl hover:bg-rosa-dark transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingSection === "shipping" ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Pagos
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Metodos de pago disponibles
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-5">
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tarjeta de Credito/Debito
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Visa, Mastercard, AMEX
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={payments.cardEnabled}
                  onChange={(e) =>
                    setPayments((prev) => ({
                      ...prev,
                      cardEnabled: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    PP
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    PayPal
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Pago con cuenta PayPal
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={payments.paypalEnabled}
                  onChange={(e) =>
                    setPayments((prev) => ({
                      ...prev,
                      paypalEnabled: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    TR
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transferencia Bancaria
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Pago directo por transferencia
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={payments.transferEnabled}
                  onChange={(e) =>
                    setPayments((prev) => ({
                      ...prev,
                      transferEnabled: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => saveSection("payments")}
              disabled={savingSection === "payments"}
              className="flex items-center gap-2 px-5 py-2.5 bg-rosa text-white rounded-xl hover:bg-rosa-dark transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingSection === "payments" ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        {/* Shop Sections Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-fuchsia-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Secciones de Shop
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Activa u oculta las 4 secciones visibles en /shop
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-2">
            {SECTIONS.map((section) => {
              const isEnabled = shopSections.enabledSectionIds.includes(
                section.id
              );
              const isOnlyEnabledSection =
                isEnabled && shopSections.enabledSectionIds.length === 1;
              return (
                <label
                  key={section.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getShopSectionLabel(section.id)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {isEnabled ? "Visible en Shop" : "Oculta en Shop"}
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      disabled={isOnlyEnabledSection}
                      onChange={() => toggleShopSection(section.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors peer-disabled:opacity-50" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5 peer-disabled:opacity-70" />
                  </div>
                </label>
              );
            })}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            Debe haber al menos una seccion activa para mostrar productos.
          </p>

          <div className="flex justify-end">
            <button
              onClick={() => saveSection("shop")}
              disabled={savingSection === "shop"}
              className="flex items-center gap-2 px-5 py-2.5 bg-rosa text-white rounded-xl hover:bg-rosa-dark transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingSection === "shop" ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        {/* Home Sections Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Secciones del Home
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Activa u oculta bloques clave de la landing
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Our Collection
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Mostrar bloque de colecciones destacadas
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={homeSections.showCollections}
                  onChange={() => toggleHomeSection("showCollections")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Star Product
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Mostrar producto principal en home
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={homeSections.showFeaturedProduct}
                  onChange={() => toggleHomeSection("showFeaturedProduct")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Find Your Perfect Size
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Mostrar quiz de tallas para recomendacion
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={homeSections.showSizeQuiz}
                  onChange={() => toggleHomeSection("showSizeQuiz")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Feed de TikTok
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Mostrar videos y CTA de TikTok en home
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={homeSections.showTikTok}
                  onChange={() => toggleHomeSection("showTikTok")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Feed de Instagram
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Mostrar grid y newsletter de Instagram en home
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={homeSections.showInstagram}
                  onChange={() => toggleHomeSection("showInstagram")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-rosa transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-rosa" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Intensidad visual del Hero
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {HERO_EFFECT_INTENSITY_OPTIONS.map((intensity) => {
                const selected = homeSections.heroEffectIntensity === intensity;
                const metadata = HERO_INTENSITY_LABELS[intensity];
                return (
                  <button
                    key={intensity}
                    type="button"
                    onClick={() => setHomeHeroIntensity(intensity)}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      selected
                        ? "border-rosa bg-rosa/10 text-rosa-dark"
                        : "border-gray-200 bg-white text-gray-700 hover:border-rosa/45 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    }`}
                  >
                    <p className="text-sm font-semibold">{metadata.title}</p>
                    <p className="mt-1 text-xs opacity-80">
                      {metadata.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => saveSection("home")}
              disabled={savingSection === "home"}
              className="flex items-center gap-2 px-5 py-2.5 bg-rosa text-white rounded-xl hover:bg-rosa-dark transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingSection === "home" ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        {/* Footer Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Footer y Redes
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Configura WhatsApp y los enlaces de redes sociales del footer
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Numero de WhatsApp
              </label>
              <input
                type="text"
                value={footerSettings.whatsappNumber}
                onChange={(e) =>
                  setFooterSettings((prev) => ({
                    ...prev,
                    whatsappNumber: e.target.value,
                  }))
                }
                placeholder="+1 234 567 890"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Mensaje predefinido
              </label>
              <input
                type="text"
                value={footerSettings.whatsappMessage}
                onChange={(e) =>
                  setFooterSettings((prev) => ({
                    ...prev,
                    whatsappMessage: e.target.value,
                  }))
                }
                placeholder="Hola! Quiero mas informacion."
                className={inputClasses}
              />
            </div>
          </div>

          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Redes Sociales
            </p>
            <div className="space-y-3">
              {footerSettings.socialLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="grid grid-cols-1 md:grid-cols-[160px_1fr_1fr_auto] gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <select
                    value={link.platform}
                    onChange={(e) =>
                      updateFooterSocialLink(
                        link.id,
                        "platform",
                        e.target.value as FooterSocialPlatform
                      )
                    }
                    className={inputClasses}
                  >
                    {FOOTER_SOCIAL_PLATFORM_OPTIONS.map((platform) => (
                      <option key={platform} value={platform}>
                        {getFooterSocialDefaultLabel(platform)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) =>
                      updateFooterSocialLink(link.id, "label", e.target.value)
                    }
                    placeholder="Nombre visible"
                    className={inputClasses}
                  />
                  <input
                    type="url"
                    value={link.href}
                    onChange={(e) =>
                      updateFooterSocialLink(link.id, "href", e.target.value)
                    }
                    placeholder="https://..."
                    className={inputClasses}
                  />
                  <button
                    type="button"
                    onClick={() => removeFooterSocialLink(link.id)}
                    className="inline-flex items-center justify-center px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    aria-label={`Eliminar red ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Puedes agregar o eliminar redes. Solo se mostraran links validos (http/https).
            </p>
            <button
              type="button"
              onClick={addFooterSocialLink}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:border-rosa/50 hover:text-rosa transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Agregar red
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => saveSection("footer")}
              disabled={savingSection === "footer"}
              className="flex items-center gap-2 px-5 py-2.5 bg-rosa text-white rounded-xl hover:bg-rosa-dark transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingSection === "footer" ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        {/* Admin Info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Administracion
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Informacion de la cuenta admin
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Email de Admin
              </label>
              <input
                type="email"
                value={adminEmail}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Rol
              </label>
              <input
                type="text"
                value={adminRole}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
