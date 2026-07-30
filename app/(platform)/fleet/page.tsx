"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Truck,
  Wrench,
  TrendingUp,
  UserRound,
  Gauge,
  Search,
  DollarSign,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge, truckStatusLabel, truckStatusTone } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { StatCard } from "@/src/components/ui/StatCard";
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

const monthLabel = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

function FleetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<TabKey>(
    initialTab === "maintenance" || initialTab === "analytics" ? initialTab : "trucks"
  );
  const [trucks, setTrucks] = useState<TruckRow[] | null>(null);
  const [records, setRecords] = useState<MaintenanceRow[] | null>(null);
  const [fleetCpm, setFleetCpm] = useState<number | null | undefined>(undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [assignTruck, setAssignTruck] = useState<TruckRow | null>(null);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [maintFilter, setMaintFilter] = useState<"all" | "preventative" | "accident">("all");
  const [maintQuery, setMaintQuery] = useState("");

  const load = useCallback(() => {
    api<{ trucks: TruckRow[] }>("/api/trucks")
      .then(({ trucks }) => setTrucks(trucks))
      .catch(() => setTrucks([]));
    api<{ records: MaintenanceRow[] }>("/api/maintenance")
      .then(({ records }) => setRecords(records))
      .catch(() => setRecords([]));
    api<{ cpm: number | null }>("/api/analytics/cpm?range=90d")
      .then(({ cpm }) => setFleetCpm(cpm))
      .catch(() => setFleetCpm(null));
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(load, [load]);

  function switchTab(next: TabKey) {
    setTab(next);
    router.replace(next === "trucks" ? "/fleet" : `/fleet?tab=${next}`, { scroll: false });
  }

  // KPI derivations
  const stats = useMemo(() => {
    if (!trucks || !records) return null;
    const monthAgo = Date.now() - 30 * 86_400_000;
    const recent = records.filter((r) => new Date(r.date).getTime() >= monthAgo);
    const spend30d = recent.reduce((sum, r) => sum + r.amount, 0);
    const inShop = trucks.filter((t) => t.status === "in_shop").length;
    const unassigned = trucks.filter((t) => !t.driver).length;
    const accident12m = records
      .filter(
        (r) =>
          r.category === "accident" &&
          new Date(r.date).getTime() >= Date.now() - 365 * 86_400_000
      )
      .reduce((sum, r) => sum + r.amount, 0);
    return { spend30d, invoices30d: recent.length, inShop, unassigned, accident12m };
  }, [trucks, records]);

  // Per-truck spend (90 days) + record count, for the truck cards
  const truckSpend = useMemo(() => {
    const map: Record<string, { spend90d: number; count: number }> = {};
    if (!records) return map;
    const cutoff = Date.now() - 90 * 86_400_000;
    for (const record of records) {
      const entry = (map[record.truck.id] ??= { spend90d: 0, count: 0 });
      entry.count += 1;
      if (new Date(record.date).getTime() >= cutoff) entry.spend90d += record.amount;
    }
    return map;
  }, [records]);

  // Month-grouped, filtered maintenance
  const groupedRecords = useMemo(() => {
    if (!records) return null;
    const filtered = records.filter((record) => {
      if (maintFilter !== "all" && record.category !== maintFilter) return false;
      if (maintQuery) {
        const haystack =
          `${record.truck.unitNumber} ${record.vendor} ${record.description}`.toLowerCase();
        if (!haystack.includes(maintQuery.toLowerCase())) return false;
      }
      return true;
    });
    const groups: { key: string; label: string; total: number; rows: MaintenanceRow[] }[] = [];
    for (const record of filtered) {
      const date = new Date(record.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = { key, label: monthLabel.format(date), total: 0, rows: [] };
        groups.push(group);
      }
      group.total += record.amount;
      group.rows.push(record);
    }
    return groups;
  }, [records, maintFilter, maintQuery]);

  return (
    <div>
      <PageHeader
        eyebrow="Fleet"
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

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Trucks"
              value={trucks!.length}
              sub={
                stats.inShop > 0
                  ? `${stats.inShop} in the shop`
                  : stats.unassigned > 0
                    ? `${stats.unassigned} unassigned`
                    : "all rolling"
              }
              icon={<Truck size={17} />}
              tone={stats.inShop > 0 ? "warning" : "success"}
              onClick={() => switchTab("trucks")}
            />
            <StatCard
              label="Spend · 30d"
              value={formatCurrency(stats.spend30d)}
              sub={`${stats.invoices30d} invoice${stats.invoices30d === 1 ? "" : "s"}`}
              icon={<DollarSign size={17} />}
              tone="accent"
              delay={0.05}
              onClick={() => switchTab("maintenance")}
            />
            <StatCard
              label="Fleet CPM · 90d"
              value={fleetCpm != null ? `${fleetCpm.toFixed(1)}¢` : "—"}
              sub={fleetCpm != null ? "per mile, maintenance" : "needs odometer data"}
              icon={<TrendingUp size={17} />}
              tone="default"
              delay={0.1}
              onClick={() => switchTab("analytics")}
            />
            <StatCard
              label="Accidents · 12m"
              value={formatCurrency(stats.accident12m)}
              sub="repair costs"
              icon={<Wrench size={17} />}
              tone={stats.accident12m > 0 ? "danger" : "default"}
              delay={0.15}
              onClick={() => {
                switchTab("maintenance");
                setMaintFilter("accident");
              }}
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-border bg-surface p-1 backdrop-blur sm:w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTab(t.key)}
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
              <Skeleton key={i} className="h-48 rounded-2xl" />
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
              const spend = truckSpend[truck.id];
              return (
                <motion.div
                  key={truck.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26, delay: Math.min(i * 0.04, 0.3) }}
                  className="glass flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-raised"
                >
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

                  <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <div className="flex items-center gap-2 text-ink-secondary">
                      <Gauge size={14} className="shrink-0 text-ink-tertiary" />
                      {formatNumber(truck.mileage)} mi
                    </div>
                    <div className="flex items-center gap-2 text-ink-secondary">
                      <DollarSign size={14} className="shrink-0 text-ink-tertiary" />
                      {spend ? `${formatCurrency(spend.spend90d)} · 90d` : "$0 · 90d"}
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-ink-secondary">
                      <Wrench size={14} className="shrink-0 text-ink-tertiary" />
                      {lastService
                        ? `Last service ${formatDate(lastService.date)}`
                        : "No maintenance logged"}
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <UserRound size={14} className="shrink-0 text-ink-tertiary" />
                      {truck.driver ? (
                        <span className="truncate font-medium">
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
                </motion.div>
              );
            })}
          </div>
        ))}

      {tab === "maintenance" && (
        <div>
          {/* Maintenance filters */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative min-w-52 flex-1 sm:max-w-xs">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
              <input
                className="input pl-9"
                placeholder="Search unit, vendor, work…"
                value={maintQuery}
                onChange={(e) => setMaintQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "preventative", label: "Preventative" },
                  { key: "accident", label: "Accidents" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setMaintFilter(f.key)}
                  className={`focus-ring shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    maintFilter === f.key
                      ? "bg-accent text-accent-text"
                      : "text-ink-secondary hover:bg-accent-soft"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {records === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={<Wrench size={24} />}
              title="No maintenance records"
              description="Log your first repair or PM service — drop invoice photos or PDFs and AI fills in the details."
              action={
                <Button icon={<Wrench size={15} />} onClick={() => setMaintenanceOpen(true)}>
                  Log maintenance
                </Button>
              }
            />
          ) : groupedRecords && groupedRecords.length === 0 ? (
            <EmptyState
              icon={<Search size={24} />}
              title="No matches"
              description="No records match your search or filter."
            />
          ) : (
            <div className="space-y-6">
              {groupedRecords!.map((group) => (
                <div key={group.key}>
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <h3 className="text-sm font-semibold text-ink-secondary">
                      {group.label}
                    </h3>
                    <span className="text-xs font-medium text-ink-tertiary">
                      {group.rows.length} record{group.rows.length === 1 ? "" : "s"} ·{" "}
                      {formatCurrency(group.total)}
                    </span>
                  </div>
                  <div className="glass divide-y divide-border overflow-hidden rounded-2xl">
                    {group.rows.map((record) => (
                      <div
                        key={record.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5"
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            record.category === "accident" ? "bg-danger" : "bg-success"
                          }`}
                        />
                        <span className="w-16 shrink-0 text-sm font-semibold">
                          {record.truck.unitNumber}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">
                            {record.description || "No description"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-ink-tertiary">
                            {record.vendor || "Unknown vendor"}
                            {record.odometer != null &&
                              ` · ${formatNumber(record.odometer)} mi`}
                          </p>
                        </div>
                        <span className="text-xs text-ink-tertiary">
                          {formatDate(record.date)}
                        </span>
                        <span className="w-20 text-right text-sm font-semibold">
                          {formatCurrency(record.amount, 2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

export default function FleetPage() {
  return (
    <Suspense>
      <FleetContent />
    </Suspense>
  );
}
