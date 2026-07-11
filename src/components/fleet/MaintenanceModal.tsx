"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/src/components/ui/Field";
import { FileDrop, type DroppedFile } from "@/src/components/ui/FileDrop";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import type { TruckRow } from "./TruckModals";

interface ExtractedInvoice {
  vendor?: string | null;
  date?: string | null;
  totalAmount?: number | null;
  odometer?: number | null;
  description?: string | null;
  category?: string | null;
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
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [invoiceFileName, setInvoiceFileName] = useState("");
  const [rawExtracted, setRawExtracted] = useState("");

  const [form, setForm] = useState({
    truckId: defaultTruckId ?? "",
    date: new Date().toISOString().slice(0, 10),
    vendor: "",
    description: "",
    amount: "",
    category: "preventative",
    odometer: "",
  });

  function reset() {
    setForm({
      truckId: defaultTruckId ?? "",
      date: new Date().toISOString().slice(0, 10),
      vendor: "",
      description: "",
      amount: "",
      category: "preventative",
      odometer: "",
    });
    setScanned(false);
    setInvoiceFileName("");
    setRawExtracted("");
  }

  async function scanInvoice(file: DroppedFile) {
    setScanning(true);
    try {
      const { extracted } = await api<{ extracted: ExtractedInvoice }>(
        "/api/maintenance/extract",
        { method: "POST", json: { dataUrl: file.dataUrl, mimeType: file.mimeType } }
      );
      setForm((prev) => ({
        ...prev,
        vendor: extracted.vendor ?? prev.vendor,
        date: extracted.date ?? prev.date,
        amount: extracted.totalAmount != null ? String(extracted.totalAmount) : prev.amount,
        odometer: extracted.odometer != null ? String(extracted.odometer) : prev.odometer,
        description: extracted.description ?? prev.description,
        category: extracted.category === "accident" ? "accident" : "preventative",
      }));
      setScanned(true);
      setInvoiceFileName(file.fileName);
      setRawExtracted(JSON.stringify(extracted));
      toast("success", "Invoice scanned", "Check the details below, then save.");
    } catch (error) {
      toast("error", "Couldn't scan invoice", (error as Error).message);
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/maintenance", {
        method: "POST",
        json: { ...form, invoiceFileName, extracted: rawExtracted },
      });
      toast("success", "Maintenance logged");
      reset();
      onDone();
      onClose();
    } catch (error) {
      toast("error", "Couldn't save record", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log maintenance"
      subtitle="Snap a photo of the invoice and let AI do the typing."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FileDrop
          label="Scan invoice with AI"
          sublabel="Photo or screenshot of the repair bill"
          accept="image/*"
          busy={scanning}
          done={scanned}
          onFile={scanInvoice}
        />
        {scanned && (
          <div className="flex items-start gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">
            <Sparkles size={15} className="mt-0.5 shrink-0" />
            Details filled in from “{invoiceFileName}”. Give them a quick check before saving.
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
          <Field label="Amount ($)">
            <Input
              required
              type="number"
              min={0.01}
              step="0.01"
              placeholder="850.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="Odometer (mi)">
            <Input
              type="number"
              min={0}
              placeholder="428500"
              value={form.odometer}
              onChange={(e) => setForm({ ...form, odometer: e.target.value })}
            />
          </Field>
          <Field label="Vendor">
            <Input
              placeholder="TA Truck Service"
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />
          </Field>
          <Field label="Type">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="preventative">Preventative maintenance</option>
              <option value="accident">Accident repair</option>
            </Select>
          </Field>
        </div>
        <Field label="Work performed">
          <Textarea
            rows={2}
            placeholder="PM service — oil change, filters, chassis lube"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save record
          </Button>
        </div>
      </form>
    </Modal>
  );
}
