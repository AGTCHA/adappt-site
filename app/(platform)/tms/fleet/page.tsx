"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Truck,
  Plus,
  Trash2,
  Edit2,
  Navigation,
  Container,
  Route,
  Search,
  Settings,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge, truckStatusTone, truckStatusLabel } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency, formatDate } from "@/src/lib/format";

interface FleetTruck {
  id: string;
  unitNumber: string;
  status: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  assignedDriver: { id: string; firstName: string; lastName: string } | null;
  currentLoad: { id: string; loadNumber: string; status: string } | null;
  latitude: number | null;
  longitude: number | null;
  lastLocationUpdate: string | null;
}

interface Trailer {
  id: string;
  unitNumber: string;
  type: string;
  status: string;
  length: number | null;
  licensePlate: string | null;
}

interface TripRow {
  id: string;
  loadNumber: string;
  customerName: string;
  driverName: string;
  miles: number | null;
  rate: number | null;
  deliveryDate: string | null;
  origin: string | null;
  destination: string | null;
}

type Tab = "map" | "trips" | "trailers";

export default function FleetPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("map");
  const [trucks, setTrucks] = useState<FleetTruck[] | null>(null);
  const [trailers, setTrailers] = useState<Trailer[] | null>(null);
  const [trips, setTrips] = useState<TripRow[] | null>(null);
  const [search, setSearch] = useState("");

  // Trailer modal
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [editingTrailer, setEditingTrailer] = useState<Trailer | null>(null);
  const [trailerForm, setTrailerForm] = useState({
    unitNumber: "",
    type: "dry_van",
    status: "active",
    length: "",
    licensePlate: "",
  });
  const [savingTrailer, setSavingTrailer] = useState(false);

  const fetchTrucks = useCallback(() => {
    api<{ trucks: FleetTruck[] }>("/api/trucks")
      .then(({ trucks: rows }) => setTrucks(rows))
      .catch(() => setTrucks([]));
  }, []);

  const fetchTrailers = useCallback(() => {
    api<{ trailers: Trailer[] }>("/api/tms/trailers")
      .then(({ trailers: rows }) => setTrailers(rows))
      .catch(() => setTrailers([]));
  }, []);

  const fetchTrips = useCallback(() => {
    api<{ trips?: TripRow[]; loads?: TripRow[] }>("/api/tms/loads?status=delivered")
      .then((res) => setTrips(res.trips ?? res.loads ?? []))
      .catch(() => setTrips([]));
  }, []);

  useEffect(fetchTrucks, [fetchTrucks]);
  useEffect(() => {
    if (tab === "trailers") fetchTrailers();
    if (tab === "trips") fetchTrips();
  }, [tab, fetchTrailers, fetchTrips]);

  const filteredTrucks = useMemo(() => {
    if (!trucks) return null;
    if (!search.trim()) return trucks;
    const q = search.toLowerCase();
    return trucks.filter(
      (t) =>
        (t.unitNumber ?? "").toLowerCase().includes(q) ||
        (t.assignedDriver
          ? `${t.assignedDriver.firstName ?? ""} ${t.assignedDriver.lastName ?? ""}`
              .toLowerCase()
              .includes(q)
          : false)
    );
  }, [trucks, search]);

  function openCreateTrailer() {
    setEditingTrailer(null);
    setTrailerForm({ unitNumber: "", type: "dry_van", status: "active", length: "", licensePlate: "" });
    setTrailerOpen(true);
  }

  function openEditTrailer(t: Trailer) {
    setEditingTrailer(t);
    setTrailerForm({
      unitNumber: t.unitNumber,
      type: t.type,
      status: t.status,
      length: t.length?.toString() ?? "",
      licensePlate: t.licensePlate ?? "",
    });
    setTrailerOpen(true);
  }

  async function saveTrailer(e: React.FormEvent) {
    e.preventDefault();
    setSavingTrailer(true);
    try {
      const payload = {
        unitNumber: trailerForm.unitNumber,
        type: trailerForm.type,
        status: trailerForm.status,
        ...(trailerForm.length ? { length: Number(trailerForm.length) } : {}),
        ...(trailerForm.licensePlate ? { licensePlate: trailerForm.licensePlate } : {}),
      };
      if (editingTrailer) {
        await api(`/api/tms/trailers/${editingTrailer.id}`, { method: "PATCH", json: payload });
        toast("success", "Trailer updated");
      } else {
        await api("/api/tms/trailers", { method: "POST", json: payload });
        toast("success", "Trailer created");
      }
      setTrailerOpen(false);
      fetchTrailers();
    } catch (err) {
      toast("error", "Save failed", (err as Error).message);
    } finally {
      setSavingTrailer(false);
    }
  }

  async function deleteTrailer(id: string) {
    if (!confirm("Delete this trailer?")) return;
    try {
      await api(`/api/tms/trailers/${id}`, { method: "DELETE" });
      toast("success", "Trailer deleted");
      fetchTrailers();
    } catch (err) {
      toast("error", "Delete failed", (err as Error).message);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Fleet"
        subtitle="Live truck positions, trip history, and trailer management."
        actions={
          tab === "trailers" ? (
            <Button icon={<Plus size={15} />} onClick={openCreateTrailer}>
              Add trailer
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="mb-5 flex items-center gap-1 rounded-xl bg-surface-solid p-1">
        {([
          { key: "map", label: "Live map", icon: <Navigation size={14} /> },
          { key: "trips", label: "Trips", icon: <Route size={14} /> },
          { key: "trailers", label: "Trailers", icon: <Container size={14} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`focus-ring flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-accent text-accent-text shadow-sm"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* === LIVE MAP TAB === */}
      {tab === "map" && (
        <>
          <div className="mb-4 relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <Input
              placeholder="Search trucks or drivers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!pl-8"
            />
          </div>

          {filteredTrucks === null ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : filteredTrucks.length === 0 ? (
            <EmptyState
              icon={<Truck size={24} />}
              title="No trucks"
              description="Add trucks to your fleet to see them here."
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTrucks.map((truck, i) => (
                  <motion.div
                    key={truck.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.2) }}
                    className="glass rounded-2xl p-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">Unit {truck.unitNumber}</p>
                        {truck.make && (
                          <p className="text-xs text-ink-tertiary">
                            {truck.year} {truck.make} {truck.model}
                          </p>
                        )}
                      </div>
                      <Badge tone={truckStatusTone[truck.status] ?? "neutral"}>
                        {truckStatusLabel[truck.status] ?? truck.status}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <p className="text-ink-secondary">
                        <span className="font-medium text-ink">Driver:</span>{" "}
                        {truck.assignedDriver
                          ? `${truck.assignedDriver.firstName} ${truck.assignedDriver.lastName}`
                          : "Unassigned"}
                      </p>
                      {truck.currentLoad && (
                        <p className="text-ink-secondary">
                          <span className="font-medium text-ink">Load:</span>{" "}
                          <Link href={`/tms/loads/${truck.currentLoad.id}`} className="text-accent hover:underline">
                            {truck.currentLoad.loadNumber}
                          </Link>
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-ink-tertiary">
                        <MapPin size={11} />
                        {truck.latitude != null && truck.longitude != null ? (
                          <span>
                            {truck.latitude.toFixed(4)}, {truck.longitude.toFixed(4)}
                          </span>
                        ) : (
                          <span>No position data</span>
                        )}
                      </div>
                      {truck.lastLocationUpdate && (
                        <p className="text-xs text-ink-tertiary">
                          Updated {formatDate(truck.lastLocationUpdate)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 glass rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Connect telematics</p>
                    <p className="mt-0.5 text-xs text-ink-secondary">
                      Enable real-time GPS tracking by connecting your telematics provider.
                    </p>
                  </div>
                  <Link href="/tms/settings">
                    <Button variant="secondary" size="sm" icon={<Settings size={14} />}>
                      Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* === TRIPS TAB === */}
      {tab === "trips" && (
        <>
          {trips === null ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <EmptyState
              icon={<Route size={24} />}
              title="No trip history"
              description="Delivered loads will appear here as trip records."
            />
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <div className="hidden grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
                <span>Load</span>
                <span>Driver</span>
                <span>Route</span>
                <span>Miles</span>
                <span className="text-right">Revenue</span>
              </div>
              {trips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.15) }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 sm:grid sm:grid-cols-[1fr_1fr_1fr_auto_auto]"
                >
                  <div>
                    <p className="text-sm font-semibold">{trip.loadNumber}</p>
                    <p className="text-xs text-ink-tertiary">{trip.customerName}</p>
                  </div>
                  <p className="text-sm text-ink-secondary">{trip.driverName || "—"}</p>
                  <p className="text-sm text-ink-secondary">
                    {trip.origin && trip.destination
                      ? `${trip.origin} → ${trip.destination}`
                      : "—"}
                  </p>
                  <p className="text-sm font-medium">{trip.miles ?? "—"}</p>
                  <p className="text-right text-sm font-semibold">
                    {trip.rate != null ? formatCurrency(trip.rate) : "—"}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* === TRAILERS TAB === */}
      {tab === "trailers" && (
        <>
          {trailers === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : trailers.length === 0 ? (
            <EmptyState
              icon={<Container size={24} />}
              title="No trailers"
              description="Add trailers to track your fleet equipment."
              action={
                <Button icon={<Plus size={15} />} onClick={openCreateTrailer}>
                  Add trailer
                </Button>
              }
            />
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
                <span>Unit #</span>
                <span>Type</span>
                <span>Length</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {trailers.map((trailer, i) => (
                <motion.div
                  key={trailer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.15) }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto]"
                >
                  <div>
                    <p className="text-sm font-semibold">{trailer.unitNumber}</p>
                    {trailer.licensePlate && (
                      <p className="text-xs text-ink-tertiary">{trailer.licensePlate}</p>
                    )}
                  </div>
                  <p className="text-sm text-ink-secondary capitalize">
                    {(trailer.type ?? "dry_van").replace(/_/g, " ")}
                  </p>
                  <p className="text-sm text-ink-secondary">
                    {trailer.length ? `${trailer.length}ft` : "—"}
                  </p>
                  <Badge tone={trailer.status === "active" ? "success" : "neutral"}>
                    {trailer.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit2 size={13} />}
                      onClick={() => openEditTrailer(trailer)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={13} />}
                      onClick={() => deleteTrailer(trailer.id)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Trailer Modal */}
          <Modal
            open={trailerOpen}
            onClose={() => setTrailerOpen(false)}
            title={editingTrailer ? "Edit trailer" : "New trailer"}
          >
            <form onSubmit={saveTrailer} className="space-y-4">
              <Field label="Unit number">
                <Input
                  required
                  placeholder="e.g. TRL-101"
                  value={trailerForm.unitNumber}
                  onChange={(e) => setTrailerForm((f) => ({ ...f, unitNumber: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <Select
                    value={trailerForm.type}
                    onChange={(e) => setTrailerForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    <option value="dry_van">Dry van</option>
                    <option value="reefer">Reefer</option>
                    <option value="flatbed">Flatbed</option>
                    <option value="step_deck">Step deck</option>
                    <option value="tanker">Tanker</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select
                    value={trailerForm.status}
                    onChange={(e) => setTrailerForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="in_shop">In shop</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Length (ft)">
                  <Input
                    type="number"
                    min={0}
                    value={trailerForm.length}
                    onChange={(e) => setTrailerForm((f) => ({ ...f, length: e.target.value }))}
                  />
                </Field>
                <Field label="License plate">
                  <Input
                    value={trailerForm.licensePlate}
                    onChange={(e) => setTrailerForm((f) => ({ ...f, licensePlate: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setTrailerOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={savingTrailer}>
                  {editingTrailer ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}
