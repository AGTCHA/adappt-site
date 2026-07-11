"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Check, Copy, MessageSquareText, Sparkles } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Field, Input, Select } from "@/src/components/ui/Field";
import { FileDrop, type DroppedFile } from "@/src/components/ui/FileDrop";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

const steps = ["Application", "Documents", "Send Link"];

interface DriverLite {
  id: string;
  firstName: string;
  phone: string;
}

export function OnboardingWizard({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [driver, setDriver] = useState<DriverLite | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    experienceYears: "",
    endorsements: "",
    preferredRoute: "",
  });

  const [uploads, setUploads] = useState<{ cdl: boolean; medcard: boolean }>({
    cdl: false,
    medcard: false,
  });
  const [uploading, setUploading] = useState<"cdl" | "medcard" | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  const [link, setLink] = useState<string | null>(null);
  const [smsHref, setSmsHref] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setStep(0);
    setDriver(null);
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      experienceYears: "",
      endorsements: "",
      preferredRoute: "",
    });
    setUploads({ cdl: false, medcard: false });
    setAiNote(null);
    setLink(null);
    setSmsHref(null);
    setCopied(false);
  }

  function handleClose() {
    onClose();
    if (driver) onDone();
    setTimeout(reset, 300);
  }

  async function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { driver: created } = await api<{ driver: DriverLite }>("/api/drivers", {
        method: "POST",
        json: { ...form, source: "manual" },
      });
      setDriver(created);
      setStep(1);
    } catch (error) {
      toast("error", "Couldn't save application", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadDocument(type: "cdl" | "medcard", file: DroppedFile) {
    if (!driver) return;
    setUploading(type);
    try {
      const result = await api<{ extracted: Record<string, unknown> | null; aiEnabled: boolean }>(
        `/api/drivers/${driver.id}/documents`,
        { method: "POST", json: { type, ...file } }
      );
      setUploads((prev) => ({ ...prev, [type]: true }));
      if (result.extracted) {
        setAiNote("AI read the document and filled in the compliance details automatically.");
        toast("success", "Document scanned", "Details extracted and saved to the profile.");
      } else {
        toast("success", "Document uploaded", result.aiEnabled ? undefined : "Add an OpenAI key to enable auto-extraction.");
      }
    } catch (error) {
      toast("error", "Upload failed", (error as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function generateLink() {
    if (!driver) return;
    setSaving(true);
    try {
      const result = await api<{ link: string; smsHref: string | null }>(
        `/api/drivers/${driver.id}/send-link`,
        { method: "POST" }
      );
      setLink(result.link);
      setSmsHref(result.smsHref);
    } catch (error) {
      toast("error", "Couldn't create link", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add New Driver"
      subtitle="Three quick steps — you can finish later anytime."
    >
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i < step
                  ? "bg-success text-white"
                  : i === step
                    ? "bg-accent text-accent-text"
                    : "bg-border/60 text-ink-tertiary"
              }`}
            >
              {i < step ? <Check size={13} /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                i === step ? "text-ink" : "text-ink-tertiary"
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.form
            key="application"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onSubmit={submitApplication}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <Input
                  required
                  placeholder="Mike"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </Field>
              <Field label="Last name">
                <Input
                  required
                  placeholder="Reyes"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  placeholder="mike@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Years of experience">
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
                  <option value="otr">OTR (over the road)</option>
                </Select>
              </Field>
            </div>
            <Field label="Endorsements" hint="Optional — e.g. Hazmat (H), Tanker (N), Doubles (T)">
              <Input
                placeholder="H, N"
                value={form.endorsements}
                onChange={(e) => setForm({ ...form, endorsements: e.target.value })}
              />
            </Field>
            <div className="flex justify-end pt-1">
              <Button type="submit" loading={saving}>
                Continue
              </Button>
            </div>
          </motion.form>
        )}

        {step === 1 && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FileDrop
                label="Upload CDL"
                busy={uploading === "cdl"}
                done={uploads.cdl}
                onFile={(file) => uploadDocument("cdl", file)}
              />
              <FileDrop
                label="Upload Med Card"
                busy={uploading === "medcard"}
                done={uploads.medcard}
                onFile={(file) => uploadDocument("medcard", file)}
              />
            </div>
            {aiNote && (
              <div className="flex items-start gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">
                <Sparkles size={15} className="mt-0.5 shrink-0" />
                {aiNote}
              </div>
            )}
            <p className="text-xs text-ink-tertiary">
              Don&apos;t have the documents handy? Skip this — the driver can upload
              them from the link in the next step.
            </p>
            <div className="flex justify-between pt-1">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)}>
                {uploads.cdl || uploads.medcard ? "Continue" : "Skip for now"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="send"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            <p className="text-sm leading-relaxed text-ink-secondary">
              Text {driver?.firstName || "your driver"} a personal link so they can
              finish the application and upload documents from their phone.
            </p>

            {!link ? (
              <Button onClick={generateLink} loading={saving} icon={<MessageSquareText size={16} />}>
                Create onboarding link
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-solid px-4 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-secondary">
                    {link}
                  </span>
                  <Button size="sm" variant="secondary" onClick={copyLink} icon={copied ? <Check size={14} /> : <Copy size={14} />}>
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                {smsHref ? (
                  <a
                    href={smsHref}
                    className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-text shadow-sm shadow-accent/25 transition-colors hover:bg-accent-hover"
                  >
                    <MessageSquareText size={16} />
                    Send via text
                  </a>
                ) : (
                  <p className="text-xs text-ink-tertiary">
                    Add a phone number to the driver&apos;s profile to text the link directly.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between pt-1">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant={link ? "success" : "secondary"} onClick={handleClose}>
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
