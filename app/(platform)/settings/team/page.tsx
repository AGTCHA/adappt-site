"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Mail, UserPlus } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatDate, formatRelative } from "@/src/lib/format";

interface InviteRow {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

export default function TeamSettingsPage() {
  const toast = useToast();
  const [invites, setInvites] = useState<InviteRow[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", role: "viewer" });

  const load = useCallback(() => {
    api<{ invites: InviteRow[] }>("/api/company/invite")
      .then(({ invites: rows }) => setInvites(rows))
      .catch(() => setInvites([]));
  }, []);

  useEffect(load, [load]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/company/invite", { method: "POST", json: form });
      toast("success", "Invite sent", `An invitation was sent to ${form.email}.`);
      setForm({ email: "", role: "viewer" });
      load();
    } catch (error) {
      toast("error", "Couldn't send invite", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Team"
        subtitle="Invite teammates and manage pending invitations."
      />

      <div className="glass mb-6 rounded-2xl p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <UserPlus size={16} className="text-accent" />
          Invite teammate
        </h3>
        <form onSubmit={sendInvite} className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1">
            <Field label="Email">
              <Input
                required
                type="email"
                placeholder="colleague@company.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Field>
          </div>
          <div className="w-36">
            <Field label="Role">
              <Select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </Select>
            </Field>
          </div>
          <Button type="submit" loading={saving} icon={<Mail size={15} />}>
            Send invite
          </Button>
        </form>
      </div>

      <h3 className="mb-3 text-sm font-semibold">Pending invites</h3>
      {invites === null ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : invites.length === 0 ? (
        <EmptyState
          icon={<Mail size={24} />}
          title="No pending invites"
          description="Invitations you send will appear here until accepted."
        />
      ) : (
        <div className="glass divide-y divide-border overflow-hidden rounded-2xl">
          {invites.map((invite, i) => (
            <motion.div
              key={invite.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.15) }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4"
            >
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{invite.email}</p>
              <Badge tone="accent">{invite.role}</Badge>
              <span className="text-xs text-ink-tertiary">
                Sent {formatRelative(invite.createdAt)}
              </span>
              <span className="text-xs text-ink-tertiary">
                Expires {formatDate(invite.expiresAt)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
