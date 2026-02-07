"use client";

import { useRouter } from "next/navigation";
import { Plus, Megaphone, Calendar, ExternalLink } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminBadge from "@/components/admin/AdminBadge";

export interface CampaignRow {
  id: string;
  name: string;
  description: string;
  couponId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  bannerImage: string | null;
  bannerTextEn: string;
  bannerTextEs: string;
  targetUrl: string;
  createdAt: string | null;
}

function getCampaignStatus(campaign: CampaignRow): {
  label: string;
  variant: "success" | "warning" | "danger" | "default";
} {
  const now = new Date();
  const startsAt = campaign.startsAt ? new Date(campaign.startsAt) : null;
  const endsAt = campaign.endsAt ? new Date(campaign.endsAt) : null;

  if (!campaign.isActive) {
    return { label: "Inactiva", variant: "default" };
  }

  if (endsAt && endsAt < now) {
    return { label: "Expirada", variant: "danger" };
  }

  if (startsAt && startsAt > now) {
    return { label: "Programada", variant: "warning" };
  }

  return { label: "Activa", variant: "success" };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function CampaignsClient({
  initialCampaigns,
}: {
  initialCampaigns: CampaignRow[];
}) {
  const router = useRouter();

  const columns = [
    {
      key: "name",
      header: "Nombre",
      render: (c: CampaignRow) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rosa-light/30 to-arena flex-shrink-0 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-rosa/60" />
          </div>
          <div>
            <p className="font-medium text-gray-800 line-clamp-1">{c.name}</p>
            {c.couponId && (
              <p className="text-xs text-gray-400">Cupon: {c.couponId}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Descripcion",
      render: (c: CampaignRow) => (
        <span className="text-gray-600 text-sm">
          {truncate(c.description || "-", 40)}
        </span>
      ),
    },
    {
      key: "bannerText",
      header: "Banner (ES)",
      render: (c: CampaignRow) => (
        <span className="text-gray-600 text-sm">
          {truncate(c.bannerTextEs || "-", 30)}
        </span>
      ),
    },
    {
      key: "dates",
      header: "Fechas",
      render: (c: CampaignRow) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>
            {formatDate(c.startsAt)} - {formatDate(c.endsAt)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (c: CampaignRow) => {
        const status = getCampaignStatus(c);
        return <AdminBadge variant={status.variant}>{status.label}</AdminBadge>;
      },
    },
    {
      key: "targetUrl",
      header: "URL",
      render: (c: CampaignRow) => (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="line-clamp-1">{truncate(c.targetUrl || "/shop", 20)}</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Campanas"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Campanas" },
        ]}
        action={
          <button
            onClick={() => router.push("/admin/campaigns/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nueva Campana
          </button>
        }
      />

      <AdminTable
        columns={columns}
        data={initialCampaigns}
        keyExtractor={(c) => c.id}
        onRowClick={(c) => router.push(`/admin/campaigns/${c.id}`)}
        emptyMessage="No hay campanas creadas"
      />
    </>
  );
}

