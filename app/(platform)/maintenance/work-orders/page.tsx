"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
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
  woNumber: string;
  title: string;
  status: string;
  totalAmount: number;
  category: string;
  createdAt: string;
  truck: { id: string; unitNumber: string };
  vendor: { id: string; name: string } | null;
}

const statusTone: Record<string, "accent" | "warning" | "success" | "neutral"> = {
  open: "accent",
  in_progress: "warning",
  completed: "success",
  cancelled: "neutral",
};

function WorkOrdersContent() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const truckFilter = searchParams.get("truckId") ?? "";
  const [orders, setOrders] = useState<WorkOrderRow[] | null>(null);
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(searchParams.get("new") === "1");
  const [trucks, setTrucks] = useState<{ id: string; unitNumber: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    truckId: truckFilter,
    title: "",
    vendorId: "",
    description: "",
  });

  const load = useCallback(() => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (truckFilter) qs.set("truckId", truckFilter);
    api<{ workOrders: WorkOrderRow[] }>(`/api/work-orders?${qs}`)
      .then(({ workOrders }) => setOrders(workOrders))
      .catch(() => setOrders([]));
  }, [status, truckFilter]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!createOpen) return;
    api<{ trucks: { id: string; unitNumber: string }[] }>("/api/trucks")
      .then(({ trucks: rows }) => setTrucks(rows))
      .catch(() => setTrucks([]));
    api<{ vendors: { id: string; name: string }[] }>("/api/vendors")
      .then(({ vendors: rows }) => setVendors(rows))
      .catch(() => setVendors([]));
  }, [createOpen]);

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { workOrder } = await api<{ workOrder: { id: string } }>("/api/work-orders", {
        method: "POST",
        json: {
          truckId: form.truckId,
          title: form.title,
          vendorId: form.vendorId || undefined,
          description: form.description,
        },
      });
      toast("success", "Work order created");
      setCreateOpen(false);
      router.push(`/maintenance/work-orders/${workOrder.id}`);
    } catch (error) {
      toast("error", "Couldn't create work order", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance"
        title="Work Orders"
        subtitle="Track shop work from open through complete — with lines, vendors, and PM."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            New work order
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {["", "open", "in_progress", "completed", "cancelled"].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setStatus(s)}
            className={`focus-ring rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              status === s
                ? "bg-accent text-accent-text"
                : "bg-surface-solid text-ink-secondary ring-1 ring-border hover:bg-accent-soft"
            }`}
          >
            {s === "" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {orders === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Wrench size={24} />}
          title="No work orders"
          description="Create a blank WO or apply an invoice from Documents."
        />
      ) : (
        <div className="space-y-2">
          {orders.map((wo) => (
            <Link
              key={wo.id}
              href={`/maintenance/work-orders/${wo.id}`}
              className="glass focus-ring flex items-center gap-4 rounded-2xl px-4 py-3.5 transition hover:shadow-raised"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-accent">{wo.woNumber || "WO"}</span>
                  <Badge tone={statusTone[wo.status] ?? "neutral"}>
                    {wo.status.replace("_", " ")}
                  </Badge>
                  {wo.category === "accident" && <Badge tone="danger">Accident</Badge>}
                </div>
                <p className="mt-0.5 truncate text-sm font-semibold text-ink">{wo.title}</p>
                <p className="text-xs text-ink-secondary">
                  Unit {wo.truck.unitNumber}
                  {wo.vendor ? ` · ${wo.vendor.name}` : ""} · {formatDate(wo.createdAt)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold">{formatCurrency(wo.totalAmount)}</p>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New work order"
        subtitle="Or upload an invoice under Documents to auto-fill lines."
      >
        <form onSubmit={createOrder} className="space-y-4">
          <Field label="Truck">
            <Select
              required
              value={form.truckId}
              onChange={(e) => setForm({ ...form, truckId: e.target.value })}
            >
              <option value="">Select unit…</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  Unit {t.unitNumber}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title">
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Oil change / brake job…"
            />
          </Field>
          <Field label="Vendor">
            <Select
              value={form.vendorId}
              onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
            >
              <option value="">Optional</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2">
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

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <WorkOrdersContent />
    </Suspense>
  );
}
