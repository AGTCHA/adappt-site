"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatDate, formatNumber } from "@/src/lib/format";

interface ProgramRow {
  id: string;
  name: string;
  intervalMiles: number | null;
  intervalDays: number | null;
  nextDueAt: string | null;
  nextDueMiles: number | null;
  truck: { id: string; unitNumber: string; mileage: number } | null;
}

interface TruckOption {
  id: string;
  unitNumber: string;
}

export default function ServiceProgramsPage() {
  const toast = useToast();
  const [programs, setPrograms] = useState<ProgramRow[] | null>(null);
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    truckId: "",
    intervalMiles: "",
    intervalDays: "",
  });

  const load = useCallback(() => {
    api<{ programs: ProgramRow[] }>("/api/service-programs")
      .then(({ programs: rows }) => setPrograms(rows))
      .catch(() => setPrograms([]));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (!createOpen) return;
    api<{ trucks: TruckOption[] }>("/api/trucks")
      .then(({ trucks: rows }) => setTrucks(rows))
      .catch(() => setTrucks([]));
  }, [createOpen]);

  async function createProgram(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/service-programs", {
        method: "POST",
        json: {
          name: form.name,
          ...(form.truckId ? { truckId: form.truckId } : {}),
          ...(form.intervalMiles ? { intervalMiles: Number(form.intervalMiles) } : {}),
          ...(form.intervalDays ? { intervalDays: Number(form.intervalDays) } : {}),
        },
      });
      toast("success", "PM program created");
      setForm({ name: "", truckId: "", intervalMiles: "", intervalDays: "" });
      setCreateOpen(false);
      load();
    } catch (error) {
      toast("error", "Couldn't create program", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Fleet"
        title="PM Service Programs"
        subtitle="Preventative maintenance schedules by truck or fleet-wide."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            Add program
          </Button>
        }
      />

      {programs === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <EmptyState
          icon={<Calendar size={24} />}
          title="No PM programs yet"
          description="Set up oil changes, DOT inspections, and other recurring service intervals."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              Add program
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {programs.map((program, i) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.25) }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{program.name}</h3>
                  <p className="mt-0.5 text-sm text-ink-secondary">
                    {program.truck
                      ? `Unit ${program.truck.unitNumber}`
                      : "Fleet-wide"}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-ink-secondary">
                {program.intervalMiles != null && (
                  <p>Every {formatNumber(program.intervalMiles)} mi</p>
                )}
                {program.intervalDays != null && (
                  <p>Every {program.intervalDays} days</p>
                )}
                {program.nextDueAt && (
                  <p className="col-span-2 text-xs text-ink-tertiary">
                    Next due {formatDate(program.nextDueAt)}
                    {program.nextDueMiles != null &&
                      ` · ${formatNumber(program.nextDueMiles)} mi`}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add PM program"
        subtitle="Schedule recurring preventative maintenance."
      >
        <form onSubmit={createProgram} className="space-y-4">
          <Field label="Program name">
            <Input
              required
              placeholder="e.g. Oil change, DOT inspection"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Truck" hint="Leave blank for fleet-wide programs.">
            <Select
              value={form.truckId}
              onChange={(e) => setForm((f) => ({ ...f, truckId: e.target.value }))}
            >
              <option value="">All trucks</option>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  Unit {truck.unitNumber}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Interval (miles)">
              <Input
                type="number"
                min={0}
                value={form.intervalMiles}
                onChange={(e) => setForm((f) => ({ ...f, intervalMiles: e.target.value }))}
              />
            </Field>
            <Field label="Interval (days)">
              <Input
                type="number"
                min={0}
                value={form.intervalDays}
                onChange={(e) => setForm((f) => ({ ...f, intervalDays: e.target.value }))}
              />
            </Field>
          </div>
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
