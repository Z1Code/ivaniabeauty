"use client";

import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminBadge, {
  getOrderStatusVariant,
  getOrderStatusLabel,
} from "@/components/admin/AdminBadge";
import { formatPrice } from "@/lib/utils";

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderRow {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function CustomerDetailClient({
  customer,
  orders,
}: {
  customer: Customer;
  orders: OrderRow[];
}) {
  const router = useRouter();
  const fullName = `${customer.firstName} ${customer.lastName}`.trim();

  const orderColumns = [
    {
      key: "orderNumber",
      header: "Pedido",
      render: (o: OrderRow) => (
        <span className="font-semibold text-gray-800">{o.orderNumber}</span>
      ),
    },
    {
      key: "date",
      header: "Fecha",
      render: (o: OrderRow) => (
        <span className="text-gray-500">
          {new Date(o.createdAt).toLocaleDateString("es")}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (o: OrderRow) => (
        <span className="font-semibold">{formatPrice(o.total)}</span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (o: OrderRow) => (
        <AdminBadge variant={getOrderStatusVariant(o.status)}>
          {getOrderStatusLabel(o.status)}
        </AdminBadge>
      ),
    },
  ];

  const hasAddress =
    customer.addressLine1 || customer.city || customer.country;

  return (
    <>
      <AdminPageHeader
        title={fullName || "Cliente"}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Clientes", href: "/admin/customers" },
          { label: fullName || "Detalle" },
        ]}
        action={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Informacion del Cliente
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-gray-700">{customer.email || "---"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Telefono
                  </p>
                  <p className="text-gray-700">{customer.phone || "---"}</p>
                </div>
              </div>

              {hasAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Direccion
                    </p>
                    <p className="text-gray-700">
                      {customer.addressLine1}
                      {customer.addressLine2 && (
                        <>
                          <br />
                          {customer.addressLine2}
                        </>
                      )}
                      {(customer.city || customer.state || customer.zipCode) && (
                        <>
                          <br />
                          {[customer.city, customer.state, customer.zipCode]
                            .filter(Boolean)
                            .join(", ")}
                        </>
                      )}
                      {customer.country && (
                        <>
                          <br />
                          {customer.country}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Miembro desde
                  </p>
                  <p className="text-gray-700">
                    {new Date(customer.createdAt).toLocaleDateString("es", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Estadisticas</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rosa-light/30 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-rosa" />
                  </div>
                  <span className="text-gray-600">Total Pedidos</span>
                </div>
                <span className="text-xl font-bold text-gray-800">
                  {customer.totalOrders}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-gray-600">Total Gastado</span>
                </div>
                <span className="text-xl font-bold text-gray-800">
                  {formatPrice(customer.totalSpent)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Historial de Pedidos
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Este cliente no tiene pedidos aun
              </div>
            ) : (
              <AdminTable
                columns={orderColumns}
                data={orders}
                keyExtractor={(o) => o.id}
                onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
                emptyMessage="No hay pedidos"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
