"use client";

import { memo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminPageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
}

function AdminPageHeaderComponent({
  title,
  breadcrumbs,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-2">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-rosa transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-600 dark:text-gray-300">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title + Action */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100">
          {title}
        </h1>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

const AdminPageHeader = memo(AdminPageHeaderComponent);

export default AdminPageHeader;
