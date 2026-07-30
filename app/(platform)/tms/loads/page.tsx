"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Download,
  Package,
  Play,
  Plus,
  Search,
  CheckCircle,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency, formatDate } from "@/src/lib/format";
import { CreateLoadModal } from "@/src/components/tms/CreateLoadModal";
import {
  LOAD_STATUSES,
  LOAD_STATUS_LABEL,
  normalizeLoadStatus,
  type LoadStatus,
} from "@/src/lib/tms/constants";

interface LoadRow {
  id: string;
  loadNumber: string;
  status: string;
  customerName: string;
  rate: number | null;
  miles: number | null;
  pickupDate: string | null;
  deliveryDate: string | null;
  originCity: string | null;
  originState: string | null;
  destCity: string | null;
  destState: string | null;
  driver: { id: string; firstName: string; lastName: string } | null;
  truck: { id: string; unitNumber: string } | null;
}

interface DriverOption {
  id: string;
  firstName: string;
  lastName: string;
}

const statusTone: Record<string, "neutral" | "accent" | "warning" | "success" | "danger"> = {
  pending: "accent",
  assigned: "warning",
  in_transit: "warning",
  delivered: "success",
  cancelled: "neutral",
  draft: "neutral",
  dispatched: "accent",
};

const VIEW_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "assigned", label: "Assigned" },
  { id: "in_transit", label: "In Transit" },
  { id: "delivered", label: "Delivered" },
  { id: "unpaid", label: "Unpaid" },
] as const;

export default function LoadsPage() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view") || "all";
  const statusParam = searchParams.get("status") || "";
  const qParam = searchParams.get("q") || "";

  const [loads, setLoads] = useState<LoadRow[] | null>(null);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState(qParam);
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [assignModal, setAssignModal] = useState<LoadRow | null>(null);
  const [assignDriverId, setAssignDriverId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchLoads = useCallback(() => {
    api<{ loads: LoadRow[] }>("/api/tms/loads")
      .then(({ loads: rows }) => setLoads(rows))
      .catch(() => setLoads([]));
  }, []);

  useEffect(fetchLoads, [fetchLoads]);

  useEffect(() => {
    api<{ drivers: DriverOption[] }>("/api/drivers")
      .then(({ drivers: rows }) => setDrivers(rows))
      .catch(() => setDrivers([]));
  }, []);

  const activeView = VIEW_TABS.find((t) => t.id === viewParam) ? viewParam : "all";

  const filtered = useMemo(() => {
    if (!loads) return null;
    let rows = loads;

    if (activeView !== "all") {
      if (activeView === "unpaid") {
        rows = rows.filter(
          (r) => normalizeLoadStatus(r.status) === "delivered" && r.rate && r.rate > 0
        );
      } else {
        rows = rows.filter((r) => normalizeLoadStatus(r.status) === activeView);
      }
    }

    if (statusFilter) {
      rows = rows.filter((r) => normalizeLoadStatus(r.status) === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.loadNumber.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.originCity?.toLowerCase().includes(q) ||
          r.destCity?.toLowerCase().includes(q) ||
          r.driver?.firstName.toLowerCase().includes(q) ||
          r.driver?.lastName.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [loads, activeView, statusFilter, search]);

  const totals = useMemo(() => {
    if (!filtered) return { count: 0, revenue: 0, miles: 0 };
    return {
      count: filtered.length,
      revenue: filtered.reduce((s, r) => s + (r.rate ?? 0), 0),
      miles: filtered.reduce((s, r) => s + (r.miles ?? 0), 0),
    };
  }, [filtered]);

  function setView(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "all") params.delete("view");
    else params.set("view", v);
    router.push(`/tms/loads?${params.toString()}`);
  }

  async function transitionLoad(id: string, status: string) {
    try {
      await api(`/api/tms/loads/${id}`, {
        method: "PATCH",
        json: { action: "transition", status },
      });
      toast("success", `Load updated to ${LOAD_STATUS_LABEL[status as LoadStatus] ?? status}`);
      fetchLoads();
    } catch (err) {
      toast("error", "Transition failed", (err as Error).message);
    }
  }

  async function assignDriver() {
    if (!assignModal || !assignDriverId) return;
    setAssigning(true);
    try {
      await api(`/api/tms/loads/${assignModal.id}`, {
        method: "PATCH",
        json: { action: "assign", driverId: assignDriverId },
      });
      toast("success", "Driver assigned");
      setAssignModal(null);
      setAssignDriverId("");
      fetchLoads();
    } catch (err) {
      toast("error", "Assign failed", (err as Error).message);
    } finally {
      setAssigning(false);
    }
  }

  function exportCsv() {
    if (!filtered || filtered.length === 0) return;
    const headers = [
      "Load #",
      "Customer",
      "Origin",
      "Destination",
      "Driver",
      "Truck",
      "Pickup",
      "Delivery",
      "Status",
      "Revenue",
      "Miles",
    ];
    const rows = filtered.map((r) => [
      r.loadNumber,
      r.customerName,
      r.originCity && r.originState ? `${r.originCity} ${r.originState}` : "",
      r.destCity && r.destState ? `${r.destCity} ${r.destState}` : "",
      r.driver ? `${r.driver.firstName} ${r.driver.lastName}` : "",
      r.truck?.unitNumber ?? "",
      r.pickupDate ?? "",
      r.deliveryDate ?? "",
      normalizeLoadStatus(r.status),
      r.rate?.toString() ?? "",
      r.miles?.toString() ?? "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Loads"
        subtitle="Create and track freight loads from pickup to delivery."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Download size={15} />} onClick={exportCsv}>
              Export
            </Button>
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              New load
            </Button>
          </div>
        }
      />

      {/* View tabs */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {VIEW_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activeView === t.id
                ? "bg-accent text-accent-text"
                : "bg-surface-solid text-ink-secondary ring-1 ring-border hover:ring-ink-tertiary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & filter */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
          />
          <Input
            placeholder="Search loads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-9"
          />
        </div>
        <div className="w-40">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {LOAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LOAD_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      {filtered === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={24} />}
          title="No loads found"
          description={
            search || statusFilter || activeView !== "all"
              ? "Try adjusting your filters."
              : "Create your first load to get started."
          }
          action={
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              New load
            </Button>
          }
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          {/* Header row */}
          <div className="hidden grid-cols-[0.8fr_1fr_1.2fr_0.9fr_0.6fr_0.7fr_0.7fr_auto_0.6fr_0.5fr_auto] gap-3 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary xl:grid">
            <span>Load #</span>
            <span>Customer</span>
            <span>Lane</span>
            <span>Driver</span>
            <span>Truck</span>
            <span>Pickup</span>
            <span>Delivery</span>
            <span>Status</span>
            <span className="text-right">Revenue</span>
            <span className="text-right">Miles</span>
            <span>Actions</span>
          </div>

          {/* Data rows */}
          {filtered.map((row, i) => {
            const normalized = normalizeLoadStatus(row.status);
            const lane =
              row.originCity && row.destCity
                ? `${row.originCity}, ${row.originState ?? ""} → ${row.destCity}, ${row.destState ?? ""}`
                : "—";

            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.15) }}
                className="group flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-5 py-3 last:border-0 hover:bg-accent-soft/30 xl:grid xl:grid-cols-[0.8fr_1fr_1.2fr_0.9fr_0.6fr_0.7fr_0.7fr_auto_0.6fr_0.5fr_auto]"
              >
                <Link
                  href={`/tms/loads/${row.id}`}
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  {row.loadNumber}
                </Link>
                <p className="truncate text-sm text-ink-secondary">{row.customerName || "—"}</p>
                <p className="truncate text-xs text-ink-secondary">{lane}</p>
                <p className="truncate text-sm text-ink-secondary">
                  {row.driver
                    ? `${row.driver.firstName} ${row.driver.lastName}`
                    : "Unassigned"}
                </p>
                <p className="truncate text-xs text-ink-tertiary">
                  {row.truck ? `#${row.truck.unitNumber}` : "—"}
                </p>
                <p className="text-xs text-ink-secondary">
                  {row.pickupDate ? formatDate(row.pickupDate) : "—"}
                </p>
                <p className="text-xs text-ink-secondary">
                  {row.deliveryDate ? formatDate(row.deliveryDate) : "—"}
                </p>
                <Badge tone={statusTone[normalized] ?? "neutral"}>
                  {LOAD_STATUS_LABEL[normalized] ?? row.status}
                </Badge>
                <span className="text-right text-sm font-semibold">
                  {row.rate != null ? formatCurrency(row.rate) : "—"}
                </span>
                <span className="text-right text-xs text-ink-secondary">
                  {row.miles != null ? row.miles.toLocaleString() : "—"}
                </span>

                {/* Row actions */}
                <div className="flex items-center gap-1">
                  {(normalized === "pending" || !row.driver) && (
                    <button
                      type="button"
                      title="Assign driver"
                      onClick={() => {
                        setAssignModal(row);
                        setAssignDriverId(row.driver?.id ?? "");
                      }}
                      className="rounded-lg p-1.5 text-ink-tertiary hover:bg-accent-soft hover:text-accent"
                    >
                      <UserPlus size={14} />
                    </button>
                  )}
                  {normalized === "assigned" && (
                    <button
                      type="button"
                      title="Start route"
                      onClick={() => transitionLoad(row.id, "in_transit")}
                      className="rounded-lg p-1.5 text-ink-tertiary hover:bg-warning-soft hover:text-warning"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  {normalized === "in_transit" && (
                    <button
                      type="button"
                      title="Mark delivered"
                      onClick={() => transitionLoad(row.id, "delivered")}
                      className="rounded-lg p-1.5 text-ink-tertiary hover:bg-success-soft hover:text-success"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Footer totals */}
          <div className="flex items-center justify-between border-t border-border bg-surface-solid/40 px-5 py-2.5 text-xs font-medium text-ink-secondary">
            <span>{totals.count} load{totals.count !== 1 ? "s" : ""}</span>
            <span className="flex gap-4">
              <span>Revenue: {formatCurrency(totals.revenue)}</span>
              <span>Miles: {totals.miles.toLocaleString()}</span>
            </span>
          </div>
        </div>
      )}

      {/* Create Load Modal */}
      <CreateLoadModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchLoads}
      />

      {/* Assign Driver Modal */}
      <Modal
        open={!!assignModal}
        onClose={() => setAssignModal(null)}
        title="Assign Driver"
        subtitle={assignModal ? `Load ${assignModal.loadNumber}` : undefined}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            assignDriver();
          }}
          className="space-y-4"
        >
          <Field label="Driver">
            <Select value={assignDriverId} onChange={(e) => setAssignDriverId(e.target.value)}>
              <option value="">Select a driver</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAssignModal(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={assigning} disabled={!assignDriverId}>
              Assign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
