"use client";

import { useEffect, useState } from "react";
import { UserMinus } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

export interface TruckRow {
  id: string;
  unitNumber: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  mileage: number;
  status: string;
  driver: { id: string; firstName: string; lastName: string } | null;
  maintenance: { date: string; category: string; description: string }[];
}

export function AddTruckModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    unitNumber: "",
    year: "",
    make: "",
    model: "",
    vin: "",
    mileage: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/trucks", { method: "POST", json: form });
      toast("success", `Unit ${form.unitNumber} added to your fleet`);
      setForm({ unitNumber: "", year: "", make: "", model: "", vin: "", mileage: "" });
      onDone();
      onClose();
    } catch (error) {
      toast("error", "Couldn't add truck", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a truck" subtitle="Just the basics — you can edit anytime.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit number">
            <Input
              required
              placeholder="101"
              value={form.unitNumber}
              onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <Input
              required
              type="number"
              min={1980}
              max={2035}
              placeholder="2021"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </Field>
          <Field label="Make">
            <Input
              required
              placeholder="Freightliner"
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
            />
          </Field>
          <Field label="Model">
            <Input
              required
              placeholder="Cascadia"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </Field>
          <Field label="Current mileage">
            <Input
              type="number"
              min={0}
              placeholder="425000"
              value={form.mileage}
              onChange={(e) => setForm({ ...form, mileage: e.target.value })}
            />
          </Field>
          <Field label="VIN (optional)">
            <Input
              placeholder="1FUJG…"
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value })}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Add truck
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface DriverOption {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  truck: { id: string; unitNumber: string } | null;
}

export function AssignDriverModal({
  truck,
  onClose,
  onDone,
}: {
  truck: TruckRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [drivers, setDrivers] = useState<DriverOption[] | null>(null);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!truck) return;
    setSelected(truck.driver?.id ?? "");
    api<{ drivers: DriverOption[] }>("/api/drivers")
      .then(({ drivers }) =>
        setDrivers(drivers.filter((d) => d.status === "active" || d.status === "onboarding"))
      )
      .catch(() => setDrivers([]));
  }, [truck]);

  async function save(driverId: string | null) {
    if (!truck) return;
    setSaving(true);
    try {
      await api(`/api/trucks/${truck.id}`, { method: "PATCH", json: { driverId } });
      toast(
        "success",
        driverId ? "Driver assigned" : "Driver unassigned",
        `Unit ${truck.unitNumber} updated.`
      );
      onDone();
      onClose();
    } catch (error) {
      toast("error", "Couldn't update assignment", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={Boolean(truck)}
      onClose={onClose}
      title={`Assign driver — Unit ${truck?.unitNumber ?? ""}`}
      subtitle="Pick who's behind the wheel. A driver can only be on one truck."
    >
      <div className="space-y-4">
        <Field label="Driver">
          <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">— No driver —</option>
            {(drivers ?? []).map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.firstName} {driver.lastName}
                {driver.truck && driver.truck.id !== truck?.id
                  ? ` (currently on Unit ${driver.truck.unitNumber})`
                  : ""}
              </option>
            ))}
          </Select>
        </Field>
        {drivers !== null && drivers.length === 0 && (
          <p className="text-xs text-ink-tertiary">
            No active drivers yet — add one from the Drivers page first.
          </p>
        )}
        <div className="flex justify-between gap-2 pt-1">
          {truck?.driver ? (
            <Button
              variant="ghost"
              icon={<UserMinus size={15} />}
              loading={saving}
              onClick={() => save(null)}
              className="text-danger hover:bg-danger-soft hover:text-danger"
            >
              Unassign
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => save(selected || null)}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
