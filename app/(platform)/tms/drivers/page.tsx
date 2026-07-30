"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Search, Phone, Truck } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Input, Select } from "@/src/components/ui/Field";
import { api } from "@/src/lib/client";

interface RosterDriver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  type: string;
  state: string;
  dispatcher: string | null;
  currentLoadId: string | null;
  currentLoadNumber: string | null;
  truckUnitNumber: string | null;
  status: string;
}

const stateTone: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  available: "success",
  on_load: "accent",
  off_duty: "neutral",
  home_time: "warning",
  terminated: "danger",
};

export default function TmsDriversPage() {
  const [roster, setRoster] = useState<RosterDriver[] | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const fetchRoster = useCallback(() => {
    api<{ drivers: RosterDriver[] }>("/api/tms/drivers/roster")
      .then(({ drivers }) => setRoster(drivers))
      .catch(() => setRoster([]));
  }, []);

  useEffect(fetchRoster, [fetchRoster]);

  const filtered = useMemo(() => {
    if (!roster) return null;
    let rows = roster;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (d) =>
          d.firstName.toLowerCase().includes(q) ||
          d.lastName.toLowerCase().includes(q) ||
          (d.phone ?? "").includes(q) ||
          (d.dispatcher ?? "").toLowerCase().includes(q)
      );
    }
    if (typeFilter) rows = rows.filter((d) => d.type === typeFilter);
    if (stateFilter) rows = rows.filter((d) => d.state === stateFilter);
    return rows;
  }, [roster, search, typeFilter, stateFilter]);

  const types = useMemo(() => {
    if (!roster) return [];
    return [...new Set(roster.map((d) => d.type).filter(Boolean))];
  }, [roster]);

  const states = useMemo(() => {
    if (!roster) return [];
    return [...new Set(roster.map((d) => d.state).filter(Boolean))];
  }, [roster]);

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Drivers"
        subtitle="Driver roster — status, assignments, and contact info at a glance."
      />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <Input
            placeholder="Search name, phone, dispatcher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-8"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="!w-auto"
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <Select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="!w-auto"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </div>

      {filtered === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No drivers found"
          description="No drivers match your search or your roster is empty."
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[1.5fr_auto_auto_auto_auto_1fr_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary xl:grid">
            <span>Name</span>
            <span>Phone</span>
            <span>Type</span>
            <span>State</span>
            <span>Dispatcher</span>
            <span>Current load</span>
            <span>Truck</span>
            <span>Status</span>
          </div>
          {filtered.map((driver, i) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.2) }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 xl:grid xl:grid-cols-[1.5fr_auto_auto_auto_auto_1fr_auto_auto]"
            >
              <div>
                <Link
                  href={`/drivers/${driver.id}`}
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  {driver.firstName} {driver.lastName}
                </Link>
              </div>
              <span className="flex items-center gap-1 text-sm text-ink-secondary">
                <Phone size={11} /> {driver.phone ?? "—"}
              </span>
              <span className="text-sm text-ink-secondary capitalize">
                {driver.type?.replace(/_/g, " ") ?? "—"}
              </span>
              <Badge tone={stateTone[driver.state] ?? "neutral"}>
                {driver.state?.replace(/_/g, " ") ?? "—"}
              </Badge>
              <span className="text-sm text-ink-secondary">
                {driver.dispatcher ?? "—"}
              </span>
              <span className="text-sm">
                {driver.currentLoadNumber ? (
                  <Link
                    href={`/tms/loads/${driver.currentLoadId}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {driver.currentLoadNumber}
                  </Link>
                ) : (
                  <span className="text-ink-tertiary">None</span>
                )}
              </span>
              <span className="flex items-center gap-1 text-sm text-ink-secondary">
                <Truck size={12} /> {driver.truckUnitNumber ?? "—"}
              </span>
              <Badge tone={driver.status === "active" ? "success" : "neutral"}>
                {driver.status ?? "—"}
              </Badge>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
