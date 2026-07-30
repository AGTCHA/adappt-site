"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Wrench } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency, formatDate } from "@/src/lib/format";

interface WorkOrderRow {
  id: string;
  title: string;
  description: string;
  status: string;
  totalAmount: number;
  category: string;
  createdAt: string;
  truck: { id: string; unitNumber: string };
  vendor: { id: string; name: string } | null;
}

interface TruckOption {
  id: string;
  unitNumber: string;
}

interface VendorOption {
  id: string;
  name: string;
}

const statusTone: Record<string, "accent" | "warning" | "success" | "neutral"> = {
  open: "accent",
  in_progress: "warning",
  completed: "success",
  cancelled: "neutral",
};

const statusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function WorkOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<WorkOrderRow[] | null>(null);
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ truckId: "", title: "", vendorId: "" });

  const load = useCallback(() => {
    api<{ workOrders: WorkOrderRow[] }>("/api/work-orders")
      .then(({ workOrders }) => setOrders(workOrders))
      .catch(() => setOrders([]));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (!createOpen) return;
    api<{ trucks: TruckOption[] }>("/api/trucks")
      .then(({ trucks: rows }) => setTrucks(rows))
      .catch(() => setTrucks([]));
    api<{ vendors: VendorOption[] }>("/api/vendors")
      .then(({ vendors: rows }) => setVendors(rows))
      .catch(() => setVendors([]));
  }, [createOpen]);

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/work-orders", {
        method: "POST",
        json: {
          truckId: form.truckId,
          title: form.title,
          ...(form.vendorId ? { vendorId: form.vendorId } : {}),
        },
      });
      toast("success", "Work order created");
      setForm({ truckId: "", title: "", vendorId: "" });
      setCreateOpen(false);
      load();
    } catch (error) {
      toast("error", "Couldn't create work order", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Fleet"
        title="Work Orders"
        subtitle="Track shop work and vendor repairs across your fleet."
        actions={
          <>
            <Link href="/fleet?tab=maintenance">
              <Button variant="secondary" icon={<Wrench size={15} />}>
                Maintenance log
              </Button>
            </Link>
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              New work order
            </Button>
          </>
        }
      />

      {orders === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Wrench size={24} />}
          title="No work orders yet"
          description="Create a work order when a truck goes in for service or repair."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              New work order
            </Button>
          }
        />
      ) : (
        <div className="glass divide-y divide-border overflow-hidden rounded-2xl">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.2) }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  order.category === "accident" ? "bg-danger" : "bg-accent"
                }`}
              />
              <span className="w-16 shrink-0 text-sm font-semibold">
                {order.truck.unitNumber}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{order.title}</p>
                <p className="mt-0.5 truncate text-xs text-ink-tertiary">
                  {order.vendor?.name ?? "No vendor"}
                  {order.description ? ` · ${order.description}` : ""}
                </p>
              </div>
              <Badge tone={statusTone[order.status] ?? "neutral"}>
                {statusLabel[order.status] ?? order.status}
              </Badge>
              <span className="text-xs text-ink-tertiary">{formatDate(order.createdAt)}</span>
              {order.totalAmount > 0 && (
                <span className="w-20 text-right text-sm font-semibold">
                  {formatCurrency(order.totalAmount)}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New work order"
        subtitle="Open a ticket for shop or vendor work."
      >
        <form onSubmit={createOrder} className="space-y-4">
          <Field label="Truck">
            <Select
              required
              value={form.truckId}
              onChange={(e) => setForm((f) => ({ ...f, truckId: e.target.value }))}
            >
              <option value="">Select unit…</option>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  Unit {truck.unitNumber}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title">
            <Input
              required
              placeholder="e.g. PM service, brake repair"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </Field>
          <Field label="Vendor" hint="Optional — assign a shop or vendor.">
            <Select
              value={form.vendorId}
              onChange={(e) => setForm((f) => ({ ...f, vendorId: e.target.value }))}
            >
              <option value="">None</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
