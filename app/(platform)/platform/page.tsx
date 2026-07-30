"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Building2, ShieldAlert, Users, Truck } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";
import { MODULES, type ModuleId } from "@/src/lib/modules";
import { formatDate } from "@/src/lib/format";

interface SessionUser {
  isPlatformAdmin: boolean;
}

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  enabledModules: ModuleId[];
  createdAt: string;
  _count: { memberships: number; drivers: number; trucks: number };
}

export default function PlatformAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[] | null>(null);

  useEffect(() => {
    api<{ user: SessionUser | null }>("/api/auth/session")
      .then(({ user }) => {
        if (!user?.isPlatformAdmin) {
          setAuthorized(false);
          return;
        }
        setAuthorized(true);
        return api<{ companies: CompanyRow[] }>("/api/platform/companies");
      })
      .then((data) => {
        if (data) setCompanies(data.companies);
      })
      .catch(() => {
        setAuthorized(false);
        setCompanies([]);
      });
  }, []);

  if (authorized === null) {
    return (
      <div>
        <PageHeader
          eyebrow="Platform"
          title="Platform Admin"
          subtitle="Loading…"
        />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div>
        <PageHeader
          eyebrow="Platform"
          title="Platform Admin"
          subtitle="Restricted area."
        />
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Access denied"
          description="This page is only available to platform administrators."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Platform Admin"
        subtitle="All companies on the Adapt platform."
      />

      {companies === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="No companies"
          description="Companies will appear here as they sign up."
        />
      ) : (
        <div className="glass divide-y divide-border overflow-hidden rounded-2xl">
          {companies.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.15) }}
              className="px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{company.name}</p>
                  <p className="text-xs text-ink-tertiary">
                    {company.slug} · Created {formatDate(company.createdAt)}
                  </p>
                </div>
                <Badge tone="accent">{company.plan}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-secondary">
                <span className="inline-flex items-center gap-1">
                  <Users size={12} />
                  {company._count.memberships} members
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={12} />
                  {company._count.drivers} drivers
                </span>
                <span className="inline-flex items-center gap-1">
                  <Truck size={12} />
                  {company._count.trucks} trucks
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {company.enabledModules.map((mod) => (
                  <Badge key={mod} tone="neutral" className="!text-[10px]">
                    {MODULES[mod].label}
                  </Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
