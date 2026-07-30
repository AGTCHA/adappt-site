"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  User,
  Briefcase,
  FileText,
  Activity,
  Trash2,
  Check,
  Sparkles,
  MessageSquareText,
  Plus,
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
import { daysUntil, formatDate, formatRelative, initials } from "@/src/lib/format";
import { parseEmployers, PIPELINE_STAGES, STAGE_LABELS, type EmployerRow } from "@/src/lib/recruiting";

interface DriverDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status: string;
  pipelineStage: string;
  hireSource: string;
  hireSourceOther: string;
  driverType: string;
  city: string;
  state: string;
  dateOfBirth: string | null;
  emergencyContact: string;
  employersJson: string;
  experienceYears: number | null;
  endorsements: string;
  preferredRoute: string;
  source: string;
  notes: string;
  followUpAt: string | null;
  cdlNumber: string;
  cdlState: string;
  cdlExpiry: string | null;
  medCardExpiry: string | null;
  onboardingStep: number;
  applyToken: string | null;
  createdAt: string;
  truck: { id: string; unitNumber: string; year: number; make: string; model: string } | null;
  documents: {
    id: string;
    type: string;
    fileName: string;
    mimeType: string;
    extracted: string;
    reviewStatus: string;
    createdAt: string;
  }[];
}

interface DriverNote {
  id: string;
  body: string;
  kind: string;
  userName: string;
  createdAt: string;
}

interface HireSource {
  id: string;
  name: string;
}

type Tab = "details" | "personal" | "employment" | "documents" | "activity";

const tabs: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
  { key: "details", label: "Details", icon: ClipboardList },
  { key: "personal", label: "Personal", icon: User },
  { key: "employment", label: "Employment", icon: Briefcase },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "activity", label: "Activity", icon: Activity },
];

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
  const [hireSources, setHireSources] = useState<HireSource[]>([]);
  const [notes, setNotes] = useState<DriverNote[]>([]);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("details");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reviewDoc, setReviewDoc] = useState<DriverDetail["documents"][number] | null>(null);
  const [newNote, setNewNote] = useState("");

  const [detailsForm, setDetailsForm] = useState({
    phone: "",
    email: "",
    experienceYears: "",
    endorsements: "",
    preferredRoute: "",
    pipelineStage: "",
    hireSource: "",
    hireSourceOther: "",
    notes: "",
    followUpAt: "",
    cdlNumber: "",
    cdlState: "",
    cdlExpiry: "",
    medCardExpiry: "",
  });
  const [personalForm, setPersonalForm] = useState({
    city: "",
    state: "",
    dateOfBirth: "",
    emergencyContact: "",
    driverType: "",
  });
  const [employers, setEmployers] = useState<EmployerRow[]>([]);

  const load = useCallback(() => {
    Promise.all([
      api<{ driver: DriverDetail }>(`/api/drivers/${id}`),
      api<{ sources: HireSource[] }>("/api/hire-sources").catch(() => ({ sources: [] })),
      api<{ notes: DriverNote[] }>(`/api/drivers/${id}/notes`).catch(() => ({ notes: [] })),
    ])
      .then(([{ driver: d }, { sources }, { notes: n }]) => {
        setDriver(d);
        setHireSources(sources);
        setNotes(n);
        setDetailsForm({
          phone: d.phone,
          email: d.email,
          experienceYears: d.experienceYears?.toString() ?? "",
          endorsements: d.endorsements,
          preferredRoute: d.preferredRoute,
          pipelineStage: d.pipelineStage,
          hireSource: d.hireSource,
          hireSourceOther: d.hireSourceOther,
          notes: d.notes,
          followUpAt: d.followUpAt?.slice(0, 10) ?? "",
          cdlNumber: d.cdlNumber,
          cdlState: d.cdlState,
          cdlExpiry: d.cdlExpiry?.slice(0, 10) ?? "",
          medCardExpiry: d.medCardExpiry?.slice(0, 10) ?? "",
        });
        setPersonalForm({
          city: d.city,
          state: d.state,
          dateOfBirth: d.dateOfBirth?.slice(0, 10) ?? "",
          emergencyContact: d.emergencyContact,
          driverType: d.driverType,
        });
        setEmployers(parseEmployers(d.employersJson));
      })
      .catch(() => setFailed(true));
  }, [id]);

  useEffect(load, [load]);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/drivers/${id}`, { method: "PATCH", json: detailsForm });
      toast("success", "Profile saved");
      load();
    } catch (error) {
      toast("error", "Couldn't save", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function savePersonal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/drivers/${id}`, { method: "PATCH", json: personalForm });
      toast("success", "Personal info saved");
      load();
    } catch (error) {
      toast("error", "Couldn't save", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveEmployment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/drivers/${id}`, {
        method: "PATCH",
        json: { employersJson: JSON.stringify(employers.filter((e) => e.name?.trim())) },
      });
      toast("success", "Employment saved");
      load();
    } catch (error) {
      toast("error", "Couldn't save", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await api(`/api/drivers/${id}/notes`, { method: "POST", json: { body: newNote } });
      setNewNote("");
      toast("success", "Note added");
      load();
    } catch (error) {
      toast("error", "Couldn't add note", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadDocument(type: "cdl" | "medcard", file: DroppedFile) {
    setUploading(type);
    try {
      const result = await api<{ extracted: unknown }>(`/api/drivers/${id}/documents`, {
        method: "POST",
        json: { type, ...file },
      });
      toast("success", "Document uploaded", result.extracted ? "Review extracted fields before applying." : undefined);
      load();
    } catch (error) {
      toast("error", "Upload failed", (error as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function applyExtraction(docId: string) {
    setSaving(true);
    try {
      await api(`/api/drivers/${id}/documents/${docId}`, { method: "PATCH", json: { action: "apply" } });
      toast("success", "Fields applied to profile");
      setReviewDoc(null);
      load();
    } catch (error) {
      toast("error", "Apply failed", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteDocument(docId: string) {
    try {
      await api(`/api/drivers/${id}/documents/${docId}`, { method: "DELETE" });
      toast("success", "Document removed");
      load();
    } catch (error) {
      toast("error", "Delete failed", (error as Error).message);
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
      toast("success", "Application link copied");
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

  const extractedPreview = reviewDoc?.extracted ? JSON.parse(reviewDoc.extracted) : null;

  return (
    <div>
      <Link href="/drivers" className="focus-ring mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm text-ink-secondary hover:text-ink">
        <ArrowLeft size={15} />
        All drivers
      </Link>

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
              <Badge tone="accent">{STAGE_LABELS[driver.pipelineStage] ?? driver.pipelineStage}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-secondary">
              {driver.phone || "No phone"} · Added {formatDate(driver.createdAt)}
              {driver.hireSource && ` · ${driver.hireSource}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {driver.applyToken && (
              <Link href={`/track/${driver.applyToken}`} target="_blank">
                <Button variant="ghost" size="sm">Track page</Button>
              </Link>
            )}
            <Button variant="secondary" size="sm" icon={copied ? <Check size={14} /> : <MessageSquareText size={14} />} onClick={sendLink}>
              {copied ? "Link copied" : "Send apply link"}
            </Button>
            <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)} className="text-danger hover:bg-danger-soft" />
          </div>
        </div>
      </Card>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`focus-ring relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
                active ? "text-ink" : "text-ink-secondary hover:text-ink"
              }`}
            >
              {active && (
                <motion.span layoutId="profile-tab" className="absolute inset-0 rounded-xl bg-surface-solid shadow-sm" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
              )}
              <Icon size={15} className="relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === "details" && (
          <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card className="p-6">
              <div className="mb-4 flex flex-wrap gap-2">
                <ExpiryPill date={driver.cdlExpiry} label="CDL" />
                <ExpiryPill date={driver.medCardExpiry} label="Med card" />
              </div>
              <form onSubmit={saveDetails} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone"><Input type="tel" value={detailsForm.phone} onChange={(e) => setDetailsForm({ ...detailsForm, phone: e.target.value })} /></Field>
                  <Field label="Email"><Input type="email" value={detailsForm.email} onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })} /></Field>
                  <Field label="Pipeline stage">
                    <Select value={detailsForm.pipelineStage} onChange={(e) => setDetailsForm({ ...detailsForm, pipelineStage: e.target.value })}>
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Hire source">
                    <Select value={detailsForm.hireSource} onChange={(e) => setDetailsForm({ ...detailsForm, hireSource: e.target.value })}>
                      <option value="">Select…</option>
                      {hireSources.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                      <option value="Other">Other</option>
                    </Select>
                  </Field>
                  {detailsForm.hireSource === "Other" && (
                    <Field label="Other source"><Input value={detailsForm.hireSourceOther} onChange={(e) => setDetailsForm({ ...detailsForm, hireSourceOther: e.target.value })} /></Field>
                  )}
                  <Field label="Follow up"><Input type="date" value={detailsForm.followUpAt} onChange={(e) => setDetailsForm({ ...detailsForm, followUpAt: e.target.value })} /></Field>
                  <Field label="Years experience"><Input type="number" min={0} value={detailsForm.experienceYears} onChange={(e) => setDetailsForm({ ...detailsForm, experienceYears: e.target.value })} /></Field>
                  <Field label="CDL number"><Input value={detailsForm.cdlNumber} onChange={(e) => setDetailsForm({ ...detailsForm, cdlNumber: e.target.value })} /></Field>
                  <Field label="CDL state"><Input maxLength={2} value={detailsForm.cdlState} onChange={(e) => setDetailsForm({ ...detailsForm, cdlState: e.target.value.toUpperCase() })} /></Field>
                  <Field label="CDL expiry"><Input type="date" value={detailsForm.cdlExpiry} onChange={(e) => setDetailsForm({ ...detailsForm, cdlExpiry: e.target.value })} /></Field>
                  <Field label="Med card expiry"><Input type="date" value={detailsForm.medCardExpiry} onChange={(e) => setDetailsForm({ ...detailsForm, medCardExpiry: e.target.value })} /></Field>
                </div>
                <Field label="Notes"><Textarea value={detailsForm.notes} onChange={(e) => setDetailsForm({ ...detailsForm, notes: e.target.value })} /></Field>
                <div className="flex justify-end"><Button type="submit" loading={saving}>Save changes</Button></div>
              </form>
            </Card>
          </motion.div>
        )}

        {tab === "personal" && (
          <motion.div key="personal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card className="p-6">
              <form onSubmit={savePersonal} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City"><Input value={personalForm.city} onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })} /></Field>
                  <Field label="State"><Input maxLength={2} value={personalForm.state} onChange={(e) => setPersonalForm({ ...personalForm, state: e.target.value.toUpperCase() })} /></Field>
                  <Field label="Date of birth"><Input type="date" value={personalForm.dateOfBirth} onChange={(e) => setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })} /></Field>
                  <Field label="Driver type"><Input placeholder="Company, OO, Lease…" value={personalForm.driverType} onChange={(e) => setPersonalForm({ ...personalForm, driverType: e.target.value })} /></Field>
                </div>
                <Field label="Emergency contact"><Textarea value={personalForm.emergencyContact} onChange={(e) => setPersonalForm({ ...personalForm, emergencyContact: e.target.value })} /></Field>
                <div className="flex justify-end"><Button type="submit" loading={saving}>Save</Button></div>
              </form>
            </Card>
          </motion.div>
        )}

        {tab === "employment" && (
          <motion.div key="employment" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card className="p-6">
              <form onSubmit={saveEmployment} className="space-y-4">
                {employers.map((emp, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
                    <Field label="Employer"><Input value={emp.name ?? ""} onChange={(e) => { const n = [...employers]; n[i] = { ...n[i], name: e.target.value }; setEmployers(n); }} /></Field>
                    <Field label="Position"><Input value={emp.position ?? ""} onChange={(e) => { const n = [...employers]; n[i] = { ...n[i], position: e.target.value }; setEmployers(n); }} /></Field>
                    <Field label="From"><Input type="month" value={emp.from ?? ""} onChange={(e) => { const n = [...employers]; n[i] = { ...n[i], from: e.target.value }; setEmployers(n); }} /></Field>
                    <Field label="To"><Input type="month" value={emp.to ?? ""} onChange={(e) => { const n = [...employers]; n[i] = { ...n[i], to: e.target.value }; setEmployers(n); }} /></Field>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setEmployers([...employers, { name: "" }])}>
                  Add employer
                </Button>
                <div className="flex justify-end"><Button type="submit" loading={saving}>Save employment</Button></div>
              </form>
            </Card>
          </motion.div>
        )}

        {tab === "documents" && (
          <motion.div key="documents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <Card className="p-6">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-sm font-semibold">Upload documents</h3>
                <Sparkles size={13} className="text-accent" />
              </div>
              <p className="mb-4 text-xs text-ink-secondary">AI extracts fields — review before applying to profile.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FileDrop label="Upload CDL" busy={uploading === "cdl"} done={Boolean(driver.documents.find((d) => d.type === "cdl"))} onFile={(f) => uploadDocument("cdl", f)} />
                <FileDrop label="Upload Med Card" busy={uploading === "medcard"} done={Boolean(driver.documents.find((d) => d.type === "medcard"))} onFile={(f) => uploadDocument("medcard", f)} />
              </div>
            </Card>
            {driver.documents.length > 0 && (
              <Card className="p-6">
                <ul className="space-y-2">
                  {driver.documents.map((doc) => (
                    <li key={doc.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-solid px-4 py-2.5">
                      <FileText size={15} className="text-ink-tertiary" />
                      <span className="min-w-0 flex-1 truncate text-sm">{doc.fileName}</span>
                      <Badge tone={doc.reviewStatus === "applied" ? "success" : doc.extracted ? "warning" : "neutral"}>
                        {doc.reviewStatus === "applied" ? "Applied" : doc.extracted ? "Review" : "Pending"}
                      </Badge>
                      {doc.extracted && doc.reviewStatus !== "applied" && (
                        <Button size="sm" variant="secondary" onClick={() => setReviewDoc(doc)}>Review</Button>
                      )}
                      <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => deleteDocument(doc.id)} className="text-danger" />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </motion.div>
        )}

        {tab === "activity" && (
          <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card className="mb-4 p-6">
              <form onSubmit={addNote} className="flex gap-2">
                <Textarea className="flex-1" placeholder="Add a note or follow-up…" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                <Button type="submit" loading={saving}>Add</Button>
              </form>
            </Card>
            <Card className="p-6">
              {notes.length === 0 ? (
                <p className="text-sm text-ink-secondary">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li key={note.id} className="border-b border-border/60 pb-3 last:border-0">
                      <p className="text-sm">{note.body}</p>
                      <p className="mt-1 text-xs text-ink-tertiary">
                        {note.userName || "System"} · {formatRelative(note.createdAt)}
                        {note.kind === "stage_change" && " · Stage change"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={Boolean(reviewDoc)} onClose={() => setReviewDoc(null)} title="Review extracted fields" subtitle={reviewDoc?.fileName}>
        {extractedPreview && (
          <pre className="mb-4 max-h-48 overflow-auto rounded-xl bg-surface-solid p-3 text-xs">
            {JSON.stringify(extractedPreview, null, 2)}
          </pre>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setReviewDoc(null)}>Cancel</Button>
          <Button loading={saving} onClick={() => reviewDoc && applyExtraction(reviewDoc.id)}>Apply to profile</Button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={`Remove ${driver.firstName} ${driver.lastName}?`} subtitle="This permanently deletes the driver and their documents.">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete} icon={<Trash2 size={15} />}>Remove driver</Button>
        </div>
      </Modal>
    </div>
  );
}
