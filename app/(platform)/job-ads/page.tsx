"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
  PhoneCall,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { StatCard } from "@/src/components/ui/StatCard";
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

const pipelineColumns = [
  {
    key: "new",
    label: "New",
    icon: Inbox,
    hint: "Fresh from your ads — reach out fast.",
    tone: "text-accent",
  },
  {
    key: "contacted",
    label: "Contacted",
    icon: PhoneCall,
    hint: "You've reached out — waiting to hear back.",
    tone: "text-warning",
  },
  {
    key: "converted",
    label: "Added to Drivers",
    icon: CheckCircle2,
    hint: "In your pipeline as applicants.",
    tone: "text-success",
  },
] as const;

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

  async function leadAction(lead: LeadRow, action: "convert" | "dismiss" | "contacted") {
    try {
      if (action === "convert") {
        await api(`/api/leads/${lead.id}`, { method: "PATCH", json: { action: "convert" } });
        toast("success", "Lead added to Drivers", `${lead.name || "The applicant"} is now in your pipeline.`);
      } else if (action === "contacted") {
        await api(`/api/leads/${lead.id}`, { method: "PATCH", json: { status: "contacted" } });
        toast("success", "Marked as contacted");
      } else {
        await api(`/api/leads/${lead.id}`, { method: "PATCH", json: { status: "dismissed" } });
        toast("success", "Lead dismissed");
      }
      load();
    } catch (error) {
      toast("error", "Couldn't update lead", (error as Error).message);
    }
  }

  const stats = useMemo(() => {
    if (!ads || !leads) return null;
    const weekAgo = Date.now() - 7 * 86_400_000;
    const active = leads.filter((l) => l.status !== "dismissed");
    return {
      activeAds: ads.filter((a) => a.status === "active").length,
      totalLeads: active.length,
      newThisWeek: leads.filter((l) => new Date(l.createdAt).getTime() >= weekAgo).length,
      converted: leads.filter((l) => l.status === "converted").length,
    };
  }, [ads, leads]);

  const leadsByStatus = useMemo(() => {
    const map: Record<string, LeadRow[]> = { new: [], contacted: [], converted: [] };
    for (const lead of leads ?? []) {
      if (map[lead.status]) map[lead.status].push(lead);
    }
    return map;
  }, [leads]);

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

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Active ads"
              value={stats.activeAds}
              sub={`of ${ads!.length} total`}
              icon={<Megaphone size={17} />}
              tone="accent"
            />
            <StatCard
              label="Open leads"
              value={stats.totalLeads}
              sub="in your pipeline"
              icon={<Inbox size={17} />}
              tone={leadsByStatus.new.length > 0 ? "warning" : "default"}
              delay={0.05}
            />
            <StatCard
              label="New this week"
              value={stats.newThisWeek}
              sub="last 7 days"
              icon={<UserPlus size={17} />}
              tone="default"
              delay={0.1}
            />
            <StatCard
              label="Converted"
              value={stats.converted}
              sub="became applicants"
              icon={<CheckCircle2 size={17} />}
              tone="success"
              delay={0.15}
            />
          </>
        )}
      </div>

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

      {/* Lead pipeline board */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Lead pipeline</h2>
        {leads === null ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : leads.filter((l) => l.status !== "dismissed").length === 0 ? (
          <Card className="p-6">
            <p className="text-sm leading-relaxed text-ink-secondary">
              No leads yet. Copy an ad&apos;s webhook URL into your ad platform
              (Facebook Lead Ads, Zapier, Make…) and new applicants will appear
              here the moment they apply.
            </p>
          </Card>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-3">
            {pipelineColumns.map((column, ci) => {
              const Icon = column.icon;
              const columnLeads = leadsByStatus[column.key];
              return (
                <motion.div
                  key={column.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26, delay: ci * 0.06 }}
                  className="rounded-2xl border border-border bg-surface/50 p-3 backdrop-blur"
                >
                  <div className="mb-3 flex items-center gap-2 px-1.5">
                    <Icon size={14} className={column.tone} />
                    <h3 className="text-sm font-semibold">{column.label}</h3>
                    <span className="ml-auto rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-semibold text-ink-secondary">
                      {columnLeads.length}
                    </span>
                  </div>
                  {columnLeads.length === 0 ? (
                    <p className="px-1.5 pb-2 text-xs leading-relaxed text-ink-tertiary">
                      {column.hint}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {columnLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="rounded-xl bg-surface-solid p-3.5 shadow-sm ring-1 ring-border"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-sm font-medium">
                              {lead.name || "Unnamed applicant"}
                            </p>
                            <span className="shrink-0 text-[11px] text-ink-tertiary">
                              {formatRelative(lead.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-tertiary">
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="inline-flex items-center gap-1 hover:text-accent"
                              >
                                <Phone size={10} /> {lead.phone}
                              </a>
                            )}
                            {lead.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail size={10} /> {lead.email}
                              </span>
                            )}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-ink-tertiary">
                            via {lead.jobAd.title}
                          </p>
                          {lead.status !== "converted" && (
                            <div className="mt-2.5 flex gap-1.5">
                              {lead.status === "new" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  icon={<PhoneCall size={12} />}
                                  onClick={() => leadAction(lead, "contacted")}
                                >
                                  Contacted
                                </Button>
                              )}
                              <Button
                                size="sm"
                                icon={<UserPlus size={12} />}
                                onClick={() => leadAction(lead, "convert")}
                              >
                                Add to Drivers
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<X size={12} />}
                                onClick={() => leadAction(lead, "dismiss")}
                                className="ml-auto text-ink-tertiary"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
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
