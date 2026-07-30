"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  Link2,
  Inbox,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatDate } from "@/src/lib/format";

interface EdiPartner {
  id: string;
  name: string;
  isa_id: string;
  gs_id: string;
  status: string;
  lastActivity: string | null;
}

interface EdiTender {
  id: string;
  partnerName: string;
  loadNumber: string;
  origin: string;
  destination: string;
  rate: number | null;
  status: string;
  receivedAt: string;
}

interface EdiMessage {
  id: string;
  type: string;
  direction: "inbound" | "outbound";
  partnerName: string;
  reference: string;
  status: string;
  createdAt: string;
}

type Tab = "partners" | "inbox" | "messages";

export default function EdiPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("partners");

  // Partners
  const [partners, setPartners] = useState<EdiPartner[] | null>(null);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<EdiPartner | null>(null);
  const [partnerForm, setPartnerForm] = useState({ name: "", isa_id: "", gs_id: "" });
  const [savingPartner, setSavingPartner] = useState(false);

  // Inbox
  const [tenders, setTenders] = useState<EdiTender[] | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  // Messages
  const [ediMessages, setEdiMessages] = useState<EdiMessage[] | null>(null);
  const [msgFilter, setMsgFilter] = useState({ type: "", direction: "" });

  const fetchPartners = useCallback(() => {
    api<{ partners: EdiPartner[] }>("/api/tms/edi/partners")
      .then(({ partners: rows }) => setPartners(rows))
      .catch(() => setPartners([]));
  }, []);

  const fetchTenders = useCallback(() => {
    api<{ tenders: EdiTender[] }>("/api/tms/edi/tenders")
      .then(({ tenders: rows }) => setTenders(rows))
      .catch(() => setTenders([]));
  }, []);

  const fetchMessages = useCallback(() => {
    const params = new URLSearchParams();
    if (msgFilter.type) params.set("type", msgFilter.type);
    if (msgFilter.direction) params.set("direction", msgFilter.direction);
    api<{ messages: EdiMessage[] }>(`/api/tms/edi/messages?${params}`)
      .then(({ messages: rows }) => setEdiMessages(rows))
      .catch(() => setEdiMessages([]));
  }, [msgFilter]);

  useEffect(() => {
    if (tab === "partners") fetchPartners();
    if (tab === "inbox") fetchTenders();
    if (tab === "messages") fetchMessages();
  }, [tab, fetchPartners, fetchTenders, fetchMessages]);

  // Partner CRUD
  function openCreatePartner() {
    setEditingPartner(null);
    setPartnerForm({ name: "", isa_id: "", gs_id: "" });
    setPartnerOpen(true);
  }

  function openEditPartner(p: EdiPartner) {
    setEditingPartner(p);
    setPartnerForm({ name: p.name, isa_id: p.isa_id, gs_id: p.gs_id });
    setPartnerOpen(true);
  }

  async function savePartner(e: React.FormEvent) {
    e.preventDefault();
    setSavingPartner(true);
    try {
      if (editingPartner) {
        await api(`/api/tms/edi/partners/${editingPartner.id}`, {
          method: "PATCH",
          json: partnerForm,
        });
        toast("success", "Partner updated");
      } else {
        await api("/api/tms/edi/partners", { method: "POST", json: partnerForm });
        toast("success", "Partner added");
      }
      setPartnerOpen(false);
      fetchPartners();
    } catch (err) {
      toast("error", "Save failed", (err as Error).message);
    } finally {
      setSavingPartner(false);
    }
  }

  async function deletePartner(id: string) {
    if (!confirm("Remove this EDI partner?")) return;
    try {
      await api(`/api/tms/edi/partners/${id}`, { method: "DELETE" });
      toast("success", "Partner removed");
      fetchPartners();
    } catch (err) {
      toast("error", "Delete failed", (err as Error).message);
    }
  }

  async function resetCircuit(id: string) {
    try {
      await api(`/api/tms/edi/partners/${id}/reset`, { method: "POST" });
      toast("success", "Circuit reset");
      fetchPartners();
    } catch (err) {
      toast("error", "Reset failed", (err as Error).message);
    }
  }

  // Tender actions
  async function respondTender(id: string, action: "accept" | "decline") {
    setProcessing(id);
    try {
      await api(`/api/tms/edi/tenders/${id}/${action}`, { method: "POST" });
      toast("success", action === "accept" ? "Tender accepted" : "Tender declined");
      fetchTenders();
    } catch (err) {
      toast("error", "Action failed", (err as Error).message);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="EDI"
        subtitle="Electronic data interchange — trading partners, tender inbox, and message log."
        actions={
          tab === "partners" ? (
            <Button icon={<Plus size={15} />} onClick={openCreatePartner}>
              Add partner
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="mb-5 flex items-center gap-1 rounded-xl bg-surface-solid p-1">
        {([
          { key: "partners", label: "Partners", icon: <Link2 size={14} /> },
          { key: "inbox", label: "Inbox", icon: <Inbox size={14} /> },
          { key: "messages", label: "Messages", icon: <FileText size={14} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`focus-ring flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-accent text-accent-text shadow-sm"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* === PARTNERS === */}
      {tab === "partners" && (
        <>
          {partners === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <EmptyState
              icon={<Link2 size={24} />}
              title="No EDI partners"
              description="Add your first trading partner to start receiving tenders electronically."
              action={
                <Button icon={<Plus size={15} />} onClick={openCreatePartner}>
                  Add partner
                </Button>
              }
            />
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
                <span>Partner</span>
                <span>ISA ID</span>
                <span>GS ID</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {partners.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.15) }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto]"
                >
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    {p.lastActivity && (
                      <p className="text-xs text-ink-tertiary">Last: {formatDate(p.lastActivity)}</p>
                    )}
                  </div>
                  <code className="text-xs text-ink-secondary">{p.isa_id}</code>
                  <code className="text-xs text-ink-secondary">{p.gs_id}</code>
                  <Badge tone={p.status === "active" ? "success" : "neutral"}>{p.status}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" icon={<Edit2 size={13} />} onClick={() => openEditPartner(p)} />
                    <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={() => resetCircuit(p.id)} title="Reset circuit" />
                    <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => deletePartner(p.id)} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <Modal
            open={partnerOpen}
            onClose={() => setPartnerOpen(false)}
            title={editingPartner ? "Edit partner" : "Add EDI partner"}
          >
            <form onSubmit={savePartner} className="space-y-4">
              <Field label="Partner name">
                <Input
                  required
                  placeholder="e.g. C.H. Robinson"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ISA ID">
                  <Input
                    required
                    placeholder="ISA qualifier"
                    value={partnerForm.isa_id}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, isa_id: e.target.value }))}
                  />
                </Field>
                <Field label="GS ID">
                  <Input
                    required
                    placeholder="GS application code"
                    value={partnerForm.gs_id}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, gs_id: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setPartnerOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={savingPartner}>
                  {editingPartner ? "Update" : "Add partner"}
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {/* === INBOX (TENDERS) === */}
      {tab === "inbox" && (
        <>
          {tenders === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : tenders.length === 0 ? (
            <EmptyState
              icon={<Inbox size={24} />}
              title="Inbox empty"
              description="No pending EDI tenders. Tenders from trading partners will appear here."
            />
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <div className="hidden grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
                <span>Partner / Load</span>
                <span>Route</span>
                <span>Received</span>
                <span>Rate</span>
                <span>Actions</span>
              </div>
              {tenders.map((tender, i) => (
                <motion.div
                  key={tender.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.15) }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-0 sm:grid sm:grid-cols-[1fr_1fr_1fr_auto_auto]"
                >
                  <div>
                    <p className="text-sm font-semibold">{tender.loadNumber}</p>
                    <p className="text-xs text-ink-tertiary">{tender.partnerName}</p>
                  </div>
                  <p className="text-sm text-ink-secondary">
                    {tender.origin} → {tender.destination}
                  </p>
                  <p className="text-xs text-ink-tertiary">{formatDate(tender.receivedAt)}</p>
                  <p className="text-sm font-semibold">
                    {tender.rate != null ? `$${tender.rate.toLocaleString()}` : "—"}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="success"
                      size="sm"
                      icon={<CheckCircle size={13} />}
                      loading={processing === tender.id}
                      onClick={() => respondTender(tender.id, "accept")}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<XCircle size={13} />}
                      loading={processing === tender.id}
                      onClick={() => respondTender(tender.id, "decline")}
                    >
                      Decline
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* === MESSAGES LOG === */}
      {tab === "messages" && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select
              value={msgFilter.type}
              onChange={(e) => setMsgFilter((f) => ({ ...f, type: e.target.value }))}
              className="!w-auto"
            >
              <option value="">All types</option>
              <option value="204">204 — Motor carrier load tender</option>
              <option value="990">990 — Response to load tender</option>
              <option value="214">214 — Shipment status</option>
              <option value="210">210 — Invoice</option>
              <option value="997">997 — Functional acknowledgment</option>
            </Select>
            <Select
              value={msgFilter.direction}
              onChange={(e) => setMsgFilter((f) => ({ ...f, direction: e.target.value }))}
              className="!w-auto"
            >
              <option value="">All directions</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </Select>
          </div>

          {ediMessages === null ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-2xl" />
              ))}
            </div>
          ) : ediMessages.length === 0 ? (
            <EmptyState
              icon={<FileText size={24} />}
              title="No messages"
              description="EDI transaction messages will be logged here."
            />
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <div className="hidden grid-cols-[auto_1fr_1fr_auto_auto] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-tertiary sm:grid">
                <span>Type</span>
                <span>Partner</span>
                <span>Reference</span>
                <span>Direction</span>
                <span>Date</span>
              </div>
              {ediMessages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.15) }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3 last:border-0 sm:grid sm:grid-cols-[auto_1fr_1fr_auto_auto]"
                >
                  <Badge tone="accent">{msg.type}</Badge>
                  <p className="text-sm text-ink-secondary">{msg.partnerName}</p>
                  <p className="text-sm font-medium">{msg.reference}</p>
                  <Badge tone={msg.direction === "inbound" ? "success" : "violet"}>
                    {msg.direction}
                  </Badge>
                  <p className="text-xs text-ink-tertiary">{formatDate(msg.createdAt)}</p>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
