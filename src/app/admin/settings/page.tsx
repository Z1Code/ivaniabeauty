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
} from "lucide-react";
import { Type } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import useAdminTheme from "@/hooks/useAdminTheme";
import { ADMIN_THEMES } from "@/lib/admin-themes";
import { ADMIN_FONTS } from "@/lib/admin-fonts";

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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
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
    setLoading(false);
  }, []);

  const saveSection = useCallback(
    async (section: string) => {
      setSavingSection(section);
      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 400));

      try {
        switch (section) {
          case "store":
            localStorage.setItem(STORAGE_KEY_STORE, JSON.stringify(store));
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
        }
      } catch (error) {
        console.error("Error saving settings:", error);
      } finally {
        setSavingSection(null);
      }
    },
    [store, shipping, payments]
  );

  if (loading) {
    return (
      <>
        <AdminPageHeader
          title="Configuracion"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Configuracion" },
          ]}
        />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-rosa border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Configuracion"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Configuracion" },
        ]}
      />

      {/* Firebase connection notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl mb-6 text-sm">
        <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-300">
            Conectar con Firebase - Proximamente
          </p>
          <p className="text-amber-600 dark:text-amber-400 mt-0.5">
            Actualmente los ajustes se guardan localmente en el navegador. La
            persistencia en Firestore se habilitara proximamente.
          </p>
        </div>
      </div>

      <div className="space-y-6">
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
