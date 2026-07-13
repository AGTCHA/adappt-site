"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import {
  Sparkles,
  FileText,
  Check,
  AlertTriangle,
  Loader2,
  X,
  PencilLine,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/src/components/ui/Field";
import { FileDrop, type DroppedFile } from "@/src/components/ui/FileDrop";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency } from "@/src/lib/format";
import type { TruckRow } from "./TruckModals";

interface ExtractedLineItem {
  description?: string;
  amount?: number;
  quantity?: number | null;
  isPm?: boolean;
  isDot?: boolean;
}

interface ExtractedInvoice {
  vendor?: string | null;
  vendorLocation?: string | null;
  invoiceNumber?: string | null;
  date?: string | null;
  unitNumber?: string | null;
  odometer?: number | null;
  description?: string | null;
  category?: string | null;
  lineItems?: ExtractedLineItem[];
  subtotal?: number | null;
  tax?: number | null;
  totalAmount?: number | null;
  fieldConfidence?: Record<string, number>;
}

type QueueStatus = "scanning" | "ready" | "saved" | "failed";

interface QueueItem {
  id: number;
  file: DroppedFile;
  status: QueueStatus;
  extracted?: ExtractedInvoice;
  error?: string;
}

interface FormState {
  truckId: string;
  date: string;
  vendor: string;
  description: string;
  amount: string;
  category: string;
  odometer: string;
}

function emptyForm(defaultTruckId?: string): FormState {
  return {
    truckId: defaultTruckId ?? "",
    date: new Date().toISOString().slice(0, 10),
    vendor: "",
    description: "",
    amount: "",
    category: "preventative",
    odometer: "",
  };
}

/** Loose unit-number match: "48216C" matches "48216", case/punctuation-insensitive. */
function matchTruck(trucks: TruckRow[], unitNumber?: string | null): TruckRow | null {
  if (!unitNumber) return null;
  const clean = (value: string) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const target = clean(unitNumber);
  if (!target) return null;
  return (
    trucks.find((t) => clean(t.unitNumber) === target) ??
    trucks.find(
      (t) => target.startsWith(clean(t.unitNumber)) || clean(t.unitNumber).startsWith(target)
    ) ??
    null
  );
}

function ConfidenceHint({ confidence }: { confidence?: number }) {
  if (confidence == null || confidence >= 75) return null;
  return (
    <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning">
      <AlertTriangle size={9} />
      verify
    </span>
  );
}

export function MaintenanceModal({
  open,
  trucks,
  defaultTruckId,
  onClose,
  onDone,
}: {
  open: boolean;
  trucks: TruckRow[];
  defaultTruckId?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(defaultTruckId));
  const nextId = useMemo(() => ({ current: 1 }), []);

  const active = queue.find((item) => item.id === activeId) ?? null;
  const confidence = active?.extracted?.fieldConfidence ?? {};
  const showForm = manualMode || (active != null && active.status === "ready");

  const loadIntoForm = useCallback(
    (item: QueueItem) => {
      const data = item.extracted ?? {};
      const matched = matchTruck(trucks, data.unitNumber);
      setForm({
        truckId: matched?.id ?? defaultTruckId ?? "",
        date: data.date ?? new Date().toISOString().slice(0, 10),
        vendor:
          [data.vendor, data.vendorLocation].filter(Boolean).join(" ") ?? "",
        description: data.description ?? "",
        amount: data.totalAmount != null ? String(data.totalAmount) : "",
        category: data.category === "accident" ? "accident" : "preventative",
        odometer: data.odometer != null ? String(data.odometer) : "",
      });
      setActiveId(item.id);
      setManualMode(false);
    },
    [trucks, defaultTruckId]
  );

  async function handleFile(file: DroppedFile) {
    const id = nextId.current++;
    setQueue((prev) => [...prev, { id, file, status: "scanning" }]);
    try {
      const { extracted } = await api<{ extracted: ExtractedInvoice }>(
        "/api/maintenance/extract",
        { method: "POST", json: file }
      );
      setQueue((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, status: "ready" as const, extracted } : item
        );
        return updated;
      });
      // Auto-open the first ready item if nothing is under review
      setActiveId((current) => {
        if (current === null) {
          loadIntoForm({ id, file, status: "ready", extracted });
          return id;
        }
        return current;
      });
    } catch (error) {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "failed", error: (error as Error).message }
            : item
        )
      );
      toast("error", `Couldn't read ${file.fileName}`, (error as Error).message);
    }
  }

  function advanceToNext(afterId: number) {
    const next = queue.find((item) => item.status === "ready" && item.id !== afterId);
    if (next) {
      loadIntoForm(next);
    } else {
      setActiveId(null);
      setForm(emptyForm(defaultTruckId));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/maintenance", {
        method: "POST",
        json: {
          ...form,
          invoiceFileName: active?.file.fileName ?? "",
          extracted: active?.extracted ? JSON.stringify(active.extracted) : "",
        },
      });
      const truck = trucks.find((t) => t.id === form.truckId);
      toast(
        "success",
        "Maintenance logged",
        truck ? `Saved to Unit ${truck.unitNumber}.` : undefined
      );
      onDone();
      if (active) {
        setQueue((prev) =>
          prev.map((item) =>
            item.id === active.id ? { ...item, status: "saved" } : item
          )
        );
        advanceToNext(active.id);
      } else {
        setForm(emptyForm(defaultTruckId));
        setManualMode(false);
      }
    } catch (error) {
      toast("error", "Couldn't save record", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setQueue([]);
      setActiveId(null);
      setManualMode(false);
      setForm(emptyForm(defaultTruckId));
    }, 300);
  }

  const unmatchedUnit =
    active?.extracted?.unitNumber && !matchTruck(trucks, active.extracted.unitNumber);
  const lineItems = active?.extracted?.lineItems ?? [];
  const lineSum = lineItems.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const tax = Number(active?.extracted?.tax) || 0;
  const reconciles =
    active?.extracted?.totalAmount != null &&
    Math.abs(lineSum + tax - Number(active.extracted.totalAmount)) <= 1;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Log maintenance"
      subtitle="Drop invoices — photos or PDFs — and AI does the typing. Review each one, then save."
      wide
    >
      <div className="space-y-4">
        <FileDrop
          label="Scan invoices with AI"
          sublabel="Drop one or many — PDF or photo"
          accept="image/*,.pdf,application/pdf"
          multiple
          onFile={handleFile}
        />

        {/* Queue */}
        {queue.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {queue.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => item.status === "ready" && loadIntoForm(item)}
                disabled={item.status !== "ready"}
                className={`focus-ring flex max-w-56 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  item.id === activeId && item.status === "ready"
                    ? "border-accent bg-accent-soft text-accent"
                    : item.status === "saved"
                      ? "border-transparent bg-success-soft text-success"
                      : item.status === "failed"
                        ? "border-transparent bg-danger-soft text-danger"
                        : item.status === "ready"
                          ? "border-border-strong bg-surface-solid text-ink-secondary hover:border-accent/50"
                          : "border-border bg-surface-solid text-ink-tertiary"
                }`}
              >
                {item.status === "scanning" && <Loader2 size={11} className="animate-spin" />}
                {item.status === "saved" && <Check size={11} />}
                {item.status === "failed" && <X size={11} />}
                {item.status === "ready" && <FileText size={11} />}
                <span className="truncate">{item.file.fileName}</span>
              </button>
            ))}
          </div>
        )}

        {/* Manual entry entry-point */}
        {!showForm && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-solid px-4 py-3">
            <p className="text-sm text-ink-secondary">
              {queue.some((q) => q.status === "scanning")
                ? "Reading your invoices…"
                : queue.length > 0 && queue.every((q) => q.status !== "ready")
                  ? "All done! Drop more invoices or close this window."
                  : "No invoice handy?"}
            </p>
            <Button
              size="sm"
              variant="secondary"
              icon={<PencilLine size={13} />}
              onClick={() => {
                setActiveId(null);
                setManualMode(true);
                setForm(emptyForm(defaultTruckId));
              }}
            >
              Enter manually
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {showForm && (
            <motion.form
              key={active?.id ?? "manual"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {active && (
                <div className="flex items-start gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">
                  <Sparkles size={15} className="mt-0.5 shrink-0" />
                  <span>
                    Details read from “{active.file.fileName}”. Give them a quick
                    check before saving.
                    {unmatchedUnit && (
                      <span className="mt-1 block text-warning">
                        Invoice mentions unit “{active.extracted?.unitNumber}” — no
                        matching truck found, please pick one.
                      </span>
                    )}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Truck">
                  <Select
                    required
                    value={form.truckId}
                    onChange={(e) => setForm({ ...form, truckId: e.target.value })}
                  >
                    <option value="" disabled>
                      Select truck…
                    </option>
                    {trucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        Unit {truck.unitNumber} — {truck.year} {truck.make}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Date">
                  <Input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </Field>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    Amount ($)
                    <ConfidenceHint confidence={confidence.totalAmount} />
                  </label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    placeholder="850.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    Odometer (mi)
                    <ConfidenceHint confidence={confidence.odometer} />
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="428500"
                    value={form.odometer}
                    onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    Vendor
                    <ConfidenceHint confidence={confidence.vendor} />
                  </label>
                  <Input
                    placeholder="TA Truck Service"
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    Type
                    <ConfidenceHint confidence={confidence.category} />
                  </label>
                  <Select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="preventative">Preventative maintenance</option>
                    <option value="accident">Accident repair</option>
                  </Select>
                </div>
              </div>

              <Field label="Work performed">
                <Textarea
                  rows={2}
                  placeholder="PM service — oil change, filters, chassis lube"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>

              {/* Extracted line items */}
              {lineItems.length > 0 && (
                <div className="rounded-xl border border-border bg-surface-solid">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                    <span className="text-xs font-semibold text-ink-secondary">
                      Line items from invoice
                      <ConfidenceHint confidence={confidence.lineItems} />
                    </span>
                    {!reconciles && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning">
                        <AlertTriangle size={10} />
                        lines don&apos;t add up to the total — double-check
                      </span>
                    )}
                  </div>
                  <ul className="max-h-44 divide-y divide-border overflow-y-auto">
                    {lineItems.map((line, i) => (
                      <li key={i} className="flex items-center gap-2 px-4 py-2 text-sm">
                        <span className="min-w-0 flex-1 truncate text-ink-secondary">
                          {line.description || "—"}
                          {line.quantity != null && line.quantity !== 1 && (
                            <span className="text-ink-tertiary"> ×{line.quantity}</span>
                          )}
                        </span>
                        {line.isPm && (
                          <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success">
                            PM
                          </span>
                        )}
                        {line.isDot && (
                          <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                            DOT
                          </span>
                        )}
                        <span className="shrink-0 font-medium">
                          {formatCurrency(Number(line.amount) || 0, 2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {tax > 0 && (
                    <div className="flex justify-between border-t border-border px-4 py-2 text-xs text-ink-tertiary">
                      <span>Tax</span>
                      <span>{formatCurrency(tax, 2)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" type="button" onClick={handleClose}>
                  {queue.some((q) => q.status === "ready") ? "Finish later" : "Cancel"}
                </Button>
                <Button type="submit" loading={saving}>
                  {active ? "Save record" : "Save record"}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
