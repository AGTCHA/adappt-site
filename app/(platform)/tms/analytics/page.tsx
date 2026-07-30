"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Fuel,
  MapPin,
  Gauge,
  Route,
  DollarSign,
  Truck,
  Users,
  Package,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { StatCard } from "@/src/components/ui/StatCard";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { Select } from "@/src/components/ui/Field";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency, formatNumber, formatDate } from "@/src/lib/format";

/* ---------- types ---------- */

type AnalyticsTab = "financial" | "fuel" | "ifta" | "efficiency" | "lanes";

type Period = "7d" | "30d" | "quarter" | "ytd";

interface AnalyticsData {
  kpis?: Record<string, number | string>;
  topCustomers?: { name: string; revenue: number; loads: number }[];
  driverPerformance?: {
    name: string;
    loads: number;
    miles: number;
    revenue: number;
    rpm: number;
    deadheadPct: number;
  }[];
  laneGroups?: {
    origin: string;
    destination: string;
    loads: number;
    avgRate: number;
    totalRevenue: number;
    avgMiles: number;
  }[];
  dailyTrend?: { date: string; revenue: number; loads: number; miles: number }[];
  fuelData?: {
    totalGallons: number;
    totalCost: number;
    avgPricePerGallon: number;
    mpg: number;
    costPerMile: number;
    entries?: { date: string; gallons: number; cost: number; location: string }[];
  };
  iftaData?: {
    totalMiles: number;
    totalFuelGallons: number;
    jurisdictions?: { state: string; miles: number; gallons: number; taxOwed: number }[];
    quarterSummary?: { quarter: string; totalTax: number; totalMiles: number };
  };
  efficiencyData?: {
    utilization: number;
    avgLoadTime: number;
    emptyMilesPct: number;
    onTimeDeliveryPct: number;
    avgDwell: number;
    revenuePerTruck: number;
    loadsPerDriver: number;
  };
}

const tabConfig: { key: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
  { key: "financial", label: "Financial", icon: <TrendingUp size={16} /> },
  { key: "fuel", label: "Fuel", icon: <Fuel size={16} /> },
  { key: "ifta", label: "IFTA", icon: <MapPin size={16} /> },
  { key: "efficiency", label: "Efficiency", icon: <Gauge size={16} /> },
  { key: "lanes", label: "Lanes", icon: <Route size={16} /> },
];

const periodLabel: Record<Period, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  quarter: "This Quarter",
  ytd: "Year to Date",
};

export default function AnalyticsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<AnalyticsTab>("financial");
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    api<AnalyticsData>(`/api/tms/analytics?tab=${tab}&period=${period}`)
      .then((d) => setData(d))
      .catch(() => {
        setData(null);
        toast("error", "Failed to load analytics");
      })
      .finally(() => setLoading(false));
  }, [tab, period, toast]);

  useEffect(fetchData, [fetchData]);

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Analytics"
        subtitle="Performance metrics, fuel costs, IFTA, and lane analysis."
        actions={
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="w-44"
          >
            {(Object.keys(periodLabel) as Period[]).map((p) => (
              <option key={p} value={p}>
                {periodLabel[p]}
              </option>
            ))}
          </Select>
        }
      />

      {/* tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-surface p-1">
        {tabConfig.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-accent text-accent-text"
                : "text-ink-secondary hover:bg-accent-soft hover:text-accent"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : !data ? (
        <div className="glass rounded-2xl p-8 text-center">
          <BarChart3 size={32} className="mx-auto mb-2 text-ink-tertiary" />
          <p className="text-ink-secondary">No analytics data available for this period.</p>
        </div>
      ) : (
        <>
          {tab === "financial" && <FinancialView data={data} />}
          {tab === "fuel" && <FuelView data={data} />}
          {tab === "ifta" && <IFTAView data={data} />}
          {tab === "efficiency" && <EfficiencyView data={data} />}
          {tab === "lanes" && <LanesView data={data} />}
        </>
      )}
    </div>
  );
}

/* ============================================================
   FINANCIAL VIEW
   ============================================================ */

function FinancialView({ data }: { data: AnalyticsData }) {
  const k = data.kpis ?? {};
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard label="Revenue" value={formatCurrency(Number(k.revenue ?? 0))} icon={<DollarSign size={16} />} tone="success" />
        <StatCard label="Expenses" value={formatCurrency(Number(k.expenses ?? 0))} icon={<DollarSign size={16} />} tone="danger" />
        <StatCard label="Profit" value={formatCurrency(Number(k.profit ?? 0))} icon={<TrendingUp size={16} />} tone="accent" />
        <StatCard label="Loads" value={formatNumber(Number(k.loads ?? 0))} icon={<Package size={16} />} />
        <StatCard label="RPM" value={`$${Number(k.rpm ?? 0).toFixed(2)}`} icon={<Gauge size={16} />} tone="violet" />
      </div>

      {/* daily trend */}
      {data.dailyTrend && data.dailyTrend.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-ink-tertiary">Daily Trend</h3>
          <div className="glass overflow-hidden rounded-2xl">
            <div className="flex items-end gap-px px-4 py-4" style={{ height: 180 }}>
              {data.dailyTrend.map((d, i) => {
                const max = Math.max(...data.dailyTrend!.map((x) => x.revenue), 1);
                const pct = (d.revenue / max) * 100;
                return (
                  <motion.div
                    key={d.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ delay: i * 0.03, type: "spring", stiffness: 200, damping: 20 }}
                    className="group relative flex-1 rounded-t bg-accent/70 hover:bg-accent"
                    title={`${formatDate(d.date)}: ${formatCurrency(d.revenue)}`}
                  >
                    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium opacity-0 shadow-raised transition-opacity group-hover:opacity-100">
                      {formatCurrency(d.revenue)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between border-t border-border px-4 py-1 text-[10px] text-ink-tertiary">
              <span>{formatDate(data.dailyTrend[0].date)}</span>
              <span>{formatDate(data.dailyTrend[data.dailyTrend.length - 1].date)}</span>
            </div>
          </div>
        </div>
      )}

      {/* top customers */}
      {data.topCustomers && data.topCustomers.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-ink-tertiary">Top Customers</h3>
          <div className="glass overflow-hidden rounded-2xl">
            <div className="hidden grid-cols-[2fr_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
              <span>Customer</span>
              <span>Loads</span>
              <span className="text-right">Revenue</span>
            </div>
            {data.topCustomers.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[2fr_auto_auto] gap-4 border-b border-border px-5 py-3 text-sm last:border-0"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-ink-secondary">{c.loads}</span>
                <span className="text-right font-semibold">{formatCurrency(c.revenue)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* driver performance */}
      {data.driverPerformance && data.driverPerformance.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-ink-tertiary">Driver Performance</h3>
          <div className="glass overflow-hidden rounded-2xl">
            <div className="hidden grid-cols-[2fr_auto_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
              <span>Driver</span>
              <span>Loads</span>
              <span>Miles</span>
              <span>Revenue</span>
              <span>RPM</span>
              <span>Deadhead</span>
            </div>
            {data.driverPerformance.map((d, i) => (
              <motion.div
                key={d.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[2fr_auto_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-3 text-sm last:border-0"
              >
                <span className="font-medium">{d.name}</span>
                <span className="text-ink-secondary">{d.loads}</span>
                <span className="text-ink-secondary">{formatNumber(d.miles)}</span>
                <span className="font-semibold">{formatCurrency(d.revenue)}</span>
                <span className="text-accent">${d.rpm.toFixed(2)}</span>
                <Badge tone={d.deadheadPct > 15 ? "danger" : d.deadheadPct > 10 ? "warning" : "success"}>
                  {d.deadheadPct.toFixed(1)}%
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FUEL VIEW
   ============================================================ */

function FuelView({ data }: { data: AnalyticsData }) {
  const f = data.fuelData;
  if (!f) return <EmptyAnalytics label="No fuel data available." />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total Gallons" value={formatNumber(f.totalGallons)} icon={<Fuel size={16} />} />
        <StatCard label="Total Cost" value={formatCurrency(f.totalCost)} icon={<DollarSign size={16} />} tone="danger" />
        <StatCard label="Avg $/gal" value={`$${f.avgPricePerGallon.toFixed(3)}`} icon={<Fuel size={16} />} tone="accent" />
        <StatCard label="MPG" value={f.mpg.toFixed(1)} icon={<Gauge size={16} />} tone="success" />
        <StatCard label="Cost/Mile" value={`$${f.costPerMile.toFixed(3)}`} icon={<Truck size={16} />} tone="warning" />
      </div>

      {f.entries && f.entries.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-ink-tertiary">Recent Fuel Purchases</h3>
          <div className="glass overflow-hidden rounded-2xl">
            <div className="hidden grid-cols-[1fr_auto_auto_1.5fr] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
              <span>Date</span>
              <span>Gallons</span>
              <span>Cost</span>
              <span>Location</span>
            </div>
            {f.entries.map((entry, i) => (
              <motion.div
                key={`${entry.date}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[1fr_auto_auto_1.5fr] gap-4 border-b border-border px-5 py-3 text-sm last:border-0"
              >
                <span>{formatDate(entry.date)}</span>
                <span className="text-ink-secondary">{entry.gallons.toFixed(1)}</span>
                <span className="font-semibold">{formatCurrency(entry.cost, 2)}</span>
                <span className="text-ink-secondary">{entry.location}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   IFTA VIEW
   ============================================================ */

function IFTAView({ data }: { data: AnalyticsData }) {
  const ifta = data.iftaData;
  if (!ifta) return <EmptyAnalytics label="No IFTA data available." />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total Miles" value={formatNumber(ifta.totalMiles)} icon={<Route size={16} />} tone="accent" />
        <StatCard label="Total Fuel (gal)" value={formatNumber(ifta.totalFuelGallons)} icon={<Fuel size={16} />} />
        {ifta.quarterSummary && (
          <StatCard label={`${ifta.quarterSummary.quarter} Tax`} value={formatCurrency(ifta.quarterSummary.totalTax, 2)} icon={<DollarSign size={16} />} tone="warning" />
        )}
      </div>

      {ifta.jurisdictions && ifta.jurisdictions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-ink-tertiary">Jurisdiction Breakdown</h3>
          <div className="glass overflow-hidden rounded-2xl">
            <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
              <span>State</span>
              <span>Miles</span>
              <span>Gallons</span>
              <span className="text-right">Tax Owed</span>
            </div>
            {ifta.jurisdictions.map((j, i) => (
              <motion.div
                key={j.state}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border px-5 py-3 text-sm last:border-0"
              >
                <span className="font-medium">{j.state}</span>
                <span className="text-ink-secondary">{formatNumber(j.miles)}</span>
                <span className="text-ink-secondary">{j.gallons.toFixed(1)}</span>
                <span className="text-right font-semibold">{formatCurrency(j.taxOwed, 2)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   EFFICIENCY VIEW
   ============================================================ */

function EfficiencyView({ data }: { data: AnalyticsData }) {
  const e = data.efficiencyData;
  if (!e) return <EmptyAnalytics label="No efficiency data available." />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard
          label="Utilization"
          value={`${e.utilization.toFixed(1)}%`}
          icon={<Gauge size={16} />}
          tone={e.utilization > 80 ? "success" : e.utilization > 60 ? "accent" : "warning"}
        />
        <StatCard label="Avg Load Time" value={`${e.avgLoadTime.toFixed(1)}h`} icon={<Package size={16} />} />
        <StatCard
          label="Empty Miles"
          value={`${e.emptyMilesPct.toFixed(1)}%`}
          icon={<Route size={16} />}
          tone={e.emptyMilesPct < 10 ? "success" : e.emptyMilesPct < 20 ? "warning" : "danger"}
        />
        <StatCard
          label="On-Time Delivery"
          value={`${e.onTimeDeliveryPct.toFixed(1)}%`}
          icon={<Truck size={16} />}
          tone={e.onTimeDeliveryPct > 95 ? "success" : e.onTimeDeliveryPct > 85 ? "accent" : "danger"}
        />
        <StatCard label="Avg Dwell" value={`${e.avgDwell.toFixed(1)}h`} icon={<MapPin size={16} />} />
        <StatCard label="Rev/Truck" value={formatCurrency(e.revenuePerTruck)} icon={<Truck size={16} />} tone="violet" />
        <StatCard label="Loads/Driver" value={e.loadsPerDriver.toFixed(1)} icon={<Users size={16} />} tone="accent" />
      </div>
    </div>
  );
}

/* ============================================================
   LANES VIEW
   ============================================================ */

function LanesView({ data }: { data: AnalyticsData }) {
  const lanes = data.laneGroups;
  if (!lanes || lanes.length === 0) return <EmptyAnalytics label="No lane data available." />;
  return (
    <div className="space-y-6">
      <div className="glass overflow-hidden rounded-2xl">
        <div className="hidden grid-cols-[1.5fr_1.5fr_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
          <span>Origin</span>
          <span>Destination</span>
          <span>Loads</span>
          <span>Avg Rate</span>
          <span>Revenue</span>
          <span>Avg Miles</span>
        </div>
        {lanes.map((lane, i) => (
          <motion.div
            key={`${lane.origin}-${lane.destination}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="grid grid-cols-[1.5fr_1.5fr_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-3 text-sm last:border-0"
          >
            <span className="font-medium">{lane.origin}</span>
            <span className="font-medium">{lane.destination}</span>
            <span className="text-ink-secondary">{lane.loads}</span>
            <span className="text-accent">{formatCurrency(lane.avgRate)}</span>
            <span className="font-semibold">{formatCurrency(lane.totalRevenue)}</span>
            <span className="text-ink-secondary">{formatNumber(lane.avgMiles)} mi</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------- shared empty ---------- */

function EmptyAnalytics({ label }: { label: string }) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <BarChart3 size={32} className="mx-auto mb-2 text-ink-tertiary" />
      <p className="text-ink-secondary">{label}</p>
    </div>
  );
}
