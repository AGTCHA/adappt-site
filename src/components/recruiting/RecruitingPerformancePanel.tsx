"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Percent, Target, TrendingUp, UserCheck, UserX, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { StatCard } from "@/src/components/ui/StatCard";

interface PerformanceDriver {
  id: string;
  name: string;
  phone: string;
  email: string;
  driverType: string;
  division: string;
  hireSource: string;
  hiredAt: string | null;
  leftAt: string | null;
  terminalReason: string;
  isActive: boolean;
  isLeft: boolean;
}

export interface PerformanceData {
  totalHired: number;
  stillActive: number;
  quitLeft: number;
  retentionRate: number;
  retentionBySource: {
    source: string;
    hired: number;
    active: number;
    left: number;
    retention: number;
  }[];
  weeklyData: { week: string; hires: number; label: string }[];
  drivers: PerformanceDriver[];
}

export function RecruitingPerformancePanel({ data }: { data: PerformanceData }) {
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!sourceFilter) return data.drivers;
    return data.drivers.filter((d) => d.hireSource === sourceFilter);
  }, [data.drivers, sourceFilter]);

  function exportCsv() {
    const headers = ["Name", "Phone", "Email", "Driver Type", "Route", "Hire Source", "Hired", "Status", "Left", "Reason"];
    const rows = filtered.map((d) => [
      d.name,
      d.phone,
      d.email,
      d.driverType,
      d.division,
      d.hireSource,
      d.hiredAt?.slice(0, 10) ?? "",
      d.isActive && !d.isLeft ? "Active" : d.isLeft ? "Left" : "Hired",
      d.leftAt?.slice(0, 10) ?? "",
      d.terminalReason,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recruiting-performance.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total hired" value={data.totalHired} icon={<Users size={17} />} tone="accent" />
        <StatCard label="Still active" value={data.stillActive} icon={<UserCheck size={17} />} tone="success" />
        <StatCard label="Quit / left" value={data.quitLeft} icon={<UserX size={17} />} tone="warning" />
        <StatCard
          label="Retention rate"
          value={`${data.retentionRate.toFixed(1)}%`}
          sub="Drivers who stayed"
          icon={<Percent size={17} />}
          tone="accent"
        />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={16} />
          <h3 className="text-sm font-semibold">Weekly hiring trend</h3>
        </div>
        {data.weeklyData.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-tertiary">No hires recorded yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyData}>
                <defs>
                  <linearGradient id="hireGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
                <Area type="monotone" dataKey="hires" name="Hires" stroke="var(--accent)" fill="url(#hireGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Target size={16} />
          <h3 className="text-sm font-semibold">Retention by hire source</h3>
        </div>
        <ul className="space-y-3">
          {data.retentionBySource.map((row) => (
            <li key={row.source}>
              <button
                type="button"
                onClick={() => setSourceFilter((p) => (p === row.source ? null : row.source))}
                className="w-full text-left"
              >
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{row.source}</span>
                  <span
                    className={`font-bold tabular-nums ${
                      row.retention >= 80 ? "text-success" : row.retention >= 50 ? "text-warning" : "text-danger"
                    }`}
                  >
                    {row.retention}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${row.retention}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-tertiary">
                  {row.active} active · {row.left} left · {row.hired} hired
                </p>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">Hired drivers</h3>
            {sourceFilter && (
              <p className="text-xs text-ink-tertiary">
                Filtered by {sourceFilter}{" "}
                <button type="button" className="text-accent underline" onClick={() => setSourceFilter(null)}>
                  clear
                </button>
              </p>
            )}
          </div>
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-tertiary">
                <th className="px-5 py-3 font-semibold">Driver</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Source</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-border/60 hover:bg-accent-soft/20">
                  <td className="px-5 py-3">
                    <Link href={`/drivers/${d.id}`} className="font-medium hover:text-accent">
                      {d.name}
                    </Link>
                    <p className="text-xs text-ink-tertiary">{d.phone || d.email}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">{d.driverType}</td>
                  <td className="px-5 py-3 text-ink-secondary">{d.hireSource}</td>
                  <td className="px-5 py-3">
                    <Badge tone={d.isActive && !d.isLeft ? "success" : d.isLeft ? "warning" : "accent"}>
                      {d.isActive && !d.isLeft ? "Active" : d.isLeft ? "Left" : "Hired"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
