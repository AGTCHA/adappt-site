"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Truck, Check, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { FileDrop, type DroppedFile } from "@/src/components/ui/FileDrop";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

interface ApplyInfo {
  firstName: string;
  companyName: string;
  completed: boolean;
  trackToken: string;
}

interface EmployerRow {
  name: string;
  position: string;
  from: string;
  to: string;
}

const steps = ["About you", "License", "Work history", "Review"];

export default function ApplyPage() {
  const { token } = useParams<{ token: string }>();
  const toast = useToast();

  const [info, setInfo] = useState<ApplyInfo | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploads, setUploads] = useState({ cdl: false, medcard: false });

  const [about, setAbout] = useState({
    phone: "",
    email: "",
    city: "",
    state: "",
    experienceYears: "",
    preferredRoute: "",
    driverType: "",
  });
  const [license, setLicense] = useState({
    cdlNumber: "",
    cdlState: "",
    cdlExpiry: "",
    endorsements: "",
  });
  const [employers, setEmployers] = useState<EmployerRow[]>([
    { name: "", position: "", from: "", to: "" },
  ]);

  useEffect(() => {
    api<ApplyInfo>(`/api/apply/${token}`)
      .then((data) => {
        setInfo(data);
        if (data.completed) setStep(3);
      })
      .catch(() => setInvalid(true));
  }, [token]);

  async function submitAbout(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/apply/${token}`, { method: "POST", json: { step: "about", ...about } });
      setStep(1);
    } catch (error) {
      toast("error", "Couldn't save", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function submitLicense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/apply/${token}`, { method: "POST", json: { step: "license", ...license } });
      setStep(2);
    } catch (error) {
      toast("error", "Couldn't save", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function submitEmployment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/apply/${token}`, {
        method: "POST",
        json: { step: "employment", employers: employers.filter((e) => e.name.trim()) },
      });
      setStep(3);
    } catch (error) {
      toast("error", "Couldn't save", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadDocument(type: "cdl" | "medcard", file: DroppedFile) {
    setUploading(type);
    try {
      await api(`/api/apply/${token}`, {
        method: "POST",
        json: { step: "document", type, ...file },
      });
      setUploads((prev) => ({ ...prev, [type]: true }));
      toast("success", "Uploaded");
    } catch (error) {
      toast("error", "Upload failed", (error as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      await api(`/api/apply/${token}`, { method: "POST", json: { step: "finish" } });
      setStep(4);
    } catch (error) {
      toast("error", "Something went wrong", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (invalid) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass max-w-sm rounded-3xl p-8 text-center">
          <h1 className="text-lg font-semibold">Link expired</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            This application link is no longer valid. Ask your recruiter to send you a new one.
          </p>
        </div>
      </div>
    );
  }

  const done = step >= 4;

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-text shadow-sm shadow-accent/30">
          <Truck size={20} />
        </div>
        <div>
          <p className="text-base font-semibold leading-tight tracking-tight">
            {info?.companyName ?? "Driver application"}
          </p>
          <p className="text-xs text-ink-tertiary">Powered by Adapt</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md rounded-3xl p-7"
      >
        {!info ? (
          <Skeleton className="h-64" />
        ) : done ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckCircle2 size={30} />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Application submitted!</h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-secondary">
              {info.companyName} received your application. Track your progress anytime.
            </p>
            {info.trackToken && (
              <Link href={`/track/${info.trackToken}`} className="mt-4">
                <Button variant="secondary">Track my application</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-1">
              {steps.map((label, i) => (
                <div key={label} className="flex flex-1 items-center gap-1">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                      i < step
                        ? "bg-success text-white"
                        : i === step
                          ? "bg-accent text-accent-text"
                          : "bg-border/60 text-ink-tertiary"
                    }`}
                  >
                    {i < step ? <Check size={11} /> : i + 1}
                  </div>
                  {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.form
                  key="about"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={submitAbout}
                  className="space-y-4"
                >
                  <div>
                    <h1 className="text-lg font-semibold">Hi {info.firstName}!</h1>
                    <p className="mt-1 text-sm text-ink-secondary">Tell us about yourself.</p>
                  </div>
                  <Field label="Phone">
                    <Input required type="tel" value={about.phone} onChange={(e) => setAbout({ ...about, phone: e.target.value })} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={about.email} onChange={(e) => setAbout({ ...about, email: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City">
                      <Input value={about.city} onChange={(e) => setAbout({ ...about, city: e.target.value })} />
                    </Field>
                    <Field label="State">
                      <Input maxLength={2} value={about.state} onChange={(e) => setAbout({ ...about, state: e.target.value.toUpperCase() })} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Years driving">
                      <Input type="number" min={0} value={about.experienceYears} onChange={(e) => setAbout({ ...about, experienceYears: e.target.value })} />
                    </Field>
                    <Field label="Route preference">
                      <Select value={about.preferredRoute} onChange={(e) => setAbout({ ...about, preferredRoute: e.target.value })}>
                        <option value="">Any</option>
                        <option value="local">Local</option>
                        <option value="regional">Regional</option>
                        <option value="otr">OTR</option>
                      </Select>
                    </Field>
                  </div>
                  <Button type="submit" size="lg" loading={saving} className="w-full">
                    Continue
                  </Button>
                </motion.form>
              )}

              {step === 1 && (
                <motion.form
                  key="license"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={submitLicense}
                  className="space-y-4"
                >
                  <h1 className="text-lg font-semibold">CDL & license</h1>
                  <Field label="CDL number">
                    <Input value={license.cdlNumber} onChange={(e) => setLicense({ ...license, cdlNumber: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="State">
                      <Input maxLength={2} value={license.cdlState} onChange={(e) => setLicense({ ...license, cdlState: e.target.value.toUpperCase() })} />
                    </Field>
                    <Field label="Expiration">
                      <Input type="date" value={license.cdlExpiry} onChange={(e) => setLicense({ ...license, cdlExpiry: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Endorsements">
                    <Input placeholder="H, N, T" value={license.endorsements} onChange={(e) => setLicense({ ...license, endorsements: e.target.value })} />
                  </Field>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                      Back
                    </Button>
                    <Button type="submit" loading={saving} className="flex-1">
                      Continue
                    </Button>
                  </div>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="employment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={submitEmployment}
                  className="space-y-4"
                >
                  <h1 className="text-lg font-semibold">Work history</h1>
                  {employers.map((emp, i) => (
                    <div key={i} className="space-y-2 rounded-xl border border-border p-3">
                      <Field label="Employer">
                        <Input value={emp.name} onChange={(e) => {
                          const next = [...employers];
                          next[i] = { ...next[i], name: e.target.value };
                          setEmployers(next);
                        }} />
                      </Field>
                      <Field label="Position">
                        <Input value={emp.position} onChange={(e) => {
                          const next = [...employers];
                          next[i] = { ...next[i], position: e.target.value };
                          setEmployers(next);
                        }} />
                      </Field>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="From">
                          <Input type="month" value={emp.from} onChange={(e) => {
                            const next = [...employers];
                            next[i] = { ...next[i], from: e.target.value };
                            setEmployers(next);
                          }} />
                        </Field>
                        <Field label="To">
                          <Input type="month" value={emp.to} onChange={(e) => {
                            const next = [...employers];
                            next[i] = { ...next[i], to: e.target.value };
                            setEmployers(next);
                          }} />
                        </Field>
                      </div>
                      {employers.length > 1 && (
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs text-danger"
                          onClick={() => setEmployers(employers.filter((_, j) => j !== i))}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-semibold text-accent"
                    onClick={() => setEmployers([...employers, { name: "", position: "", from: "", to: "" }])}
                  >
                    <Plus size={12} /> Add employer
                  </button>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="submit" loading={saving} className="flex-1">
                      Continue
                    </Button>
                  </div>
                </motion.form>
              )}

              {step === 3 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h1 className="text-lg font-semibold">Documents & submit</h1>
                  <p className="text-sm text-ink-secondary">Upload your CDL and med card, then submit.</p>
                  <FileDrop
                    label="CDL photo"
                    busy={uploading === "cdl"}
                    done={uploads.cdl}
                    onFile={(file) => uploadDocument("cdl", file)}
                  />
                  <FileDrop
                    label="Med card photo"
                    busy={uploading === "medcard"}
                    done={uploads.medcard}
                    onFile={(file) => uploadDocument("medcard", file)}
                  />
                  <Button size="lg" className="w-full" loading={saving} onClick={finish}>
                    Submit application
                  </Button>
                  <button type="button" onClick={finish} className="w-full text-center text-xs text-ink-tertiary underline-offset-2 hover:underline">
                    Submit without documents
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  );
}
