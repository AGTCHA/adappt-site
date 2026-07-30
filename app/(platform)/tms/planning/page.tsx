"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Search } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Input } from "@/src/components/ui/Field";
import { api } from "@/src/lib/client";

interface PlanningLoad {
  id: string;
  loadNumber: string;
  status: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  customerName: string;
}

interface PlanningDriver {
  id: string;
  firstName: string;
  lastName: string;
  loads: PlanningLoad[];
}

const statusColor: Record<string, string> = {
  draft: "bg-border/70 text-ink-secondary",
  dispatched: "bg-accent-soft text-accent",
  in_transit: "bg-warning-soft text-warning",
  delivered: "bg-success-soft text-success",
  cancelled: "bg-border/50 text-ink-tertiary",
};

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatWeekDay(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function PlanningPage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [data, setData] = useState<PlanningDriver[] | null>(null);
  const [search, setSearch] = useState("");

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const fetchPlanning = useCallback(() => {
    setData(null);
    api<{ drivers: PlanningDriver[] }>(`/api/tms/planning?weekStart=${isoDate(weekStart)}`)
      .then(({ drivers }) => setData(drivers))
      .catch(() => setData([]));
  }, [weekStart]);

  useEffect(fetchPlanning, [fetchPlanning]);

  const filtered = useMemo(() => {
    if (!data) return null;
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q)
    );
  }, [data, search]);

  function loadSpansDay(load: PlanningLoad, day: Date): boolean {
    if (!load.pickupDate) return false;
    const pickup = new Date(load.pickupDate);
    const delivery = load.deliveryDate ? new Date(load.deliveryDate) : pickup;
    const dayStr = isoDate(day);
    return dayStr >= isoDate(pickup) && dayStr <= isoDate(delivery);
  }

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Planning"
        subtitle="Weekly dispatch planning board — drag-free Gantt view of driver assignments."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft size={14} />}
              onClick={() => setWeekStart((w) => addDays(w, -7))}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekStart(getMonday(new Date()))}
            >
              This week
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronRight size={14} />}
              onClick={() => setWeekStart((w) => addDays(w, 7))}
            />
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <Input
            placeholder="Search drivers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-8"
          />
        </div>
        <p className="text-xs text-ink-tertiary">
          Week of {formatWeekDay(weekStart)}
        </p>
      </div>

      {filtered === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={24} />}
          title="No drivers found"
          description="No drivers with assignments for this week, or adjust your search."
        />
      ) : (
        <div className="glass overflow-x-auto rounded-2xl">
          <div className="min-w-[800px]">
            {/* Header row */}
            <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-border">
              <div className="px-4 py-2.5 text-xs font-medium text-ink-tertiary">Driver</div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="border-l border-border px-2 py-2.5 text-center text-xs font-medium text-ink-tertiary"
                >
                  {formatWeekDay(day)}
                </div>
              ))}
            </div>

            {/* Driver rows */}
            {filtered.map((driver, i) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.2) }}
                className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-border last:border-0"
              >
                <div className="flex items-center px-4 py-3">
                  <span className="truncate text-sm font-medium">
                    {driver.firstName} {driver.lastName}
                  </span>
                </div>
                {weekDays.map((day) => {
                  const loadsOnDay = driver.loads.filter((l) => loadSpansDay(l, day));
                  return (
                    <div
                      key={day.toISOString()}
                      className="flex flex-col gap-1 border-l border-border px-1 py-2"
                    >
                      {loadsOnDay.map((load) => (
                        <Link
                          key={load.id}
                          href={`/tms/loads/${load.id}`}
                          className={`focus-ring block rounded-lg px-2 py-1 text-[11px] font-semibold leading-tight transition-opacity hover:opacity-80 ${statusColor[load.status] ?? statusColor.draft}`}
                          title={`${load.loadNumber} — ${load.customerName}`}
                        >
                          {load.loadNumber}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-tertiary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-border/70" /> Draft
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-accent-soft" /> Dispatched
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-warning-soft" /> In transit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-success-soft" /> Delivered
        </span>
      </div>
    </div>
  );
}
