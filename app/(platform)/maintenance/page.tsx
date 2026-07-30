"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  FileText,
  Plus,
  Truck,
  Wrench,
  DollarSign,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { StatCard } from "@/src/components/ui/StatCard";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";
import { formatCurrency, formatRelative } from "@/src/lib/format";

interface DashData {
  openWos: number;
  inProgressWos: number;
  trucksInShop: number;
  pendingDocs: number;
  spend30d: number;
  invoices30d: number;
  overduePm: number;
  dueSoonPm: number;
  recentWos: {
    id: string;
    woNumber: string;
    title: string;
    status: string;
    totalAmount: number;
    updatedAt: string;
    truck: { unitNumber: string };
    vendor: { name: string } | null;
  }[];
}

const statusTone: Record<string, "accent" | "warning" | "success" | "neutral"> = {
  open: "accent",
  in_progress: "warning",
  completed: "success",
  cancelled: "neutral",
};

export default function MaintenanceDashboardPage() {
  const [data, setData] = useState<DashData | null>(null);

  useEffect(() => {
    api<DashData>("/api/maintenance/dashboard")
      .then(setData)
      .catch(() =>
        setData({
          openWos: 0,
          inProgressWos: 0,
          trucksInShop: 0,
          pendingDocs: 0,
          spend30d: 0,
          invoices30d: 0,
          overduePm: 0,
          dueSoonPm: 0,
          recentWos: [],
        })
      );
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance"
        title="Maintenance"
        subtitle="Work orders, PM, invoices, and fleet spend — in one place."
        actions={
          <>
            <Link href="/maintenance/documents">
              <Button variant="secondary" icon={<FileText size={15} />}>
                Upload invoice
              </Button>
            </Link>
            <Link href="/maintenance/work-orders">
              <Button icon={<Plus size={15} />}>New work order</Button>
            </Link>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        {!data ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Open WOs"
              value={data.openWos + data.inProgressWos}
              sub={`${data.inProgressWos} in progress`}
              icon={<Wrench size={17} />}
              tone="accent"
              onClick={() => (window.location.href = "/maintenance/work-orders")}
            />
            <StatCard
              label="In the shop"
              value={data.trucksInShop}
              sub="units"
              icon={<Truck size={17} />}
              tone={data.trucksInShop > 0 ? "warning" : "default"}
              onClick={() => (window.location.href = "/maintenance/units")}
            />
            <StatCard
              label="Overdue PM"
              value={data.overduePm}
              sub={data.dueSoonPm > 0 ? `${data.dueSoonPm} due soon` : "on schedule"}
              icon={<AlertTriangle size={17} />}
              tone={data.overduePm > 0 ? "danger" : "success"}
              onClick={() => (window.location.href = "/maintenance/service")}
            />
            <StatCard
              label="Pending docs"
              value={data.pendingDocs}
              sub="need review"
              icon={<FileText size={17} />}
              tone={data.pendingDocs > 0 ? "violet" : "default"}
              onClick={() => (window.location.href = "/maintenance/documents")}
            />
            <StatCard
              label="Spend · 30d"
              value={formatCurrency(data.spend30d)}
              sub={`${data.invoices30d} invoices`}
              icon={<DollarSign size={17} />}
              tone="default"
              onClick={() => (window.location.href = "/maintenance/reports")}
            />
            <StatCard
              label="Service"
              value={data.dueSoonPm + data.overduePm}
              sub="need attention"
              icon={<Calendar size={17} />}
              tone="warning"
              delay={0.05}
              onClick={() => (window.location.href = "/maintenance/service")}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Recent work orders</h2>
            <Link
              href="/maintenance/work-orders"
              className="focus-ring flex items-center gap-1 text-xs font-semibold text-accent"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {!data ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : data.recentWos.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-tertiary">
              No work orders yet. Create one or apply an invoice.
            </p>
          ) : (
            <div className="space-y-2">
              {data.recentWos.map((wo, i) => (
                <motion.div
                  key={wo.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={`/maintenance/work-orders/${wo.id}`}
                    className="focus-ring flex items-center gap-3 rounded-xl border border-border/70 bg-surface-solid/60 px-3.5 py-3 hover:border-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-accent">
                          {wo.woNumber || "WO"}
                        </span>
                        <Badge tone={statusTone[wo.status] ?? "neutral"}>{wo.status}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-ink">{wo.title}</p>
                      <p className="truncate text-xs text-ink-secondary">
                        Unit {wo.truck.unitNumber}
                        {wo.vendor ? ` · ${wo.vendor.name}` : ""} · {formatRelative(wo.updatedAt)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">
                      {formatCurrency(wo.totalAmount)}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Quick links</h2>
          <div className="space-y-2">
            {[
              { href: "/maintenance/units", label: "Units", desc: "Trucks & profiles" },
              { href: "/maintenance/documents", label: "Documents", desc: "Invoice inbox" },
              { href: "/maintenance/service", label: "PM schedule", desc: "Overdue & upcoming" },
              { href: "/maintenance/vendors", label: "Vendors", desc: "Shops & spend" },
              { href: "/maintenance/reports", label: "Reports", desc: "CPM & cost" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-accent-soft"
              >
                <span>
                  <span className="block text-sm font-semibold text-ink">{item.label}</span>
                  <span className="text-xs text-ink-tertiary">{item.desc}</span>
                </span>
                <ArrowRight size={14} className="text-accent" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
