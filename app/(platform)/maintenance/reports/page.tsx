"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Card } from "@/src/components/ui/Card";
import { StatCard } from "@/src/components/ui/StatCard";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { CpmAnalytics } from "@/src/components/fleet/CpmAnalytics";
import { api } from "@/src/lib/client";
import { formatCurrency } from "@/src/lib/format";

interface ReportData {
  rangeDays: number;
  totalSpend: number;
  byTruck: { truckId: string; unitNumber: string; spend: number; count: number }[];
  byVendor: { name: string; spend: number; count: number }[];
}

export default function ReportsPage() {
  const [range, setRange] = useState("90d");
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    api<ReportData>(`/api/analytics/maintenance-reports?range=${range}`)
      .then(setData)
      .catch(() =>
        setData({ rangeDays: 90, totalSpend: 0, byTruck: [], byVendor: [] })
      );
  }, [range]);

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance"
        title="Reports"
        subtitle="Cost per mile, spend by unit, and vendor totals for your fleet."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ["30d", "30 days"],
          ["90d", "90 days"],
          ["365d", "12 months"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setRange(key)}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              range === key
                ? "bg-accent text-accent-text"
                : "bg-surface-solid text-ink-secondary ring-1 ring-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {!data ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label={`Spend · ${data.rangeDays}d`}
              value={formatCurrency(data.totalSpend)}
              icon={<BarChart3 size={17} />}
              tone="accent"
            />
            <StatCard
              label="Units with spend"
              value={data.byTruck.length}
              tone="default"
            />
            <StatCard
              label="Vendors used"
              value={data.byVendor.length}
              tone="violet"
            />
          </>
        )}
      </div>

      <div className="mb-8">
        <CpmAnalytics refreshKey={range === "30d" ? 30 : range === "365d" ? 365 : 90} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Cost by unit</h2>
          {!data ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : data.byTruck.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-tertiary">No spend in range.</p>
          ) : (
            <div className="space-y-2">
              {data.byTruck.slice(0, 15).map((row) => (
                <div
                  key={row.truckId}
                  className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">Unit {row.unitNumber}</p>
                    <p className="text-xs text-ink-tertiary">{row.count} records</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(row.spend)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Cost by vendor</h2>
          {!data ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : data.byVendor.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-tertiary">
              No completed work orders with vendors in range.
            </p>
          ) : (
            <div className="space-y-2">
              {data.byVendor.slice(0, 15).map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{row.name}</p>
                    <p className="text-xs text-ink-tertiary">{row.count} WOs</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(row.spend)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
