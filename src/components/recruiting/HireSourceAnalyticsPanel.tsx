"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Lightbulb, Search } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Field";
import { DriverTypeTrendsChart } from "@/src/components/recruiting/DriverTypeTrendsChart";
import { RetentionPanel } from "@/src/components/recruiting/RetentionPanel";

interface HireSourceAnalyticsProps {
  stats: { source: string; count: number }[];
  monthly: { month: string; sources: Record<string, number>; total: number }[];
  insights: { type: "success" | "warning" | "info"; text: string }[];
  driverTypeTrends: Record<string, number | string>[];
  divisionTrends: Record<string, number | string>[];
  driverSearch: {
    id: string;
    name: string;
    phone: string;
    email: string;
    hireSource: string;
    pipelineStage: string;
  }[];
  totalHired: number;
  searchQuery: string;
  onSearchQuery: (q: string) => void;
}

const BAR_COLORS = ["var(--accent)", "var(--success)", "var(--warning)", "var(--violet)"];

export function HireSourceAnalyticsPanel({
  stats,
  monthly,
  insights,
  driverTypeTrends,
  divisionTrends,
  driverSearch,
  totalHired,
  searchQuery,
  onSearchQuery,
}: HireSourceAnalyticsProps) {
  const maxStat = Math.max(...stats.map((s) => s.count), 1);

  const monthlyChart = monthly.map((m) => ({
    month: new Date(`${m.month}-01`).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    ...m.sources,
    total: m.total,
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">Source distribution</h3>
          {stats.length === 0 ? (
            <p className="text-sm text-ink-secondary">No hire data yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.map((row, i) => (
                <li key={row.source}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{row.source}</span>
                    <span className="text-ink-tertiary">
                      {row.count} · {Math.round((row.count / totalHired) * 100) || 0}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(row.count / maxStat) * 100}%`,
                        background: BAR_COLORS[i % BAR_COLORS.length],
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-warning" />
            <h3 className="text-sm font-semibold">Insights</h3>
          </div>
          <ul className="space-y-2">
            {insights.map((item, i) => (
              <li
                key={i}
                className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  item.type === "success"
                    ? "bg-success-soft text-success"
                    : item.type === "warning"
                      ? "bg-warning-soft text-warning"
                      : "bg-accent-soft text-accent"
                }`}
              >
                {item.text}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {monthlyChart.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Monthly hires by source</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {stats.slice(0, 5).map((s, i) => (
                  <Bar key={s.source} dataKey={s.source} stackId="a" fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {stats.slice(0, 6).map((row) => (
          <Card key={row.source} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{row.source}</p>
                <p className="text-xs text-ink-tertiary">{row.count} hired drivers</p>
              </div>
              <Badge tone="accent">{Math.round((row.count / Math.max(totalHired, 1)) * 100)}%</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Driver drill-down</h3>
            <p className="text-xs text-ink-tertiary">Search hired drivers by name, phone, or source</p>
          </div>
          <div className="relative min-w-56 flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <Input
              className="pl-9"
              placeholder="Search drivers…"
              value={searchQuery}
              onChange={(e) => onSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {searchQuery.length >= 2 ? (
          driverSearch.length === 0 ? (
            <p className="text-sm text-ink-secondary">No drivers match.</p>
          ) : (
            <ul className="divide-y divide-border">
              {driverSearch.map((d) => (
                <li key={d.id}>
                  <Link href={`/drivers/${d.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-accent">
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-ink-tertiary">
                        {d.hireSource} · {d.pipelineStage}
                      </p>
                    </div>
                    <span className="text-xs text-ink-secondary">{d.phone || d.email}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="text-sm text-ink-tertiary">Enter at least 2 characters to search.</p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <DriverTypeTrendsChart data={driverTypeTrends} title="Onboarding by driver type" />
        </Card>
        <Card className="p-5">
          <DriverTypeTrendsChart
            data={divisionTrends}
            title="Onboarding by route"
            series={["Local", "Regional", "OTR"]}
          />
        </Card>
      </div>

      <RetentionPanel />
    </div>
  );
}
