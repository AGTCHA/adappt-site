"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  DollarSign,
  CheckCircle,
  CreditCard,
  Wallet,
  ArrowDownCircle,
  Repeat,
  Minus,
  Banknote,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { StatCard } from "@/src/components/ui/StatCard";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency, formatDate } from "@/src/lib/format";

/* ---------- types ---------- */

interface DriverOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface Settlement {
  id: string;
  settlementNumber: string;
  status: string;
  driverId: string;
  driverName: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  lineCount: number;
  createdAt: string;
}

interface SettlementDetail extends Settlement {
  lines?: {
    id: string;
    type: string;
    description: string;
    amount: number;
    loadNumber: string | null;
  }[];
}

interface RecurringItem {
  id: string;
  driverId: string;
  driverName: string;
  type: string;
  description: string;
  amount: number;
  frequency: string;
  active: boolean;
  createdAt: string;
}

interface Adjustment {
  id: string;
  driverId: string;
  driverName: string;
  type: string;
  description: string;
  amount: number;
  appliedToSettlement: boolean;
  createdAt: string;
}

interface EscrowAccount {
  id: string;
  driverId: string;
  driverName: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  createdAt: string;
}

type Tab = "settlements" | "deductions" | "escrow";

const tabLabel: Record<Tab, string> = {
  settlements: "Settlements",
  deductions: "Deductions & Advances",
  escrow: "Escrow",
};

const settlementTone: Record<string, "neutral" | "accent" | "success" | "warning"> = {
  draft: "neutral",
  approved: "accent",
  paid: "success",
};

export default function SettlementsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("settlements");

  /* shared */
  const [drivers, setDrivers] = useState<DriverOption[]>([]);

  useEffect(() => {
    api<{ drivers: DriverOption[] }>("/api/tms/drivers/roster")
      .then(({ drivers: d }) => setDrivers(d))
      .catch(() => setDrivers([]));
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Settlements"
        subtitle="Driver pay, deductions, advances, and escrow management."
      />

      {/* tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-surface p-1">
        {(Object.keys(tabLabel) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-accent text-accent-text"
                : "text-ink-secondary hover:bg-accent-soft hover:text-accent"
            }`}
          >
            {tabLabel[t]}
          </button>
        ))}
      </div>

      {tab === "settlements" && <SettlementsTab drivers={drivers} toast={toast} />}
      {tab === "deductions" && <DeductionsTab drivers={drivers} toast={toast} />}
      {tab === "escrow" && <EscrowTab drivers={drivers} toast={toast} />}
    </div>
  );
}

/* ============================================================
   SETTLEMENTS TAB
   ============================================================ */

function SettlementsTab({
  drivers,
  toast,
}: {
  drivers: DriverOption[];
  toast: ReturnType<typeof useToast>;
}) {
  const [settlements, setSettlements] = useState<Settlement[] | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genForm, setGenForm] = useState({ driverId: "", periodStart: "", periodEnd: "" });
  const [generating, setGenerating] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SettlementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchList = useCallback(() => {
    api<{ settlements: Settlement[] }>("/api/tms/settlements")
      .then(({ settlements: s }) => setSettlements(s))
      .catch(() => setSettlements([]));
  }, []);

  useEffect(fetchList, [fetchList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    api<{ settlement: SettlementDetail }>(`/api/tms/settlements/${selectedId}`)
      .then(({ settlement }) => setDetail(settlement))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      await api("/api/tms/settlements", {
        method: "POST",
        json: {
          driverId: genForm.driverId,
          periodStart: genForm.periodStart,
          periodEnd: genForm.periodEnd,
        },
      });
      toast("success", "Settlement generated");
      setGenerateOpen(false);
      setGenForm({ driverId: "", periodStart: "", periodEnd: "" });
      fetchList();
    } catch (err) {
      toast("error", "Generation failed", (err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function doAction(action: "approve" | "pay") {
    if (!selectedId) return;
    setActionLoading(action);
    try {
      await api(`/api/tms/settlements/${selectedId}`, {
        method: "PATCH",
        json: { action },
      });
      toast("success", action === "approve" ? "Settlement approved" : "Settlement marked paid");
      const refreshed = await api<{ settlement: SettlementDetail }>(`/api/tms/settlements/${selectedId}`);
      setDetail(refreshed.settlement);
      fetchList();
    } catch (err) {
      toast("error", "Action failed", (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button icon={<Plus size={15} />} onClick={() => setGenerateOpen(true)}>
          Generate Settlement
        </Button>
      </div>

      {settlements === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : settlements.length === 0 ? (
        <EmptyState
          icon={<DollarSign size={24} />}
          title="No settlements"
          description="Generate a settlement for a driver period."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setGenerateOpen(true)}>
              Generate Settlement
            </Button>
          }
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[1fr_1.5fr_1fr_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
            <span>Settlement #</span>
            <span>Driver</span>
            <span>Period</span>
            <span>Gross</span>
            <span>Deductions</span>
            <span>Net</span>
            <span>Status</span>
          </div>
          {settlements.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.15) }}
              className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 hover:bg-accent-soft/30 sm:grid sm:grid-cols-[1fr_1.5fr_1fr_auto_auto_auto_auto]"
              onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
            >
              <p className="text-sm font-semibold">{s.settlementNumber}</p>
              <p className="text-sm text-ink-secondary">{s.driverName}</p>
              <p className="text-xs text-ink-tertiary">
                {formatDate(s.periodStart)} — {formatDate(s.periodEnd)}
              </p>
              <span className="text-sm font-semibold">{formatCurrency(s.grossPay)}</span>
              <span className="text-sm text-danger">{formatCurrency(s.totalDeductions)}</span>
              <span className="text-sm font-semibold text-success">{formatCurrency(s.netPay)}</span>
              <Badge tone={settlementTone[s.status] ?? "neutral"}>
                {(s.status ?? "draft").charAt(0).toUpperCase() +
                  (s.status ?? "draft").slice(1)}
              </Badge>
            </motion.div>
          ))}
        </div>
      )}

      {/* detail modal */}
      <Modal
        open={!!selectedId && !!detail}
        onClose={() => setSelectedId(null)}
        title={detail ? `Settlement ${detail.settlementNumber}` : "Settlement Detail"}
        wide
      >
        {detailLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : detail ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Gross Pay" value={formatCurrency(detail.grossPay)} tone="accent" icon={<DollarSign size={14} />} />
              <StatCard label="Deductions" value={formatCurrency(detail.totalDeductions)} tone="danger" icon={<Minus size={14} />} />
              <StatCard label="Net Pay" value={formatCurrency(detail.netPay)} tone="success" icon={<Banknote size={14} />} />
              <StatCard label="Lines" value={detail.lineCount} icon={<CreditCard size={14} />} />
            </div>

            {detail.lines && detail.lines.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium text-ink-tertiary">Line Items</h4>
                <div className="glass overflow-hidden rounded-xl">
                  <div className="hidden grid-cols-[auto_2fr_1fr_auto] gap-4 border-b border-border px-4 py-2 text-xs font-medium text-ink-tertiary sm:grid">
                    <span>Type</span>
                    <span>Description</span>
                    <span>Load</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {detail.lines.map((ln) => (
                    <div key={ln.id} className="grid grid-cols-[auto_2fr_1fr_auto] gap-4 border-b border-border px-4 py-2.5 text-sm last:border-0">
                      <Badge tone={ln.amount >= 0 ? "success" : "danger"}>{ln.type}</Badge>
                      <span>{ln.description}</span>
                      <span className="text-ink-secondary">{ln.loadNumber ?? "—"}</span>
                      <span className={`text-right font-semibold ${ln.amount >= 0 ? "text-success" : "text-danger"}`}>
                        {formatCurrency(Math.abs(ln.amount), 2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {detail.status === "draft" && (
                <Button
                  icon={<CheckCircle size={14} />}
                  loading={actionLoading === "approve"}
                  onClick={() => doAction("approve")}
                >
                  Approve
                </Button>
              )}
              {detail.status === "approved" && (
                <Button
                  variant="success"
                  icon={<Banknote size={14} />}
                  loading={actionLoading === "pay"}
                  onClick={() => doAction("pay")}
                >
                  Mark Paid
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-tertiary">Could not load settlement details.</p>
        )}
      </Modal>

      {/* generate modal */}
      <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Settlement">
        <form onSubmit={generate} className="space-y-4">
          <Field label="Driver">
            <Select
              required
              value={genForm.driverId}
              onChange={(e) => setGenForm((f) => ({ ...f, driverId: e.target.value }))}
            >
              <option value="">Select driver…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Period Start">
              <Input
                required
                type="date"
                value={genForm.periodStart}
                onChange={(e) => setGenForm((f) => ({ ...f, periodStart: e.target.value }))}
              />
            </Field>
            <Field label="Period End">
              <Input
                required
                type="date"
                value={genForm.periodEnd}
                onChange={(e) => setGenForm((f) => ({ ...f, periodEnd: e.target.value }))}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setGenerateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={generating}>
              Generate
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* ============================================================
   DEDUCTIONS & ADVANCES TAB
   ============================================================ */

function DeductionsTab({
  drivers,
  toast,
}: {
  drivers: DriverOption[];
  toast: ReturnType<typeof useToast>;
}) {
  const [recurring, setRecurring] = useState<RecurringItem[] | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustment[] | null>(null);
  const [subTab, setSubTab] = useState<"recurring" | "adjustments">("recurring");

  const [addRecurOpen, setAddRecurOpen] = useState(false);
  const [recurForm, setRecurForm] = useState({
    driverId: "",
    type: "deduction",
    description: "",
    amount: "",
    frequency: "per_settlement",
  });
  const [recurSaving, setRecurSaving] = useState(false);

  const [addAdjOpen, setAddAdjOpen] = useState(false);
  const [adjForm, setAdjForm] = useState({
    driverId: "",
    type: "deduction",
    description: "",
    amount: "",
  });
  const [adjSaving, setAdjSaving] = useState(false);

  const fetchRecurring = useCallback(() => {
    api<{ items: RecurringItem[] }>("/api/tms/settlements/recurring")
      .then(({ items }) => setRecurring(items))
      .catch(() => setRecurring([]));
  }, []);

  const fetchAdjustments = useCallback(() => {
    api<{ adjustments: Adjustment[] }>("/api/tms/settlements/adjustments")
      .then(({ adjustments: a }) => setAdjustments(a))
      .catch(() => setAdjustments([]));
  }, []);

  useEffect(fetchRecurring, [fetchRecurring]);
  useEffect(fetchAdjustments, [fetchAdjustments]);

  async function addRecurring(e: React.FormEvent) {
    e.preventDefault();
    setRecurSaving(true);
    try {
      await api("/api/tms/settlements/recurring", {
        method: "POST",
        json: {
          driverId: recurForm.driverId,
          type: recurForm.type,
          description: recurForm.description,
          amount: Number(recurForm.amount),
          frequency: recurForm.frequency,
        },
      });
      toast("success", "Recurring item added");
      setAddRecurOpen(false);
      setRecurForm({ driverId: "", type: "deduction", description: "", amount: "", frequency: "per_settlement" });
      fetchRecurring();
    } catch (err) {
      toast("error", "Failed to add", (err as Error).message);
    } finally {
      setRecurSaving(false);
    }
  }

  async function addAdjustment(e: React.FormEvent) {
    e.preventDefault();
    setAdjSaving(true);
    try {
      await api("/api/tms/settlements/adjustments", {
        method: "POST",
        json: {
          driverId: adjForm.driverId,
          type: adjForm.type,
          description: adjForm.description,
          amount: Number(adjForm.amount),
        },
      });
      toast("success", "Adjustment added");
      setAddAdjOpen(false);
      setAdjForm({ driverId: "", type: "deduction", description: "", amount: "" });
      fetchAdjustments();
    } catch (err) {
      toast("error", "Failed to add", (err as Error).message);
    } finally {
      setAdjSaving(false);
    }
  }

  return (
    <>
      {/* sub-tabs */}
      <div className="mb-4 flex gap-4 text-sm">
        <button
          onClick={() => setSubTab("recurring")}
          className={`border-b-2 pb-1 font-medium transition-colors ${
            subTab === "recurring" ? "border-accent text-accent" : "border-transparent text-ink-secondary hover:text-accent"
          }`}
        >
          <Repeat size={14} className="mr-1 inline" /> Recurring
        </button>
        <button
          onClick={() => setSubTab("adjustments")}
          className={`border-b-2 pb-1 font-medium transition-colors ${
            subTab === "adjustments" ? "border-accent text-accent" : "border-transparent text-ink-secondary hover:text-accent"
          }`}
        >
          <ArrowDownCircle size={14} className="mr-1 inline" /> One-Time Adjustments
        </button>
      </div>

      {subTab === "recurring" && (
        <>
          <div className="mb-4 flex justify-end">
            <Button icon={<Plus size={15} />} onClick={() => setAddRecurOpen(true)}>
              Add Recurring
            </Button>
          </div>
          {recurring === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : recurring.length === 0 ? (
            <EmptyState
              icon={<Repeat size={24} />}
              title="No recurring items"
              description="Add recurring deductions or advances for drivers."
              action={
                <Button icon={<Plus size={15} />} onClick={() => setAddRecurOpen(true)}>
                  Add Recurring
                </Button>
              }
            />
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <div className="hidden grid-cols-[1.5fr_1fr_2fr_auto_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
                <span>Driver</span>
                <span>Type</span>
                <span>Description</span>
                <span>Amount</span>
                <span>Frequency</span>
                <span>Active</span>
              </div>
              {recurring.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.15) }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 sm:grid sm:grid-cols-[1.5fr_1fr_2fr_auto_auto_auto]"
                >
                  <p className="text-sm font-semibold">{r.driverName}</p>
                  <Badge tone={r.type === "deduction" ? "danger" : "success"}>{r.type}</Badge>
                  <p className="text-sm text-ink-secondary">{r.description}</p>
                  <span className="text-sm font-semibold">{formatCurrency(r.amount, 2)}</span>
                  <span className="text-xs text-ink-tertiary">
                    {(r.frequency ?? "per_settlement").replaceAll("_", " ")}
                  </span>
                  <Badge tone={r.active ? "success" : "neutral"}>{r.active ? "Active" : "Inactive"}</Badge>
                </motion.div>
              ))}
            </div>
          )}

          <Modal open={addRecurOpen} onClose={() => setAddRecurOpen(false)} title="Add Recurring Deduction/Advance">
            <form onSubmit={addRecurring} className="space-y-4">
              <Field label="Driver">
                <Select
                  required
                  value={recurForm.driverId}
                  onChange={(e) => setRecurForm((f) => ({ ...f, driverId: e.target.value }))}
                >
                  <option value="">Select driver…</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <Select
                    value={recurForm.type}
                    onChange={(e) => setRecurForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    <option value="deduction">Deduction</option>
                    <option value="advance">Advance</option>
                    <option value="reimbursement">Reimbursement</option>
                  </Select>
                </Field>
                <Field label="Frequency">
                  <Select
                    value={recurForm.frequency}
                    onChange={(e) => setRecurForm((f) => ({ ...f, frequency: e.target.value }))}
                  >
                    <option value="per_settlement">Per Settlement</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </Select>
                </Field>
              </div>
              <Field label="Description">
                <Input
                  required
                  placeholder="e.g. Insurance premium"
                  value={recurForm.description}
                  onChange={(e) => setRecurForm((f) => ({ ...f, description: e.target.value }))}
                />
              </Field>
              <Field label="Amount ($)">
                <Input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={recurForm.amount}
                  onChange={(e) => setRecurForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setAddRecurOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={recurSaving}>
                  Add
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {subTab === "adjustments" && (
        <>
          <div className="mb-4 flex justify-end">
            <Button icon={<Plus size={15} />} onClick={() => setAddAdjOpen(true)}>
              Add Adjustment
            </Button>
          </div>
          {adjustments === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : adjustments.length === 0 ? (
            <EmptyState
              icon={<ArrowDownCircle size={24} />}
              title="No adjustments"
              description="Add one-time deductions, bonuses, or advances."
              action={
                <Button icon={<Plus size={15} />} onClick={() => setAddAdjOpen(true)}>
                  Add Adjustment
                </Button>
              }
            />
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <div className="hidden grid-cols-[1.5fr_1fr_2fr_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
                <span>Driver</span>
                <span>Type</span>
                <span>Description</span>
                <span>Amount</span>
                <span>Applied</span>
              </div>
              {adjustments.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.15) }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 sm:grid sm:grid-cols-[1.5fr_1fr_2fr_auto_auto]"
                >
                  <p className="text-sm font-semibold">{a.driverName}</p>
                  <Badge tone={a.type === "deduction" ? "danger" : "success"}>{a.type}</Badge>
                  <p className="text-sm text-ink-secondary">{a.description}</p>
                  <span className="text-sm font-semibold">{formatCurrency(a.amount, 2)}</span>
                  <Badge tone={a.appliedToSettlement ? "success" : "neutral"}>
                    {a.appliedToSettlement ? "Applied" : "Pending"}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}

          <Modal open={addAdjOpen} onClose={() => setAddAdjOpen(false)} title="Add One-Time Adjustment">
            <form onSubmit={addAdjustment} className="space-y-4">
              <Field label="Driver">
                <Select
                  required
                  value={adjForm.driverId}
                  onChange={(e) => setAdjForm((f) => ({ ...f, driverId: e.target.value }))}
                >
                  <option value="">Select driver…</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Type">
                <Select
                  value={adjForm.type}
                  onChange={(e) => setAdjForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="deduction">Deduction</option>
                  <option value="advance">Advance</option>
                  <option value="bonus">Bonus</option>
                  <option value="reimbursement">Reimbursement</option>
                </Select>
              </Field>
              <Field label="Description">
                <Input
                  required
                  placeholder="e.g. Toll reimbursement"
                  value={adjForm.description}
                  onChange={(e) => setAdjForm((f) => ({ ...f, description: e.target.value }))}
                />
              </Field>
              <Field label="Amount ($)">
                <Input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={adjForm.amount}
                  onChange={(e) => setAdjForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setAddAdjOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={adjSaving}>
                  Add Adjustment
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </>
  );
}

/* ============================================================
   ESCROW TAB
   ============================================================ */

function EscrowTab({
  drivers,
  toast,
}: {
  drivers: DriverOption[];
  toast: ReturnType<typeof useToast>;
}) {
  const [accounts, setAccounts] = useState<EscrowAccount[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ driverId: "", initialDeposit: "" });
  const [createSaving, setCreateSaving] = useState(false);

  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", reason: "" });
  const [withdrawSaving, setWithdrawSaving] = useState(false);

  const fetchAccounts = useCallback(() => {
    api<{ accounts: EscrowAccount[] }>("/api/tms/settlements/escrow")
      .then(({ accounts: a }) => setAccounts(a))
      .catch(() => setAccounts([]));
  }, []);

  useEffect(fetchAccounts, [fetchAccounts]);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setCreateSaving(true);
    try {
      await api("/api/tms/settlements/escrow", {
        method: "POST",
        json: {
          driverId: createForm.driverId,
          ...(createForm.initialDeposit ? { initialDeposit: Number(createForm.initialDeposit) } : {}),
        },
      });
      toast("success", "Escrow account created");
      setCreateOpen(false);
      setCreateForm({ driverId: "", initialDeposit: "" });
      fetchAccounts();
    } catch (err) {
      toast("error", "Creation failed", (err as Error).message);
    } finally {
      setCreateSaving(false);
    }
  }

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!withdrawId) return;
    setWithdrawSaving(true);
    try {
      await api(`/api/tms/settlements/escrow`, {
        method: "PATCH",
        json: {
          accountId: withdrawId,
          action: "withdraw",
          amount: Number(withdrawForm.amount),
          reason: withdrawForm.reason || undefined,
        },
      });
      toast("success", "Withdrawal processed");
      setWithdrawId(null);
      setWithdrawForm({ amount: "", reason: "" });
      fetchAccounts();
    } catch (err) {
      toast("error", "Withdrawal failed", (err as Error).message);
    } finally {
      setWithdrawSaving(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
          Create Escrow Account
        </Button>
      </div>

      {accounts === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<Wallet size={24} />}
          title="No escrow accounts"
          description="Create an escrow account for a driver."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              Create Escrow Account
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc, i) => (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.2) }}
              className="glass rounded-2xl p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">{acc.driverName}</h3>
                <Badge tone={acc.balance > 0 ? "success" : "neutral"}>
                  {formatCurrency(acc.balance, 2)}
                </Badge>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-ink-tertiary">Deposited</span>
                  <p className="font-medium text-success">{formatCurrency(acc.totalDeposited, 2)}</p>
                </div>
                <div>
                  <span className="text-ink-tertiary">Withdrawn</span>
                  <p className="font-medium text-danger">{formatCurrency(acc.totalWithdrawn, 2)}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                icon={<ArrowDownCircle size={14} />}
                onClick={() => {
                  setWithdrawId(acc.id);
                  setWithdrawForm({ amount: "", reason: "" });
                }}
              >
                Withdraw
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Escrow Account">
        <form onSubmit={createAccount} className="space-y-4">
          <Field label="Driver">
            <Select
              required
              value={createForm.driverId}
              onChange={(e) => setCreateForm((f) => ({ ...f, driverId: e.target.value }))}
            >
              <option value="">Select driver…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Initial Deposit ($)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={createForm.initialDeposit}
              onChange={(e) => setCreateForm((f) => ({ ...f, initialDeposit: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createSaving}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!withdrawId} onClose={() => setWithdrawId(null)} title="Withdraw from Escrow">
        <form onSubmit={withdraw} className="space-y-4">
          <Field label="Amount ($)">
            <Input
              required
              type="number"
              min={0}
              step="0.01"
              value={withdrawForm.amount}
              onChange={(e) => setWithdrawForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </Field>
          <Field label="Reason">
            <Input
              value={withdrawForm.reason}
              onChange={(e) => setWithdrawForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setWithdrawId(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={withdrawSaving}>
              Withdraw
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
