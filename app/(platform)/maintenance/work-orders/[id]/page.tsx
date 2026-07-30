"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency, formatDate } from "@/src/lib/format";

interface Line {
  id: string;
  description: string;
  amount: number;
  partNumber: string;
  laborHours: number | null;
  vmrsCode: string;
  isPm: boolean;
  isDot: boolean;
}

interface WorkOrder {
  id: string;
  woNumber: string;
  title: string;
  description: string;
  notes: string;
  invoiceRef: string;
  status: string;
  category: string;
  totalAmount: number;
  odometer: number | null;
  completedAt: string | null;
  createdAt: string;
  truck: { id: string; unitNumber: string; make: string; model: string };
  vendor: { id: string; name: string; phone: string; email: string } | null;
  lines: Line[];
}

const statusTone: Record<string, "accent" | "warning" | "success" | "neutral"> = {
  open: "accent",
  in_progress: "warning",
  completed: "success",
  cancelled: "neutral",
};

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [newLine, setNewLine] = useState({
    description: "",
    amount: "",
    partNumber: "",
    vmrsCode: "",
    isPm: false,
  });
  const [completeOdo, setCompleteOdo] = useState("");

  const load = useCallback(() => {
    api<{ workOrder: WorkOrder }>(`/api/work-orders/${id}`)
      .then(({ workOrder }) => {
        setWo(workOrder);
        setCompleteOdo(workOrder.odometer != null ? String(workOrder.odometer) : "");
      })
      .catch(() => setWo(null));
  }, [id]);

  useEffect(load, [load]);

  useEffect(() => {
    api<{ vendors: { id: string; name: string }[] }>("/api/vendors")
      .then(({ vendors: rows }) => setVendors(rows))
      .catch(() => setVendors([]));
  }, []);

  async function saveHeader(patch: Record<string, unknown>) {
    setSaving(true);
    try {
      const { workOrder } = await api<{ workOrder: WorkOrder }>(`/api/work-orders/${id}`, {
        method: "PATCH",
        json: patch,
      });
      setWo(workOrder);
      toast("success", "Saved");
    } catch (error) {
      toast("error", "Couldn't save", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function addLine(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { workOrder } = await api<{ workOrder: WorkOrder }>(
        `/api/work-orders/${id}/lines`,
        {
          method: "POST",
          json: {
            description: newLine.description,
            amount: Number(newLine.amount) || 0,
            partNumber: newLine.partNumber,
            vmrsCode: newLine.vmrsCode,
            isPm: newLine.isPm,
          },
        }
      );
      setWo(workOrder);
      setNewLine({ description: "", amount: "", partNumber: "", vmrsCode: "", isPm: false });
    } catch (error) {
      toast("error", "Couldn't add line", (error as Error).message);
    }
  }

  async function deleteLine(lineId: string) {
    try {
      const { workOrder } = await api<{ workOrder: WorkOrder }>(
        `/api/work-orders/${id}/lines?lineId=${lineId}`,
        { method: "DELETE" }
      );
      setWo(workOrder);
    } catch (error) {
      toast("error", "Couldn't delete line", (error as Error).message);
    }
  }

  async function complete() {
    setCompleting(true);
    try {
      const { workOrder } = await api<{ workOrder: WorkOrder }>(
        `/api/work-orders/${id}/complete`,
        {
          method: "POST",
          json: { odometer: completeOdo ? Number(completeOdo) : null },
        }
      );
      setWo(workOrder);
      toast("success", "Work order completed", "Maintenance record and PM updated.");
    } catch (error) {
      toast("error", "Couldn't complete", (error as Error).message);
    } finally {
      setCompleting(false);
    }
  }

  if (!wo) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const locked = wo.status === "completed" || wo.status === "cancelled";

  return (
    <div>
      <Link
        href="/maintenance/work-orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-accent"
      >
        <ArrowLeft size={14} /> Work orders
      </Link>

      <PageHeader
        eyebrow={wo.woNumber || "Work order"}
        title={wo.title}
        subtitle={`Unit ${wo.truck.unitNumber} · ${wo.truck.make} ${wo.truck.model}`}
        actions={
          <>
            <Badge tone={statusTone[wo.status] ?? "neutral"}>
              {wo.status.replace("_", " ")}
            </Badge>
            {!locked && (
              <>
                {wo.status === "open" && (
                  <Button
                    variant="secondary"
                    loading={saving}
                    onClick={() => saveHeader({ status: "in_progress" })}
                  >
                    Start work
                  </Button>
                )}
                <Button
                  icon={<Check size={15} />}
                  loading={completing}
                  onClick={complete}
                >
                  Complete
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-3 p-5 xl:col-span-1">
          <Field label="Title">
            <Input
              disabled={locked}
              value={wo.title}
              onChange={(e) => setWo({ ...wo, title: e.target.value })}
              onBlur={() => !locked && saveHeader({ title: wo.title })}
            />
          </Field>
          <Field label="Vendor">
            <Select
              disabled={locked}
              value={wo.vendor?.id ?? ""}
              onChange={(e) =>
                saveHeader({ vendorId: e.target.value || null })
              }
            >
              <option value="">None</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Select
              disabled={locked}
              value={wo.category}
              onChange={(e) => saveHeader({ category: e.target.value })}
            >
              <option value="preventative">Preventative / repair</option>
              <option value="accident">Accident</option>
            </Select>
          </Field>
          <Field label="Invoice ref">
            <Input
              disabled={locked}
              value={wo.invoiceRef}
              onChange={(e) => setWo({ ...wo, invoiceRef: e.target.value })}
              onBlur={() => !locked && saveHeader({ invoiceRef: wo.invoiceRef })}
            />
          </Field>
          <Field label="Odometer (at service)">
            <Input
              disabled={locked}
              type="number"
              value={wo.odometer ?? ""}
              onChange={(e) =>
                setWo({
                  ...wo,
                  odometer: e.target.value ? Number(e.target.value) : null,
                })
              }
              onBlur={() => !locked && saveHeader({ odometer: wo.odometer })}
            />
          </Field>
          <Field label="Notes">
            <Input
              disabled={locked}
              value={wo.notes}
              onChange={(e) => setWo({ ...wo, notes: e.target.value })}
              onBlur={() => !locked && saveHeader({ notes: wo.notes })}
            />
          </Field>
          <p className="text-xs text-ink-tertiary">
            Created {formatDate(wo.createdAt)}
            {wo.completedAt ? ` · Completed ${formatDate(wo.completedAt)}` : ""}
          </p>
          <Link
            href={`/maintenance/units/${wo.truck.id}`}
            className="block text-xs font-semibold text-accent"
          >
            View unit profile →
          </Link>
          {!locked && (
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold text-ink-secondary">
                Complete with odometer
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Miles"
                  value={completeOdo}
                  onChange={(e) => setCompleteOdo(e.target.value)}
                />
                <Button loading={completing} onClick={complete} icon={<Check size={14} />}>
                  Done
                </Button>
              </div>
            </div>
          )}
          {wo.status !== "cancelled" && !locked && (
            <Button
              variant="ghost"
              className="w-full text-danger"
              onClick={() => saveHeader({ status: "cancelled" })}
            >
              Cancel work order
            </Button>
          )}
          {locked && (
            <Button variant="secondary" className="w-full" onClick={() => router.push("/maintenance/work-orders")}>
              Back to list
            </Button>
          )}
        </Card>

        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Line items</h2>
            <p className="text-lg font-semibold text-ink">{formatCurrency(wo.totalAmount)}</p>
          </div>

          <div className="space-y-2">
            {wo.lines.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-tertiary">No lines yet.</p>
            ) : (
              wo.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-start gap-3 rounded-xl border border-border/70 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{line.description}</p>
                    <p className="text-xs text-ink-tertiary">
                      {line.partNumber ? `P/N ${line.partNumber}` : ""}
                      {line.partNumber && line.vmrsCode ? " · " : ""}
                      {line.vmrsCode ? `VMRS ${line.vmrsCode}` : ""}
                      {line.isPm ? " · PM" : ""}
                      {line.isDot ? " · DOT" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(line.amount)}</span>
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => deleteLine(line.id)}
                      className="focus-ring rounded-lg p-1.5 text-ink-tertiary hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {!locked && (
            <form onSubmit={addLine} className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-6">
              <Input
                className="sm:col-span-2"
                required
                placeholder="Description"
                value={newLine.description}
                onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
              />
              <Input
                placeholder="Amount"
                type="number"
                step="0.01"
                value={newLine.amount}
                onChange={(e) => setNewLine({ ...newLine, amount: e.target.value })}
              />
              <Input
                placeholder="Part #"
                value={newLine.partNumber}
                onChange={(e) => setNewLine({ ...newLine, partNumber: e.target.value })}
              />
              <Input
                placeholder="VMRS"
                value={newLine.vmrsCode}
                onChange={(e) => setNewLine({ ...newLine, vmrsCode: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-ink-secondary">
                  <input
                    type="checkbox"
                    checked={newLine.isPm}
                    onChange={(e) => setNewLine({ ...newLine, isPm: e.target.checked })}
                  />
                  PM
                </label>
                <Button type="submit" size="sm" icon={<Plus size={14} />}>
                  Add
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
