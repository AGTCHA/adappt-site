"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Layers,
  Package,
  Plus,
  Search,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { StatCard } from "@/src/components/ui/StatCard";
import { api } from "@/src/lib/client";
import { formatCurrency } from "@/src/lib/format";
import {
  LOAD_STATUS_LABEL,
  type LoadStatus,
} from "@/src/lib/tms/constants";

interface DashboardData {
  stats: {
    activeLoads: number;
    deliveredThisWeek: number;
    revenueThisWeek: number;
    outstandingAR: number;
  };
  tasks: { id: string; title: string; link: string; priority: string }[];
  pipeline: { status: string; count: number }[];
}

const pipelineTone: Record<string, "neutral" | "accent" | "warning" | "success" | "danger"> = {
  pending: "accent",
  assigned: "warning",
  in_transit: "warning",
  delivered: "success",
  cancelled: "neutral",
};

const quickLinks = [
  { label: "Planning", href: "/tms/planning", icon: <Layers size={17} /> },
  { label: "Dispatch", href: "/tms/dispatch", icon: <Truck size={17} /> },
  { label: "Fleet", href: "/fleet", icon: <Truck size={17} /> },
  { label: "Load Board", href: "/tms/load-board", icon: <Search size={17} /> },
  { label: "Invoices", href: "/tms/invoices", icon: <FileText size={17} /> },
];

export default function TmsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api<DashboardData>("/api/tms/dashboard")
      .then(setData)
      .catch(() => {
        setError(true);
        setData({
          stats: { activeLoads: 0, deliveredThisWeek: 0, revenueThisWeek: 0, outstandingAR: 0 },
          tasks: [],
          pipeline: [],
        });
      });
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Dashboard"
        subtitle="Real-time overview of your transportation operations."
        actions={
          <Link href="/tms/loads">
            <Button icon={<Plus size={15} />}>Create a load</Button>
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {!data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Active loads"
              value={data.stats.activeLoads}
              sub="in pipeline now"
              icon={<Package size={17} />}
              tone="accent"
            />
            <StatCard
              label="Delivered this week"
              value={data.stats.deliveredThisWeek}
              sub="completed deliveries"
              icon={<CheckCircle size={17} />}
              tone="success"
              delay={0.05}
            />
            <StatCard
              label="Revenue this week"
              value={formatCurrency(data.stats.revenueThisWeek)}
              sub="invoiced + pending"
              icon={<DollarSign size={17} />}
              tone="violet"
              delay={0.1}
            />
            <StatCard
              label="Outstanding AR"
              value={formatCurrency(data.stats.outstandingAR)}
              sub="unpaid invoices"
              icon={<Clock size={17} />}
              tone="warning"
              delay={0.15}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold">Pipeline</h3>
          {!data ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          ) : data.pipeline.length === 0 ? (
            <p className="text-sm text-ink-secondary">No loads in pipeline.</p>
          ) : (
            <div className="space-y-2">
              {data.pipeline.map((p) => (
                <Link
                  key={p.status}
                  href={`/tms/loads?view=${p.status}`}
                  className="focus-ring flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors hover:bg-accent-soft"
                >
                  <span className="flex items-center gap-2">
                    <Badge tone={pipelineTone[p.status] ?? "neutral"}>
                      {LOAD_STATUS_LABEL[p.status as LoadStatus] ?? p.status}
                    </Badge>
                  </span>
                  <span className="text-sm font-semibold text-ink">{p.count}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Tasks */}
        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold">Tasks</h3>
          {!data ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-xl" />
              ))}
            </div>
          ) : data.tasks.length === 0 ? (
            <p className="text-sm text-ink-secondary">You&apos;re all caught up.</p>
          ) : (
            <div className="space-y-1.5">
              {data.tasks.map((t) => (
                <Link
                  key={t.id}
                  href={t.link}
                  className="focus-ring flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-accent-soft"
                >
                  <span className="truncate text-ink-secondary">{t.title}</span>
                  <ArrowRight size={14} className="shrink-0 text-ink-tertiary" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card hover className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                {link.icon}
              </span>
              <span className="text-sm font-medium">{link.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty CTA */}
      {data && data.stats.activeLoads === 0 && !error && (
        <div className="mt-10">
          <EmptyState
            icon={<Package size={24} />}
            title="No active loads"
            description="Create your first load to start managing freight from pickup to delivery."
            action={
              <Link href="/tms/loads">
                <Button icon={<Plus size={15} />}>Create a load</Button>
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
