"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Rocket,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  Pie,
  PieChart,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { StatCard } from "@/src/components/ui/StatCard";
import { api } from "@/src/lib/client";
import { DriverTypeTrendsChart } from "@/src/components/recruiting/DriverTypeTrendsChart";

interface VelocityRow {
  id: string;
  name: string;
  stage: string;
  stageLabel: string;
  driverType: string;
  division: string;
  phone: string;
  daysInStage: number;
  totalDays: number;
  velocity: string;
}

interface PipelineData {
  activePipeline: number;
  avgTimeToHire: number;
  fastMovers: number;
  needsAttention: number;
  velocity: VelocityRow[];
  hireSourceStats: { source: string; count: number }[];
}

type Tab = "driverType" | "division" | "hireSources";

const PIE_COLORS = [
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--violet)",
  "var(--danger)",
  "#94a3b8",
];

function VelocityRowItem({
  driver,
  metricDays,
  metricLabel,
}: {
  driver: VelocityRow;
  metricDays: number;
  metricLabel: string;
}) {
  return (
    <Link
      href={`/drivers/${driver.id}`}
      className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent-soft/40"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{driver.name}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {driver.driverType !== "Unknown" && (
            <Badge tone="accent" className="!text-[10px]">
              {driver.driverType}
            </Badge>
          )}
          {driver.division !== "Unknown" && (
            <Badge tone="neutral" className="!text-[10px]">
              {driver.division}
            </Badge>
          )}
          <span className="text-[11px] text-ink-tertiary">{driver.stageLabel}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">{Math.round(metricDays)}d</p>
        <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">{metricLabel}</p>
      </div>
      <ArrowRight size={14} className="text-ink-tertiary" />
    </Link>
  );
}

export function PipelineAnalyticsPanel({ embedded }: { embedded?: boolean }) {
  const [data, setData] = useState<PipelineData | null>(null);
  const [trends, setTrends] = useState<{
    driverTypeTrends: Record<string, number | string>[];
    divisionTrends: Record<string, number | string>[];
  } | null>(null);
  const [tab, setTab] = useState<Tab>("driverType");

  useEffect(() => {
    Promise.all([
      api<PipelineData>("/api/analytics/pipeline-velocity"),
      api<{ driverTypeTrends: Record<string, number | string>[]; divisionTrends: Record<string, number | string>[] }>(
        "/api/recruiting/hire-sources-analytics?period=week&range=6months"
      ),
    ])
      .then(([velocity, hire]) => {
        setData(velocity);
        setTrends(hire);
      })
      .catch(() => {
        setData(null);
        setTrends(null);
      });
  }, []);

  const fast = useMemo(
    () => data?.velocity.filter((d) => d.velocity === "fast") ?? [],
    [data]
  );
  const slow = useMemo(
    () => data?.velocity.filter((d) => d.velocity === "slow") ?? [],
    [data]
  );

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active pipeline" value={data.activePipeline} sub="In progress" icon={<BarChart3 size={17} />} tone="accent" />
        <StatCard
          label="Avg time to hire"
          value={data.avgTimeToHire > 0 ? `${data.avgTimeToHire}d` : "—"}
          sub="Fast movers"
          icon={<Clock size={17} />}
          tone="success"
        />
        <StatCard label="Fast movers" value={data.fastMovers} sub="≤ 7 days" icon={<Rocket size={17} />} tone="success" />
        <StatCard
          label="Needs attention"
          value={data.needsAttention}
          sub="≥ 6 days in stage"
          icon={<AlertTriangle size={17} />}
          tone={data.needsAttention > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Rocket size={16} className="text-success" />
              <div>
                <h3 className="text-sm font-semibold">Fast movers</h3>
                <p className="text-xs text-ink-tertiary">Hired in ≤ 7 days</p>
              </div>
            </div>
            <span className="text-xs font-semibold tabular-nums">{fast.length}</span>
          </div>
          <div className="max-h-72 divide-y divide-border overflow-y-auto">
            {fast.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ink-tertiary">No fast movers in the last 90 days</p>
            ) : (
              fast.slice(0, 8).map((d) => (
                <VelocityRowItem key={d.id} driver={d} metricDays={d.totalDays} metricLabel="to hire" />
              ))
            )}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className={slow.length ? "text-warning" : "text-ink-tertiary"} />
              <div>
                <h3 className="text-sm font-semibold">Needs attention</h3>
                <p className="text-xs text-ink-tertiary">Stuck ≥ 6 days</p>
              </div>
            </div>
            <span className="text-xs font-semibold tabular-nums">{slow.length}</span>
          </div>
          <div className="max-h-72 divide-y divide-border overflow-y-auto">
            {slow.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-success" />
                <p className="text-sm font-medium">All drivers moving smoothly</p>
              </div>
            ) : (
              slow.slice(0, 8).map((d) => (
                <VelocityRowItem key={d.id} driver={d} metricDays={d.daysInStage} metricLabel="in stage" />
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} />
            <div>
              <h3 className="text-sm font-semibold">Pipeline analytics</h3>
              <p className="text-xs text-ink-tertiary">Onboarding trends & hire sources</p>
            </div>
          </div>
          <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
            {(
              [
                { id: "driverType" as Tab, label: "By driver type" },
                { id: "division" as Tab, label: "By route" },
                { id: "hireSources" as Tab, label: "Hire sources" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  tab === t.id ? "bg-accent text-accent-text" : "text-ink-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-[320px]">
          {tab === "driverType" && trends && (
            <DriverTypeTrendsChart data={trends.driverTypeTrends} title="Onboarding by driver type" />
          )}
          {tab === "division" && trends && (
            <DriverTypeTrendsChart
              data={trends.divisionTrends}
              title="Onboarding by route preference"
              series={["Local", "Regional", "OTR"]}
            />
          )}
          {tab === "hireSources" && (
            data.hireSourceStats.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.hireSourceStats}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {data.hireSourceStats.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface-raised)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 13,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-ink-tertiary">No hire source data yet</p>
            )
          )}
        </div>
      </Card>

      {!embedded && (
        <div className="flex justify-end">
          <Link href="/drivers/pipeline" className="text-sm font-semibold text-accent hover:underline">
            Open pipeline →
          </Link>
        </div>
      )}
    </div>
  );
}
