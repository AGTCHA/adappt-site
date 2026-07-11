"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";
import { formatCurrency, formatNumber } from "@/src/lib/format";

interface CpmData {
  total: number;
  preventative: number;
  accident: number;
  milesTracked: number;
  cpm: number | null;
  trucks: { truckId: string; unitNumber: string; cost: number; miles: number; cpm: number | null }[];
  series: { month: string; preventative: number; accident: number }[];
  recordCount: number;
}

const ranges = [
  { key: "7d", label: "Last week" },
  { key: "30d", label: "Last month" },
  { key: "90d", label: "90 days" },
  { key: "ytd", label: "YTD" },
  { key: "12m", label: "12 months" },
];

export function CpmAnalytics({ refreshKey }: { refreshKey: number }) {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<CpmData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<CpmData>(`/api/analytics/cpm?range=${range}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range, refreshKey]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto">
        {ranges.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={`focus-ring shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              range === r.key
                ? "bg-accent text-accent-text"
                : "text-ink-secondary hover:bg-accent-soft"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !data || data.recordCount === 0 ? (
        <EmptyState
          icon={<TrendingUp size={24} />}
          title="No maintenance data yet"
          description="Log a few maintenance invoices (with odometer readings) and your cost-per-mile will appear here automatically."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-medium text-ink-secondary">Cost per mile</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight">
                {data.cpm !== null ? `${data.cpm.toFixed(1)}¢` : "—"}
              </p>
              {data.cpm === null && (
                <p className="mt-1 text-xs text-ink-tertiary">
                  Add odometer readings to invoices to unlock
                </p>
              )}
            </Card>
            <Card delay={0.05} className="p-5">
              <p className="text-xs font-medium text-ink-secondary">Total spend</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight">
                {formatCurrency(data.total)}
              </p>
            </Card>
            <Card delay={0.1} className="p-5">
              <p className="text-xs font-medium text-ink-secondary">Preventative</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight text-success">
                {formatCurrency(data.preventative)}
              </p>
            </Card>
            <Card delay={0.15} className="p-5">
              <p className="text-xs font-medium text-ink-secondary">Accident repairs</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight text-danger">
                {formatCurrency(data.accident)}
              </p>
            </Card>
          </div>

          {data.series.length > 0 && (
            <Card delay={0.2} className="p-6">
              <h3 className="mb-4 text-sm font-semibold">Spend by month</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.series} barCategoryGap="30%">
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "var(--text-tertiary)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "var(--text-tertiary)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${formatNumber(v)}`}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--accent-soft)" }}
                      contentStyle={{
                        background: "var(--surface-raised)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 13,
                        color: "var(--text)",
                      }}
                      formatter={(value) => formatCurrency(Number(value ?? 0), 2)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="preventative" name="Preventative" stackId="a" fill="var(--success)" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="accident" name="Accident" stackId="a" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card delay={0.25} className="overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold">Per truck</h3>
            </div>
            <div className="divide-y divide-border">
              {data.trucks.map((truck) => (
                <div key={truck.truckId} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <span className="text-sm font-medium">Unit {truck.unitNumber}</span>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-ink-secondary">
                      {truck.miles > 0 ? `${formatNumber(truck.miles)} mi tracked` : "no odometer data"}
                    </span>
                    <span className="font-medium">{formatCurrency(truck.cost)}</span>
                    <span className="w-16 text-right font-semibold text-accent">
                      {truck.cpm !== null ? `${truck.cpm.toFixed(1)}¢/mi` : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
