"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

interface CustomerRow {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  dotNumber: string;
  mcNumber: string;
  stage: string;
  _count: { deals: number };
}

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<CustomerRow[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    dotNumber: "",
    mcNumber: "",
    stage: "lead",
  });

  const load = useCallback(() => {
    api<{ customers: CustomerRow[] }>("/api/crm/customers")
      .then(({ customers: rows }) => setCustomers(rows))
      .catch(() => setCustomers([]));
  }, []);

  useEffect(load, [load]);

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/crm/customers", { method: "POST", json: form });
      toast("success", "Customer added");
      setForm({
        name: "",
        contactName: "",
        phone: "",
        email: "",
        dotNumber: "",
        mcNumber: "",
        stage: "lead",
      });
      setCreateOpen(false);
      load();
    } catch (error) {
      toast("error", "Couldn't add customer", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        subtitle="Shippers, brokers, and accounts in your CRM."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            Add customer
          </Button>
        }
      />

      {customers === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="No customers yet"
          description="Add your first shipper or broker to start tracking deals."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              Add customer
            </Button>
          }
        />
      ) : (
        <div className="glass divide-y divide-border overflow-hidden rounded-2xl">
          {customers.map((customer, i) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.15) }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{customer.name}</p>
                <p className="mt-0.5 text-xs text-ink-tertiary">
                  {[customer.contactName, customer.phone, customer.email]
                    .filter(Boolean)
                    .join(" · ") || "No contact info"}
                </p>
              </div>
              {(customer.dotNumber || customer.mcNumber) && (
                <span className="text-xs text-ink-secondary">
                  {customer.dotNumber && `DOT ${customer.dotNumber}`}
                  {customer.dotNumber && customer.mcNumber && " · "}
                  {customer.mcNumber && `MC ${customer.mcNumber}`}
                </span>
              )}
              <Badge tone="accent">{customer.stage}</Badge>
              <span className="text-xs text-ink-tertiary">
                {customer._count.deals} deal{customer._count.deals === 1 ? "" : "s"}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add customer">
        <form onSubmit={createCustomer} className="space-y-4">
          <Field label="Company name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Contact name">
            <Input
              value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="DOT #">
              <Input
                value={form.dotNumber}
                onChange={(e) => setForm((f) => ({ ...f, dotNumber: e.target.value }))}
              />
            </Field>
            <Field label="MC #">
              <Input
                value={form.mcNumber}
                onChange={(e) => setForm((f) => ({ ...f, mcNumber: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Stage">
            <Select
              value={form.stage}
              onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
            >
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="customer">Customer</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
