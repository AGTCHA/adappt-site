"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/src/components/ui/Field";
import { useToast } from "@/src/components/ui/Toast";
import { api } from "@/src/lib/client";

interface TmsSettings {
  dot: string;
  mc: string;
  scac: string;
  companyName: string;
  factoringCompany: string;
  factoringEmail: string;
  remitTo: string;
  noaEnabled: boolean;
  telematicsProvider: string;
  telematicsApiKey: string;
  highwayApiKey: string;
  highwayEnv: string;
}

const defaultSettings: TmsSettings = {
  dot: "",
  mc: "",
  scac: "",
  companyName: "",
  factoringCompany: "",
  factoringEmail: "",
  remitTo: "",
  noaEnabled: false,
  telematicsProvider: "",
  telematicsApiKey: "",
  highwayApiKey: "",
  highwayEnv: "production",
};

export default function TmsSettingsPage() {
  const toast = useToast();
  const [form, setForm] = useState<TmsSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(() => {
    api<{ settings: TmsSettings }>("/api/tms/settings")
      .then(({ settings }) => setForm(settings))
      .catch(() => setForm(defaultSettings));
  }, []);

  useEffect(fetchSettings, [fetchSettings]);

  function update(key: keyof TmsSettings, value: string | boolean) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await api("/api/tms/settings", { method: "PATCH", json: form });
      toast("success", "Settings saved", "Your TMS configuration has been updated.");
    } catch (err) {
      toast("error", "Save failed", (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <div>
        <PageHeader eyebrow="TMS" title="Settings" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="TMS"
        title="Settings"
        subtitle="Configure carrier identity, factoring, telematics, and integrations."
        actions={
          <Button icon={<Save size={14} />} onClick={saveSettings} loading={saving}>
            Save changes
          </Button>
        }
      />

      <form onSubmit={saveSettings} className="space-y-8">
        {/* Carrier Identity */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="mb-4 text-base font-semibold">Carrier identity</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Company name">
              <Input
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                placeholder="Your carrier name"
              />
            </Field>
            <Field label="DOT number">
              <Input
                value={form.dot}
                onChange={(e) => update("dot", e.target.value)}
                placeholder="e.g. 1234567"
              />
            </Field>
            <Field label="MC number">
              <Input
                value={form.mc}
                onChange={(e) => update("mc", e.target.value)}
                placeholder="e.g. MC-987654"
              />
            </Field>
            <Field label="SCAC code">
              <Input
                value={form.scac}
                onChange={(e) => update("scac", e.target.value)}
                placeholder="e.g. ABCD"
                maxLength={4}
              />
            </Field>
          </div>
        </motion.section>

        {/* Factoring */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="mb-4 text-base font-semibold">Factoring</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Factoring company">
              <Input
                value={form.factoringCompany}
                onChange={(e) => update("factoringCompany", e.target.value)}
                placeholder="e.g. RTS Financial"
              />
            </Field>
            <Field label="Factoring email">
              <Input
                type="email"
                value={form.factoringEmail}
                onChange={(e) => update("factoringEmail", e.target.value)}
                placeholder="invoices@factor.com"
              />
            </Field>
            <Field label="Remit-to address" hint="Where payments should be sent">
              <Textarea
                value={form.remitTo}
                onChange={(e) => update("remitTo", e.target.value)}
                placeholder="123 Main St, Suite 200&#10;Dallas, TX 75201"
              />
            </Field>
            <Field label="NOA (Notice of Assignment)">
              <div className="flex items-center gap-3 pt-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.noaEnabled}
                    onChange={(e) => update("noaEnabled", e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  Include NOA on rate confirmations
                </label>
              </div>
            </Field>
          </div>
        </motion.section>

        {/* Telematics */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="mb-4 text-base font-semibold">Telematics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider">
              <Select
                value={form.telematicsProvider}
                onChange={(e) => update("telematicsProvider", e.target.value)}
              >
                <option value="">Not configured</option>
                <option value="samsara">Samsara</option>
                <option value="motive">Motive (KeepTruckin)</option>
                <option value="geotab">Geotab</option>
                <option value="omnitracs">Omnitracs</option>
                <option value="platform_science">Platform Science</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="API key" hint="Used for GPS position and HOS data">
              <Input
                type="password"
                value={form.telematicsApiKey}
                onChange={(e) => update("telematicsApiKey", e.target.value)}
                placeholder="Enter telematics API key"
              />
            </Field>
          </div>
        </motion.section>

        {/* Highway */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="mb-4 text-base font-semibold">Highway</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Highway API key" hint="For carrier monitoring and compliance alerts">
              <Input
                type="password"
                value={form.highwayApiKey}
                onChange={(e) => update("highwayApiKey", e.target.value)}
                placeholder="Enter Highway API key"
              />
            </Field>
            <Field label="Environment">
              <Select
                value={form.highwayEnv}
                onChange={(e) => update("highwayEnv", e.target.value)}
              >
                <option value="production">Production</option>
                <option value="sandbox">Sandbox</option>
              </Select>
            </Field>
          </div>
        </motion.section>

        <div className="flex justify-end pb-8">
          <Button type="submit" loading={saving} icon={<Save size={14} />}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
