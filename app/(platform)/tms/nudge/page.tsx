"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, RefreshCw, Send } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { StatCard } from "@/src/components/ui/StatCard";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

type Row = {
  loadId: string;
  loadNumber: string;
  origin: string;
  destination: string;
  status: string;
  urgency: "critical" | "urgent" | "recommended" | "ok";
  hoursToDelivery: number | null;
  suggestion: string;
  driver: { id: string; firstName: string; lastName: string; phone: string } | null;
  truck: { id: string; unitNumber: string } | null;
};

const URGENCY_TONE = {
  critical: "danger",
  urgent: "warning",
  recommended: "accent",
  ok: "neutral",
} as const;

export default function TmsNudgePage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [summary, setSummary] = useState({
    total: 0,
    critical: 0,
    urgent: 0,
    recommended: 0,
  });
  const [filter, setFilter] = useState<string>("all");
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ summary: typeof summary; rows: Row[] }>("/api/tms/nudge")
      .then((res) => {
        setSummary(res.summary);
        setRows(res.rows);
      })
      .catch((e: Error) => {
        toast("error", "Failed to load risk board", e.message);
        setRows([]);
      });
  }, [toast]);

  useEffect(load, [load]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    if (filter === "all") return rows;
    return rows.filter((r) => r.urgency === filter);
  }, [rows, filter]);

  async function sendNudge(row: Row) {
    setSending(row.loadId);
    try {
      await api("/api/tms/nudge", {
        method: "POST",
        json: {
          loadId: row.loadId,
          driverId: row.driver?.id,
          body: row.suggestion,
        },
      });
      toast("success", `Nudge sent for ${row.loadNumber}`);
    } catch (e) {
      toast(
        "error",
        "Failed to send nudge",
        e instanceof Error ? e.message : undefined,
      );
    } finally {
      setSending(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="HOS Nudge / Risk Board"
        subtitle="Prioritize at-risk loads and nudge drivers from one board."
        actions={
          <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={load}>
            Refresh
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active loads" value={summary.total} icon={<BellRing size={17} />} />
        <StatCard label="Critical" value={summary.critical} tone="danger" />
        <StatCard label="Urgent" value={summary.urgent} tone="warning" />
        <StatCard label="Recommended" value={summary.recommended} tone="accent" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "critical", "urgent", "recommended", "ok"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              filter === f
                ? "bg-accent text-accent-text"
                : "bg-surface-solid text-ink-secondary ring-1 ring-border"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {!filtered ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BellRing size={22} />}
          title="No loads on the risk board"
          description="Assigned and in-transit loads will appear here ranked by delivery urgency."
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="grid grid-cols-[1fr_1.2fr_1fr_0.7fr_0.7fr_1.4fr_auto] gap-2 border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
            <span>Load</span>
            <span>Lane</span>
            <span>Driver</span>
            <span>Status</span>
            <span>Urgency</span>
            <span>Suggestion</span>
            <span />
          </div>
          {filtered.map((row) => (
            <div
              key={row.loadId}
              className="grid grid-cols-[1fr_1.2fr_1fr_0.7fr_0.7fr_1.4fr_auto] items-center gap-2 border-b border-border px-4 py-3 text-sm last:border-0"
            >
              <Link
                href={`/tms/loads/${row.loadId}`}
                className="font-semibold text-accent hover:underline"
              >
                {row.loadNumber}
              </Link>
              <span className="truncate text-ink-secondary">
                {row.origin || "—"} → {row.destination || "—"}
              </span>
              <span>
                {row.driver
                  ? `${row.driver.firstName} ${row.driver.lastName}`
                  : "Unassigned"}
              </span>
              <Badge tone="neutral">{row.status}</Badge>
              <Badge tone={URGENCY_TONE[row.urgency]}>{row.urgency}</Badge>
              <span className="text-ink-secondary">{row.suggestion}</span>
              <Button
                size="sm"
                variant="secondary"
                icon={<Send size={13} />}
                loading={sending === row.loadId}
                disabled={!row.driver}
                onClick={() => sendNudge(row)}
              >
                Nudge
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
