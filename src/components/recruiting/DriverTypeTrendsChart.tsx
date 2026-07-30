"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users } from "lucide-react";

const DEFAULT_SERIES = ["Owner Operator", "Lease Purchase", "Company Driver"];
const COLORS = ["var(--accent)", "var(--violet)", "var(--success)", "var(--warning)"];

function formatPeriod(raw: string) {
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  }
  return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DriverTypeTrendsChart({
  data,
  title,
  series = DEFAULT_SERIES,
  showControls = false,
}: {
  data: Record<string, number | string>[];
  title: string;
  series?: string[];
  showControls?: boolean;
}) {
  const [period, setPeriod] = useState<"week" | "month">("week");

  const chartData = useMemo(
    () =>
      data.map((row) => ({
        ...row,
        label: formatPeriod(String(row.period)),
      })),
    [data]
  );

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-ink-tertiary">
        <Users size={28} className="mb-2 opacity-40" />
        <p className="text-sm">No onboarding trend data yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        {showControls && (
          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {(["week", "month"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                  period === p ? "bg-accent text-accent-text" : "text-ink-secondary"
                }`}
              >
                {p === "week" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
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
            {series.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.25}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
