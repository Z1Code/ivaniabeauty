"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  User,
  MapPin,
  CreditCard,
  Truck,
  Package,
  MessageSquare,
  Tag,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminBadge, {
  getOrderStatusVariant,
  getOrderStatusLabel,
} from "@/components/admin/AdminBadge";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  shippingMethod: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  trackingNumber: string;
  notes: string;
  createdAt: string | null;
  updatedAt: string | null;
  items: OrderItem[];
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "processing", label: "Procesando" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "refunded", label: "Reembolsado" },
];

const PAYMENT_LABELS: Record<string, string> = {
  card: "Tarjeta",
  paypal: "PayPal",
  transfer: "Transferencia",
};

const SHIPPING_LABELS: Record<string, string> = {
  standard: "Estandar",
  express: "Express",
};

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputClasses =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all";

export default function OrderDetailClient({ order }: { order: OrderData }) {
  const router = useRouter();

  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber);
  const [notes, setNotes] = useState(order.notes);

  const [statusSaving, setStatusSaving] = useState(false);
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const showNotification = (message: string, isError = false) => {
    if (isError) {
      setError(message);
      setTimeout(() => setError(""), 4000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const updateOrder = async (
    data: Record<string, unknown>,
    setLoading: (v: boolean) => void,
    successMsg: string
  ) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      showNotification(successMsg);
    } catch (err) {
      console.error("Error updating order:", err);
      showNotification("Error al actualizar el pedido.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateOrder({ status: newStatus }, setStatusSaving, "Estado actualizado.");
  };

  const handleTrackingSave = () => {
    updateOrder(
      { trackingNumber },
      setTrackingSaving,
      "Numero de seguimiento actualizado."
    );
  };

  const handleNotesSave = () => {
    updateOrder({ notes }, setNotesSaving, "Notas actualizadas.");
  };

  return (
    <>
      <AdminPageHeader
        title={`Pedido ${order.orderNumber || order.id.slice(0, 8)}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pedidos", href: "/admin/orders" },
          { label: `#${order.orderNumber || order.id.slice(0, 8)}` },
        ]}
        action={
          <button
            onClick={() => router.push("/admin/orders")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Pedidos
          </button>
        }
      />

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-serif text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-rosa" />
                Articulos ({order.items.length})
              </h2>
            </div>

            {order.items.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No hay articulos en este pedido
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                    {/* Product image */}
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {item.productName}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {item.color && (
                          <span className="text-xs text-gray-400">
                            Color: <span className="text-gray-600 capitalize">{item.color}</span>
                          </span>
                        )}
                        {item.size && (
                          <span className="text-xs text-gray-400">
                            Talla: <span className="text-gray-600 uppercase">{item.size}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Qty & Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-600">
                        {item.quantity} x {formatPrice(item.unitPrice)}
                      </p>
                      <p className="font-semibold text-gray-800 text-sm">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Timeline / Dates */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-rosa" />
              Notas del Pedido
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar notas internas sobre el pedido..."
              rows={4}
              className={inputClasses + " resize-none"}
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleNotesSave}
                disabled={notesSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors disabled:opacity-50 cursor-pointer"
              >
                {notesSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {notesSaving ? "Guardando..." : "Guardar Notas"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-serif text-base font-semibold text-gray-800 mb-3">
              Estado
            </h3>
            <div className="mb-4">
              <AdminBadge variant={getOrderStatusVariant(status)}>
                {getOrderStatusLabel(status)}
              </AdminBadge>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cambiar Estado
            </label>
            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusSaving}
                className={inputClasses + " disabled:opacity-50"}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {statusSaving && (
                <div className="w-5 h-5 border-2 border-rosa border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Creado: {formatDate(order.createdAt)}
            </p>
            {order.updatedAt && (
              <p className="text-xs text-gray-400">
                Actualizado: {formatDate(order.updatedAt)}
              </p>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-serif text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-rosa" />
              Cliente
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-800">{order.customerName}</p>
              <p className="text-gray-500">{order.customerEmail}</p>
              {order.customerId && (
                <button
                  onClick={() => router.push(`/admin/customers/${order.customerId}`)}
                  className="text-rosa text-xs font-medium hover:text-rosa-dark transition-colors cursor-pointer"
                >
                  Ver perfil del cliente
                </button>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-serif text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rosa" />
              Direccion de Envio
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>{order.shippingAddressLine1}</p>
              {order.shippingAddressLine2 && (
                <p>{order.shippingAddressLine2}</p>
              )}
              <p>
                {order.shippingCity}
                {order.shippingState ? `, ${order.shippingState}` : ""}
                {order.shippingZip ? ` ${order.shippingZip}` : ""}
              </p>
              {order.shippingCountry && (
                <p className="text-gray-400">{order.shippingCountry}</p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-serif text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rosa" />
              Pago
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Metodo</span>
                <span className="text-gray-800 font-medium capitalize">
                  {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Envio</span>
                <span className="text-gray-800 font-medium capitalize">
                  {SHIPPING_LABELS[order.shippingMethod] || order.shippingMethod}
                </span>
              </div>
              {order.couponCode && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cupon</span>
                  <span className="flex items-center gap-1 text-gray-800 font-mono text-xs">
                    <Tag className="w-3 h-3 text-rosa" />
                    {order.couponCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-serif text-base font-semibold text-gray-800 mb-3">
              Resumen
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-800">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Envio</span>
                <span className="text-gray-800">
                  {order.shippingCost > 0
                    ? formatPrice(order.shippingCost)
                    : "Gratis"}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Impuestos</span>
                  <span className="text-gray-800">
                    {formatPrice(order.taxAmount)}
                  </span>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between">
                <span className="font-semibold text-gray-800">Total</span>
                <span className="font-bold text-gray-900 text-base">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Tracking Number */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-serif text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-rosa" />
              Seguimiento
            </h3>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Numero de seguimiento"
              className={inputClasses}
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleTrackingSave}
                disabled={trackingSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors disabled:opacity-50 cursor-pointer"
              >
                {trackingSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {trackingSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
