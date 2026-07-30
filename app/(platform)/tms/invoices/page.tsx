"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  FileText,
  Search,
  RefreshCw,
  Mail,
  CheckCircle,
  DollarSign,
  XCircle,
  Send,
  Clock,
  AlertTriangle,
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
import { INVOICE_STATUSES } from "@/src/lib/tms/constants";

/* ---------- types ---------- */

interface AgingSummary {
  current: number;
  "1_30": number;
  "31_60": number;
  "61_90": number;
  "90_plus": number;
  totalOutstanding: number;
  invoiceCount: number;
  updated: string;
}

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  agingBucket: string | null;
  load?: {
    id: string;
    loadNumber: string;
    customerName: string;
  } | null;
  customer?: { id: string; name: string } | null;
}

interface InvoiceDetail extends InvoiceRow {
  lineItems?: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  payments?: {
    id: string;
    amount: number;
    method: string | null;
    reference: string | null;
    paidAt: string;
  }[];
  notes: string | null;
  sentAt: string | null;
  paymentTerms: string | null;
}

interface DeliveredLoad {
  id: string;
  loadNumber: string;
  customerName: string;
  rate: number | null;
  deliveryDate: string | null;
}

const statusTone: Record<string, "neutral" | "accent" | "success" | "warning" | "danger" | "violet"> = {
  pending: "neutral",
  invoiced: "accent",
  partial: "violet",
  paid: "success",
  disputed: "danger",
  voided: "neutral",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  invoiced: "Invoiced",
  partial: "Partial",
  paid: "Paid",
  disputed: "Disputed",
  voided: "Voided",
};

const agingLabel: Record<string, string> = {
  current: "Current",
  "1_30": "1–30 days",
  "31_60": "31–60 days",
  "61_90": "61–90 days",
  "90_plus": "90+ days",
};

export default function InvoicesPage() {
  const toast = useToast();
  const [aging, setAging] = useState<AgingSummary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAging, setFilterAging] = useState("");
  const [search, setSearch] = useState("");
  const [recomputing, setRecomputing] = useState(false);

  /* detail drawer */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* create from load */
  const [createOpen, setCreateOpen] = useState(false);
  const [deliveredLoads, setDeliveredLoads] = useState<DeliveredLoad[]>([]);
  const [createForm, setCreateForm] = useState({ loadId: "", paymentTerms: "", notes: "", force: false });
  const [creating, setCreating] = useState(false);

  /* record payment */
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "check", reference: "" });
  const [paymentSaving, setPaymentSaving] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* fetch aging */
  const fetchAging = useCallback(() => {
    api<AgingSummary>("/api/tms/invoices/aging")
      .then((d) => setAging(d))
      .catch(() => {});
  }, []);

  /* fetch invoices */
  const fetchInvoices = useCallback(() => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("q", search);
    const qs = params.toString() ? `?${params}` : "";
    api<{ invoices: InvoiceRow[] }>(`/api/tms/invoices${qs}`)
      .then(({ invoices: rows }) => setInvoices(rows))
      .catch(() => setInvoices([]));
  }, [filterStatus, search]);

  useEffect(() => {
    fetchAging();
  }, [fetchAging]);

  useEffect(() => {
    const id = setTimeout(fetchInvoices, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [fetchInvoices, search]);

  /* recompute aging */
  async function recomputeAging() {
    setRecomputing(true);
    try {
      const data = await api<AgingSummary>("/api/tms/invoices/aging");
      setAging(data);
      toast("success", "Aging recomputed");
    } catch {
      toast("error", "Failed to recompute aging");
    } finally {
      setRecomputing(false);
    }
  }

  /* fetch detail */
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    api<{ invoice: InvoiceDetail }>(`/api/tms/invoices/${selectedId}`)
      .then(({ invoice }) => setDetail(invoice))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  /* filtered display */
  const displayed = useMemo(() => {
    if (!invoices) return null;
    let list = invoices;
    if (filterAging) {
      list = list.filter((inv) => inv.agingBucket === filterAging);
    }
    return list;
  }, [invoices, filterAging]);

  /* create invoice from load */
  useEffect(() => {
    if (!createOpen) return;
    api<{ loads: DeliveredLoad[] }>("/api/tms/loads?status=delivered")
      .then(({ loads }) => setDeliveredLoads(loads))
      .catch(() => setDeliveredLoads([]));
  }, [createOpen]);

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api("/api/tms/invoices", {
        method: "POST",
        json: {
          loadId: createForm.loadId,
          ...(createForm.paymentTerms ? { paymentTerms: createForm.paymentTerms } : {}),
          ...(createForm.notes ? { notes: createForm.notes } : {}),
          ...(createForm.force ? { force: true } : {}),
        },
      });
      toast("success", "Invoice created");
      setCreateOpen(false);
      setCreateForm({ loadId: "", paymentTerms: "", notes: "", force: false });
      fetchInvoices();
      fetchAging();
    } catch (err) {
      toast("error", "Failed to create invoice", (err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  /* invoice actions */
  async function invoiceAction(action: string, extra?: Record<string, unknown>) {
    if (!selectedId) return;
    setActionLoading(action);
    try {
      await api(`/api/tms/invoices/${selectedId}`, {
        method: "PATCH",
        json: { action, ...extra },
      });
      toast("success", `Invoice ${action.replace("_", " ")} successful`);
      const refreshed = await api<{ invoice: InvoiceDetail }>(`/api/tms/invoices/${selectedId}`);
      setDetail(refreshed.invoice);
      fetchInvoices();
      fetchAging();
    } catch (err) {
      toast("error", `Action failed`, (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setPaymentSaving(true);
    try {
      await api(`/api/tms/invoices/${selectedId}`, {
        method: "PATCH",
        json: {
          action: "record_payment",
          amount: Number(paymentForm.amount),
          method: paymentForm.method || null,
          reference: paymentForm.reference || null,
        },
      });
      toast("success", "Payment recorded");
      setPaymentOpen(false);
      setPaymentForm({ amount: "", method: "check", reference: "" });
      const refreshed = await api<{ invoice: InvoiceDetail }>(`/api/tms/invoices/${selectedId}`);
      setDetail(refreshed.invoice);
      fetchInvoices();
      fetchAging();
    } catch (err) {
      toast("error", "Payment failed", (err as Error).message);
    } finally {
      setPaymentSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Invoices"
        subtitle="Track receivables, aging, and payments."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={recomputeAging} loading={recomputing}>
              Recompute Aging
            </Button>
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              Invoice from Load
            </Button>
          </div>
        }
      />

      {/* aging stat cards */}
      {aging && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Current"
            value={formatCurrency(aging.current)}
            icon={<CheckCircle size={16} />}
            tone="success"
            active={filterAging === "current"}
            onClick={() => setFilterAging(filterAging === "current" ? "" : "current")}
          />
          <StatCard
            label="1–30 days"
            value={formatCurrency(aging["1_30"])}
            icon={<Clock size={16} />}
            tone="accent"
            active={filterAging === "1_30"}
            onClick={() => setFilterAging(filterAging === "1_30" ? "" : "1_30")}
          />
          <StatCard
            label="31–60 days"
            value={formatCurrency(aging["31_60"])}
            icon={<Clock size={16} />}
            tone="warning"
            active={filterAging === "31_60"}
            onClick={() => setFilterAging(filterAging === "31_60" ? "" : "31_60")}
          />
          <StatCard
            label="61–90 days"
            value={formatCurrency(aging["61_90"])}
            icon={<AlertTriangle size={16} />}
            tone="warning"
            active={filterAging === "61_90"}
            onClick={() => setFilterAging(filterAging === "61_90" ? "" : "61_90")}
          />
          <StatCard
            label="90+ days"
            value={formatCurrency(aging["90_plus"])}
            icon={<AlertTriangle size={16} />}
            tone="danger"
            active={filterAging === "90_plus"}
            onClick={() => setFilterAging(filterAging === "90_plus" ? "" : "90_plus")}
          />
          <StatCard
            label="Total Outstanding"
            value={formatCurrency(aging.totalOutstanding)}
            icon={<DollarSign size={16} />}
            tone="violet"
          />
        </div>
      )}

      {/* filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <Input placeholder="Search invoices…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel[s] ?? s}
            </option>
          ))}
        </Select>
        <Select value={filterAging} onChange={(e) => setFilterAging(e.target.value)} className="w-40">
          <option value="">All aging</option>
          {Object.entries(agingLabel).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      {/* table */}
      {displayed === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="No invoices found"
          description="Create an invoice from a delivered load to get started."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              Invoice from Load
            </Button>
          }
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[1fr_1.5fr_auto_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
            <span>Invoice #</span>
            <span>Customer / Load</span>
            <span>Amount</span>
            <span>Paid</span>
            <span>Balance</span>
            <span>Due</span>
            <span>Status</span>
          </div>
          {displayed.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.15) }}
              className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 hover:bg-accent-soft/30 sm:grid sm:grid-cols-[1fr_1.5fr_auto_auto_auto_auto_auto]"
              onClick={() => setSelectedId(selectedId === inv.id ? null : inv.id)}
            >
              <p className="text-sm font-semibold">{inv.invoiceNumber}</p>
              <div>
                <p className="truncate text-sm text-ink-secondary">
                  {inv.customer?.name ?? inv.load?.customerName ?? "—"}
                </p>
                {inv.load && (
                  <p className="text-xs text-ink-tertiary">{inv.load.loadNumber}</p>
                )}
              </div>
              <span className="text-sm font-semibold">{formatCurrency(inv.totalAmount)}</span>
              <span className="text-sm text-ink-secondary">{formatCurrency(inv.amountPaid)}</span>
              <span className="text-sm font-semibold text-accent">{formatCurrency(inv.balanceDue)}</span>
              <span className="text-sm text-ink-secondary">{formatDate(inv.dueDate)}</span>
              <Badge tone={statusTone[inv.status] ?? "neutral"}>{statusLabel[inv.status] ?? inv.status}</Badge>
            </motion.div>
          ))}
        </div>
      )}

      {/* detail drawer/modal */}
      <Modal
        open={!!selectedId && !!detail}
        onClose={() => setSelectedId(null)}
        title={detail ? `Invoice ${detail.invoiceNumber}` : "Invoice Detail"}
        wide
      >
        {detailLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : detail ? (
          <div className="space-y-5">
            {/* header info */}
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <span className="text-ink-tertiary">Status</span>
                <div className="mt-1">
                  <Badge tone={statusTone[detail.status] ?? "neutral"}>
                    {statusLabel[detail.status] ?? detail.status}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-ink-tertiary">Total</span>
                <p className="font-semibold">{formatCurrency(detail.totalAmount)}</p>
              </div>
              <div>
                <span className="text-ink-tertiary">Balance Due</span>
                <p className="font-semibold text-accent">{formatCurrency(detail.balanceDue)}</p>
              </div>
              <div>
                <span className="text-ink-tertiary">Due Date</span>
                <p>{formatDate(detail.dueDate)}</p>
              </div>
            </div>

            {/* line items */}
            {detail.lineItems && detail.lineItems.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium text-ink-tertiary">Line Items</h4>
                <div className="glass overflow-hidden rounded-xl">
                  <div className="hidden grid-cols-[2fr_auto_auto_auto] gap-4 border-b border-border px-4 py-2 text-xs font-medium text-ink-tertiary sm:grid">
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Unit Price</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {detail.lineItems.map((li) => (
                    <div key={li.id} className="grid grid-cols-[2fr_auto_auto_auto] gap-4 border-b border-border px-4 py-2.5 text-sm last:border-0">
                      <span>{li.description}</span>
                      <span className="text-ink-secondary">{li.quantity}</span>
                      <span className="text-ink-secondary">{formatCurrency(li.unitPrice, 2)}</span>
                      <span className="text-right font-semibold">{formatCurrency(li.amount, 2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* payments */}
            {detail.payments && detail.payments.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium text-ink-tertiary">Payments</h4>
                <div className="space-y-1">
                  {detail.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm">
                      <span className="text-ink-secondary">{formatDate(p.paidAt)}</span>
                      <span className="text-ink-secondary">{p.method ?? "—"}</span>
                      <span className="text-ink-secondary">{p.reference ?? "—"}</span>
                      <span className="font-semibold text-success">{formatCurrency(p.amount, 2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.notes && (
              <div>
                <h4 className="mb-1 text-xs font-medium text-ink-tertiary">Notes</h4>
                <p className="text-sm text-ink-secondary">{detail.notes}</p>
              </div>
            )}

            {/* actions */}
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {detail.status === "pending" && (
                <Button
                  variant="secondary"
                  icon={<Mail size={14} />}
                  loading={actionLoading === "send"}
                  onClick={() => invoiceAction("send")}
                >
                  Email Invoice
                </Button>
              )}
              {(detail.status === "pending" || detail.status === "invoiced") && (
                <Button
                  variant="secondary"
                  icon={<CheckCircle size={14} />}
                  loading={actionLoading === "mark_sent"}
                  onClick={() => invoiceAction("mark_sent")}
                >
                  Mark Sent
                </Button>
              )}
              {detail.status !== "paid" && detail.status !== "voided" && (
                <Button
                  variant="success"
                  icon={<DollarSign size={14} />}
                  onClick={() => {
                    setPaymentForm({ amount: String(detail.balanceDue), method: "check", reference: "" });
                    setPaymentOpen(true);
                  }}
                >
                  Record Payment
                </Button>
              )}
              {detail.status !== "voided" && detail.status !== "paid" && (
                <Button
                  variant="danger"
                  icon={<XCircle size={14} />}
                  loading={actionLoading === "void"}
                  onClick={() => invoiceAction("void")}
                >
                  Void
                </Button>
              )}
              {detail.status !== "voided" && detail.status !== "paid" && (
                <Button
                  variant="secondary"
                  icon={<Send size={14} />}
                  loading={actionLoading === "send_factor"}
                  onClick={() => invoiceAction("send", { factor: true })}
                >
                  Send to Factor
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-tertiary">Could not load invoice details.</p>
        )}
      </Modal>

      {/* record payment modal */}
      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Record Payment">
        <form onSubmit={recordPayment} className="space-y-4">
          <Field label="Amount ($)">
            <Input
              required
              type="number"
              min={0}
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </Field>
          <Field label="Method">
            <Select value={paymentForm.method} onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value }))}>
              <option value="check">Check</option>
              <option value="ach">ACH</option>
              <option value="wire">Wire</option>
              <option value="credit_card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="factor">Factor</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Reference / Check #">
            <Input
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm((f) => ({ ...f, reference: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={paymentSaving}>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* create invoice from load modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Invoice from Load">
        <form onSubmit={createInvoice} className="space-y-4">
          <Field label="Delivered Load">
            <Select
              required
              value={createForm.loadId}
              onChange={(e) => setCreateForm((f) => ({ ...f, loadId: e.target.value }))}
            >
              <option value="">Select a delivered load…</option>
              {deliveredLoads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.loadNumber} — {l.customerName} {l.rate != null ? `(${formatCurrency(l.rate)})` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment Terms (optional override)">
            <Select
              value={createForm.paymentTerms}
              onChange={(e) => setCreateForm((f) => ({ ...f, paymentTerms: e.target.value }))}
            >
              <option value="">Use customer default</option>
              <option value="net_15">Net 15</option>
              <option value="net_30">Net 30</option>
              <option value="net_45">Net 45</option>
              <option value="net_60">Net 60</option>
              <option value="due_on_receipt">Due on Receipt</option>
              <option value="quick_pay">Quick Pay</option>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea
              rows={2}
              value={createForm.notes}
              onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={createForm.force}
              onChange={(e) => setCreateForm((f) => ({ ...f, force: e.target.checked }))}
              className="rounded"
            />
            Force create (skip POD requirement)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
