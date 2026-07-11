"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Truck, Check, CheckCircle2 } from "lucide-react";
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
}

const steps = ["Your info", "Documents", "Done"];

export default function ApplyPage() {
  const { token } = useParams<{ token: string }>();
  const toast = useToast();

  const [info, setInfo] = useState<ApplyInfo | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploads, setUploads] = useState({ cdl: false, medcard: false });

  const [form, setForm] = useState({
    phone: "",
    email: "",
    experienceYears: "",
    endorsements: "",
    preferredRoute: "",
  });

  useEffect(() => {
    api<ApplyInfo>(`/api/apply/${token}`)
      .then((data) => {
        setInfo(data);
        if (data.completed) setStep(2);
      })
      .catch(() => setInvalid(true));
  }, [token]);

  async function submitInfo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/apply/${token}`, {
        method: "POST",
        json: { step: "application", ...form },
      });
      setStep(1);
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
      toast("success", "Uploaded", "Looks good!");
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
      setStep(2);
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
            This onboarding link is no longer valid. Ask your recruiter to send
            you a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-text shadow-sm shadow-accent/30">
          <Truck size={20} />
        </div>
        <div>
          <p className="text-base font-semibold leading-tight tracking-tight">
            {info?.companyName ?? "Driver onboarding"}
          </p>
          <p className="text-xs text-ink-tertiary">Powered by Adapt</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="glass w-full max-w-md rounded-3xl p-7"
      >
        {!info ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="mb-6 flex items-center gap-2">
              {steps.map((label, i) => (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      i < step
                        ? "bg-success text-white"
                        : i === step
                          ? "bg-accent text-accent-text"
                          : "bg-border/60 text-ink-tertiary"
                    }`}
                  >
                    {i < step ? <Check size={13} /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${i === step ? "text-ink" : "text-ink-tertiary"}`}>
                    {label}
                  </span>
                  {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.form
                  key="info"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onSubmit={submitInfo}
                  className="space-y-4"
                >
                  <div>
                    <h1 className="text-lg font-semibold tracking-tight">
                      Hi {info.firstName}! 👋
                    </h1>
                    <p className="mt-1 text-sm text-ink-secondary">
                      A couple of quick questions to get you rolling.
                    </p>
                  </div>
                  <Field label="Phone">
                    <Input
                      required
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Years driving">
                      <Input
                        type="number"
                        min={0}
                        max={60}
                        placeholder="5"
                        value={form.experienceYears}
                        onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                      />
                    </Field>
                    <Field label="Preferred route">
                      <Select
                        value={form.preferredRoute}
                        onChange={(e) => setForm({ ...form, preferredRoute: e.target.value })}
                      >
                        <option value="">No preference</option>
                        <option value="local">Local</option>
                        <option value="regional">Regional</option>
                        <option value="otr">OTR</option>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Endorsements (optional)">
                    <Input
                      placeholder="H, N, T"
                      value={form.endorsements}
                      onChange={(e) => setForm({ ...form, endorsements: e.target.value })}
                    />
                  </Field>
                  <Button type="submit" size="lg" loading={saving} className="w-full">
                    Continue
                  </Button>
                </motion.form>
              )}

              {step === 1 && (
                <motion.div
                  key="docs"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="space-y-4"
                >
                  <div>
                    <h1 className="text-lg font-semibold tracking-tight">Snap two photos</h1>
                    <p className="mt-1 text-sm text-ink-secondary">
                      Take a clear photo of each — your camera works right from here.
                    </p>
                  </div>
                  <FileDrop
                    label="Photo of your CDL"
                    sublabel="Tap to use your camera or choose a photo"
                    accept="image/*"
                    busy={uploading === "cdl"}
                    done={uploads.cdl}
                    onFile={(file) => uploadDocument("cdl", file)}
                  />
                  <FileDrop
                    label="Photo of your Med Card"
                    sublabel="Tap to use your camera or choose a photo"
                    accept="image/*"
                    busy={uploading === "medcard"}
                    done={uploads.medcard}
                    onFile={(file) => uploadDocument("medcard", file)}
                  />
                  <Button
                    size="lg"
                    className="w-full"
                    loading={saving}
                    onClick={finish}
                    disabled={!uploads.cdl && !uploads.medcard}
                  >
                    Finish
                  </Button>
                  <button
                    type="button"
                    onClick={finish}
                    className="w-full text-center text-xs text-ink-tertiary underline-offset-2 hover:underline"
                  >
                    I&apos;ll add documents later
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="flex flex-col items-center py-6 text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
                    <CheckCircle2 size={30} />
                  </div>
                  <h1 className="text-lg font-semibold tracking-tight">You&apos;re all set!</h1>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-secondary">
                    {info.companyName} has everything they need. They&apos;ll be
                    in touch about next steps soon.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  );
}
