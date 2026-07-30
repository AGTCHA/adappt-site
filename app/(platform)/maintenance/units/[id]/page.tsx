"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Gauge, Plus, Save, Wrench } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge, truckStatusLabel, truckStatusTone } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency, formatDate, formatNumber } from "@/src/lib/format";

interface TruckDetail {
  id: string;
  unitNumber: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  mileage: number;
  status: string;
  driver: { id: string; firstName: string; lastName: string; phone: string } | null;
  workOrders: {
    id: string;
    woNumber: string;
    title: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    vendor: { name: string } | null;
  }[];
  maintenance: {
    id: string;
    date: string;
    vendor: string;
    description: string;
    amount: number;
    category: string;
    odometer: number | null;
  }[];
  servicePrograms: {
    id: string;
    name: string;
    intervalMiles: number | null;
    intervalDays: number | null;
    nextDueAt: string | null;
    nextDueMiles: number | null;
  }[];
}

export default function UnitProfilePage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [truck, setTruck] = useState<TruckDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [odo, setOdo] = useState("");
  const [form, setForm] = useState({
    unitNumber: "",
    year: "",
    make: "",
    model: "",
    vin: "",
    status: "active",
  });

  const load = useCallback(() => {
    api<{ truck: TruckDetail }>(`/api/trucks/${id}`)
      .then(({ truck: t }) => {
        setTruck(t);
        setForm({
          unitNumber: t.unitNumber,
          year: String(t.year),
          make: t.make,
          model: t.model,
          vin: t.vin,
          status: t.status,
        });
        setOdo(String(t.mileage));
      })
      .catch(() => setTruck(null));
  }, [id]);

  useEffect(load, [load]);

  async function saveTruck(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/trucks/${id}`, {
        method: "PATCH",
        json: {
          ...form,
          year: Number(form.year),
        },
      });
      toast("success", "Unit updated");
      load();
    } catch (error) {
      toast("error", "Couldn't save", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveOdometer() {
    try {
      await api("/api/odometer", {
        method: "POST",
        json: { truckId: id, reading: Number(odo) },
      });
      toast("success", "Odometer saved");
      load();
    } catch (error) {
      toast("error", "Couldn't save odometer", (error as Error).message);
    }
  }

  if (!truck) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/maintenance/units"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-accent"
      >
        <ArrowLeft size={14} /> Units
      </Link>

      <PageHeader
        eyebrow="Unit profile"
        title={`Unit ${truck.unitNumber}`}
        subtitle={`${truck.year} ${truck.make} ${truck.model}`}
        actions={
          <>
            <Badge tone={truckStatusTone[truck.status] ?? "neutral"}>
              {truckStatusLabel[truck.status] ?? truck.status}
            </Badge>
            <Link href={`/maintenance/work-orders?truckId=${truck.id}`}>
              <Button icon={<Plus size={15} />}>New work order</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-1">
          <h2 className="mb-4 text-sm font-semibold">Details</h2>
          <form onSubmit={saveTruck} className="space-y-3">
            <Field label="Unit number">
              <Input
                value={form.unitNumber}
                onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Year">
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">On the road</option>
                  <option value="in_shop">In the shop</option>
                  <option value="inactive">Parked</option>
                </Select>
              </Field>
            </div>
            <Field label="Make">
              <Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
            </Field>
            <Field label="Model">
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </Field>
            <Field label="VIN">
              <Input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
            </Field>
            <Button type="submit" loading={saving} icon={<Save size={14} />} className="w-full">
              Save details
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Gauge size={14} /> Odometer
            </h3>
            <p className="mb-2 text-xs text-ink-tertiary">
              Current: {formatNumber(truck.mileage)} mi — used for CPM and PM due miles.
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                value={odo}
                onChange={(e) => setOdo(e.target.value)}
                className="flex-1"
              />
              <Button variant="secondary" onClick={saveOdometer}>
                Update
              </Button>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Driver</p>
            <p className="mt-1 font-medium text-ink">
              {truck.driver
                ? `${truck.driver.firstName} ${truck.driver.lastName}`
                : "Unassigned"}
            </p>
            {truck.driver?.phone && (
              <p className="text-xs text-ink-secondary">{truck.driver.phone}</p>
            )}
          </div>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Work orders</h2>
              <Link href="/maintenance/work-orders" className="text-xs font-semibold text-accent">
                All WOs
              </Link>
            </div>
            {truck.workOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-tertiary">No work orders yet.</p>
            ) : (
              <div className="space-y-2">
                {truck.workOrders.map((wo) => (
                  <Link
                    key={wo.id}
                    href={`/maintenance/work-orders/${wo.id}`}
                    className="focus-ring flex items-center justify-between rounded-xl border border-border/70 px-3 py-2.5 hover:bg-accent-soft"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        <span className="text-accent">{wo.woNumber}</span> · {wo.title}
                      </p>
                      <p className="text-xs text-ink-tertiary">
                        {wo.vendor?.name ?? "No vendor"} · {formatDate(wo.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone="neutral">{wo.status}</Badge>
                      <span className="text-sm font-semibold">{formatCurrency(wo.totalAmount)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
              <Wrench size={14} /> Service programs
            </h2>
            {truck.servicePrograms.length === 0 ? (
              <p className="text-sm text-ink-tertiary">
                No PM programs.{" "}
                <Link href="/maintenance/service" className="font-semibold text-accent">
                  Add one
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {truck.servicePrograms.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border/70 px-3 py-2.5 text-sm"
                  >
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-ink-tertiary">
                      {p.intervalMiles ? `Every ${formatNumber(p.intervalMiles)} mi` : ""}
                      {p.intervalMiles && p.intervalDays ? " · " : ""}
                      {p.intervalDays ? `Every ${p.intervalDays} days` : ""}
                      {p.nextDueMiles != null ? ` · due @ ${formatNumber(p.nextDueMiles)} mi` : ""}
                      {p.nextDueAt ? ` · due ${formatDate(p.nextDueAt)}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold">Maintenance history</h2>
            {truck.maintenance.length === 0 ? (
              <p className="text-sm text-ink-tertiary">No maintenance records yet.</p>
            ) : (
              <div className="space-y-2">
                {truck.maintenance.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.description || r.vendor}</p>
                      <p className="text-xs text-ink-tertiary">
                        {formatDate(r.date)}
                        {r.vendor ? ` · ${r.vendor}` : ""}
                        {r.odometer != null ? ` · ${formatNumber(r.odometer)} mi` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">{formatCurrency(r.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
