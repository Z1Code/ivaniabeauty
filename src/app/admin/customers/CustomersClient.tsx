"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import { formatPrice } from "@/lib/utils";

interface CustomerRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export default function CustomersClient({
  customers,
}: {
  customers: CustomerRow[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const columns = useMemo(() => [
    {
      key: "name",
      header: "Nombre",
      render: (c: CustomerRow) => (
        <div>
          <p className="font-semibold text-gray-800">
            {c.firstName} {c.lastName}
          </p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (c: CustomerRow) => (
        <span className="text-gray-600">{c.email}</span>
      ),
    },
    {
      key: "phone",
      header: "Telefono",
      render: (c: CustomerRow) => (
        <span className="text-gray-500">{c.phone || "---"}</span>
      ),
    },
    {
      key: "orders",
      header: "Pedidos",
      render: (c: CustomerRow) => (
        <span className="font-medium text-gray-700">{c.totalOrders}</span>
      ),
    },
    {
      key: "spent",
      header: "Total Gastado",
      render: (c: CustomerRow) => (
        <span className="font-semibold text-gray-800">
          {formatPrice(c.totalSpent)}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Registro",
      render: (c: CustomerRow) => (
        <span className="text-gray-500 text-sm">
          {new Date(c.createdAt).toLocaleDateString("es")}
        </span>
      ),
    },
  ], []);

  return (
    <>
      <AdminPageHeader
        title="Clientes"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Clientes" },
        ]}
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-colors"
          />
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(c) => c.id}
        onRowClick={(c) => router.push(`/admin/customers/${c.id}`)}
        emptyMessage="No hay clientes"
      />
    </>
  );
}
