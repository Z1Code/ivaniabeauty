"use client";

import Image from "next/image";
import { Package, Layers } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminBadge from "@/components/admin/AdminBadge";

interface CollectionRow {
  id: string;
  slug: string;
  nameEn: string;
  nameEs: string;
  descriptionEs: string;
  image: string;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function CollectionsClient({
  collections,
}: {
  collections: CollectionRow[];
}) {
  return (
    <>
      <AdminPageHeader
        title="Colecciones"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Colecciones" },
        ]}
      />

      {collections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay colecciones</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Image */}
              <div className="relative w-full h-44 bg-gradient-to-br from-rosa-light/20 to-rosa/10">
                {col.image ? (
                  <Image
                    src={col.image}
                    alt={col.nameEs}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Layers className="w-16 h-16 text-rosa/30" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-base">
                      {col.nameEs}
                    </h3>
                    {col.nameEn && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {col.nameEn}
                      </p>
                    )}
                  </div>
                  <AdminBadge variant={col.isActive ? "success" : "default"}>
                    {col.isActive ? "Activa" : "Inactiva"}
                  </AdminBadge>
                </div>

                {col.descriptionEs && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {col.descriptionEs}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span>
                    {col.productCount}{" "}
                    {col.productCount === 1 ? "producto" : "productos"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
