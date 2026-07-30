"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatDate } from "@/src/lib/format";

interface PtoRow {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  notes: string;
  employee: { id: string; firstName: string; lastName: string };
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
}

const statusTone: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "success",
  denied: "danger",
  cancelled: "neutral",
};

export default function PtoPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<PtoRow[] | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
    type: "vacation",
    notes: "",
  });

  const load = useCallback(() => {
    api<{ requests: PtoRow[] }>("/api/office/pto")
      .then(({ requests: rows }) => setRequests(rows))
      .catch(() => setRequests([]));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (!submitOpen) return;
    api<{ employees: EmployeeOption[] }>("/api/office/employees")
      .then(({ employees: rows }) => setEmployees(rows))
      .catch(() => setEmployees([]));
  }, [submitOpen]);

  async function submitPto(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/office/pto", { method: "POST", json: form });
      toast("success", "PTO request submitted");
      setForm({ employeeId: "", startDate: "", endDate: "", type: "vacation", notes: "" });
      setSubmitOpen(false);
      load();
    } catch (error) {
      toast("error", "Couldn't submit request", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Office"
        title="PTO Requests"
        subtitle="Vacation, sick leave, and time-off tracking."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setSubmitOpen(true)}>
            Submit request
          </Button>
        }
      />

      {requests === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Calendar size={24} />}
          title="No PTO requests"
          description="Submit time-off requests for your team members."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setSubmitOpen(true)}>
              Submit request
            </Button>
          }
        />
      ) : (
        <div className="glass divide-y divide-border overflow-hidden rounded-2xl">
          {requests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.15) }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {req.employee.firstName} {req.employee.lastName}
                </p>
                <p className="mt-0.5 text-xs text-ink-tertiary">
                  {formatDate(req.startDate)} → {formatDate(req.endDate)}
                  {req.notes && ` · ${req.notes}`}
                </p>
              </div>
              <Badge tone="neutral">{req.type}</Badge>
              <Badge tone={statusTone[req.status] ?? "neutral"}>{req.status}</Badge>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={submitOpen} onClose={() => setSubmitOpen(false)} title="Submit PTO request">
        <form onSubmit={submitPto} className="space-y-4">
          <Field label="Employee">
            <Select
              required
              value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
            >
              <option value="">Select employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <Input
                required
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </Field>
            <Field label="End date">
              <Input
                required
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="vacation">Vacation</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setSubmitOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Submit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
