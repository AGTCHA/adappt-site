"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";
import { formatCurrency, formatDate, formatNumber } from "@/src/lib/format";

interface MaintenanceRow {
  id: string;
  date: string;
  vendor: string;
  description: string;
  amount: number;
  category: string;
  odometer: number | null;
  workOrderId: string | null;
  truck: { id: string; unitNumber: string };
}

export default function HistoryPage() {
  const [records, setRecords] = useState<MaintenanceRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "preventative" | "accident">("all");

  const load = useCallback(() => {
    api<{ records: MaintenanceRow[] }>("/api/maintenance")
      .then(({ records: rows }) => setRecords(rows))
      .catch(() => setRecords([]));
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(() => {
    if (!records) return null;
    return records.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (!query) return true;
      const hay = `${r.truck.unitNumber} ${r.vendor} ${r.description}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    });
  }, [records, query, category]);

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance"
        title="Service history"
        subtitle="Every completed invoice and maintenance record across your fleet."
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            className="input pl-9"
            placeholder="Search unit, vendor, description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {(["all", "preventative", "accident"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`focus-ring rounded-full px-3 py-1.5 text-xs font-semibold ${
              category === c
                ? "bg-accent text-accent-text"
                : "bg-surface-solid text-ink-secondary ring-1 ring-border"
            }`}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      {filtered === null ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<History size={24} />}
          title="No history yet"
          description="Complete work orders or log invoices to build your service history."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="glass flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/maintenance/units/${r.truck.id}`}
                    className="text-xs font-bold text-accent hover:underline"
                  >
                    Unit {r.truck.unitNumber}
                  </Link>
                  <Badge tone={r.category === "accident" ? "danger" : "accent"}>
                    {r.category}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-ink">
                  {r.description || r.vendor || "Maintenance"}
                </p>
                <p className="text-xs text-ink-tertiary">
                  {formatDate(r.date)}
                  {r.vendor ? ` · ${r.vendor}` : ""}
                  {r.odometer != null ? ` · ${formatNumber(r.odometer)} mi` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {r.workOrderId && (
                  <Link
                    href={`/maintenance/work-orders/${r.workOrderId}`}
                    className="text-xs font-semibold text-accent"
                  >
                    WO
                  </Link>
                )}
                <span className="text-sm font-semibold">{formatCurrency(r.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
