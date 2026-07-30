"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Radio, Truck, UserRound } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge, driverStatusLabel, driverStatusTone } from "@/src/components/ui/Badge";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { api } from "@/src/lib/client";
import { initials } from "@/src/lib/format";

interface DriverRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  truck: { id: string; unitNumber: string } | null;
}

interface TruckRow {
  id: string;
  unitNumber: string;
  year: number;
  make: string;
  model: string;
  status: string;
  driver: { id: string; firstName: string; lastName: string } | null;
}

export default function DispatchPage() {
  const [drivers, setDrivers] = useState<DriverRow[] | null>(null);
  const [trucks, setTrucks] = useState<TruckRow[] | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api<{ drivers: DriverRow[] }>("/api/drivers"),
      api<{ trucks: TruckRow[] }>("/api/trucks"),
    ])
      .then(([d, t]) => {
        setDrivers(d.drivers);
        setTrucks(t.trucks);
      })
      .catch(() => {
        setDrivers([]);
        setTrucks([]);
      });
  }, []);

  useEffect(load, [load]);

  const activeDrivers = useMemo(
    () => (drivers ?? []).filter((d) => d.status === "active"),
    [drivers]
  );

  const assignedTrucks = useMemo(
    () => (trucks ?? []).filter((t) => t.driver != null),
    [trucks]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Dispatch"
        title="Dispatch Roster"
        subtitle="Active drivers and truck assignments at a glance."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <UserRound size={16} className="text-accent" />
            Active drivers ({activeDrivers.length})
          </h2>
          {drivers === null ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : activeDrivers.length === 0 ? (
            <EmptyState
              icon={<UserRound size={24} />}
              title="No active drivers"
              description="Drivers with active status will appear here."
            />
          ) : (
            <div className="space-y-2">
              {activeDrivers.map((driver, i) => (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.2) }}
                  className="glass flex items-center gap-3 rounded-2xl p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                    {initials(driver.firstName, driver.lastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {driver.firstName} {driver.lastName}
                    </p>
                    <p className="text-xs text-ink-tertiary">
                      {driver.phone || "No phone"}
                      {driver.truck && ` · Unit ${driver.truck.unitNumber}`}
                    </p>
                  </div>
                  <Badge tone={driverStatusTone[driver.status] ?? "neutral"}>
                    {driverStatusLabel[driver.status] ?? driver.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Truck size={16} className="text-accent" />
            Assigned trucks ({assignedTrucks.length})
          </h2>
          {trucks === null ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : assignedTrucks.length === 0 ? (
            <EmptyState
              icon={<Truck size={24} />}
              title="No assignments"
              description="Assign drivers to trucks from the Fleet page."
            />
          ) : (
            <div className="space-y-2">
              {assignedTrucks.map((truck, i) => (
                <motion.div
                  key={truck.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.2) }}
                  className="glass flex items-center gap-3 rounded-2xl p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Radio size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Unit {truck.unitNumber}</p>
                    <p className="text-xs text-ink-tertiary">
                      {truck.year} {truck.make} {truck.model}
                      {truck.driver &&
                        ` · ${truck.driver.firstName} ${truck.driver.lastName}`}
                    </p>
                  </div>
                  <Badge tone={truck.status === "in_shop" ? "warning" : "success"}>
                    {truck.status === "in_shop" ? "In shop" : "Rolling"}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
