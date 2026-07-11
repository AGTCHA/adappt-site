"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Plus, Truck, Wrench, TrendingUp, UserRound, Gauge } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge, truckStatusLabel, truckStatusTone } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import {
  AddTruckModal,
  AssignDriverModal,
  type TruckRow,
} from "@/src/components/fleet/TruckModals";
import { MaintenanceModal } from "@/src/components/fleet/MaintenanceModal";
import { CpmAnalytics } from "@/src/components/fleet/CpmAnalytics";
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
  truck: { id: string; unitNumber: string };
}

const tabs = [
  { key: "trucks", label: "Trucks", icon: Truck },
  { key: "maintenance", label: "Maintenance", icon: Wrench },
  { key: "analytics", label: "Cost per mile", icon: TrendingUp },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function FleetPage() {
  const [tab, setTab] = useState<TabKey>("trucks");
  const [trucks, setTrucks] = useState<TruckRow[] | null>(null);
  const [records, setRecords] = useState<MaintenanceRow[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [assignTruck, setAssignTruck] = useState<TruckRow | null>(null);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(() => {
    api<{ trucks: TruckRow[] }>("/api/trucks")
      .then(({ trucks }) => setTrucks(trucks))
      .catch(() => setTrucks([]));
    api<{ records: MaintenanceRow[] }>("/api/maintenance")
      .then(({ records }) => setRecords(records))
      .catch(() => setRecords([]));
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(load, [load]);

  return (
    <div>
      <PageHeader
        title="Fleet"
        subtitle="Your trucks, who's driving them, and what they cost."
        actions={
          <>
            <Button variant="secondary" icon={<Wrench size={15} />} onClick={() => setMaintenanceOpen(true)}>
              Log maintenance
            </Button>
            <Button icon={<Plus size={15} />} onClick={() => setAddOpen(true)}>
              Add truck
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-border bg-surface p-1 backdrop-blur sm:w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`focus-ring relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
                active ? "text-ink" : "text-ink-secondary hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="fleet-tab"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-surface-solid shadow-sm"
                />
              )}
              <Icon size={15} className="relative z-10" />
              <span className="relative z-10 whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "trucks" &&
        (trucks === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : trucks.length === 0 ? (
          <EmptyState
            icon={<Truck size={24} />}
            title="No trucks yet"
            description="Add your first truck to start tracking assignments, maintenance, and cost per mile."
            action={
              <Button icon={<Plus size={15} />} onClick={() => setAddOpen(true)}>
                Add truck
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trucks.map((truck, i) => {
              const lastService = truck.maintenance[0];
              return (
                <Card key={truck.id} hover delay={Math.min(i * 0.04, 0.3)} className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold tracking-tight">
                        Unit {truck.unitNumber}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-secondary">
                        {truck.year} {truck.make} {truck.model}
                      </p>
                    </div>
                    <Badge tone={truckStatusTone[truck.status] ?? "neutral"}>
                      {truckStatusLabel[truck.status] ?? truck.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-ink-secondary">
                      <Gauge size={14} className="shrink-0 text-ink-tertiary" />
                      {formatNumber(truck.mileage)} miles
                    </div>
                    <div className="flex items-center gap-2 text-ink-secondary">
                      <Wrench size={14} className="shrink-0 text-ink-tertiary" />
                      {lastService
                        ? `Last service ${formatDate(lastService.date)}`
                        : "No maintenance logged"}
                    </div>
                    <div className="flex items-center gap-2">
                      <UserRound size={14} className="shrink-0 text-ink-tertiary" />
                      {truck.driver ? (
                        <span className="font-medium">
                          {truck.driver.firstName} {truck.driver.lastName}
                        </span>
                      ) : (
                        <span className="text-ink-tertiary">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => setAssignTruck(truck)}
                  >
                    {truck.driver ? "Change driver" : "Assign driver"}
                  </Button>
                </Card>
              );
            })}
          </div>
        ))}

      {tab === "maintenance" &&
        (records === null ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={<Wrench size={24} />}
            title="No maintenance records"
            description="Log your first repair or PM service — take a photo of the invoice and AI fills in the details."
            action={
              <Button icon={<Wrench size={15} />} onClick={() => setMaintenanceOpen(true)}>
                Log maintenance
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {records.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, delay: Math.min(i * 0.03, 0.3) }}
                className="glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Unit {record.truck.unitNumber}
                    {record.vendor && ` · ${record.vendor}`}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-tertiary">
                    {record.description || "No description"}
                    {record.odometer != null && ` · ${formatNumber(record.odometer)} mi`}
                  </p>
                </div>
                <Badge tone={record.category === "accident" ? "danger" : "success"}>
                  {record.category === "accident" ? "Accident" : "Preventative"}
                </Badge>
                <span className="text-sm font-semibold">{formatCurrency(record.amount, 2)}</span>
                <span className="text-xs text-ink-tertiary">{formatDate(record.date)}</span>
              </motion.div>
            ))}
          </div>
        ))}

      {tab === "analytics" && <CpmAnalytics refreshKey={refreshKey} />}

      <AddTruckModal open={addOpen} onClose={() => setAddOpen(false)} onDone={load} />
      <AssignDriverModal truck={assignTruck} onClose={() => setAssignTruck(null)} onDone={load} />
      <MaintenanceModal
        open={maintenanceOpen}
        trucks={trucks ?? []}
        onClose={() => setMaintenanceOpen(false)}
        onDone={load}
      />
    </div>
  );
}
