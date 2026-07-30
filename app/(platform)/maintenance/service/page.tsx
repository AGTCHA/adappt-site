"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Check, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatDate, formatNumber } from "@/src/lib/format";

interface Program {
  id: string;
  name: string;
  intervalMiles: number | null;
  intervalDays: number | null;
  lastCompletedAt: string | null;
  nextDueAt: string | null;
  nextDueMiles: number | null;
  health: "overdue" | "due_soon" | "ok" | "unknown";
  truck: { id: string; unitNumber: string; mileage: number } | null;
}

const healthTone: Record<string, "danger" | "warning" | "success" | "neutral"> = {
  overdue: "danger",
  due_soon: "warning",
  ok: "success",
  unknown: "neutral",
};

const healthLabel: Record<string, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  ok: "On track",
  unknown: "No due date",
};

export default function ServicePage() {
  const toast = useToast();
  const [tab, setTab] = useState<"schedule" | "programs">("schedule");
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [trucks, setTrucks] = useState<{ id: string; unitNumber: string }[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    truckId: "",
    intervalMiles: "",
    intervalDays: "",
  });

  const load = useCallback(() => {
    api<{ programs: Program[] }>("/api/service-programs")
      .then(({ programs: rows }) => setPrograms(rows))
      .catch(() => setPrograms([]));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    api<{ trucks: { id: string; unitNumber: string }[] }>("/api/trucks")
      .then(({ trucks: rows }) => setTrucks(rows))
      .catch(() => setTrucks([]));
  }, []);

  const schedule = useMemo(() => {
    if (!programs) return null;
    const order = { overdue: 0, due_soon: 1, ok: 2, unknown: 3 };
    return [...programs].sort(
      (a, b) => (order[a.health] ?? 9) - (order[b.health] ?? 9)
    );
  }, [programs]);

  async function createProgram(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/service-programs", {
        method: "POST",
        json: {
          name: form.name,
          truckId: form.truckId || undefined,
          intervalMiles: form.intervalMiles ? Number(form.intervalMiles) : null,
          intervalDays: form.intervalDays ? Number(form.intervalDays) : null,
        },
      });
      toast("success", "Program created");
      setCreateOpen(false);
      setForm({ name: "", truckId: "", intervalMiles: "", intervalDays: "" });
      load();
    } catch (error) {
      toast("error", "Couldn't create", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function markServiced(id: string) {
    try {
      await api(`/api/service-programs/${id}`, {
        method: "PATCH",
        json: { action: "mark_serviced" },
      });
      toast("success", "Marked serviced — next due rolled forward");
      load();
    } catch (error) {
      toast("error", "Couldn't update", (error as Error).message);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/service-programs/${id}`, { method: "DELETE" });
      toast("success", "Program deleted");
      load();
    } catch (error) {
      toast("error", "Couldn't delete", (error as Error).message);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance"
        title="Service / PM"
        subtitle="Preventative schedules by miles or days — see what's overdue at a glance."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            Add program
          </Button>
        }
      />

      <div className="mb-5 flex gap-2">
        {(
          [
            ["schedule", "Schedule"],
            ["programs", "Programs"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              tab === key
                ? "bg-accent text-accent-text"
                : "bg-surface-solid text-ink-secondary ring-1 ring-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {programs === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <EmptyState
          icon={<Calendar size={24} />}
          title="No PM programs"
          description="Add oil changes, DOT inspections, or any interval-based service."
        />
      ) : tab === "schedule" ? (
        <div className="space-y-2">
          {schedule!.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <Badge tone={healthTone[p.health]}>{healthLabel[p.health]}</Badge>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{p.name}</p>
                <p className="text-xs text-ink-secondary">
                  {p.truck ? `Unit ${p.truck.unitNumber}` : "Fleet-wide"}
                  {p.nextDueMiles != null
                    ? ` · due @ ${formatNumber(p.nextDueMiles)} mi`
                    : ""}
                  {p.nextDueAt ? ` · due ${formatDate(p.nextDueAt)}` : ""}
                  {p.truck ? ` · now ${formatNumber(p.truck.mileage)} mi` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                icon={<Check size={14} />}
                onClick={() => markServiced(p.id)}
              >
                Mark serviced
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {programs.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-ink-secondary">
                  {p.truck ? `Unit ${p.truck.unitNumber}` : "All units"}
                  {p.intervalMiles ? ` · every ${formatNumber(p.intervalMiles)} mi` : ""}
                  {p.intervalDays ? ` · every ${p.intervalDays} days` : ""}
                  {p.lastCompletedAt ? ` · last ${formatDate(p.lastCompletedAt)}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                icon={<Trash2 size={14} />}
                onClick={() => remove(p.id)}
              >
                Delete
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add PM program"
        subtitle="Intervals roll next due when you mark serviced or complete a PM work order."
      >
        <form onSubmit={createProgram} className="space-y-4">
          <Field label="Name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Oil change"
            />
          </Field>
          <Field label="Truck">
            <Select
              value={form.truckId}
              onChange={(e) => setForm({ ...form, truckId: e.target.value })}
            >
              <option value="">Fleet-wide</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  Unit {t.unitNumber}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Interval (miles)">
              <Input
                type="number"
                value={form.intervalMiles}
                onChange={(e) => setForm({ ...form, intervalMiles: e.target.value })}
                placeholder="15000"
              />
            </Field>
            <Field label="Interval (days)">
              <Input
                type="number"
                value={form.intervalDays}
                onChange={(e) => setForm({ ...form, intervalDays: e.target.value })}
                placeholder="90"
              />
            </Field>
          </div>
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
