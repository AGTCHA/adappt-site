"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Store, Trash2 } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency } from "@/src/lib/format";

interface VendorRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  notes: string;
  spend: number;
  _count: { workOrders: number };
}

export default function VendorsPage() {
  const toast = useToast();
  const [vendors, setVendors] = useState<VendorRow[] | null>(null);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<VendorRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    notes: "",
  });

  const load = useCallback(() => {
    api<{ vendors: VendorRow[] }>("/api/vendors")
      .then(({ vendors: rows }) => setVendors(rows))
      .catch(() => setVendors([]));
  }, []);

  useEffect(load, [load]);

  function openCreate() {
    setEdit(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      notes: "",
    });
    setOpen(true);
  }

  function openEdit(v: VendorRow) {
    setEdit(v);
    setForm({
      name: v.name,
      phone: v.phone,
      email: v.email,
      address: v.address,
      city: v.city,
      state: v.state,
      notes: v.notes,
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit) {
        await api(`/api/vendors/${edit.id}`, { method: "PATCH", json: form });
        toast("success", "Vendor updated");
      } else {
        await api("/api/vendors", { method: "POST", json: form });
        toast("success", "Vendor added");
      }
      setOpen(false);
      load();
    } catch (error) {
      toast("error", "Couldn't save vendor", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/vendors/${id}`, { method: "DELETE" });
      toast("success", "Vendor deleted");
      load();
    } catch (error) {
      toast("error", "Couldn't delete", (error as Error).message);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance"
        title="Vendors"
        subtitle="Shops and suppliers — spend rolls up from completed work orders."
        actions={
          <Button icon={<Plus size={15} />} onClick={openCreate}>
            Add vendor
          </Button>
        }
      />

      {vendors === null ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={<Store size={24} />}
          title="No vendors yet"
          description="Add shops you use, or they'll be created automatically when you apply invoices."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {vendors.map((v) => (
            <Card key={v.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{v.name}</p>
                  <p className="text-xs text-ink-secondary">
                    {[v.city, v.state].filter(Boolean).join(", ") || v.address || "No address"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-accent">{formatCurrency(v.spend)}</p>
              </div>
              <p className="mt-2 text-xs text-ink-tertiary">
                {v._count.workOrders} work order{v._count.workOrders === 1 ? "" : "s"}
                {v.phone ? ` · ${v.phone}` : ""}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(v)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 size={14} />}
                  onClick={() => remove(v.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={edit ? "Edit vendor" : "Add vendor"}
      >
        <form onSubmit={save} className="space-y-3">
          <Field label="Name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="State">
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Notes">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
