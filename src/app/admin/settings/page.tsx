"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store,
  Truck,
  CreditCard,
  Shield,
  Save,
  Info,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);

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
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-sm">
        <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-800">
            Conectar con Firebase - Proximamente
          </p>
          <p className="text-amber-600 mt-0.5">
            Actualmente los ajustes se guardan localmente en el navegador. La
            persistencia en Firestore se habilitara proximamente.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Store Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-rosa-light/30 flex items-center justify-center">
              <Store className="w-5 h-5 text-rosa" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Tienda</h3>
              <p className="text-xs text-gray-400">
                Informacion general de la tienda
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Nombre de la Tienda
              </label>
              <input
                type="text"
                value={store.storeName}
                onChange={(e) =>
                  setStore((prev) => ({ ...prev, storeName: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
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
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Telefono
              </label>
              <input
                type="tel"
                value={store.phone}
                onChange={(e) =>
                  setStore((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+57 300 000 0000"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-colors"
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Envio</h3>
              <p className="text-xs text-gray-400">
                Tarifas y umbrales de envio
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
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
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
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
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
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
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-colors"
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Pagos</h3>
              <p className="text-xs text-gray-400">
                Metodos de pago disponibles
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-5">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Tarjeta de Credito/Debito
                  </p>
                  <p className="text-xs text-gray-400">
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
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-rosa transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">PP</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">PayPal</p>
                  <p className="text-xs text-gray-400">
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
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-rosa transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500">TR</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Transferencia Bancaria
                  </p>
                  <p className="text-xs text-gray-400">
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
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-rosa transition-colors" />
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Administracion</h3>
              <p className="text-xs text-gray-400">
                Informacion de la cuenta admin
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Email de Admin
              </label>
              <input
                type="email"
                value={adminEmail}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Rol
              </label>
              <input
                type="text"
                value={adminRole}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
