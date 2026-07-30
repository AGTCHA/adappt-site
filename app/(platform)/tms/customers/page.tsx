"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Users,
  Search,
  Edit2,
  XCircle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Package,
  CreditCard,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { StatCard } from "@/src/components/ui/StatCard";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency, formatDate } from "@/src/lib/format";

/* ---------- types ---------- */

interface Customer {
  id: string;
  name: string;
  mcNumber: string | null;
  dotNumber: string | null;
  creditLimit: number | null;
  paymentTerms: string | null;
  status: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  billingAddress: string | null;
  notes: string | null;
  createdAt: string;
}

interface CustomerDetail extends Customer {
  financialStats?: {
    totalRevenue: number;
    totalInvoiced: number;
    totalPaid: number;
    outstandingBalance: number;
    loadCount: number;
    avgRate: number;
  };
  recentLoads?: {
    id: string;
    loadNumber: string;
    status: string;
    rate: number | null;
    pickupDate: string | null;
    deliveryDate: string | null;
  }[];
}

const creditTone = (limit: number | null) => {
  if (!limit) return "neutral" as const;
  if (limit >= 100_000) return "success" as const;
  if (limit >= 25_000) return "accent" as const;
  return "warning" as const;
};

const statusTone: Record<string, "success" | "neutral" | "danger"> = {
  active: "success",
  inactive: "neutral",
  suspended: "danger",
};

const emptyForm = {
  name: "",
  mcNumber: "",
  dotNumber: "",
  creditLimit: "",
  paymentTerms: "net_30",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  billingAddress: "",
  notes: "",
};

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchList = useCallback(() => {
    const q = search ? `?q=${encodeURIComponent(search)}` : "";
    api<{ customers: Customer[] }>(`/api/tms/customers${q}`)
      .then(({ customers: rows }) => setCustomers(rows))
      .catch(() => setCustomers([]));
  }, [search]);

  useEffect(() => {
    const id = setTimeout(fetchList, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [fetchList, search]);

  /* expand detail */
  useEffect(() => {
    if (!expandedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    api<CustomerDetail>(`/api/tms/customers/${expandedId}`)
      .then((d) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [expandedId]);

  /* stats */
  const stats = useMemo(() => {
    if (!customers) return null;
    const active = customers.filter((c) => c.status === "active").length;
    const totalCredit = customers.reduce(
      (s, c) => s + (c.creditLimit ?? 0),
      0
    );
    return { total: customers.length, active, totalCredit };
  }, [customers]);

  /* form helpers */
  const set = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function openEdit(c: Customer) {
    setEditCustomer(c);
    setForm({
      name: c.name,
      mcNumber: c.mcNumber ?? "",
      dotNumber: c.dotNumber ?? "",
      creditLimit: c.creditLimit?.toString() ?? "",
      paymentTerms: c.paymentTerms ?? "net_30",
      contactName: c.contactName ?? "",
      contactEmail: c.contactEmail ?? "",
      contactPhone: c.contactPhone ?? "",
      billingAddress: c.billingAddress ?? "",
      notes: c.notes ?? "",
    });
  }

  function closeModal() {
    setCreateOpen(false);
    setEditCustomer(null);
    setForm(emptyForm);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: form.name,
      mcNumber: form.mcNumber || null,
      dotNumber: form.dotNumber || null,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : null,
      paymentTerms: form.paymentTerms || null,
      contactName: form.contactName || null,
      contactEmail: form.contactEmail || null,
      contactPhone: form.contactPhone || null,
      billingAddress: form.billingAddress || null,
      notes: form.notes || null,
    };
    try {
      if (editCustomer) {
        await api(`/api/tms/customers/${editCustomer.id}`, {
          method: "PATCH",
          json: body,
        });
        toast("success", "Customer updated");
      } else {
        await api("/api/tms/customers", { method: "POST", json: body });
        toast("success", "Customer created");
      }
      closeModal();
      fetchList();
    } catch (err) {
      toast(
        "error",
        editCustomer ? "Update failed" : "Create failed",
        (err as Error).message
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string) {
    try {
      await api(`/api/tms/customers/${id}`, { method: "DELETE" });
      toast("success", "Customer deactivated");
      fetchList();
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      toast("error", "Deactivation failed", (err as Error).message);
    }
  }

  const isOpen = createOpen || !!editCustomer;

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Customers"
        subtitle="Manage shippers, brokers, and credit terms."
        actions={
          <Button
            icon={<Plus size={15} />}
            onClick={() => setCreateOpen(true)}
          >
            Add customer
          </Button>
        }
      />

      {/* stat cards */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Total Customers"
            value={stats.total}
            icon={<Users size={18} />}
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={<Users size={18} />}
            tone="success"
          />
          <StatCard
            label="Total Credit"
            value={formatCurrency(stats.totalCredit)}
            icon={<CreditCard size={18} />}
            tone="accent"
          />
        </div>
      )}

      {/* search */}
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
          />
          <Input
            placeholder="Search by name, MC#, DOT#…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* table */}
      {customers === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No customers yet"
          description="Add your first customer to start booking loads."
          action={
            <Button
              icon={<Plus size={15} />}
              onClick={() => setCreateOpen(true)}
            >
              Add customer
            </Button>
          }
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
            <span>Name</span>
            <span>MC #</span>
            <span>DOT #</span>
            <span>Credit</span>
            <span>Terms</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {customers.map((c, i) => (
            <div key={c.id}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.15) }}
                className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 hover:bg-accent-soft/30 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto_auto]"
                onClick={() =>
                  setExpandedId(expandedId === c.id ? null : c.id)
                }
              >
                <div className="flex items-center gap-2">
                  {expandedId === c.id ? (
                    <ChevronDown size={14} className="text-ink-tertiary" />
                  ) : (
                    <ChevronRight size={14} className="text-ink-tertiary" />
                  )}
                  <p className="text-sm font-semibold">{c.name}</p>
                </div>
                <p className="text-sm text-ink-secondary">
                  {c.mcNumber || "—"}
                </p>
                <p className="text-sm text-ink-secondary">
                  {c.dotNumber || "—"}
                </p>
                <Badge tone={creditTone(c.creditLimit)}>
                  {c.creditLimit
                    ? formatCurrency(c.creditLimit)
                    : "No limit"}
                </Badge>
                <p className="text-sm text-ink-secondary">
                  {c.paymentTerms?.replace("_", " ") ?? "—"}
                </p>
                <Badge tone={statusTone[c.status] ?? "neutral"}>
                  {c.status}
                </Badge>
                <div className="flex items-center gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit2 size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(c);
                    }}
                  />
                  {c.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<XCircle size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        deactivate(c.id);
                      }}
                    />
                  )}
                </div>
              </motion.div>

              {/* expanded detail row */}
              {expandedId === c.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-border bg-surface/50 px-5 py-4"
                >
                  {detailLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 rounded-xl" />
                      <Skeleton className="h-10 rounded-xl" />
                    </div>
                  ) : detail ? (
                    <div className="space-y-4">
                      {/* financial stats */}
                      {detail.financialStats && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                          <StatCard
                            label="Revenue"
                            value={formatCurrency(
                              detail.financialStats.totalRevenue
                            )}
                            icon={<DollarSign size={14} />}
                            tone="success"
                          />
                          <StatCard
                            label="Invoiced"
                            value={formatCurrency(
                              detail.financialStats.totalInvoiced
                            )}
                            icon={<DollarSign size={14} />}
                          />
                          <StatCard
                            label="Paid"
                            value={formatCurrency(
                              detail.financialStats.totalPaid
                            )}
                            icon={<DollarSign size={14} />}
                            tone="accent"
                          />
                          <StatCard
                            label="Outstanding"
                            value={formatCurrency(
                              detail.financialStats.outstandingBalance
                            )}
                            icon={<DollarSign size={14} />}
                            tone={
                              detail.financialStats.outstandingBalance > 0
                                ? "warning"
                                : "success"
                            }
                          />
                          <StatCard
                            label="Loads"
                            value={detail.financialStats.loadCount}
                            icon={<Package size={14} />}
                          />
                          <StatCard
                            label="Avg Rate"
                            value={formatCurrency(
                              detail.financialStats.avgRate
                            )}
                            icon={<DollarSign size={14} />}
                          />
                        </div>
                      )}

                      {/* contact info */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                        <div>
                          <span className="text-ink-tertiary">Contact</span>
                          <p>{detail.contactName || "—"}</p>
                        </div>
                        <div>
                          <span className="text-ink-tertiary">Email</span>
                          <p>{detail.contactEmail || "—"}</p>
                        </div>
                        <div>
                          <span className="text-ink-tertiary">Phone</span>
                          <p>{detail.contactPhone || "—"}</p>
                        </div>
                        <div>
                          <span className="text-ink-tertiary">
                            Billing Address
                          </span>
                          <p>{detail.billingAddress || "—"}</p>
                        </div>
                      </div>

                      {/* recent loads */}
                      {detail.recentLoads && detail.recentLoads.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-medium text-ink-tertiary">
                            Recent Loads
                          </h4>
                          <div className="space-y-1">
                            {detail.recentLoads.map((l) => (
                              <div
                                key={l.id}
                                className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm"
                              >
                                <span className="font-medium">
                                  {l.loadNumber}
                                </span>
                                <span className="text-ink-secondary">
                                  {formatDate(l.pickupDate)}
                                  {l.deliveryDate &&
                                    ` → ${formatDate(l.deliveryDate)}`}
                                </span>
                                <Badge tone="neutral">{l.status}</Badge>
                                <span className="font-semibold">
                                  {l.rate != null
                                    ? formatCurrency(l.rate)
                                    : "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-tertiary">
                      Could not load customer details.
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* create/edit modal */}
      <Modal
        open={isOpen}
        onClose={closeModal}
        title={editCustomer ? "Edit Customer" : "Add Customer"}
        wide
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Company name">
            <Input
              required
              placeholder="e.g. Swift Transportation"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="MC #">
              <Input
                placeholder="MC-123456"
                value={form.mcNumber}
                onChange={(e) => set("mcNumber", e.target.value)}
              />
            </Field>
            <Field label="DOT #">
              <Input
                placeholder="1234567"
                value={form.dotNumber}
                onChange={(e) => set("dotNumber", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Credit Limit ($)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.creditLimit}
                onChange={(e) => set("creditLimit", e.target.value)}
              />
            </Field>
            <Field label="Payment Terms">
              <Select
                value={form.paymentTerms}
                onChange={(e) => set("paymentTerms", e.target.value)}
              >
                <option value="net_15">Net 15</option>
                <option value="net_30">Net 30</option>
                <option value="net_45">Net 45</option>
                <option value="net_60">Net 60</option>
                <option value="due_on_receipt">Due on Receipt</option>
                <option value="quick_pay">Quick Pay</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Contact Name">
              <Input
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Billing Address">
            <Textarea
              rows={2}
              value={form.billingAddress}
              onChange={(e) => set("billingAddress", e.target.value)}
            />
          </Field>
          <Field label="Notes">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editCustomer ? "Save changes" : "Add customer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
