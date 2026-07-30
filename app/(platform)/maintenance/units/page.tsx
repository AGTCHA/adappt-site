"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Gauge, Plus, Search, Truck, UserRound } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge, truckStatusLabel, truckStatusTone } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { AddTruckModal, type TruckRow } from "@/src/components/fleet/TruckModals";
import { api } from "@/src/lib/client";
import { formatNumber } from "@/src/lib/format";

export default function UnitsPage() {
  const [trucks, setTrucks] = useState<TruckRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(() => {
    api<{ trucks: TruckRow[] }>("/api/trucks")
      .then(({ trucks: rows }) => setTrucks(rows))
      .catch(() => setTrucks([]));
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(() => {
    if (!trucks) return null;
    const q = query.trim().toLowerCase();
    if (!q) return trucks;
    return trucks.filter((t) =>
      `${t.unitNumber} ${t.make} ${t.model} ${t.vin} ${t.driver?.firstName ?? ""} ${t.driver?.lastName ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [trucks, query]);

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance"
        title="Units"
        subtitle="Every truck in your fleet — open a unit for work orders, PM, and history."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setAddOpen(true)}>
            Add truck
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            className="input pl-9"
            placeholder="Search unit, VIN, driver…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {trucks && (
          <p className="text-xs text-ink-tertiary">
            {filtered?.length ?? 0} of {trucks.length} units
          </p>
        )}
      </div>

      {trucks === null ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : filtered!.length === 0 ? (
        <EmptyState
          icon={<Truck size={24} />}
          title="No units yet"
          description="Add your first truck to start logging work orders and PM."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered!.map((truck) => (
            <Link
              key={truck.id}
              href={`/maintenance/units/${truck.id}`}
              className="glass focus-ring block rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-raised"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold tracking-tight text-ink">
                    Unit {truck.unitNumber}
                  </p>
                  <p className="text-sm text-ink-secondary">
                    {truck.year} {truck.make} {truck.model}
                  </p>
                </div>
                <Badge tone={truckStatusTone[truck.status] ?? "neutral"}>
                  {truckStatusLabel[truck.status] ?? truck.status}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-secondary">
                <span className="inline-flex items-center gap-1">
                  <Gauge size={12} /> {formatNumber(truck.mileage)} mi
                </span>
                <span className="inline-flex items-center gap-1">
                  <UserRound size={12} />
                  {truck.driver
                    ? `${truck.driver.firstName} ${truck.driver.lastName}`
                    : "Unassigned"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <AddTruckModal open={addOpen} onClose={() => setAddOpen(false)} onDone={load} />
    </div>
  );
}
