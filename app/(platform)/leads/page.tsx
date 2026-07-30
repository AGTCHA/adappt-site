"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Phone, UserPlus, ChevronRight } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge, leadDispositionLabel, leadStatusTone } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Select, Textarea } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatRelative } from "@/src/lib/format";
import { LEAD_DISPOSITIONS } from "@/src/lib/modules";

interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  disposition: string;
  dispositionNote: string;
  followUpAt: string | null;
  createdAt: string;
  jobAd: { id: string; title: string };
}

export default function LeadsPage() {
  const router = useRouter();
  const toast = useToast();
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<LeadRow | null>(null);
  const [note, setNote] = useState("");
  const [disposition, setDisposition] = useState("contacted");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api<{ leads: LeadRow[] }>("/api/leads")
      .then(({ leads: rows }) => setLeads(rows))
      .catch(() => setLeads([]));
  }, []);

  useEffect(load, [load]);

  const visible = useMemo(() => {
    const rows = leads ?? [];
    if (filter === "all") return rows.filter((l) => l.disposition !== "converted");
    return rows.filter((l) => l.disposition === filter);
  }, [leads, filter]);

  const counts = useMemo(() => {
    const rows = leads ?? [];
    const map: Record<string, number> = {};
    for (const d of LEAD_DISPOSITIONS) map[d.id] = 0;
    for (const l of rows) map[l.disposition] = (map[l.disposition] ?? 0) + 1;
    return map;
  }, [leads]);

  async function updateDisposition(leadId: string, disp: string, dispositionNote?: string) {
    setSaving(true);
    try {
      await api(`/api/leads/${leadId}`, {
        method: "PATCH",
        json: { disposition: disp, dispositionNote: dispositionNote ?? "" },
      });
      toast("success", "Lead updated");
      setSelected(null);
      load();
    } catch (error) {
      toast("error", "Update failed", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function convertLead(lead: LeadRow) {
    setSaving(true);
    try {
      const { driver } = await api<{ driver: { id: string } }>(`/api/leads/${lead.id}`, {
        method: "PATCH",
        json: { action: "convert", hireSource: lead.jobAd.title },
      });
      toast("success", "Converted to pipeline");
      router.push(`/drivers/${driver.id}`);
    } catch (error) {
      toast("error", "Convert failed", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Leads"
        subtitle="Work inbound leads with dispositions — convert into the pipeline with hire-source attribution."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`focus-ring rounded-full px-3.5 py-1.5 text-xs font-semibold ${
            filter === "all" ? "bg-accent text-accent-text" : "bg-surface-solid ring-1 ring-border text-ink-secondary"
          }`}
        >
          Active ({(leads ?? []).filter((l) => l.disposition !== "converted").length})
        </button>
        {LEAD_DISPOSITIONS.filter((d) => d.id !== "converted").map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setFilter(d.id)}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              filter === d.id ? "bg-accent text-accent-text" : "bg-surface-solid ring-1 ring-border text-ink-secondary"
            }`}
          >
            {d.label} ({counts[d.id] ?? 0})
          </button>
        ))}
      </div>

      {!leads ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Inbox size={24} />}
          title="No leads in this view"
          description="Leads from job ad webhooks show up here. Post a job ad to start collecting them."
          action={
            <Link href="/job-ads">
              <Button icon={<UserPlus size={15} />}>Job Ads</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map((lead) => (
            <div
              key={lead.id}
              className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4 transition-all hover:shadow-raised"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{lead.name || "Unknown"}</p>
                  <Badge tone={leadStatusTone[lead.disposition] ?? "neutral"}>
                    {leadDispositionLabel[lead.disposition] ?? lead.disposition}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-ink-secondary">
                  {lead.jobAd.title} · {formatRelative(lead.createdAt)}
                </p>
                {lead.dispositionNote && (
                  <p className="mt-1 text-xs text-ink-tertiary">{lead.dispositionNote}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="focus-ring inline-flex items-center gap-1 rounded-lg bg-success-soft px-3 py-1.5 text-xs font-semibold text-success"
                  >
                    <Phone size={12} />
                    Call
                  </a>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelected(lead);
                    setNote(lead.dispositionNote);
                    setDisposition("contacted");
                  }}
                >
                  Disposition
                </Button>
                <Button size="sm" loading={saving} onClick={() => convertLead(lead)}>
                  Convert
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Lead"}
        subtitle={selected ? `${selected.phone || "No phone"} · ${selected.jobAd.title}` : ""}
      >
        <Field label="Disposition">
          <Select value={disposition} onChange={(e) => setDisposition(e.target.value)}>
            {LEAD_DISPOSITIONS.filter((d) => d.id !== "converted").map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Note">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Spoke with driver…" />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setSelected(null)}>
            Cancel
          </Button>
          <Button
            loading={saving}
            onClick={() => selected && updateDisposition(selected.id, disposition, note)}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
