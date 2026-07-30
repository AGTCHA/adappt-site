"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Percent, UserX } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { StatCard } from "@/src/components/ui/StatCard";
import { api } from "@/src/lib/client";
import { formatRelative } from "@/src/lib/format";

interface RetentionData {
  activeCount: number;
  churnedCount: number;
  retentionRate: number;
  avgTenureDays: number;
  byDriverType: { type: string; active: number; churned: number; retention: number }[];
  recentChurn: { id: string; name: string; reason: string; leftAt: string | null; hireSource: string }[];
}

export function RetentionPanel() {
  const [data, setData] = useState<RetentionData | null>(null);

  useEffect(() => {
    api<{ retentionAnalysis: RetentionData }>("/api/analytics/recruiting-performance")
      .then((res) => setData(res.retentionAnalysis))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Retention & churn</h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active drivers" value={data.activeCount} tone="success" />
        <StatCard label="Churned" value={data.churnedCount} tone="warning" icon={<UserX size={17} />} />
        <StatCard label="Retention rate" value={`${data.retentionRate}%`} tone="accent" icon={<Percent size={17} />} />
        <StatCard label="Avg tenure" value={`${data.avgTenureDays}d`} sub="active drivers" tone="default" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h4 className="mb-3 text-sm font-semibold">By driver type</h4>
          <ul className="space-y-3">
            {data.byDriverType.map((row) => (
              <li key={row.type}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{row.type}</span>
                  <span className="font-semibold tabular-nums">{row.retention}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                  <div
                    className={`h-full rounded-full ${
                      row.retention >= 80 ? "bg-success" : row.retention >= 50 ? "bg-warning" : "bg-danger"
                    }`}
                    style={{ width: `${row.retention}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h4 className="mb-3 text-sm font-semibold">Recent churn</h4>
          {data.recentChurn.length === 0 ? (
            <p className="text-sm text-ink-secondary">No recent churn recorded.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentChurn.map((d) => (
                <li key={d.id}>
                  <Link href={`/drivers/${d.id}`} className="block rounded-xl px-2 py-2 hover:bg-accent-soft/40">
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-ink-tertiary">
                      {d.reason}
                      {d.leftAt ? ` · ${formatRelative(d.leftAt)}` : ""} · {d.hireSource}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
