"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  Check,
  Inbox,
  Webhook,
  UserPlus,
  X,
  Phone,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge, leadStatusTone } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Textarea } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { formatRelative } from "@/src/lib/format";

interface JobAdRow {
  id: string;
  title: string;
  description: string;
  payRange: string;
  location: string;
  status: string;
  webhookToken: string;
  createdAt: string;
  _count: { leads: number };
}

interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
  jobAd: { id: string; title: string };
}

const adStatusTone: Record<string, "success" | "warning" | "neutral"> = {
  active: "success",
  paused: "warning",
  closed: "neutral",
};

function JobAdsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [ads, setAds] = useState<JobAdRow[] | null>(null);
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [createOpen, setCreateOpen] = useState(searchParams.get("new") === "1");
  const [saving, setSaving] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", location: "", payRange: "", description: "" });

  const load = useCallback(() => {
    api<{ jobAds: JobAdRow[] }>("/api/job-ads")
      .then(({ jobAds }) => setAds(jobAds))
      .catch(() => setAds([]));
    api<{ leads: LeadRow[] }>("/api/leads")
      .then(({ leads }) => setLeads(leads))
      .catch(() => setLeads([]));
  }, []);

  useEffect(load, [load]);

  async function createAd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/job-ads", { method: "POST", json: form });
      toast("success", "Job ad created", "Connect the webhook to start receiving leads.");
      setForm({ title: "", location: "", payRange: "", description: "" });
      setCreateOpen(false);
      if (searchParams.get("new")) router.replace("/job-ads");
      load();
    } catch (error) {
      toast("error", "Couldn't create ad", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function setAdStatus(ad: JobAdRow, status: string) {
    try {
      await api(`/api/job-ads/${ad.id}`, { method: "PATCH", json: { status } });
      toast("success", status === "active" ? "Ad resumed" : `Ad ${status}`);
      load();
    } catch (error) {
      toast("error", "Couldn't update ad", (error as Error).message);
    }
  }

  async function copyWebhook(ad: JobAdRow) {
    const url = `${window.location.origin}/api/webhooks/leads/${ad.webhookToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(ad.webhookToken);
    setTimeout(() => setCopiedToken(null), 2500);
    toast("info", "Webhook URL copied", "Paste it into Facebook Lead Ads, Zapier, or your ad platform.");
  }

  async function leadAction(lead: LeadRow, action: "convert" | "dismiss") {
    try {
      if (action === "convert") {
        await api(`/api/leads/${lead.id}`, { method: "PATCH", json: { action: "convert" } });
        toast("success", "Lead added to Drivers", `${lead.name || "The applicant"} is now in your pipeline.`);
      } else {
        await api(`/api/leads/${lead.id}`, { method: "PATCH", json: { status: "dismissed" } });
        toast("success", "Lead dismissed");
      }
      load();
    } catch (error) {
      toast("error", "Couldn't update lead", (error as Error).message);
    }
  }

  const activeLeads = (leads ?? []).filter((lead) => lead.status !== "dismissed");

  return (
    <div>
      <PageHeader
        title="Job Ads"
        subtitle="Post openings and catch every applicant automatically."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            New job ad
          </Button>
        }
      />

      {/* Ads */}
      {ads === null ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={24} />}
          title="No job ads yet"
          description="Create your first ad, then connect its webhook to your ad platform so leads land here automatically."
          action={
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
              New job ad
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ads.map((ad, i) => (
            <Card key={ad.id} delay={Math.min(i * 0.05, 0.3)} className="flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold tracking-tight">{ad.title}</h3>
                  <p className="mt-0.5 text-sm text-ink-secondary">
                    {[ad.location, ad.payRange].filter(Boolean).join(" · ") || "No details yet"}
                  </p>
                </div>
                <Badge tone={adStatusTone[ad.status] ?? "neutral"}>
                  {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                </Badge>
              </div>
              {ad.description && (
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-secondary">
                  {ad.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs text-ink-tertiary">
                <Inbox size={13} />
                {ad._count.leads} lead{ad._count.leads === 1 ? "" : "s"} · created{" "}
                {formatRelative(ad.createdAt)}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={copiedToken === ad.webhookToken ? <Check size={13} /> : <Webhook size={13} />}
                  onClick={() => copyWebhook(ad)}
                >
                  {copiedToken === ad.webhookToken ? "Copied" : "Copy webhook URL"}
                </Button>
                {ad.status === "active" ? (
                  <Button size="sm" variant="ghost" onClick={() => setAdStatus(ad, "paused")}>
                    Pause
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setAdStatus(ad, "active")}>
                    Resume
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Leads */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Incoming leads</h2>
        {leads === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : activeLeads.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm leading-relaxed text-ink-secondary">
              No leads yet. Copy an ad&apos;s webhook URL into your ad platform
              (Facebook Lead Ads, Zapier, Make…) and new applicants will appear
              here the moment they apply.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeLeads.map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, delay: Math.min(i * 0.03, 0.3) }}
                className="glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{lead.name || "Unnamed applicant"}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-tertiary">
                    {lead.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={11} /> {lead.phone}
                      </span>
                    )}
                    {lead.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={11} /> {lead.email}
                      </span>
                    )}
                    <span>{lead.jobAd.title}</span>
                  </p>
                </div>
                <Badge tone={leadStatusTone[lead.status] ?? "neutral"}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </Badge>
                <span className="text-xs text-ink-tertiary">{formatRelative(lead.createdAt)}</span>
                {lead.status !== "converted" && (
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      icon={<UserPlus size={13} />}
                      onClick={() => leadAction(lead, "convert")}
                    >
                      Add to Drivers
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<X size={13} />}
                      onClick={() => leadAction(lead, "dismiss")}
                      className="text-ink-tertiary"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          if (searchParams.get("new")) router.replace("/job-ads");
        }}
        title="Run Job Advertisement"
        subtitle="Describe the job — you'll get a webhook to plug into any ad platform."
      >
        <form onSubmit={createAd} className="space-y-4">
          <Field label="Job title">
            <Input
              required
              placeholder="CDL-A Driver — Regional, Home Weekends"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <Input
                placeholder="Dallas, TX"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>
            <Field label="Pay range">
              <Input
                placeholder="$0.62–$0.70 / mile"
                value={form.payRange}
                onChange={(e) => setForm({ ...form, payRange: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              placeholder="What makes this job great? Home time, equipment, benefits…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create ad
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function JobAdsPage() {
  return (
    <Suspense>
      <JobAdsContent />
    </Suspense>
  );
}
