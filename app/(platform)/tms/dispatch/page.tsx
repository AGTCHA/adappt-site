"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, CalendarClock, Search, Truck, MapPin, Clock } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
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
  location: string | null;
  hosRemaining: number | null;
}

interface PendingLoad {
  id: string;
  loadNumber: string;
  customerName: string;
  pickupDate: string | null;
  status: string;
}

type Tab = "drivers" | "upcoming";

const stateTone: Record<string, "neutral" | "accent" | "success" | "warning"> = {
  available: "success",
  on_load: "accent",
  off_duty: "neutral",
  home_time: "warning",
};

export default function TmsDispatchPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("drivers");
  const [roster, setRoster] = useState<RosterDriver[] | null>(null);
  const [loads, setLoads] = useState<PendingLoad[] | null>(null);
  const [search, setSearch] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoadId, setAssignLoadId] = useState("");
  const [assignDriverId, setAssignDriverId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchRoster = useCallback(() => {
    api<{ drivers: RosterDriver[] }>("/api/tms/drivers/roster")
      .then(({ drivers }) => setRoster(drivers))
      .catch(() => setRoster([]));
  }, []);

  const fetchLoads = useCallback(() => {
    api<{ loads: PendingLoad[] }>("/api/tms/loads?status=draft,dispatched")
      .then(({ loads: rows }) => setLoads(rows))
      .catch(() => setLoads([]));
  }, []);

  useEffect(fetchRoster, [fetchRoster]);
  useEffect(fetchLoads, [fetchLoads]);

  const filteredRoster = useMemo(() => {
    if (!roster) return null;
    if (!search.trim()) return roster;
    const q = search.toLowerCase();
    return roster.filter(
      (d) =>
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
        (d.location ?? "").toLowerCase().includes(q)
    );
  }, [roster, search]);

  const filteredLoads = useMemo(() => {
    if (!loads) return null;
    if (!search.trim()) return loads;
    const q = search.toLowerCase();
    return loads.filter(
      (l) =>
        l.loadNumber.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q)
    );
  }, [loads, search]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignLoadId || !assignDriverId) return;
    setAssigning(true);
    try {
      await api(`/api/tms/loads/${assignLoadId}`, {
        method: "PATCH",
        json: { driverId: assignDriverId, status: "dispatched" },
      });
      toast("success", "Driver assigned", "Load dispatched successfully.");
      setAssignOpen(false);
      setAssignLoadId("");
      setAssignDriverId("");
      fetchRoster();
      fetchLoads();
    } catch (err) {
      toast("error", "Assignment failed", (err as Error).message);
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Dispatch"
        subtitle="Real-time driver status, HOS, and quick load assignment."
        actions={
          <Button onClick={() => setAssignOpen(true)}>Quick assign</Button>
        }
      />

      {/* Tabs */}
      <div className="mb-5 flex items-center gap-1 rounded-xl bg-surface-solid p-1">
        {(["drivers", "upcoming"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`focus-ring rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-accent text-accent-text shadow-sm"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            {t === "drivers" ? "Drivers" : "Upcoming loads"}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <Input
            placeholder={tab === "drivers" ? "Search drivers…" : "Search loads…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-8"
          />
        </div>
      </div>

      {tab === "drivers" && (
        <>
          {filteredRoster === null ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : filteredRoster.length === 0 ? (
            <EmptyState
              icon={<Users size={24} />}
              title="No drivers"
              description="No drivers match your search or roster is empty."
            />
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <div className="hidden grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary lg:grid">
                <span>Driver</span>
                <span>Current load / Location</span>
                <span>Truck</span>
                <span>HOS</span>
                <span>State</span>
                <span>Type</span>
              </div>
              {filteredRoster.map((driver, i) => (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.15) }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 lg:grid lg:grid-cols-[1fr_1fr_auto_auto_auto_auto]"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {driver.firstName} {driver.lastName}
                    </p>
                    {driver.phone && (
                      <p className="text-xs text-ink-tertiary">{driver.phone}</p>
                    )}
                    {driver.dispatcher && (
                      <p className="text-xs text-ink-tertiary">Disp: {driver.dispatcher}</p>
                    )}
                  </div>
                  <div>
                    {driver.currentLoadNumber ? (
                      <p className="text-sm font-medium text-accent">
                        {driver.currentLoadNumber}
                      </p>
                    ) : (
                      <p className="text-sm text-ink-tertiary">No active load</p>
                    )}
                    {driver.location && (
                      <p className="flex items-center gap-1 text-xs text-ink-tertiary">
                        <MapPin size={10} /> {driver.location}
                      </p>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-sm text-ink-secondary">
                    <Truck size={13} /> {driver.truckUnitNumber ?? "—"}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-ink-secondary">
                    <Clock size={13} />
                    {driver.hosRemaining != null ? `${driver.hosRemaining}h` : "—"}
                  </span>
                  <Badge tone={stateTone[driver.state] ?? "neutral"}>
                    {driver.state?.replace(/_/g, " ") ?? "unknown"}
                  </Badge>
                  <span className="text-xs text-ink-tertiary capitalize">{driver.type}</span>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "upcoming" && (
        <>
          {filteredLoads === null ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : filteredLoads.length === 0 ? (
            <EmptyState
              icon={<CalendarClock size={24} />}
              title="No upcoming loads"
              description="All loads have been dispatched or none match your search."
            />
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <div className="hidden grid-cols-[1fr_1fr_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
                <span>Load #</span>
                <span>Customer</span>
                <span>Pickup</span>
                <span>Status</span>
              </div>
              {filteredLoads.map((load, i) => (
                <motion.div
                  key={load.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.15) }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 sm:grid sm:grid-cols-[1fr_1fr_auto_auto]"
                >
                  <p className="text-sm font-semibold">{load.loadNumber}</p>
                  <p className="text-sm text-ink-secondary">{load.customerName || "—"}</p>
                  <p className="text-xs text-ink-tertiary">
                    {load.pickupDate
                      ? new Date(load.pickupDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "TBD"}
                  </p>
                  <Badge tone={load.status === "draft" ? "neutral" : "accent"}>
                    {load.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Quick Assign Modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Quick assign">
        <form onSubmit={handleAssign} className="space-y-4">
          <Field label="Load">
            <Select
              required
              value={assignLoadId}
              onChange={(e) => setAssignLoadId(e.target.value)}
            >
              <option value="">Select a pending load…</option>
              {(loads ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.loadNumber} — {l.customerName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Driver">
            <Select
              required
              value={assignDriverId}
              onChange={(e) => setAssignDriverId(e.target.value)}
            >
              <option value="">Select a driver…</option>
              {(roster ?? [])
                .filter((d) => d.state === "available" || !d.currentLoadId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName}
                    {d.truckUnitNumber ? ` (Unit ${d.truckUnitNumber})` : ""}
                  </option>
                ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={assigning}>
              Assign & dispatch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
