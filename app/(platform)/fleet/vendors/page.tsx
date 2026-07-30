"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Plus, Store } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

interface VendorRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  _count: { workOrders: number };
}

export default function VendorsPage() {
  const toast = useToast();
  const [vendors, setVendors] = useState<VendorRow[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  const load = useCallback(() => {
    api<{ vendors: VendorRow[] }>("/api/vendors")
      .then(({ vendors: rows }) => setVendors(rows))
      .catch(() => setVendors([]));
  }, []);

  useEffect(load, [load]);

  async function createVendor(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/vendors", { method: "POST", json: form });
      toast("success", "Vendor added");
      setForm({ name: "", phone: "", email: "", address: "" });
      setCreateOpen(false);
      load();
    } catch (error) {
      toast("error", "Couldn't add vendor", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Fleet"
        title="Vendors"
        subtitle="Shops and suppliers you work with for fleet maintenance."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            Add vendor
          </Button>
        }
      />

      {vendors === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={<Store size={24} />}
          title="No vendors yet"
          description="Add your preferred shops so you can assign them to work orders."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              Add vendor
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.25) }}
              className="glass rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-raised"
            >
              <h3 className="text-base font-semibold">{vendor.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-ink-secondary">
                {vendor.phone && <p>{vendor.phone}</p>}
                {vendor.email && <p>{vendor.email}</p>}
                {vendor.address && <p className="text-ink-tertiary">{vendor.address}</p>}
              </div>
              <p className="mt-3 text-xs text-ink-tertiary">
                {vendor._count.workOrders} work order{vendor._count.workOrders === 1 ? "" : "s"}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add vendor">
        <form onSubmit={createVendor} className="space-y-4">
          <Field label="Name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Phone">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add vendor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
