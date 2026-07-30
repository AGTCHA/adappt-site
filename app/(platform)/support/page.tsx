"use client";

import { useState } from "react";
import { Lightbulb, Bug, LifeBuoy, Send, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Field, Input, Textarea } from "@/src/components/ui/Field";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

const options = [
  {
    type: "feedback",
    icon: Lightbulb,
    title: "Give Feedback",
    body: "Tell us what would make Adapt better for your company. We read every note.",
    cta: "Share feedback",
    placeholder: "It would be great if…",
  },
  {
    type: "bug",
    icon: Bug,
    title: "Report a Bug",
    body: "Something broken or acting weird? Describe what happened and we'll fix it.",
    cta: "Report bug",
    placeholder: "What were you doing when it happened? What did you expect?",
  },
  {
    type: "support",
    icon: LifeBuoy,
    title: "Contact Support",
    body: "Stuck on anything at all? A real person will get back to you quickly.",
    cta: "Get help",
    placeholder: "How can we help?",
  },
] as const;

type OptionType = (typeof options)[number];

export default function SupportPage() {
  const toast = useToast();
  const [selected, setSelected] = useState<OptionType | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "" });

  function openModal(option: OptionType) {
    setSelected(option);
    setSent(false);
    setForm({ subject: "", body: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await api("/api/support", {
        method: "POST",
        json: { type: selected.type, ...form },
      });
      setSent(true);
      toast("success", "Message sent", "We'll get back to you shortly.");
    } catch (error) {
      toast("error", "Couldn't send", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Help"
        title="Support"
        subtitle="We're here to help — usually within a business day."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option, i) => {
          const Icon = option.icon;
          return (
            <Card key={option.type} hover delay={i * 0.06} className="flex flex-col p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon size={20} />
              </div>
              <h3 className="text-base font-semibold tracking-tight">{option.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-secondary">
                {option.body}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-5 w-fit"
                onClick={() => openModal(option)}
              >
                {option.cta}
              </Button>
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title}
        subtitle={sent ? undefined : "The more detail, the faster we can help."}
      >
        {sent ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success">
              <CheckCircle2 size={26} />
            </div>
            <h3 className="text-base font-semibold">Thanks — got it!</h3>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-secondary">
              Your message is in our queue. We&apos;ll reply to your account email.
            </p>
            <Button className="mt-5" variant="secondary" onClick={() => setSelected(null)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Subject">
              <Input
                required
                placeholder="A short summary"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </Field>
            <Field label="Message">
              <Textarea
                required
                rows={5}
                placeholder={selected?.placeholder}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" type="button" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} icon={<Send size={15} />}>
                Send
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
