"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, AlertTriangle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { StatCard } from "@/src/components/ui/StatCard";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatRelative } from "@/src/lib/format";
import Link from "next/link";

type Event = {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  driverName: string;
  message: string;
  at: string;
};

export default function TmsSafetyPage() {
  const toast = useToast();
  const [data, setData] = useState<{
    summary: {
      eventsThisWeek: number;
      atRiskDrivers: number;
      inTransitLoads: number;
      deliveredThisWeek: number;
      telematicsConnected: boolean;
    };
    events: Event[];
    note: string;
  } | null>(null);

  const load = useCallback(() => {
    api<NonNullable<typeof data>>("/api/tms/safety")
      .then(setData)
      .catch((e: Error) => {
        toast("error", "Failed to load safety", e.message);
        setData({
          summary: {
            eventsThisWeek: 0,
            atRiskDrivers: 0,
            inTransitLoads: 0,
            deliveredThisWeek: 0,
            telematicsConnected: false,
          },
          events: [],
          note: "",
        });
      });
  }, [toast]);

  useEffect(load, [load]);

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Safety & Compliance"
        subtitle="Credential risk, in-transit alerts, and telematics-ready safety events."
        actions={
          <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={load}>
            Refresh
          </Button>
        }
      />

      {!data ? (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Open signals"
              value={data.summary.eventsThisWeek}
              icon={<AlertTriangle size={17} />}
              tone="warning"
            />
            <StatCard
              label="At-risk drivers"
              value={data.summary.atRiskDrivers}
              icon={<Shield size={17} />}
              tone="danger"
            />
            <StatCard
              label="In transit"
              value={data.summary.inTransitLoads}
              tone="accent"
            />
            <StatCard
              label="Delivered (7d)"
              value={data.summary.deliveredThisWeek}
              tone="success"
            />
          </div>

          {!data.summary.telematicsConnected && (
            <div className="mb-4 rounded-2xl border border-border bg-accent-soft/40 px-4 py-3 text-sm text-ink-secondary">
              {data.note}{" "}
              <Link href="/tms/settings" className="font-medium text-accent">
                Open TMS Settings
              </Link>
            </div>
          )}

          <div className="glass overflow-hidden rounded-2xl">
            <div className="border-b border-border px-4 py-3 text-sm font-semibold">
              Events
            </div>
            {data.events.length === 0 ? (
              <EmptyState
                icon={<Shield size={22} />}
                title="No safety signals"
                description="Credential expirations and unassigned in-transit loads will appear here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {data.events.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-start justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          tone={
                            ev.severity === "critical"
                              ? "danger"
                              : ev.severity === "warning"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {ev.severity}
                        </Badge>
                        <span className="text-sm font-medium">{ev.driverName}</span>
                      </div>
                      <p className="mt-1 text-sm text-ink-secondary">{ev.message}</p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-tertiary">
                      {formatRelative(ev.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
