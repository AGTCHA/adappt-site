"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import {
  EQUIPMENT_TYPES,
  EQUIPMENT_LABEL,
  STOP_TYPES,
} from "@/src/lib/tms/constants";

interface CustomerOption {
  id: string;
  name: string;
}

interface DriverOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface TruckOption {
  id: string;
  unitNumber: string;
}

interface Stop {
  key: string;
  type: "pickup" | "delivery" | "stop";
  city: string;
  state: string;
  zip: string;
  address: string;
  appointment: string;
  instructions: string;
}

interface CreateLoadForm {
  customerId: string;
  customerName: string;
  billTo: string;
  refBol: string;
  refPo: string;
  refPro: string;
  stops: Stop[];
  equipment: string;
  commodity: string;
  weight: string;
  pieces: string;
  pallets: string;
  hazmat: boolean;
  reeferTempMin: string;
  reeferTempMax: string;
  linehaul: string;
  fsc: string;
  accessorials: string;
  loadedMiles: string;
  emptyMiles: string;
  driverId: string;
  truckId: string;
  trailerId: string;
  notes: string;
}

const TABS = [
  { id: "customer", label: "Customer & Refs" },
  { id: "stops", label: "Stops" },
  { id: "freight", label: "Freight" },
  { id: "rate", label: "Rate & Miles" },
  { id: "dispatch", label: "Dispatch" },
  { id: "notes", label: "Notes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function makeStop(type: "pickup" | "delivery" | "stop" = "pickup"): Stop {
  return {
    key: Math.random().toString(36).slice(2),
    type,
    city: "",
    state: "",
    zip: "",
    address: "",
    appointment: "",
    instructions: "",
  };
}

const defaultForm: CreateLoadForm = {
  customerId: "",
  customerName: "",
  billTo: "",
  refBol: "",
  refPo: "",
  refPro: "",
  stops: [makeStop("pickup"), makeStop("delivery")],
  equipment: "dry_van",
  commodity: "",
  weight: "",
  pieces: "",
  pallets: "",
  hazmat: false,
  reeferTempMin: "",
  reeferTempMax: "",
  linehaul: "",
  fsc: "",
  accessorials: "",
  loadedMiles: "",
  emptyMiles: "",
  driverId: "",
  truckId: "",
  trailerId: "",
  notes: "",
};

interface CreateLoadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  initialValues?: Partial<CreateLoadForm>;
}

export function CreateLoadModal({ open, onClose, onCreated, initialValues }: CreateLoadModalProps) {
  const toast = useToast();
  const [tab, setTab] = useState<TabId>("customer");
  const [form, setForm] = useState<CreateLoadForm>({ ...defaultForm, ...initialValues });
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [addAnother, setAddAnother] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...defaultForm, ...initialValues });
    setTab("customer");
    api<{ customers: CustomerOption[] }>("/api/tms/customers")
      .then(({ customers: rows }) => setCustomers(rows))
      .catch(() => setCustomers([]));
    api<{ drivers: DriverOption[] }>("/api/drivers")
      .then(({ drivers: rows }) => setDrivers(rows))
      .catch(() => setDrivers([]));
    api<{ trucks: TruckOption[] }>("/api/trucks")
      .then(({ trucks: rows }) => setTrucks(rows))
      .catch(() => setTrucks([]));
  }, [open, initialValues]);

  const set = useCallback(
    <K extends keyof CreateLoadForm>(key: K, val: CreateLoadForm[K]) =>
      setForm((f) => ({ ...f, [key]: val })),
    []
  );

  function updateStop(idx: number, patch: Partial<Stop>) {
    setForm((f) => ({
      ...f,
      stops: f.stops.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  }

  function removeStop(idx: number) {
    setForm((f) => ({ ...f, stops: f.stops.filter((_, i) => i !== idx) }));
  }

  function moveStop(from: number, to: number) {
    setForm((f) => {
      const stops = [...f.stops];
      const [moved] = stops.splice(from, 1);
      stops.splice(to, 0, moved);
      return { ...f, stops };
    });
  }

  const totalRate =
    (Number(form.linehaul) || 0) + (Number(form.fsc) || 0) + (Number(form.accessorials) || 0);
  const totalMiles = (Number(form.loadedMiles) || 0) + (Number(form.emptyMiles) || 0);
  const rpm = totalMiles > 0 ? totalRate / totalMiles : 0;

  async function submit(dispatch: boolean) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        customerName: form.customerName || undefined,
        customerId: form.customerId || undefined,
        billTo: form.billTo || undefined,
        refBol: form.refBol || undefined,
        refPo: form.refPo || undefined,
        refPro: form.refPro || undefined,
        stops: form.stops.map((s) => ({
          type: s.type,
          city: s.city,
          state: s.state,
          zip: s.zip,
          address: s.address,
          appointment: s.appointment || undefined,
          instructions: s.instructions || undefined,
        })),
        equipment: form.equipment,
        commodity: form.commodity || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        pieces: form.pieces ? Number(form.pieces) : undefined,
        pallets: form.pallets ? Number(form.pallets) : undefined,
        hazmat: form.hazmat,
        reeferTempMin: form.reeferTempMin ? Number(form.reeferTempMin) : undefined,
        reeferTempMax: form.reeferTempMax ? Number(form.reeferTempMax) : undefined,
        rate: totalRate || undefined,
        linehaul: form.linehaul ? Number(form.linehaul) : undefined,
        fsc: form.fsc ? Number(form.fsc) : undefined,
        accessorials: form.accessorials ? Number(form.accessorials) : undefined,
        loadedMiles: form.loadedMiles ? Number(form.loadedMiles) : undefined,
        emptyMiles: form.emptyMiles ? Number(form.emptyMiles) : undefined,
        miles: totalMiles || undefined,
        driverId: form.driverId || undefined,
        truckId: form.truckId || undefined,
        trailerId: form.trailerId || undefined,
        notes: form.notes || undefined,
        dispatch,
      };
      await api("/api/tms/loads", { method: "POST", json: body });
      toast("success", dispatch ? "Load created & dispatched" : "Load created");
      onCreated?.();
      if (addAnother) {
        setForm({ ...defaultForm });
        setTab("customer");
      } else {
        onClose();
      }
    } catch (err) {
      toast("error", "Failed to create load", (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Load" subtitle="Create a freight load" wide>
      <div className="flex min-h-[420px] gap-5">
        {/* Left rail tabs */}
        <nav className="hidden w-40 shrink-0 flex-col gap-0.5 sm:flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`focus-ring rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-accent-soft text-accent"
                  : "text-ink-secondary hover:bg-accent-soft/50 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Mobile tab pills */}
          <div className="flex flex-wrap gap-1.5 sm:hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  tab === t.id
                    ? "bg-accent text-accent-text"
                    : "bg-surface-solid text-ink-secondary ring-1 ring-border"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "customer" && (
            <>
              <Field label="Customer">
                <Select
                  value={form.customerId}
                  onChange={(e) => {
                    set("customerId", e.target.value);
                    const found = customers.find((c) => c.id === e.target.value);
                    if (found) set("customerName", found.name);
                  }}
                >
                  <option value="">— Select or type below —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Customer name (override)">
                <Input
                  value={form.customerName}
                  onChange={(e) => set("customerName", e.target.value)}
                  placeholder="Free text customer name"
                />
              </Field>
              <Field label="Bill to">
                <Input
                  value={form.billTo}
                  onChange={(e) => set("billTo", e.target.value)}
                  placeholder="Billing entity"
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="BOL #">
                  <Input value={form.refBol} onChange={(e) => set("refBol", e.target.value)} />
                </Field>
                <Field label="PO #">
                  <Input value={form.refPo} onChange={(e) => set("refPo", e.target.value)} />
                </Field>
                <Field label="PRO #">
                  <Input value={form.refPro} onChange={(e) => set("refPro", e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {tab === "stops" && (
            <>
              {form.stops.map((stop, idx) => (
                <div
                  key={stop.key}
                  className="glass rounded-2xl border border-border p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="cursor-grab text-ink-tertiary"
                      title="Drag to reorder"
                      onPointerDown={() => {}}
                      onClick={() => {
                        if (idx > 0) moveStop(idx, idx - 1);
                      }}
                    >
                      <GripVertical size={14} />
                    </button>
                    <Select
                      value={stop.type}
                      onChange={(e) =>
                        updateStop(idx, { type: e.target.value as Stop["type"] })
                      }
                      className="!w-auto"
                    >
                      {STOP_TYPES.map((st) => (
                        <option key={st} value={st}>
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </option>
                      ))}
                    </Select>
                    <span className="text-xs font-semibold text-ink-tertiary">
                      Stop {idx + 1}
                    </span>
                    {form.stops.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeStop(idx)}
                        className="ml-auto rounded-lg p-1.5 text-danger hover:bg-danger-soft"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="City">
                      <Input
                        value={stop.city}
                        onChange={(e) => updateStop(idx, { city: e.target.value })}
                      />
                    </Field>
                    <Field label="State">
                      <Input
                        value={stop.state}
                        onChange={(e) => updateStop(idx, { state: e.target.value })}
                        maxLength={2}
                        placeholder="CA"
                      />
                    </Field>
                    <Field label="ZIP">
                      <Input
                        value={stop.zip}
                        onChange={(e) => updateStop(idx, { zip: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Field label="Address">
                    <Input
                      value={stop.address}
                      onChange={(e) => updateStop(idx, { address: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Appointment">
                      <Input
                        type="datetime-local"
                        value={stop.appointment}
                        onChange={(e) => updateStop(idx, { appointment: e.target.value })}
                      />
                    </Field>
                    <Field label="Instructions">
                      <Input
                        value={stop.instructions}
                        onChange={(e) => updateStop(idx, { instructions: e.target.value })}
                        placeholder="Dock #, notes..."
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() =>
                  setForm((f) => ({ ...f, stops: [...f.stops, makeStop("stop")] }))
                }
              >
                Add stop
              </Button>
            </>
          )}

          {tab === "freight" && (
            <>
              <Field label="Equipment type">
                <Select
                  value={form.equipment}
                  onChange={(e) => set("equipment", e.target.value)}
                >
                  {EQUIPMENT_TYPES.map((eq) => (
                    <option key={eq} value={eq}>
                      {EQUIPMENT_LABEL[eq]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Commodity">
                <Input
                  value={form.commodity}
                  onChange={(e) => set("commodity", e.target.value)}
                  placeholder="e.g. Electronics, Produce"
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Weight (lbs)">
                  <Input
                    type="number"
                    min={0}
                    value={form.weight}
                    onChange={(e) => set("weight", e.target.value)}
                  />
                </Field>
                <Field label="Pieces">
                  <Input
                    type="number"
                    min={0}
                    value={form.pieces}
                    onChange={(e) => set("pieces", e.target.value)}
                  />
                </Field>
                <Field label="Pallets">
                  <Input
                    type="number"
                    min={0}
                    value={form.pallets}
                    onChange={(e) => set("pallets", e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.hazmat}
                    onChange={(e) => set("hazmat", e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  Hazmat
                </label>
              </div>
              {form.equipment === "reefer" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Temp min (°F)">
                    <Input
                      type="number"
                      value={form.reeferTempMin}
                      onChange={(e) => set("reeferTempMin", e.target.value)}
                    />
                  </Field>
                  <Field label="Temp max (°F)">
                    <Input
                      type="number"
                      value={form.reeferTempMax}
                      onChange={(e) => set("reeferTempMax", e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </>
          )}

          {tab === "rate" && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Linehaul ($)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.linehaul}
                    onChange={(e) => set("linehaul", e.target.value)}
                  />
                </Field>
                <Field label="FSC ($)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.fsc}
                    onChange={(e) => set("fsc", e.target.value)}
                  />
                </Field>
                <Field label="Accessorials ($)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.accessorials}
                    onChange={(e) => set("accessorials", e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Loaded miles">
                  <Input
                    type="number"
                    min={0}
                    value={form.loadedMiles}
                    onChange={(e) => set("loadedMiles", e.target.value)}
                  />
                </Field>
                <Field label="Empty miles">
                  <Input
                    type="number"
                    min={0}
                    value={form.emptyMiles}
                    onChange={(e) => set("emptyMiles", e.target.value)}
                  />
                </Field>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-ink-tertiary">Total Rate</p>
                    <p className="text-lg font-semibold text-ink">
                      ${totalRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-tertiary">Total Miles</p>
                    <p className="text-lg font-semibold text-ink">
                      {totalMiles.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-tertiary">RPM</p>
                    <p className="text-lg font-semibold text-ink">
                      ${rpm.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "dispatch" && (
            <>
              <Field label="Driver">
                <Select value={form.driverId} onChange={(e) => set("driverId", e.target.value)}>
                  <option value="">Unassigned</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Truck">
                <Select value={form.truckId} onChange={(e) => set("truckId", e.target.value)}>
                  <option value="">Unassigned</option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      Unit {t.unitNumber}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Trailer">
                <Input
                  value={form.trailerId}
                  onChange={(e) => set("trailerId", e.target.value)}
                  placeholder="Trailer ID or unit number"
                />
              </Field>
            </>
          )}

          {tab === "notes" && (
            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Internal notes about this load..."
              />
            </Field>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <label className="flex items-center gap-2 text-xs text-ink-secondary">
          <input
            type="checkbox"
            checked={addAnother}
            onChange={(e) => setAddAnother(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent"
          />
          Save &amp; add another
        </label>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={saving}
            onClick={() => submit(false)}
          >
            Create Load
          </Button>
          <Button type="button" loading={saving} onClick={() => submit(true)}>
            Create &amp; Dispatch
          </Button>
        </div>
      </div>
    </Modal>
  );
}
