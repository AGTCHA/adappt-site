"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  FileText,
  Edit2,
  Trash2,
  DollarSign,
  Users,
  Percent,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatCurrency, formatDate } from "@/src/lib/format";
import { PAY_RULE_TYPES, PAY_RULE_LABEL } from "@/src/lib/tms/constants";

/* ---------- types ---------- */

interface PayRule {
  id: string;
  ruleType: string;
  driverId: string | null;
  driverName: string | null;
  ratePerMile: number | null;
  ratePerLoadPct: number | null;
  rateHourly: number | null;
  rateFlat: number | null;
  salaryWeekly: number | null;
  teamSharePct: number | null;
  detentionPerHour: number | null;
  layoverFlat: number | null;
  stopPay: number | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  active: boolean;
  notes: string | null;
  createdAt: string;
}

interface DriverOption {
  id: string;
  firstName: string;
  lastName: string;
}

const rateFieldForType: Record<string, string> = {
  per_mile: "ratePerMile",
  per_load_pct: "ratePerLoadPct",
  hourly: "rateHourly",
  flat_per_load: "rateFlat",
  salary_weekly: "salaryWeekly",
  team_split: "teamSharePct",
};

const rateLabel: Record<string, string> = {
  per_mile: "Rate per Mile ($)",
  per_load_pct: "% of Linehaul",
  hourly: "Hourly Rate ($)",
  flat_per_load: "Flat Rate per Load ($)",
  salary_weekly: "Weekly Salary ($)",
  team_split: "Team Share (%)",
};

const rateIcon: Record<string, React.ReactNode> = {
  per_mile: <DollarSign size={14} />,
  per_load_pct: <Percent size={14} />,
  hourly: <Clock size={14} />,
  flat_per_load: <DollarSign size={14} />,
  salary_weekly: <DollarSign size={14} />,
  team_split: <Users size={14} />,
};

function getRateValue(rule: PayRule): string {
  switch (rule.ruleType) {
    case "per_mile":
      return rule.ratePerMile != null ? `$${rule.ratePerMile.toFixed(2)}/mi` : "—";
    case "per_load_pct":
      return rule.ratePerLoadPct != null ? `${rule.ratePerLoadPct}%` : "—";
    case "hourly":
      return rule.rateHourly != null ? `$${rule.rateHourly.toFixed(2)}/hr` : "—";
    case "flat_per_load":
      return rule.rateFlat != null ? formatCurrency(rule.rateFlat) : "—";
    case "salary_weekly":
      return rule.salaryWeekly != null ? `${formatCurrency(rule.salaryWeekly)}/wk` : "—";
    case "team_split":
      return rule.teamSharePct != null ? `${rule.teamSharePct}%` : "—";
    default:
      return "—";
  }
}

const emptyForm = {
  ruleType: "per_mile" as string,
  driverId: "",
  rateValue: "",
  detentionPerHour: "",
  layoverFlat: "",
  stopPay: "",
  effectiveFrom: "",
  effectiveTo: "",
  notes: "",
};

export default function PayRulesPage() {
  const toast = useToast();
  const [rules, setRules] = useState<PayRule[] | null>(null);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRule, setEditRule] = useState<PayRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchRules = useCallback(() => {
    api<{ rules: PayRule[] }>("/api/tms/pay-rules")
      .then(({ rules: r }) => setRules(r))
      .catch(() => setRules([]));
  }, []);

  useEffect(fetchRules, [fetchRules]);

  useEffect(() => {
    if (!createOpen && !editRule) return;
    api<{ drivers: DriverOption[] }>("/api/tms/drivers/roster")
      .then(({ drivers: d }) => setDrivers(d))
      .catch(() => setDrivers([]));
  }, [createOpen, editRule]);

  const set = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function openEdit(rule: PayRule) {
    const rateField = rateFieldForType[rule.ruleType];
    const val = rateField
      ? (rule as unknown as Record<string, unknown>)[rateField]
      : null;
    setEditRule(rule);
    setForm({
      ruleType: rule.ruleType,
      driverId: rule.driverId ?? "",
      rateValue: val != null ? String(val) : "",
      detentionPerHour: rule.detentionPerHour?.toString() ?? "",
      layoverFlat: rule.layoverFlat?.toString() ?? "",
      stopPay: rule.stopPay?.toString() ?? "",
      effectiveFrom: rule.effectiveFrom?.slice(0, 10) ?? "",
      effectiveTo: rule.effectiveTo?.slice(0, 10) ?? "",
      notes: rule.notes ?? "",
    });
  }

  function closeModal() {
    setCreateOpen(false);
    setEditRule(null);
    setForm(emptyForm);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const rateField = rateFieldForType[form.ruleType];
    const body: Record<string, unknown> = {
      ruleType: form.ruleType,
      driverId: form.driverId || null,
      ...(rateField && form.rateValue ? { [rateField]: Number(form.rateValue) } : {}),
      ...(form.detentionPerHour
        ? { detentionPerHour: Number(form.detentionPerHour) }
        : {}),
      ...(form.layoverFlat ? { layoverFlat: Number(form.layoverFlat) } : {}),
      ...(form.stopPay ? { stopPay: Number(form.stopPay) } : {}),
      ...(form.effectiveFrom ? { effectiveFrom: form.effectiveFrom } : {}),
      ...(form.effectiveTo ? { effectiveTo: form.effectiveTo } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
    };
    try {
      if (editRule) {
        await api(`/api/tms/pay-rules/${editRule.id}`, { method: "PATCH", json: body });
        toast("success", "Pay rule updated");
      } else {
        await api("/api/tms/pay-rules", { method: "POST", json: body });
        toast("success", "Pay rule created");
      }
      closeModal();
      fetchRules();
    } catch (err) {
      toast("error", editRule ? "Update failed" : "Create failed", (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string) {
    try {
      await api(`/api/tms/pay-rules/${id}`, { method: "DELETE" });
      toast("success", "Pay rule deactivated");
      fetchRules();
    } catch (err) {
      toast("error", "Deactivation failed", (err as Error).message);
    }
  }

  const isOpen = createOpen || !!editRule;

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Pay Rules"
        subtitle="Configure driver compensation structures."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            Add Pay Rule
          </Button>
        }
      />

      {rules === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="No pay rules"
          description="Create pay rules to define how drivers are compensated."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              Add Pay Rule
            </Button>
          }
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[1.5fr_1.5fr_auto_auto_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
            <span>Driver</span>
            <span>Rule Type</span>
            <span>Rate</span>
            <span>Detention</span>
            <span>Layover</span>
            <span>Stop Pay</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {rules.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.15) }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 sm:grid sm:grid-cols-[1.5fr_1.5fr_auto_auto_auto_auto_auto_auto]"
            >
              <div>
                <p className="text-sm font-semibold">
                  {rule.driverName ?? "Company Default"}
                </p>
                {rule.effectiveFrom && (
                  <p className="text-xs text-ink-tertiary">
                    {formatDate(rule.effectiveFrom)}
                    {rule.effectiveTo ? ` → ${formatDate(rule.effectiveTo)}` : " → ongoing"}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {rateIcon[rule.ruleType]}
                <Badge tone="accent">
                  {PAY_RULE_LABEL[rule.ruleType as keyof typeof PAY_RULE_LABEL] ?? rule.ruleType}
                </Badge>
              </div>
              <span className="text-sm font-semibold">{getRateValue(rule)}</span>
              <span className="text-sm text-ink-secondary">
                {rule.detentionPerHour != null
                  ? `$${rule.detentionPerHour}/hr`
                  : "—"}
              </span>
              <span className="text-sm text-ink-secondary">
                {rule.layoverFlat != null ? `$${rule.layoverFlat}/day` : "—"}
              </span>
              <span className="text-sm text-ink-secondary">
                {rule.stopPay != null ? formatCurrency(rule.stopPay) : "—"}
              </span>
              <Badge tone={rule.active ? "success" : "neutral"}>
                {rule.active ? "Active" : "Inactive"}
              </Badge>
              <div className="flex items-center gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Edit2 size={14} />}
                  onClick={() => openEdit(rule)}
                />
                {rule.active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={() => deactivate(rule.id)}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* create/edit modal */}
      <Modal
        open={isOpen}
        onClose={closeModal}
        title={editRule ? "Edit Pay Rule" : "Add Pay Rule"}
        wide
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rule Type">
              <Select
                required
                value={form.ruleType}
                onChange={(e) => set("ruleType", e.target.value)}
                disabled={!!editRule}
              >
                {PAY_RULE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PAY_RULE_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Driver (leave blank for company default)">
              <Select
                value={form.driverId}
                onChange={(e) => set("driverId", e.target.value)}
              >
                <option value="">Company Default</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label={rateLabel[form.ruleType] ?? "Rate"}>
            <Input
              required
              type="number"
              min={0}
              step={form.ruleType === "per_load_pct" || form.ruleType === "team_split" ? "1" : "0.01"}
              placeholder={form.ruleType === "per_mile" ? "0.55" : form.ruleType === "per_load_pct" ? "75" : ""}
              value={form.rateValue}
              onChange={(e) => set("rateValue", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Detention Rate ($/hr)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.detentionPerHour}
                onChange={(e) => set("detentionPerHour", e.target.value)}
              />
            </Field>
            <Field label="Layover Rate ($/day)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.layoverFlat}
                onChange={(e) => set("layoverFlat", e.target.value)}
              />
            </Field>
            <Field label="Stop Pay ($)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.stopPay}
                onChange={(e) => set("stopPay", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Effective From">
              <Input
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => set("effectiveFrom", e.target.value)}
              />
            </Field>
            <Field label="Effective To">
              <Input
                type="date"
                value={form.effectiveTo}
                onChange={(e) => set("effectiveTo", e.target.value)}
              />
            </Field>
          </div>

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
              {editRule ? "Save changes" : "Add rule"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
