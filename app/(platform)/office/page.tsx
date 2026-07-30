"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatDate, initials } from "@/src/lib/format";

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  status: string;
  startDate: string | null;
}

const statusTone: Record<string, "success" | "neutral" | "danger"> = {
  active: "success",
  inactive: "neutral",
  terminated: "danger",
};

export default function OfficeDirectoryPage() {
  const toast = useToast();
  const [employees, setEmployees] = useState<EmployeeRow[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    status: "active",
  });

  const load = useCallback(() => {
    api<{ employees: EmployeeRow[] }>("/api/office/employees")
      .then(({ employees: rows }) => setEmployees(rows))
      .catch(() => setEmployees([]));
  }, []);

  useEffect(load, [load]);

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/office/employees", { method: "POST", json: form });
      toast("success", "Employee added");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        title: "",
        department: "",
        status: "active",
      });
      setCreateOpen(false);
      load();
    } catch (error) {
      toast("error", "Couldn't add employee", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Office"
        title="Employee Directory"
        subtitle="Your back-office team — HR, dispatch, safety, and admin."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            Add employee
          </Button>
        }
      />

      {employees === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No employees yet"
          description="Add your office staff to manage PTO and org directory."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              Add employee
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp, i) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.25) }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {initials(emp.firstName, emp.lastName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <Badge tone={statusTone[emp.status] ?? "neutral"}>{emp.status}</Badge>
                  </div>
                  {emp.title && (
                    <p className="mt-0.5 text-sm text-ink-secondary">{emp.title}</p>
                  )}
                  {emp.department && (
                    <p className="text-xs text-ink-tertiary">{emp.department}</p>
                  )}
                  {(emp.email || emp.phone) && (
                    <p className="mt-2 truncate text-xs text-ink-tertiary">
                      {[emp.email, emp.phone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {emp.startDate && (
                    <p className="mt-1 text-[11px] text-ink-tertiary">
                      Started {formatDate(emp.startDate)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add employee">
        <form onSubmit={createEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <Input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </Field>
            <Field label="Last name">
              <Input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Phone">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>
            <Field label="Department">
              <Input
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
