"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  ClipboardList,
  MessageSquareText,
  Trash2,
  Check,
  Sparkles,
  FileText,
} from "lucide-react";
import { Badge, driverStatusLabel, driverStatusTone } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState, Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/src/components/ui/Field";
import { FileDrop, type DroppedFile } from "@/src/components/ui/FileDrop";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";
import { daysUntil, formatDate, initials } from "@/src/lib/format";

interface DriverDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status: string;
  experienceYears: number | null;
  endorsements: string;
  preferredRoute: string;
  source: string;
  notes: string;
  cdlNumber: string;
  cdlState: string;
  cdlExpiry: string | null;
  medCardExpiry: string | null;
  onboardingStep: number;
  createdAt: string;
  truck: { id: string; unitNumber: string; year: number; make: string; model: string } | null;
  documents: {
    id: string;
    type: string;
    fileName: string;
    mimeType: string;
    extracted: string;
    createdAt: string;
  }[];
}

const routeLabels: Record<string, string> = {
  local: "Local",
  regional: "Regional",
  otr: "OTR",
};

function ExpiryPill({ date, label }: { date: string | null; label: string }) {
  const days = daysUntil(date);
  if (days === null) return <Badge tone="neutral">{label}: not on file</Badge>;
  if (days < 0) return <Badge tone="danger">{label} expired {formatDate(date)}</Badge>;
  if (days <= 30) return <Badge tone="warning">{label} expires {formatDate(date)}</Badge>;
  return <Badge tone="success">{label} valid until {formatDate(date)}</Badge>;
}

export default function DriverProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"recruiting" | "compliance">("recruiting");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [recruitingForm, setRecruitingForm] = useState({
    phone: "",
    email: "",
    experienceYears: "",
    endorsements: "",
    preferredRoute: "",
    notes: "",
  });
  const [complianceForm, setComplianceForm] = useState({
    cdlNumber: "",
    cdlState: "",
    cdlExpiry: "",
    medCardExpiry: "",
  });

  const load = useCallback(() => {
    api<{ driver: DriverDetail }>(`/api/drivers/${id}`)
      .then(({ driver }) => {
        setDriver(driver);
        setRecruitingForm({
          phone: driver.phone,
          email: driver.email,
          experienceYears: driver.experienceYears?.toString() ?? "",
          endorsements: driver.endorsements,
          preferredRoute: driver.preferredRoute,
          notes: driver.notes,
        });
        setComplianceForm({
          cdlNumber: driver.cdlNumber,
          cdlState: driver.cdlState,
          cdlExpiry: driver.cdlExpiry?.slice(0, 10) ?? "",
          medCardExpiry: driver.medCardExpiry?.slice(0, 10) ?? "",
        });
      })
      .catch(() => setFailed(true));
  }, [id]);

  useEffect(load, [load]);

  async function saveRecruiting(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/drivers/${id}`, { method: "PATCH", json: recruitingForm });
      toast("success", "Profile saved");
      load();
    } catch (error) {
      toast("error", "Couldn't save", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveCompliance(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/drivers/${id}`, {
        method: "PATCH",
        json: {
          cdlNumber: complianceForm.cdlNumber,
          cdlState: complianceForm.cdlState,
          cdlExpiry: complianceForm.cdlExpiry || null,
          medCardExpiry: complianceForm.medCardExpiry || null,
        },
      });
      toast("success", "Compliance info saved");
      load();
    } catch (error) {
      toast("error", "Couldn't save", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(status: string) {
    try {
      await api(`/api/drivers/${id}`, { method: "PATCH", json: { status } });
      toast("success", `Marked as ${driverStatusLabel[status] ?? status}`);
      load();
    } catch (error) {
      toast("error", "Couldn't update status", (error as Error).message);
    }
  }

  async function uploadDocument(type: "cdl" | "medcard", file: DroppedFile) {
    setUploading(type);
    try {
      const result = await api<{ extracted: unknown }>(`/api/drivers/${id}/documents`, {
        method: "POST",
        json: { type, ...file },
      });
      toast(
        "success",
        "Document uploaded",
        result.extracted ? "AI extracted the details and updated this profile." : undefined
      );
      load();
    } catch (error) {
      toast("error", "Upload failed", (error as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function sendLink() {
    try {
      const { link, smsHref } = await api<{ link: string; smsHref: string | null }>(
        `/api/drivers/${id}/send-link`,
        { method: "POST" }
      );
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast("success", "Onboarding link copied", smsHref ? "Opening your messages app…" : "Paste it into a text to your driver.");
      if (smsHref) window.location.href = smsHref;
    } catch (error) {
      toast("error", "Couldn't create link", (error as Error).message);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api(`/api/drivers/${id}`, { method: "DELETE" });
      toast("success", "Driver removed");
      router.push("/drivers");
    } catch (error) {
      toast("error", "Couldn't remove driver", (error as Error).message);
      setSaving(false);
    }
  }

  if (failed) {
    return (
      <EmptyState
        icon={<FileText size={24} />}
        title="Driver not found"
        description="This driver may have been removed."
        action={
          <Link href="/drivers">
            <Button variant="secondary" icon={<ArrowLeft size={15} />}>Back to Drivers</Button>
          </Link>
        }
      />
    );
  }

  if (!driver) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const docFor = (type: string) => driver.documents.find((d) => d.type === type);

  return (
    <div>
      <Link
        href="/drivers"
        className="focus-ring mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm text-ink-secondary transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        All drivers
      </Link>

      {/* Header card */}
      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-lg font-semibold text-accent">
            {initials(driver.firstName, driver.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight">
                {driver.firstName} {driver.lastName}
              </h1>
              <Badge tone={driverStatusTone[driver.status] ?? "neutral"}>
                {driverStatusLabel[driver.status] ?? driver.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-ink-secondary">
              {driver.phone || "No phone"} · Added {formatDate(driver.createdAt)}
              {driver.truck &&
                ` · Drives Unit ${driver.truck.unitNumber} (${driver.truck.year} ${driver.truck.make})`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <Check size={14} /> : <MessageSquareText size={14} />}
              onClick={sendLink}
            >
              {copied ? "Link copied" : "Send onboarding link"}
            </Button>
            {driver.status !== "active" ? (
              <Button size="sm" variant="success" onClick={() => changeStatus("active")}>
                Mark active
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => changeStatus("inactive")}>
                Mark inactive
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 size={14} />}
              onClick={() => setDeleteOpen(true)}
              className="text-danger hover:bg-danger-soft hover:text-danger"
            />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-2xl border border-border bg-surface p-1 backdrop-blur sm:w-fit">
        {(
          [
            { key: "recruiting", label: "Recruiting Info", icon: ClipboardList },
            { key: "compliance", label: "Safety & Compliance", icon: ShieldCheck },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`focus-ring relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
                active ? "text-ink" : "text-ink-secondary hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="profile-tab"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-surface-solid shadow-sm"
                />
              )}
              <Icon size={15} className="relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === "recruiting" ? (
          <motion.div
            key="recruiting"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className="p-6">
              <form onSubmit={saveRecruiting} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone">
                    <Input
                      type="tel"
                      value={recruitingForm.phone}
                      onChange={(e) => setRecruitingForm({ ...recruitingForm, phone: e.target.value })}
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      value={recruitingForm.email}
                      onChange={(e) => setRecruitingForm({ ...recruitingForm, email: e.target.value })}
                    />
                  </Field>
                  <Field label="Years of experience">
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      value={recruitingForm.experienceYears}
                      onChange={(e) =>
                        setRecruitingForm({ ...recruitingForm, experienceYears: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Preferred route">
                    <Select
                      value={recruitingForm.preferredRoute}
                      onChange={(e) =>
                        setRecruitingForm({ ...recruitingForm, preferredRoute: e.target.value })
                      }
                    >
                      <option value="">No preference</option>
                      <option value="local">Local</option>
                      <option value="regional">Regional</option>
                      <option value="otr">OTR (over the road)</option>
                    </Select>
                  </Field>
                  <Field label="Endorsements">
                    <Input
                      placeholder="H, N, T"
                      value={recruitingForm.endorsements}
                      onChange={(e) =>
                        setRecruitingForm({ ...recruitingForm, endorsements: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Source">
                    <Input disabled value={driver.source === "job_ad" ? "Job ad lead" : driver.source === "import" ? "Spreadsheet import" : "Added manually"} />
                  </Field>
                </div>
                <Field label="Notes">
                  <Textarea
                    placeholder="Interview notes, references, availability…"
                    value={recruitingForm.notes}
                    onChange={(e) => setRecruitingForm({ ...recruitingForm, notes: e.target.value })}
                  />
                </Field>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-ink-tertiary">
                    {driver.preferredRoute && `Prefers ${routeLabels[driver.preferredRoute] ?? driver.preferredRoute} routes`}
                  </p>
                  <Button type="submit" loading={saving}>
                    Save changes
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="compliance"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            <Card className="p-6">
              <div className="mb-4 flex flex-wrap gap-2">
                <ExpiryPill date={driver.cdlExpiry} label="CDL" />
                <ExpiryPill date={driver.medCardExpiry} label="Med card" />
              </div>
              <form onSubmit={saveCompliance} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="CDL number">
                    <Input
                      value={complianceForm.cdlNumber}
                      onChange={(e) => setComplianceForm({ ...complianceForm, cdlNumber: e.target.value })}
                    />
                  </Field>
                  <Field label="CDL state">
                    <Input
                      maxLength={2}
                      placeholder="TX"
                      value={complianceForm.cdlState}
                      onChange={(e) =>
                        setComplianceForm({ ...complianceForm, cdlState: e.target.value.toUpperCase() })
                      }
                    />
                  </Field>
                  <Field label="CDL expiration">
                    <Input
                      type="date"
                      value={complianceForm.cdlExpiry}
                      onChange={(e) => setComplianceForm({ ...complianceForm, cdlExpiry: e.target.value })}
                    />
                  </Field>
                  <Field label="Med card expiration">
                    <Input
                      type="date"
                      value={complianceForm.medCardExpiry}
                      onChange={(e) =>
                        setComplianceForm({ ...complianceForm, medCardExpiry: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" loading={saving}>
                    Save changes
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="p-6">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-sm font-semibold">Documents</h3>
                <Sparkles size={13} className="text-accent" />
              </div>
              <p className="mb-4 text-xs text-ink-secondary">
                Upload a photo of the CDL or med card — AI reads it and fills in the fields above.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FileDrop
                  label="Upload CDL"
                  busy={uploading === "cdl"}
                  done={Boolean(docFor("cdl"))}
                  onFile={(file) => uploadDocument("cdl", file)}
                />
                <FileDrop
                  label="Upload Med Card"
                  busy={uploading === "medcard"}
                  done={Boolean(docFor("medcard"))}
                  onFile={(file) => uploadDocument("medcard", file)}
                />
              </div>
              {driver.documents.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {driver.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface-solid px-4 py-2.5"
                    >
                      <FileText size={15} className="shrink-0 text-ink-tertiary" />
                      <span className="min-w-0 flex-1 truncate text-sm">{doc.fileName}</span>
                      <Badge tone={doc.type === "cdl" ? "accent" : doc.type === "medcard" ? "success" : "neutral"}>
                        {doc.type === "cdl" ? "CDL" : doc.type === "medcard" ? "Med card" : "Other"}
                      </Badge>
                      <span className="shrink-0 text-xs text-ink-tertiary">
                        {formatDate(doc.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={`Remove ${driver.firstName} ${driver.lastName}?`}
        subtitle="This permanently deletes the driver, their documents, and message history."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={saving} onClick={handleDelete} icon={<Trash2 size={15} />}>
            Remove driver
          </Button>
        </div>
      </Modal>
    </div>
  );
}
